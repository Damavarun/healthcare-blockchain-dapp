import React, { useState } from "react";
import toast from "react-hot-toast";

// ── Expanded rule-based symptom engine ──────────────────────────────────────
const RULES = [
  {
    keywords: ["chest pain", "chest tightness", "shortness of breath", "breathless", "palpitation"],
    conditions: ["Possible: Cardiac or respiratory issue", "Could indicate: Angina / Pulmonary embolism"],
    specialist: "Cardiologist / Pulmonologist",
    severity: "high",
    tips: ["Avoid physical exertion", "Seek emergency care if pain is severe", "Keep yourself calm"]
  },
  {
    keywords: ["fever", "cough", "cold", "flu", "body pain", "runny nose"],
    conditions: ["Possible: Viral infection (flu / common cold)", "Could indicate: COVID-19 / Influenza"],
    specialist: "General Physician",
    severity: "medium",
    tips: ["Stay hydrated", "Take rest", "Monitor temperature regularly"]
  },
  {
    keywords: ["headache", "vomit", "migraine", "dizziness", "vertigo"],
    conditions: ["Possible: Migraine or inner-ear issue", "Could indicate: CNS infection if very severe"],
    specialist: "Neurologist",
    severity: "medium",
    tips: ["Rest in a dark, quiet room", "Avoid screen time", "Take prescribed pain relief"]
  },
  {
    keywords: ["rash", "skin", "itching", "acne", "eczema", "hives"],
    conditions: ["Possible: Dermatological or allergic condition"],
    specialist: "Dermatologist",
    severity: "low",
    tips: ["Avoid scratching", "Use a mild moisturizer", "Avoid known allergens"]
  },
  {
    keywords: ["diabetes", "sugar", "blood sugar", "hyperglycemia"],
    conditions: ["Chronic: Diabetes / Metabolic syndrome"],
    specialist: "Endocrinologist",
    severity: "medium",
    tips: ["Monitor blood sugar daily", "Maintain a low-GI diet", "Exercise regularly"]
  },
  {
    keywords: ["back pain", "spine", "sciatica", "slipped disc", "joint pain"],
    conditions: ["Possible: Musculoskeletal disorder / Spinal issue"],
    specialist: "Orthopedic Surgeon / Physiotherapist",
    severity: "medium",
    tips: ["Avoid heavy lifting", "Apply ice/heat packs", "Gentle stretching may help"]
  },
  {
    keywords: ["stomach pain", "abdomen", "diarrhea", "constipation", "nausea", "bloating"],
    conditions: ["Possible: Gastrointestinal issue (IBS, gastritis, etc.)"],
    specialist: "Gastroenterologist",
    severity: "medium",
    tips: ["Eat small, frequent meals", "Avoid spicy and fatty food", "Stay hydrated"]
  },
  {
    keywords: ["depression", "anxiety", "stress", "panic", "mental", "mood"],
    conditions: ["Possible: Mental health concern (anxiety / depression)"],
    specialist: "Psychiatrist / Psychologist",
    severity: "medium",
    tips: ["Talk to a healthcare professional", "Practice mindfulness or meditation", "Avoid isolation"]
  },
  {
    keywords: ["eye", "vision", "blurry", "red eye", "eyesight"],
    conditions: ["Possible: Ocular condition (conjunctivitis, refractive error)"],
    specialist: "Ophthalmologist",
    severity: "low",
    tips: ["Avoid rubbing eyes", "Reduce screen time", "Wear UV-protection sunglasses"]
  },
  {
    keywords: ["ear", "hearing", "tinnitus", "earache", "ear pain"],
    conditions: ["Possible: ENT issue (ear infection, tinnitus)"],
    specialist: "ENT Specialist",
    severity: "low",
    tips: ["Avoid loud noise exposure", "Keep ears dry", "Avoid inserting objects in ears"]
  },
  {
    keywords: ["toothache", "gum", "teeth", "dental", "jaw pain"],
    conditions: ["Possible: Dental or oral health issue"],
    specialist: "Dentist",
    severity: "low",
    tips: ["Rinse with warm salt water", "Avoid very hot or cold foods", "Brush gently"]
  },
  {
    keywords: ["kidney", "urination", "uti", "burning urine", "urinary"],
    conditions: ["Possible: Urinary tract infection / Renal issue"],
    specialist: "Nephrologist / Urologist",
    severity: "medium",
    tips: ["Drink plenty of water", "Avoid caffeine and alcohol", "Complete any prescribed antibiotic course"]
  }
];

const SEVERITY_META = {
  high:   { label: "🔴 High — Seek Immediate Attention", color: "#ef4444" },
  medium: { label: "🟡 Medium — Consult a Doctor Soon",  color: "#f59e0b" },
  low:    { label: "🟢 Low — Monitor & Follow Up",       color: "#10b981" }
};

function matchSymptoms(text) {
  const lower = text.toLowerCase();
  const matched = [];

  for (const rule of RULES) {
    if (rule.keywords.some(k => lower.includes(k))) {
      matched.push(rule);
    }
  }

  if (matched.length === 0) {
    if (lower.trim().length > 0) {
      return [{
        conditions: ["No specific pattern matched. A general consultation is recommended."],
        specialist: "General Physician",
        severity: "low",
        tips: ["Observe symptoms for 24–48 hours", "Consult a GP if symptoms persist"]
      }];
    }
    return null;
  }

  return matched;
}

// ── Component ────────────────────────────────────────────────────────────────
function AIHealthAssistant() {
  const [symptoms, setSymptoms] = useState("");
  const [results, setResults] = useState(null);

  const analyse = () => {
    if (!symptoms.trim()) {
      toast.error("Please describe your symptoms first.");
      return;
    }
    const matched = matchSymptoms(symptoms);
    if (!matched) {
      toast.error("Please describe at least one symptom.");
      return;
    }
    setResults(matched);
    toast.success("Analysis complete!");
  };

  const reset = () => {
    setSymptoms("");
    setResults(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="card" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "48px" }}>🤖</span>
          <div>
            <h2 style={{ margin: 0, color: "#38bdf8" }}>AI Health Assistant</h2>
            <p style={{ margin: "6px 0 0", opacity: 0.8, lineHeight: 1.5 }}>
              Describe your symptoms in plain English. Our rule-based engine will suggest
              possible conditions and the most relevant medical specialist.
            </p>
            <p style={{ margin: "6px 0 0", fontSize: "0.78rem", opacity: 0.55 }}>
              ⚠️ For informational purposes only — not a substitute for professional medical advice.
            </p>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Describe Your Symptoms</h3>
        <textarea
          placeholder="Example: I have been having fever, cough and body aches for two days..."
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          onKeyDown={(e) => { if (e.ctrlKey && e.key === "Enter") analyse(); }}
          style={{
            width: "100%",
            minHeight: "130px",
            padding: "14px",
            borderRadius: "10px",
            border: "1px solid rgba(0,0,0,0.1)",
            fontFamily: "Inter, sans-serif",
            fontSize: "15px",
            resize: "vertical",
            boxSizing: "border-box"
          }}
        />
        <div style={{ display: "flex", gap: "12px", marginTop: "14px" }}>
          <button onClick={analyse} style={{ flex: 1 }}>
            🔍 Analyse Symptoms
          </button>
          {results && (
            <button
              onClick={reset}
              style={{ background: "rgba(0,0,0,0.08)", color: "#374151", boxShadow: "none" }}
            >
              Reset
            </button>
          )}
        </div>
        <p style={{ margin: "8px 0 0", fontSize: "0.8rem", opacity: 0.5 }}>Tip: Press Ctrl+Enter to analyse quickly</p>
      </div>

      {/* Results */}
      {results && results.map((res, i) => {
        const sev = SEVERITY_META[res.severity];
        return (
          <div key={i} className="card" style={{ borderLeft: `4px solid ${sev.color}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <span style={{
                padding: "4px 14px",
                background: sev.color,
                color: "#fff",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "700"
              }}>
                {sev.label}
              </span>
            </div>

            <h4 style={{ margin: "0 0 10px", color: "#1e3a5f" }}>🩺 Possible Conditions</h4>
            <ul style={{ paddingLeft: "18px", marginTop: 0 }}>
              {res.conditions.map((c, ci) => (
                <li key={ci} style={{ marginBottom: "4px" }}>{c}</li>
              ))}
            </ul>

            <div style={{
              marginTop: "14px",
              padding: "12px 16px",
              background: "rgba(59,130,246,0.08)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              <span style={{ fontSize: "24px" }}>👨‍⚕️</span>
              <div>
                <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Recommended Specialist</div>
                <div style={{ fontSize: "17px", fontWeight: "700", color: "#1d4ed8", marginTop: "2px" }}>{res.specialist}</div>
              </div>
            </div>

            {res.tips && res.tips.length > 0 && (
              <div style={{ marginTop: "14px" }}>
                <h4 style={{ margin: "0 0 8px", color: "#065f46" }}>💡 Home Care Tips</h4>
                <ul style={{ paddingLeft: "18px", marginTop: 0 }}>
                  {res.tips.map((tip, ti) => (
                    <li key={ti} style={{ marginBottom: "4px", color: "#374151" }}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}

      {/* Common symptom chips */}
      {!results && (
        <div className="card">
          <h4 style={{ marginTop: 0, marginBottom: "12px", color: "#6b7280" }}>🏷️ Common Symptoms (click to add)</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {["Fever", "Cough", "Headache", "Chest pain", "Back pain", "Stomach pain", "Skin rash", "Dizziness", "Anxiety"].map((chip) => (
              <button
                key={chip}
                onClick={() => setSymptoms(prev => prev ? `${prev}, ${chip.toLowerCase()}` : chip.toLowerCase())}
                style={{
                  padding: "6px 14px",
                  background: "rgba(59,130,246,0.1)",
                  color: "#2563eb",
                  border: "1px solid rgba(59,130,246,0.3)",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "none"
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AIHealthAssistant;
