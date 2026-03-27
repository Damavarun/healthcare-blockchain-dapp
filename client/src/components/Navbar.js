import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// ── Role-specific nav items ───────────────────────────────────────────────────
const NAV_ITEMS = {
  admin: [
    { path: "/admin",     label: "🏠 Dashboard"    },
    { path: "/meeting",   label: "🎥 Meeting Room" },
    { path: "/assistant", label: "🤖 AI Assistant" },
  ],
  doctor: [
    { path: "/doctor",    label: "🩺 My Dashboard" },
    { path: "/meeting",   label: "🎥 Meeting Room" },
    { path: "/assistant", label: "🤖 AI Assistant" },
  ],
  patient: [
    { path: "/patient",   label: "💊 My Dashboard" },
    { path: "/meeting",   label: "🎥 Meeting Room" },
    { path: "/assistant", label: "🤖 AI Assistant" },
  ],
};

const ROLE_LABELS = {
  admin:   { title: "⚕️ CareChain",  badge: "Administrator", color: "#ef4444" },
  doctor:  { title: "⚕️ CareChain",  badge: "Doctor",        color: "#2563eb" },
  patient: { title: "⚕️ CareChain",  badge: "Patient",       color: "#16a34a" },
};

function Navbar({ role }) {
  const navigate = useNavigate();
  const location = useLocation();

  // 🌙 Dark mode persisted in localStorage
  const [dark, setDark] = useState(() => {
    return localStorage.getItem("hc-dark") === "true";
  });

  useEffect(() => {
    if (dark) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    localStorage.setItem("hc-dark", dark);
  }, [dark]);

  const meta      = ROLE_LABELS[role] || { title: "⚕️ CareChain", badge: "", color: "#2563eb" };
  const navItems  = NAV_ITEMS[role]   || [{ path: "/assistant", label: "🤖 AI Assistant" }];

  return (
    <div className="sidebar">

      {/* ── Brand ── */}
      <div className="sidebar-brand">
        <span className="sidebar-logo">⚕️</span>
        <span className="sidebar-title">CareChain</span>
      </div>

      {/* ── Role badge ── */}
      <div className="sidebar-badge" style={{ background: `${meta.color}22`, color: meta.color }}>
        {meta.badge}
      </div>

      {/* ── Nav Links ── */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              className={`sidebar-btn${active ? " active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* ── Spacer ── */}
      <div style={{ flex: 1 }} />

      {/* ── Dark / Light toggle ── */}
      <button
        className="sidebar-theme-toggle"
        onClick={() => setDark((d) => !d)}
        title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        <span style={{ fontSize: "18px" }}>{dark ? "☀️" : "🌙"}</span>
        <span style={{ fontSize: "13px", fontWeight: 600 }}>
          {dark ? "Light Mode" : "Dark Mode"}
        </span>
      </button>

    </div>
  );
}

export default Navbar;
