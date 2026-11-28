
import { useMemo, useState } from "react";
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
  ClipboardList,
  LayoutDashboard,
  Plus,
  Menu,
  Activity,
  AlertCircle,
  Copy,
  RotateCcw,
  ChevronRight,
  BadgeCheck,
  Lightbulb,
  Headphones,
  X
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

const followUpQuestions = [
  {
    id: "duration",
    label: "Since when has this problem been happening?",
    placeholder: "Example: For the last 3 days"
  },
  {
    id: "area",
    label: "Can you mention a nearby landmark or affected area?",
    placeholder: "Example: Near the main market"
  },
  {
    id: "impact",
    label: "How is this affecting people nearby?",
    placeholder: "Example: Residents are unable to get drinking water"
  }
];

function detectCategory(text = "") {
  const value = text.toLowerCase();

  if (/water|पानी|नल|जल|पेयजल/.test(value)) return "Water Supply";
  if (/electric|बिजली|बत्ती|light|power/.test(value)) return "Electricity";
  if (/road|सड़क|गड्ढा|रास्ता|पुलिया/.test(value)) return "Road & Transport";
  if (/garbage|कचरा|सफाई|नाली|गंदगी|कूड़ा/.test(value)) return "Sanitation";
  if (/drain|sewer|जलभराव|नाला/.test(value)) return "Drainage";

  return "Other";
}

function getSavedComplaints() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("awaazComplaints") || "[]"
    );

    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function cleanAIText(text = "") {
  return String(text)
    .replace(/\r\n/g, "\n")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/__/g, "")
    .replace(/[`~]/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-+]\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildLocalFallbackDraft(
  language,
  category,
  location,
  complaint,
  extraText
) {
  const translations = {
    "हिन्दी": {
      subject: "विषय",
      location: "स्थान",
      description: "समस्या का विवरण",
      action: "अनुरोधित कार्रवाई",
      missing: "उपलब्ध नहीं",
      title: "नागरिक शिकायत पत्र",
      actionText:
        "कृपया इस समस्या की जाँच करें, विवरण सत्यापित करें और इसे हल करने के लिए आवश्यक कदम उठाएँ।",
      note:
        "यह शिकायत AwaazSetu AI के डेमो द्वारा तैयार की गई है। उपयोग करने से पहले सभी विवरण जाँच लें।"
    },
    English: {
      subject: "Subject",
      location: "Location",
      description: "Issue Description",
      action: "Requested Action",
      missing: "Not provided",
      title: "Civic Complaint",
      actionText:
        "Kindly look into this issue, verify the details and take the necessary steps to resolve it.",
      note:
        "This complaint was prepared using the AwaazSetu AI demo. Please review all details before using it."
    },
    "বাংলা": {
      subject: "বিষয়",
      location: "অবস্থান",
      description: "সমস্যার বিবরণ",
      action: "প্রয়োজনীয় পদক্ষেপ",
      missing: "উল্লেখ করা হয়নি",
      title: "নাগরিক অভিযোগপত্র",
      actionText:
        "অনুগ্রহ করে সমস্যাটি খতিয়ে দেখুন, বিবরণ যাচাই করুন এবং সমাধানের জন্য প্রয়োজনীয় পদক্ষেপ নিন।",
      note:
        "এই অভিযোগটি AwaazSetu AI ডেমোর মাধ্যমে তৈরি করা হয়েছে। ব্যবহারের আগে সব তথ্য যাচাই করুন।"
    },
    "தமிழ்": {
      subject: "பொருள்",
      location: "இடம்",
      description: "பிரச்சினையின் விவரம்",
      action: "கோரப்படும் நடவடிக்கை",
      missing: "வழங்கப்படவில்லை",
      title: "குடிமக்கள் புகார் கடிதம்",
      actionText:
        "இந்தப் பிரச்சினையை ஆய்வு செய்து, விவரங்களைச் சரிபார்த்து, தீர்வுக்குத் தேவையான நடவடிக்கைகளை எடுக்குமாறு கேட்டுக்கொள்கிறோம்.",
      note:
        "இந்தப் புகார் AwaazSetu AI டெமோ மூலம் தயாரிக்கப்பட்டது. பயன்படுத்துவதற்கு முன் அனைத்து விவரங்களையும் சரிபார்க்கவும்."
    },
    "తెలుగు": {
      subject: "విషయం",
      location: "ప్రాంతం",
      description: "సమస్య వివరాలు",
      action: "కోరుతున్న చర్య",
      missing: "పేర్కొనలేదు",
      title: "పౌర ఫిర్యాదు పత్రం",
      actionText:
        "దయచేసి ఈ సమస్యను పరిశీలించి, వివరాలను ధృవీకరించి, పరిష్కారానికి అవసరమైన చర్యలు తీసుకోండి.",
      note:
        "ఈ ఫిర్యాదు AwaazSetu AI డెమో ద్వారా రూపొందించబడింది. ఉపయోగించే ముందు అన్ని వివరాలను తనిఖీ చేయండి."
    },
    "मराठी": {
      subject: "विषय",
      location: "ठिकाण",
      description: "समस्येचे वर्णन",
      action: "अपेक्षित कार्यवाही",
      missing: "नमूद केलेले नाही",
      title: "नागरी तक्रार पत्र",
      actionText:
        "कृपया या समस्येची तपासणी करून तपशीलांची पडताळणी करावी आणि ती सोडवण्यासाठी आवश्यक ती कार्यवाही करावी.",
      note:
        "ही तक्रार AwaazSetu AI डेमोद्वारे तयार केली आहे. वापरण्यापूर्वी सर्व तपशील तपासा."
    },
    Bhojpuri: {
      subject: "विषय",
      location: "जगह",
      description: "समस्या के बिबरन",
      action: "निवेदन आ जरूरी कार्रवाई",
      missing: "बतावल नइखे",
      title: "नागरिक शिकायत पत्र",
      actionText:
        "कृपया एह समस्या के जाँच करीं, जानकारी के पुष्टि करीं आ एकरा के सुलझावे खातिर जरूरी कदम उठाईं।",
      note:
        "ई शिकायत AwaazSetu AI के डेमो से बनावल गइल बा। इस्तेमाल करे से पहिले सभ जानकारी जाँच लीं।"
    }
  };

  const t = translations[language] || translations.English;

  return `${t.title}

${t.subject}: ${category}

${t.location}: ${location.trim() || t.missing}

${t.description}:
${complaint.trim()}${extraText ? `\n\n${extraText}` : ""}

${t.action}:
${t.actionText}

${t.note}`;
}

function getQualityChecks(draft, complaint, location) {
  return [
    {
      label: "Complaint description provided",
      passed: complaint.trim().length >= 15,
      detail:
        complaint.trim().length >= 15
          ? "Your issue is described."
          : "Add a little more detail about the issue."
    },
    {
      label: "Location included",
      passed: Boolean(location.trim()),
      detail: location.trim()
        ? "A location is available in the form."
        : "Add your village, town or district."
    },
    {
      label: "Draft generated",
      passed: Boolean(draft.trim()),
      detail: draft.trim()
        ? "A complaint draft is ready to review."
        : "Generate a draft first."
    },
    {
      label: "Review before using",
      passed: true,
      detail: "Check names, dates and facts for accuracy."
    }
  ];
}

export default function App() {
  const [language, setLanguage] = useState("English");
  const [complaint, setComplaint] = useState("");
  const [location, setLocation] = useState("");
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [activeView, setActiveView] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showFollowUps, setShowFollowUps] = useState(false);

  const [followUpAnswers, setFollowUpAnswers] = useState({
    duration: "",
    area: "",
    impact: ""
  });

  const [savedComplaints, setSavedComplaints] = useState(
    getSavedComplaints
  );

  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const selectedLanguage = languages.find(
    (item) => item.name === language
  );

  const category = detectCategory(complaint);

  const qualityChecks = useMemo(
    () => getQualityChecks(draft, complaint, location),
    [draft, complaint, location]
  );

  const qualityScore = qualityChecks.filter(
    (item) => item.passed
  ).length;

  const completedFollowUps = Object.values(followUpAnswers).filter(
    (value) => value.trim()
  ).length;

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

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
      const spokenText =
        event.results?.[0]?.[0]?.transcript || "";

      if (spokenText) {
        setComplaint((previous) =>
          previous ? `${previous} ${spokenText}` : spokenText
        );

        setGenerated(false);
        setConfirmed(false);
        setMessage(
          "Voice captured. You can edit the text before generating."
        );
      }
    };

    recognition.onerror = () => {
      setMessage(
        "Could not capture voice. Please try again or type your complaint."
      );
    };

    recognition.onend = () => setListening(false);

    try {
      recognition.start();
    } catch {
      setListening(false);
      setMessage("Microphone could not start. Please try again.");
    }
  };

  const buildComplaintInput = () => {
    const extraDetails = [
      followUpAnswers.duration &&
        `Duration: ${followUpAnswers.duration}`,
      followUpAnswers.area &&
        `Nearby landmark or affected area: ${followUpAnswers.area}`,
      followUpAnswers.impact &&
        `Impact: ${followUpAnswers.impact}`
    ].filter(Boolean);

    return extraDetails.length
      ? `${complaint.trim()}\n\nAdditional details provided by the user:\n${extraDetails.join("\n")}`
      : complaint.trim();
  };

  const generateComplaint = async () => {
    if (!complaint.trim()) {
      setMessage("Please describe your civic issue first.");
      return;
    }

    if (generating) return;

    setGenerating(true);
    setMessage("Preparing your complaint...");
    setConfirmed(false);
    setTicketId("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            complaint: buildComplaintInput(),
            location: location.trim(),
            language
          })
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

      setDraft(cleanAIText(data.draft));

      setMessage(
        "Your AI complaint draft is ready. Review every detail before using it."
      );
    } catch (error) {
      console.warn(
        "AI unavailable. Using local demo mode:",
        error
      );

      const extraText = [
        followUpAnswers.duration &&
          `Duration: ${followUpAnswers.duration}`,
        followUpAnswers.area &&
          `Affected area: ${followUpAnswers.area}`,
        followUpAnswers.impact &&
          `Impact: ${followUpAnswers.impact}`
      ]
        .filter(Boolean)
        .join("\n");

      const fallbackDraft = buildLocalFallbackDraft(
        language,
        category,
        location,
        complaint,
        extraText
      );

      setDraft(cleanAIText(fallbackDraft));

      setMessage(
        "AI service unavailable. A local demo draft has been prepared instead."
      );
    } finally {
      setGenerated(true);
      setGenerating(false);
      setActiveView("dashboard");
    }
  };

  const speakDraft = () => {
    if (!draft.trim() || !window.speechSynthesis) {
      setMessage(
        "Speech playback is not available in this browser."
      );
      return;
    }

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(
      cleanAIText(draft)
    );

    const voiceLanguage = {
      "हिन्दी": "hi-IN",
      English: "en-IN",
      "বাংলা": "bn-IN",
      "தமிழ்": "ta-IN",
      "తెలుగు": "te-IN",
      "मराठी": "mr-IN",
      Bhojpuri: "hi-IN"
    };

    const selectedCode =
      voiceLanguage[language] || "hi-IN";

    speech.lang = selectedCode;

    const voices = window.speechSynthesis.getVoices();

    const matchingVoice = voices.find(
      (voice) =>
        voice.lang.toLowerCase() ===
        selectedCode.toLowerCase()
    );

    if (matchingVoice) {
      speech.voice = matchingVoice;
    }

    speech.rate = 0.9;
    speech.pitch = 1;

    window.speechSynthesis.speak(speech);
  };

  const confirmComplaint = () => {
    if (confirmed || !draft.trim()) return;

    const id = `AS-${Date.now().toString().slice(-8)}`;

    const newComplaint = {
      id,
      category,
      location: location.trim() || "Not provided",
      description: complaint.trim(),
      draft: cleanAIText(draft),
      date: new Date().toLocaleDateString("en-IN"),
      status: "Draft Confirmed"
    };

    const deleteComplaint = (id) => {
  const updated = savedComplaints.filter(
    (item) => item.id !== id
  );

  try {
    localStorage.setItem(
      "awaazComplaints",
      JSON.stringify(updated)
    );

    setSavedComplaints(updated);
    setSelectedComplaint(null);
    setMessage("Complaint deleted successfully.");
  } catch {
    setMessage("Could not delete this complaint.");
  }
};

    const updated = [newComplaint, ...savedComplaints];

    try {
      localStorage.setItem(
        "awaazComplaints",
        JSON.stringify(updated)
      );

      setSavedComplaints(updated);
      setTicketId(id);
      setConfirmed(true);

      setMessage(
        "Complaint draft saved on this device."
      );
    } catch {
      setMessage(
        "Could not save the complaint on this device."
      );
    }
  };

  const resetForm = () => {
    setComplaint("");
    setLocation("");
    setDraft("");
    setGenerated(false);
    setConfirmed(false);
    setTicketId("");
    setMessage("");
    setShowFollowUps(false);

    setFollowUpAnswers({
      duration: "",
      area: "",
      impact: ""
    });

    setSelectedComplaint(null);
    setActiveView("dashboard");

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(
        cleanAIText(draft)
      );

      setMessage("Draft copied to clipboard.");
    } catch {
      setMessage(
        "Copy is unavailable. You can select and copy the draft manually."
      );
    }
  };

  const navigate = (view) => {
    setActiveView(view);
    setMobileNavOpen(false);

    if (view !== "history") {
      setSelectedComplaint(null);
    }

    if (view === "new") {
      setGenerated(false);
      setConfirmed(false);
    }
  };

  const openComplaintDetails = (item) => {
    setSelectedComplaint(item);
  };

  return (
    <div className="app-shell">
      <aside
        className={`sidebar ${
          mobileNavOpen ? "sidebar-open" : ""
        }`}
      >
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            navigate("dashboard");
          }}
        >
          <span className="brand-mark">
            <AudioLines size={23} />
          </span>

          <span className="brand-name">
            AwaazSetu<span> AI</span>
          </span>
        </a>

        <div className="sidebar-label">WORKSPACE</div>

        <nav
          className="side-nav"
          aria-label="Main navigation"
        >
          <button
            className={
              activeView === "dashboard"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => navigate("dashboard")}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>

          <button
            className={
              activeView === "new"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => navigate("new")}
          >
            <Plus size={18} />
            New complaint
          </button>

          <button
            className={
              activeView === "history"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => navigate("history")}
          >
            <ClipboardList size={18} />
            My complaints
            <span className="nav-count">
              {savedComplaints.length}
            </span>
          </button>
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-help">
          <div className="help-icon">
            <Headphones size={19} />
          </div>

          <strong>Need a hand?</strong>

          <p>
            Speak or type your issue. We’ll help organise the details.
          </p>

          <button onClick={() => navigate("new")}>
            Start a complaint <ArrowRight size={14} />
          </button>
        </div>

        <div className="sidebar-foot">
          <ShieldCheck size={14} />
          Private local demo workspace
        </div>
      </aside>

      {mobileNavOpen && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <div className="main-panel">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() =>
              setMobileNavOpen((open) => !open)
            }
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>

          <div className="breadcrumb">
            Workspace <ChevronRight size={14} />
            <strong>
              {activeView === "history"
                ? "My complaints"
                : activeView === "new"
                  ? "New complaint"
                  : "Dashboard"}
            </strong>
          </div>

          <div className="topbar-right">
            <span className="secure-label">
              <ShieldCheck size={15} />
              Demo environment
            </span>

            <div className="avatar">AS</div>
          </div>
        </header>

        <main className="page-content">
          {activeView !== "history" && (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-dot" />
                    VOICE-FIRST CIVIC ASSISTANCE
                  </div>

                  <h1>
                    Make your voice <span>count.</span>
                  </h1>

                  <p>
                    Describe a local issue in your own language.
                    We’ll help turn it into a clear complaint draft.
                  </p>
                </div>

                <button
                  className="primary-button welcome-action"
                  onClick={() => navigate("new")}
                >
                  <Plus size={17} />
                  New complaint
                </button>
              </section>

              <section className="stats-grid">
                <article className="stat-card">
                  <div className="stat-icon stat-indigo">
                    <FileText size={19} />
                  </div>

                  <div>
                    <span className="stat-label">
                      Saved drafts
                    </span>
                    <strong>{savedComplaints.length}</strong>
                    <small>On this device</small>
                  </div>
                </article>

                <article className="stat-card">
                  <div className="stat-icon stat-green">
                    <Activity size={19} />
                  </div>

                  <div>
                    <span className="stat-label">
                      Current category
                    </span>
                    <strong className="stat-category">
                      {complaint.trim() ? category : "Not set"}
                    </strong>
                    <small>Based on your description</small>
                  </div>
                </article>

                <article className="stat-card">
                  <div className="stat-icon stat-amber">
                    <Languages size={19} />
                  </div>

                  <div>
                    <span className="stat-label">
                      Selected language
                    </span>
                    <strong className="stat-category">
                      {language}
                    </strong>
                    <small>Voice and draft language</small>
                  </div>
                </article>
              </section>
            </>
          )}

          {activeView !== "history" && (
            <section className="workspace-grid">
              <div className="workspace-main">
                {(activeView === "dashboard" ||
                  activeView === "new") && (
                  <section className="panel complaint-panel">
                    <div className="panel-heading">
                      <div>
                        <span className="panel-kicker">
                          START HERE
                        </span>

                        <h2>
                          {activeView === "new"
                            ? "Create a new complaint"
                            : "Tell us what happened"}
                        </h2>

                        <p>
                          A few simple details are enough to get started.
                        </p>
                      </div>

                      <span className="step-pill">
                        STEP 01 <span>/ 02</span>
                      </span>
                    </div>

                    <div className="form-section">
                      <label className="field-label">
                        <Languages size={16} />
                        Choose your language
                      </label>

                      <div className="language-grid">
                        {languages.map((item) => (
                          <button
                            key={item.name}
                            type="button"
                            className={`language-option ${
                              language === item.name
                                ? "selected"
                                : ""
                            }`}
                            onClick={() => {
                              setLanguage(item.name);
                              setMessage(`${item.name} selected.`);
                            }}
                          >
                            {item.name}

                            {language === item.name && (
                              <CheckCircle2 size={14} />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-section">
                      <div className="field-title-row">
                        <label
                          className="field-label"
                          htmlFor="complaint"
                        >
                          Describe your civic issue
                        </label>

                        <span className="field-counter">
                          {complaint.length}/1000
                        </span>
                      </div>

                      <p className="field-hint">
                        Use your own words. You can speak or type in
                        the language you selected.
                      </p>

                      <textarea
                        id="complaint"
                        className="complaint-input"
                        value={complaint}
                        maxLength={1000}
                        onChange={(event) => {
                          setComplaint(event.target.value);
                          setGenerated(false);
                          setConfirmed(false);
                        }}
                        placeholder="Example: Hamare area mein 3 din se paani nahi aa raha hai..."
                        rows={5}
                      />

                      <div className="input-bottom-row">
                        <button
                          type="button"
                          className={`voice-button ${
                            listening ? "is-listening" : ""
                          }`}
                          onClick={startListening}
                          disabled={listening}
                        >
                          {listening ? (
                            <Waves size={17} />
                          ) : (
                            <Mic size={17} />
                          )}

                          {listening
                            ? "Listening..."
                            : "Speak your problem"}
                        </button>

                        <span className="input-note">
                          Voice input or text input
                        </span>
                      </div>
                    </div>

                    <div className="form-section">
                      <label
                        className="field-label"
                        htmlFor="location"
                      >
                        <MapPin size={16} />
                        Your location
                      </label>

                      <input
                        id="location"
                        className="text-input"
                        value={location}
                        onChange={(event) => {
                          setLocation(event.target.value);
                          setConfirmed(false);
                        }}
                        placeholder="Village / Town, District, State"
                      />
                    </div>

                    <div className="followup-box">
                      <button
                        type="button"
                        className="followup-toggle"
                        onClick={() =>
                          setShowFollowUps((show) => !show)
                        }
                      >
                        <span className="followup-icon">
                          <Lightbulb size={17} />
                        </span>

                        <span>
                          <strong>
                            Improve your complaint with smart questions
                          </strong>
                          <small>
                            Optional · Add useful context for a clearer draft
                          </small>
                        </span>

                        <span className="followup-count">
                          {completedFollowUps}/3
                        </span>

                        <ChevronRight
                          className={
                            showFollowUps ? "rotate-chevron" : ""
                          }
                          size={18}
                        />
                      </button>

                      {showFollowUps && (
                        <div className="followup-fields">
                          {followUpQuestions.map((question) => (
                            <label
                              className="followup-field"
                              key={question.id}
                            >
                              {question.label}

                              <input
                                className="text-input"
                                value={
                                  followUpAnswers[question.id]
                                }
                                onChange={(event) =>
                                  setFollowUpAnswers((current) => ({
                                    ...current,
                                    [question.id]: event.target.value
                                  }))
                                }
                                placeholder={question.placeholder}
                              />
                            </label>
                          ))}

                          <p className="followup-note">
                            Only details you enter are added to the complaint request.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="form-footer">
                      <div className="category-preview">
                        <span className="category-dot" />
                        Detected category:
                        <strong>{category}</strong>
                      </div>

                      <button
                        type="button"
                        className="primary-button"
                        onClick={generateComplaint}
                        disabled={
                          generating || !complaint.trim()
                        }
                      >
                        {generating
                          ? "Preparing draft..."
                          : "Generate complaint"}

                        {!generating && (
                          <ArrowRight size={17} />
                        )}
                      </button>
                    </div>

                    {message && (
                      <div className="status-message">
                        <AlertCircle size={16} />
                        {message}
                      </div>
                    )}
                  </section>
                )}

                {generated && (
                  <section className="panel result-panel">
                    <div className="panel-heading">
                      <div>
                        <span className="panel-kicker">
                          YOUR DRAFT
                        </span>

                        <h2>Review before proceeding</h2>

                        <p>
                          Make sure the details are correct.
                          You can edit the draft below.
                        </p>
                      </div>

                      <span className="ready-pill">
                        <CheckCircle2 size={15} />
                        Draft ready
                      </span>
                    </div>

                    <div className="draft-meta">
                      <span>
                        <FileText size={15} />
                        {category}
                      </span>

                      <span>
                        Saved locally only after confirmation
                      </span>
                    </div>

                    <textarea
                      className="draft-editor"
                      value={draft}
                      onChange={(event) => {
                        setDraft(event.target.value);
                        setConfirmed(false);
                        setTicketId("");
                      }}
                      rows={10}
                      aria-label="Edit complaint draft"
                    />

                    <div className="draft-actions">
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
                        className="secondary-button"
                        onClick={copyDraft}
                      >
                        <Copy size={16} />
                        Copy draft
                      </button>

                      <button
                        type="button"
                        className="primary-button"
                        onClick={confirmComplaint}
                        disabled={confirmed || !draft.trim()}
                      >
                        <CheckCircle2 size={17} />
                        {confirmed
                          ? "Draft saved"
                          : "Confirm & save draft"}
                      </button>
                    </div>

                    {confirmed && (
                      <div className="confirmation-box">
                        <BadgeCheck size={22} />

                        <div>
                          <strong>Draft saved successfully</strong>

                          <p>
                            Reference ID: <b>{ticketId}</b>
                          </p>

                          <p>Status: Draft Confirmed</p>

                          <small>
                            This is a locally saved demo record.
                            No government department has been contacted
                            and no complaint has been submitted.
                          </small>
                        </div>
                      </div>
                    )}

                    <button
                      className="text-button"
                      onClick={resetForm}
                    >
                      <RotateCcw size={15} />
                      Create another complaint
                    </button>
                  </section>
                )}
              </div>

              <aside className="workspace-aside">
                <section className="aside-card quality-card">
                  <div className="aside-title">
                    <span className="aside-icon">
                      <ShieldCheck size={18} />
                    </span>

                    <div>
                      <h3>Draft quality check</h3>
                      <p>Helpful review reminders</p>
                    </div>
                  </div>

                  <div className="quality-score">
                    <strong>
                      {qualityScore}
                      <span>/4</span>
                    </strong>
                    <span>checks passed</span>
                  </div>

                  <div className="quality-meter">
                    <span
                      style={{
                        width: `${qualityScore * 25}%`
                      }}
                    />
                  </div>

                  <div className="quality-list">
                    {qualityChecks.map((check) => (
                      <div
                        className="quality-item"
                        key={check.label}
                      >
                        {check.passed ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          <AlertCircle size={16} />
                        )}

                        <div>
                          <strong>{check.label}</strong>
                          <small>{check.detail}</small>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="quality-disclaimer">
                    This is a rule-based checklist, not an official verification.
                  </p>
                </section>

                <section className="aside-card tip-card">
                  <div className="tip-icon">
                    <Sparkles size={18} />
                  </div>

                  <h3>Make your report useful</h3>

                  <p>
                    Include where the issue is, when it started and
                    how it affects people. Avoid adding details you
                    are not sure about.
                  </p>
                </section>

                <section className="aside-card process-card">
                  <span className="panel-kicker">
                    HOW IT WORKS
                  </span>

                  <div className="process-step">
                    <span>1</span>
                    <div>
                      <strong>Speak or type</strong>
                      <small>Explain the local issue</small>
                    </div>
                  </div>

                  <div className="process-line" />

                  <div className="process-step">
                    <span>2</span>
                    <div>
                      <strong>Structure with AI</strong>
                      <small>Prepare a readable draft</small>
                    </div>
                  </div>

                  <div className="process-line" />

                  <div className="process-step">
                    <span>3</span>
                    <div>
                      <strong>Review and save</strong>
                      <small>You stay in control</small>
                    </div>
                  </div>
                </section>
              </aside>
            </section>
          )}

          {activeView === "history" && (
            <section className="history-view">
              <div className="welcome-row">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-dot" />
                    YOUR RECORDS
                  </div>

                  <h1>
                    My <span>complaints.</span>
                  </h1>

                  <p>
                    Review complaint drafts saved in this browser on this device.
                  </p>
                </div>

                <button
                  className="primary-button welcome-action"
                  onClick={() => navigate("new")}
                >
                  <Plus size={17} />
                  New complaint
                </button>
              </div>

              {selectedComplaint ? (
                <section className="panel result-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="panel-kicker">
                        SAVED COMPLAINT DETAILS
                      </span>

                      <h2>{selectedComplaint.category}</h2>

                      <p>
                        Review the details of this locally saved draft.
                      </p>
                    </div>

                    <span className="ready-pill">
                      <CheckCircle2 size={15} />
                      {selectedComplaint.status}
                    </span>
                  </div>

                  <div className="draft-meta">
                    <span>
                      <FileText size={15} />
                      Ref: {selectedComplaint.id}
                    </span>

                    <span>
                      <Clock size={15} />
                      {selectedComplaint.date}
                    </span>
                  </div>

                  <div className="detail-info-grid">
                    <div className="detail-info-card">
                      <span>Category</span>
                      <strong>{selectedComplaint.category}</strong>
                    </div>

                    <div className="detail-info-card">
                      <span>Location</span>
                      <strong>
                        {selectedComplaint.location}
                      </strong>
                    </div>

                    <div className="detail-info-card">
                      <span>Status</span>
                      <strong>{selectedComplaint.status}</strong>
                    </div>
                  </div>

                  <div className="form-section">
                    <label className="field-label">
                      Original complaint
                    </label>

                    <textarea
                      className="draft-editor"
                      value={
                        selectedComplaint.description ||
                        "No original description available."
                      }
                      readOnly
                      rows={5}
                    />
                  </div>

                  <div className="form-section">
                    <label className="field-label">
                      Generated complaint draft
                    </label>

                    <textarea
                      className="draft-editor"
                      value={
                        selectedComplaint.draft ||
                        "No generated draft available."
                      }
                      readOnly
                      rows={10}
                    />
                  </div>

                  <div className="draft-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setSelectedComplaint(null)}
                    >
                      <ArrowRight
                        size={16}
                        style={{
                          transform: "rotate(180deg)"
                        }}
                      />
                      Back to complaint history
                    </button>

                    <button
  type="button"
  className="secondary-button"
  onClick={() => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this saved complaint?"
    );

    if (confirmed) {
      deleteComplaint(selectedComplaint.id);
    }
  }}
>
  <X size={16} />
  Delete complaint
</button>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            cleanAIText(
                              selectedComplaint.draft || ""
                            )
                          );
                          setMessage("Saved draft copied to clipboard.");
                        } catch {
                          setMessage("Copy is unavailable in this browser.");
                        }
                      }}
                    >
                      <Copy size={16} />
                      Copy saved draft
                    </button>
                  </div>

                  <div className="history-disclaimer">
                    <ShieldCheck size={15} />
                    This is a local demo record, not an official government tracking record.
                  </div>
                </section>
              ) : savedComplaints.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <ClipboardList size={25} />
                  </div>

                  <h2>No saved drafts yet</h2>

                  <p>
                    Your confirmed local drafts will appear here.
                  </p>

                  <button
                    className="primary-button"
                    onClick={() => navigate("new")}
                  >
                    Create your first draft
                    <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="history-table">
                  <div className="history-table-head">
                    <span>COMPLAINT</span>
                    <span>LOCATION</span>
                    <span>DATE</span>
                    <span>STATUS</span>
                  </div>

                  {savedComplaints.map((item) => (
                    <article
                      className="history-row"
                      key={item.id}
                      onClick={() =>
                        openComplaintDetails(item)
                      }
                      role="button"
                      tabIndex={0}
                      aria-label={`View ${item.category} complaint details`}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();
                          openComplaintDetails(item);
                        }
                      }}
                    >
                      <div className="history-name">
                        <span className="history-file-icon">
                          <FileText size={17} />
                        </span>

                        <div>
                          <strong>{item.category}</strong>
                          <small>Ref: {item.id}</small>
                        </div>
                      </div>

                      <span className="history-location">
                        <MapPin size={14} />
                        {item.location}
                      </span>

                      <span className="history-date">
                        <Clock size={14} />
                        {item.date}
                      </span>

                      <span className="history-status">
                        <CheckCircle2 size={14} />
                        {item.status}
                      </span>
                    </article>
                  ))}
                </div>
              )}

              <p className="history-disclaimer">
                <ShieldCheck size={15} />
                These are local demo records only. They are not government complaint tracking records.
              </p>
            </section>
          )}

          <footer className="app-footer">
            <div className="footer-brand">
              <AudioLines size={17} />
              AwaazSetu AI
            </div>

            <span>
              Making civic services more accessible, one voice at a time.
            </span>

            <span className="footer-demo">
              <CircleHelp size={14} />
              Educational prototype · Demo mode
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
