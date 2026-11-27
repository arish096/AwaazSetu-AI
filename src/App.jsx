
import { useState } from "react";
import {
  AudioLines,
  Mic,
  Volume2,
  Languages,
  MapPin,
  FileText,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Waves,
  Sparkles,
  CircleHelp,
  Clock,
  ClipboardList
} from "lucide-react";
import "./App.css";

const languages = [
  { name: "हिन्दी", code: "hi-IN" },
  { name: "English", code: "en-IN" },
  { name: "বাংলা", code: "bn-IN" },
  { name: "தமிழ்", code: "ta-IN" },
  { name: "తెలుగు", code: "te-IN" },
  { name: "मराठी", code: "mr-IN" },
  { name: "Bhojpuri", code: "bho" }
];

function detectCategory(text) {
  const value = text.toLowerCase();

  if (/water|पानी|नल|जल|पेयजल/.test(value))
    return "Water Supply";

  if (/electric|बिजली|बत्ती|light|power/.test(value))
    return "Electricity";

  if (/road|सड़क|गड्ढा|रास्ता/.test(value))
    return "Road & Transport";

  if (/garbage|कचरा|सफाई|नाली|गंदगी/.test(value))
    return "Sanitation";

  return "Other";
}

function getSavedComplaints() {
  try {
    return JSON.parse(localStorage.getItem("awaazComplaints")) || [];
  } catch {
    return [];
  }
}

export default function App() {
  const [language, setLanguage] = useState("हिन्दी");
  const [complaint, setComplaint] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("Other");
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [savedComplaints, setSavedComplaints] = useState(
    getSavedComplaints
  );

  
  const selectedLanguage = languages.find(
    (item) => item.name === language
  );

  // Remove Markdown formatting from AI response
  const cleanAIText = (text = "") => {
    return text
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/^#{1,6}\s*/gm, "")
      .replace(/^\s*[-+]\s+/gm, "")
      .replace(/^\s*>\s?/gm, "")
      .trim();
  };

  // Voice input
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessage(
        "Voice input is not supported in this browser. Please type your complaint."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang =
      selectedLanguage?.code === "bho"
        ? "hi-IN"
        : selectedLanguage?.code || "hi-IN";

    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
      setMessage("Listening... Speak clearly.");
    };

    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript;

      setComplaint((previous) =>
        previous
          ? previous + " " + spokenText
          : spokenText
      );

      setMessage("Voice captured successfully.");
    };

    recognition.onerror = () => {
      setMessage(
        "Could not capture voice. Please try again or type."
      );
    };

    recognition.onend = () => {
      setListening(false);
    };

    try {
      recognition.start();
    } catch {
      setListening(false);
      setMessage("Microphone could not start. Please try again.");
    }
  };

  // Generate complaint with AI and local fallback
  const generateComplaint = async () => {
    if (!complaint.trim()) {
      setMessage("Please describe your civic issue first.");
      return;
    }

    if (generating) return;

    setGenerating(true);
    setMessage("Preparing your complaint...");

    const detected = detectCategory(complaint);
    setCategory(detected);

    try {
      const response = await fetch(
        "http://localhost:5000/api/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            complaint: complaint.trim(),
            location: location.trim(),
            language,
          }),
        }
      );

      const data = await response.json();

      if (
        !response.ok ||
        typeof data.draft !== "string" ||
        !data.draft.trim()
      ) {
        throw new Error(
          data.error || "AI service is unavailable."
        );
      }

      const cleanedDraft = cleanAIText(data.draft);

      setDraft(cleanedDraft);
      setMessage(
        "AI-generated complaint draft is ready for review."
      );

    } catch (error) {
      console.warn(
        "AI unavailable. Using local demo mode:",
        error
      );

      const fallbackDraft = `Subject: ${detected} Complaint

Location: ${location.trim() || "Not provided"}

Issue Description:
${complaint.trim()}

Requested Action:
Kindly look into this issue and take the necessary steps to resolve it.

Note: This complaint was prepared using the AwaazSetu AI demo. Please review all details before using it.`;

      setDraft(cleanAIText(fallbackDraft));

      setMessage(
        "AI unavailable. Your complaint draft was prepared in demo mode."
      );
    } finally {
      setGenerated(true);
      setConfirmed(false);
      setTicketId("");
      setGenerating(false);
    }
  };

  // Read clean complaint aloud
  const speakDraft = () => {
    if (!draft || !window.speechSynthesis) {
      setMessage(
        "Speech playback is not available in this browser."
      );
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = cleanAIText(draft);

    const speech = new SpeechSynthesisUtterance(cleanText);

    speech.lang =
      selectedLanguage?.code === "bho"
        ? "hi-IN"
        : selectedLanguage?.code || "hi-IN";

    window.speechSynthesis.speak(speech);
  };

  // Confirm and save complaint
  const confirmComplaint = () => {
    if (confirmed) return;

    const id = "AS-" + Date.now().toString().slice(-8);

    const newComplaint = {
      id,
      category,
      location: location.trim() || "Not provided",
      description: complaint.trim(),
      draft: cleanAIText(draft),
      date: new Date().toLocaleDateString("en-IN"),
      status: "Draft Confirmed"
    };

    const updated = [
      newComplaint,
      ...savedComplaints
    ];

    try {
      localStorage.setItem(
        "awaazComplaints",
        JSON.stringify(updated)
      );

      setSavedComplaints(updated);
      setTicketId(id);
      setConfirmed(true);
      setMessage("Complaint draft saved successfully.");
    } catch {
      setMessage(
        "Could not save the complaint on this device."
      );
    }
  };

  // Start another complaint
  const resetForm = () => {
    setComplaint("");
    setLocation("");
    setDraft("");
    setGenerated(false);
    setConfirmed(false);
    setTicketId("");
    setMessage("");
    setCategory("Other");

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };


  return (
    <div className="app">

      {/* NAVBAR */}
      <header className="navbar">
        <a className="brand" href="#">
          <span className="brand-icon">
            <AudioLines size={23} />
          </span>

          <span>
            AwaazSetu
            <span className="brand-ai"> AI</span>
          </span>
        </a>

        <div className="nav-right">
          <span className="demo-label">DEMO MODE</span>

          <span className="nav-language">
            <Languages size={16} />
            Multilingual
          </span>
        </div>
      </header>

      <main>

        {/* HERO */}
        <section className="hero">
          <div className="hero-tag">
            <Sparkles size={14} />
            VOICE-FIRST CIVIC ASSISTANCE
          </div>

          <h1>
            Your Voice.
            <br />
            <span>Your Right to Be Heard.</span>
          </h1>

          <p>
            Describe your civic problem in your own language.
            AwaazSetu helps turn your words into a structured complaint.
          </p>

          <div className="hero-trust">
            <span>
              <ShieldCheck size={15} />
              Accessible by design
            </span>

            <span>
              <Languages size={15} />
              Multiple languages
            </span>
          </div>
        </section>

        {/* COMPLAINT FORM */}
        <section className="workspace">
          <div className="section-heading">
            <div>
              <span className="eyebrow">GET STARTED</span>
              <h2>Tell us your problem</h2>
            </div>

            <span className="step-count">
              STEP 01 / 02
            </span>
          </div>

          <div className="input-card">

            <label className="field-label">
              Choose your language
            </label>

            <div className="language-grid">
              {languages.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  className={`language-option ${
                    language === item.name ? "selected" : ""
                  }`}
                  onClick={() => {
                    setLanguage(item.name);
                    setMessage(`${item.name} selected.`);
                  }}
                >
                  {item.name}
                </button>
              ))}
            </div>

            <div className="field-divider" />

            <label
              className="field-label"
              htmlFor="complaint"
            >
              Describe your civic issue
            </label>

            <p className="field-hint">
              Speak naturally or type your problem below.
            </p>

            <textarea
              id="complaint"
              value={complaint}
              onChange={(e) => {
                setComplaint(e.target.value);
                setConfirmed(false);
              }}
              placeholder="Example: Hamare area mein 3 din se paani nahi aa raha hai..."
              rows={5}
            />

            <div className="voice-row">
              <button
                type="button"
                className={`mic-button ${
                  listening ? "recording" : ""
                }`}
                onClick={startListening}
                disabled={listening}
              >
                {listening ? (
                  <Waves size={19} />
                ) : (
                  <Mic size={19} />
                )}

                {listening
                  ? "Listening..."
                  : "Speak your problem"}
              </button>

              <span className="voice-hint">
                Voice input or text input
              </span>
            </div>

            <div className="field-divider" />

            <label
              className="field-label"
              htmlFor="location"
            >
              <MapPin size={16} />
              Your location
            </label>

            <input
              id="location"
              className="location-input"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setConfirmed(false);
              }}
              placeholder="Village / Town, District, State"
            />

            <button
              type="button"
              className="primary-button"
              onClick={generateComplaint}
              disabled={generating}
            >
              {generating ? "Generating..." : "Generate Complaint"}
              {!generating && <ArrowRight size={18} />}
            </button>

            {message && (
              <p className="status-message">
                {message}
              </p>
            )}
          </div>
        </section>

        {/* GENERATED COMPLAINT */}
        {generated && (
          <section className="result-section">

            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  YOUR COMPLAINT
                </span>

                <h2>Review before proceeding</h2>
              </div>

              <span className="ready-badge">
                <CheckCircle2 size={15} />
                Draft Ready
              </span>
            </div>

            <div className="result-card">

              <div className="result-meta">
                <span>
                  <FileText size={16} />
                  {category}
                </span>

                <span>Demo complaint</span>
              </div>

              <textarea
                className="draft-text"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setConfirmed(false);
                  setTicketId("");
                }}
                rows={9}
                aria-label="Edit complaint draft"
              />

              <div className="result-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={speakDraft}
                >
                  <Volume2 size={17} />
                  Read aloud
                </button>

                <button
                  type="button"
                  className="primary-button confirm-button"
                  onClick={confirmComplaint}
                  disabled={confirmed}
                >
                  <CheckCircle2 size={17} />
                  {confirmed ? "Draft Saved" : "Confirm Draft"}
                </button>
              </div>

              {confirmed && (
                <div className="confirmation">
                  <CheckCircle2 size={22} />

                  <div>
                    <strong>
                      Complaint draft saved successfully!
                    </strong>

                    <p>
                      Reference ID: <b>{ticketId}</b>
                    </p>

                    <p>
                      Status: Draft Confirmed
                    </p>

                    <p>
                      This is a locally saved demo record.
                      No government department has been contacted
                      or complaint submitted.
                    </p>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="reset-button"
                onClick={resetForm}
              >
                Create another complaint
              </button>
            </div>
          </section>
        )}

        {/* COMPLAINT HISTORY */}
        {savedComplaints.length > 0 && (
          <section className="history-section">

            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  YOUR RECORDS
                </span>

                <h2>My Complaints</h2>
              </div>

              <span className="step-count">
                {savedComplaints.length} SAVED
              </span>
            </div>

            <div className="history-list">
              {savedComplaints.map((item) => (
                <div
                  className="history-card"
                  key={item.id}
                >
                  <div className="history-icon">
                    <ClipboardList size={20} />
                  </div>

                  <div className="history-info">
                    <strong>{item.category}</strong>

                    <p>
                      <MapPin size={12} />
                      {item.location}
                    </p>

                    <small>
                      <Clock size={12} />
                      {item.date}
                    </small>

                    <small className="reference-id">
                      ID: {item.id}
                    </small>
                  </div>

                  <span className="history-status">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* HOW IT WORKS */}
        <section className="how-section">
          <span className="eyebrow">
            SIMPLE PROCESS
          </span>

          <h2>From voice to action</h2>

          <div className="how-grid">

            <div className="how-card">
              <span className="how-icon">
                <Mic />
              </span>

              <h3>01. Speak</h3>

              <p>
                Explain your civic issue in a language
                you are comfortable with.
              </p>
            </div>

            <div className="how-card">
              <span className="how-icon">
                <Sparkles />
              </span>

              <h3>02. Structure</h3>

              <p>
                Turn your description into an organised
                complaint draft.
              </p>
            </div>

            <div className="how-card">
              <span className="how-icon">
                <CheckCircle2 />
              </span>

              <h3>03. Review</h3>

              <p>
                Listen, edit and confirm your complaint
                before proceeding.
              </p>
            </div>

          </div>
        </section>

        {/* FOOTER */}
        <footer>
          <div className="footer-brand">
            <AudioLines size={18} />
            AwaazSetu AI
          </div>

          <p>
            Making civic services more accessible,
            one voice at a time.
          </p>

          <span>
            <CircleHelp size={14} />
            Educational prototype · Demo mode
          </span>
        </footer>

      </main>
    </div>
  );
}
