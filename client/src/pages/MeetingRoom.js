import React, { useState, useRef } from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";
import toast from "react-hot-toast";

// ── Utility: generate a deterministic but URL-safe room name ─────────────────
function sanitizeRoom(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 40) || "carechain-room";
}

// ── Preset quick room templates ───────────────────────────────────────────────
const PRESETS = [
  { label: "🩺 General Consultation", prefix: "carechain-consult" },
  { label: "🫀 Cardiology Session",   prefix: "carechain-cardio"  },
  { label: "🧠 Neurology Session",    prefix: "carechain-neuro"   },
  { label: "👁 Opthalmology",         prefix: "carechain-eye"     },
  { label: "🦴 Orthopedics",          prefix: "carechain-ortho"   },
  { label: "🔬 Lab Report Review",    prefix: "carechain-lab"     },
];

export default function MeetingRoom({ account, userName, role }) {

  const [roomInput, setRoomInput]   = useState("");
  const [displayName, setDisplayName] = useState(userName || "");
  const [activeRoom, setActiveRoom]  = useState(null);
  const [inMeeting, setInMeeting]    = useState(false);
  const apiRef = useRef(null);

  const joinRoom = (roomId) => {
    if (!roomId || !roomId.trim()) {
      toast.error("Please enter or select a room name.");
      return;
    }
    const safe = sanitizeRoom(roomId);
    setActiveRoom(safe);
    setInMeeting(true);
    toast.success(`Joining room: ${safe}`);
  };

  const leaveRoom = () => {
    if (apiRef.current) {
      try { apiRef.current.executeCommand("hangup"); } catch (_) {}
    }
    setInMeeting(false);
    setActiveRoom(null);
    toast("Left the meeting room.", { icon: "👋" });
  };

  // ── In-Meeting View ──────────────────────────────────────────────────────────
  if (inMeeting && activeRoom) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#000", display: "flex", flexDirection: "column" }}>

        {/* Top bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 20px",
          background: "linear-gradient(90deg, #1e293b 0%, #0f172a 100%)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
          zIndex: 10000
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ fontSize: "22px" }}>⚕️</span>
            <div>
              <div style={{ color: "#38bdf8", fontWeight: "800", fontSize: "16px" }}>CareChain Meeting Room</div>
              <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                🔴 Live · Room: <strong style={{ color: "#e2e8f0" }}>{activeRoom}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => { navigator.clipboard.writeText(`https://meet.jit.si/${activeRoom}`); toast.success("Meeting link copied!"); }}
              style={{ padding: "8px 16px", background: "#1e40af", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
            >
              📋 Copy Invite Link
            </button>
            <button
              onClick={leaveRoom}
              style={{ padding: "8px 18px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "700" }}
            >
              🔴 Leave Meeting
            </button>
          </div>
        </div>

        {/* Jitsi iframe */}
        <div style={{ flex: 1 }}>
          <JitsiMeeting
            domain="meet.jit.si"
            roomName={activeRoom}
            configOverwrite={{
              startWithAudioMuted: true,
              disableModeratorIndicator: false,
              enableEmailInStats: false,
              prejoinPageEnabled: false,
              toolbarButtons: [
                "microphone", "camera", "closedcaptions", "desktop",
                "fullscreen", "fodeviceselection", "hangup", "help",
                "invite", "mute-everyone", "participants-pane",
                "raisehand", "security", "settings", "sharedvideo",
                "shortcuts", "stats", "tileview", "videoquality", "whiteboard"
              ],
            }}
            interfaceConfigOverwrite={{
              DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
              SHOW_PROMOTIONAL_CLOSE_PAGE: false,
            }}
            userInfo={{
              displayName: displayName || (userName ? userName : account ? `${role} ${account.slice(0, 6)}` : "Guest"),
              email: ""
            }}
            onApiReady={(api) => { apiRef.current = api; }}
            onReadyToClose={leaveRoom}
            getIFrameRef={(iframe) => {
              iframe.style.height  = "100%";
              iframe.style.width   = "100%";
              iframe.style.border  = "none";
            }}
          />
        </div>
      </div>
    );
  }

  // ── Lobby View ───────────────────────────────────────────────────────────────
  return (
    <div>

      {/* Hero banner */}
      <div className="card" style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
        color: "#fff",
        borderRadius: "20px",
        overflow: "hidden",
        position: "relative",
        padding: "40px"
      }}>
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ fontSize: "48px", marginBottom: "8px" }}>🎥</div>
          <h2 style={{ margin: "0 0 10px", color: "#38bdf8", fontSize: "28px" }}>CareChain Meeting Room</h2>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "16px", maxWidth: "520px", lineHeight: 1.6 }}>
            Secure, end-to-end encrypted video consultations powered by Jitsi Meet. No account required — just create or join a room to start your session instantly.
          </p>
        </div>
        {/* Decorative circles */}
        <div style={{ position: "absolute", right: -40, top: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(56,189,248,0.08)" }} />
        <div style={{ position: "absolute", right: 80, bottom: -60, width: 150, height: 150, borderRadius: "50%", background: "rgba(37,99,235,0.1)" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

        {/* ── Create / Join custom room ── */}
        <div className="card">
          <h3 style={{ marginTop: 0 }}>🚪 Create or Join Room</h3>
          <p style={{ color: "#64748b", fontSize: "14px" }}>
            Enter a unique room name below. Share it with participants so they can join.
          </p>

          <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Your Display Name</label>
          <input
            type="text"
            placeholder={userName || `${role}-user`}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Room Name</label>
          <input
            type="text"
            placeholder="e.g. carechain-consult-varun"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") joinRoom(roomInput); }}
          />

          {roomInput.trim() && (
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "-10px", marginBottom: "12px" }}>
              📎 Room ID will be: <strong style={{ color: "#2563eb" }}>{sanitizeRoom(roomInput)}</strong>
            </div>
          )}

          <button style={{ width: "100%", marginTop: "4px" }} onClick={() => joinRoom(roomInput)}>
            🟢 Start / Join Room
          </button>
        </div>

        {/* ── Quick preset rooms ── */}
        <div className="card">
          <h3 style={{ marginTop: 0 }}>⚡ Quick Consultation Rooms</h3>
          <p style={{ color: "#64748b", fontSize: "14px" }}>
            One-click specialty rooms — shared across the platform for quick access.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
            {PRESETS.map((p) => (
              <button
                key={p.prefix}
                onClick={() => joinRoom(p.prefix)}
                style={{
                  padding: "12px 16px",
                  background: "#f8fafc",
                  color: "#0f172a",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "10px",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "none",
                  transition: "all 0.18s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.background = "#eff6ff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc"; }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="card" style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe" }}>
        <h4 style={{ marginTop: 0, color: "#1d4ed8" }}>💡 How It Works</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          {[
            ["1️⃣", "Create a Room", "Enter a unique name or pick a preset specialty room."],
            ["2️⃣", "Share Link", "Copy the room link and share with your patient/doctor."],
            ["3️⃣", "Consult Securely", "Audio, video, screen share and whiteboard — all built-in."],
            ["4️⃣", "Leave Anytime", "Click Leave Meeting to exit. The room persists for re-joining."],
          ].map(([num, title, desc]) => (
            <div key={title}>
              <div style={{ fontSize: "24px" }}>{num}</div>
              <div style={{ fontWeight: 700, color: "#1e3a5f", marginTop: "4px" }}>{title}</div>
              <div style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
