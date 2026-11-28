
const http = require("http");
const fs = require("fs");
const path = require("path");

// Load environment variables from .env
function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const cleanLine = trimmed.replace(/^export\s+/, "");
    const separator = cleanLine.indexOf("=");
    if (separator === -1) continue;

    const key = cleanLine.slice(0, separator).trim();
    let value = cleanLine.slice(separator + 1).trim();

    if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) continue;

    value = value.replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv();

const PORT = Number(process.env.PORT) || 5000;
const FRONTEND_URL = "http://localhost:5173";
const MAX_BODY_SIZE = 100000;

function sendJSON(res, status, data) {
  if (res.writableEnded) return;

  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });

  res.end(JSON.stringify(data));
}

function cleanPlainText(text) {
  return String(text)
    .replace(/\r\n/g, "\n")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/[`~]/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-+*]\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Language settings
const languageSettings = {
  "हिन्दी": {
    name: "Hindi",
    script: "Devanagari",
    subject: "विषय",
    location: "स्थान",
    description: "समस्या का विवरण",
    action: "अनुरोधित कार्रवाई",
    missing: "उपलब्ध नहीं"
  },
  "English": {
    name: "English",
    script: "Latin",
    subject: "Subject",
    location: "Location",
    description: "Issue Description",
    action: "Requested Action",
    missing: "Not provided"
  },
  "বাংলা": {
    name: "Bengali",
    script: "Bengali",
    subject: "বিষয়",
    location: "অবস্থান",
    description: "সমস্যার বিবরণ",
    action: "প্রয়োজনীয় পদক্ষেপ",
    missing: "উল্লেখ করা হয়নি"
  },
  "தமிழ்": {
    name: "Tamil",
    script: "Tamil",
    subject: "பொருள்",
    location: "இடம்",
    description: "பிரச்சினையின் விவரம்",
    action: "கோரப்படும் நடவடிக்கை",
    missing: "வழங்கப்படவில்லை"
  },
  "తెలుగు": {
    name: "Telugu",
    script: "Telugu",
    subject: "విషయం",
    location: "ప్రాంతం",
    description: "సమస్య వివరాలు",
    action: "కోరుతున్న చర్య",
    missing: "పేర్కొనలేదు"
  },
  "मराठी": {
    name: "Marathi",
    script: "Devanagari",
    subject: "विषय",
    location: "ठिकाण",
    description: "समस्येचे वर्णन",
    action: "अपेक्षित कार्यवाही",
    missing: "नमूद केलेले नाही"
  },
  "Bhojpuri": {
    name: "Bhojpuri",
    script: "Devanagari",
    subject: "विषय",
    location: "जगह",
    description: "समस्या के बिबरन",
    action: "निवेदन आ जरूरी कार्रवाई",
    missing: "बतावल नइखे"
  }
};

function createMessages(complaint, location, language) {
  const settings =
    languageSettings[language] || languageSettings["हिन्दी"];

  const systemPrompt = `
You are AwaazSetu AI, a professional multilingual civic complaint letter writer.

YOUR TASK:
Convert the citizen's short complaint into a COMPLETE, formal,
respectful and easy-to-understand civic complaint letter.

SELECTED LANGUAGE:
${settings.name}

REQUIRED SCRIPT:
${settings.script}

LANGUAGE RULES:
1. Write the entire complaint only in ${settings.name}.
2. Use the correct ${settings.script} script.
3. Translate the meaning of the user's input naturally.
4. Do not mix languages.
5. Keep place names and proper nouns unchanged where appropriate.

REQUIRED LETTER FORMAT:

1. Start with a proper complaint letter heading.
2. Include the subject using this label:
   ${settings.subject}
3. Include the location using this label:
   ${settings.location}
4. Include a respectful greeting addressed to the concerned authority.
   Do not invent the name of an officer or department.
5. Add a detailed section using this label:
   ${settings.description}
6. Explain the reported problem in a complete, clear paragraph.
7. Include another paragraph explaining why the matter needs attention.
   Only mention effects that are supplied by the user or are directly
   reasonable consequences. Do not present assumptions as confirmed facts.
8. Include a separate section using this label:
   ${settings.action}
9. Politely request the concerned authority to investigate the issue,
   take appropriate action and resolve the reported problem.
10. End with a respectful closing and thank you.

COMPLETENESS RULES:
- Do not return only a heading, subject and one short sentence.
- Write a complete letter with an introduction, main description,
  action request and closing.
- Aim for approximately 100-150 words when the supplied information
  supports it.
- Use multiple readable paragraphs.
- Do not unnecessarily repeat the same sentence.
- Do not add unrelated sections or generic filler.
- Do not invent extra details just to increase the length.

ACCURACY RULES:
- Use only the facts provided by the citizen.
- Never invent dates, names, phone numbers, addresses, evidence,
  measurements, official reference numbers or complaint IDs.
- If the location is missing, write "${settings.missing}".
- Do not invent the name of a government department.
- Do not claim that the complaint has been submitted or received.
- Do not claim that an authority has already taken action.
- Do not exaggerate the issue.

OUTPUT RULES:
- Return only the final complaint letter.
- Use plain text without Markdown.
- Do not use asterisks, hashtags, backticks, emojis or decorative symbols.
- Keep headings and paragraphs clearly separated.
- Make the result ready for the citizen to review and edit.

SPECIAL BHOJPURI RULES:
If the selected language is Bhojpuri:
- Write natural, respectful Bhojpuri.
- Use Devanagari script.
- Do not write standard Hindi and label it Bhojpuri.
- Use familiar Bhojpuri expressions.

FINAL CHECK:
Before responding, verify that the letter has a heading, subject,
location, greeting, complete description, requested action and closing.
Verify that the entire letter is in ${settings.name}.
`;

  const userPrompt = `
CITIZEN'S ORIGINAL COMPLAINT:
${complaint}

CITIZEN'S LOCATION:
${location || settings.missing}

Write a complete and professional civic complaint letter
in ${settings.name}, using ${settings.script} script.

Return only the final letter.
`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_URL);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  let pathname;

  try {
    pathname = new URL(
      req.url,
      `http://${req.headers.host || "localhost"}`
    ).pathname;
  } catch {
    return sendJSON(res, 400, {
      error: "Invalid request URL."
    });
  }

  if (req.method === "GET" && pathname === "/api/health") {
    return sendJSON(res, 200, {
      status: "running",
      aiConfigured: Boolean(process.env.OPENROUTER_API_KEY)
    });
  }

  if (req.method !== "POST" || pathname !== "/api/generate") {
    return sendJSON(res, 404, {
      error: "Route not found."
    });
  }

  let body = "";
  let tooLarge = false;

  req.on("data", (chunk) => {
    if (tooLarge) return;

    body += chunk.toString("utf8");

    if (Buffer.byteLength(body, "utf8") > MAX_BODY_SIZE) {
      tooLarge = true;
      body = "";
    }
  });

  req.on("end", async () => {
    if (tooLarge) {
      return sendJSON(res, 413, {
        error: "Request is too large."
      });
    }

    try {
      const input = JSON.parse(body);

      const complaint =
        typeof input.complaint === "string"
          ? input.complaint.trim()
          : "";

      const location =
        typeof input.location === "string"
          ? input.location.trim()
          : "";

      const requestedLanguage =
        typeof input.language === "string"
          ? input.language.trim()
          : "हिन्दी";

      const language = languageSettings[requestedLanguage]
        ? requestedLanguage
        : "हिन्दी";

      if (!complaint) {
        return sendJSON(res, 400, {
          error: "Complaint description is required."
        });
      }

      if (complaint.length > 10000 || location.length > 500) {
        return sendJSON(res, 400, {
          error: "Complaint or location exceeds the allowed length."
        });
      }

      const apiKey = process.env.OPENROUTER_API_KEY;

      if (!apiKey) {
        return sendJSON(res, 503, {
          error: "AI is not configured. Demo mode is available."
        });
      }

      const model =
        process.env.OPENROUTER_MODEL || "openrouter/free";

      console.log(
        `Generating ${languageSettings[language].name} complaint using model: ${model}`
      );

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": FRONTEND_URL,
            "X-Title": "AwaazSetu AI"
          },
          body: JSON.stringify({
            model,
            messages: createMessages(
              complaint,
              location,
              language
            ),
            temperature: 0.2,
            max_tokens: 1800
          }),
          signal: AbortSignal.timeout(45000)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "OpenRouter API error:",
          response.status,
          data.error?.message || "Unknown provider error"
        );

        return sendJSON(res, 502, {
          error: "AI service could not generate a draft."
        });
      }

      const result = data.choices?.[0]?.message?.content;

      if (typeof result !== "string" || !result.trim()) {
        return sendJSON(res, 502, {
          error: "AI returned an empty response."
        });
      }

      const draft = cleanPlainText(result);

      if (!draft) {
        return sendJSON(res, 502, {
          error: "AI returned an invalid complaint draft."
        });
      }

      console.log(
        `${languageSettings[language].name} complaint draft generated successfully.`
      );

      return sendJSON(res, 200, {
        success: true,
        mode: "ai",
        language,
        draft
      });
    } catch (error) {
      console.error("Backend error:", error.message);

      if (
        error.name === "TimeoutError" ||
        error.name === "AbortError"
      ) {
        return sendJSON(res, 504, {
          error: "AI request timed out. Please try again."
        });
      }

      if (error instanceof SyntaxError) {
        return sendJSON(res, 400, {
          error: "Invalid JSON request."
        });
      }

      return sendJSON(res, 500, {
        error: "Something went wrong on the server."
      });
    }
  });
});

server.listen(PORT, () => {
  console.log("-----------------------------------");
  console.log("       AwaazSetu AI Backend");
  console.log("-----------------------------------");
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(
    `AI configured: ${Boolean(process.env.OPENROUTER_API_KEY)}`
  );
  console.log("-----------------------------------");
});
