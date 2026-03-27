import React, { useCallback, useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { loadBlockchain } from "./contractConfig";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Doctor from "./components/Doctor";
import Patient from "./components/Patient";

import Admin from "./pages/Admin";
import DoctorPage from "./pages/DoctorPage";
import PatientPage from "./pages/PatientPage";
import LoginPage from "./pages/LoginPage";
import RegisterChoice from "./pages/RegisterChoice";
import AIHealthAssistant from "./pages/AIHealthAssistant";
import MeetingRoom from "./pages/MeetingRoom";
import { Toaster } from "react-hot-toast";

import "./App.css";

function App() {

  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [role, setRole] = useState("");
  const [connected, setConnected] = useState(false);
  const [userName, setUserName] = useState("");
  const [showWallet, setShowWallet] = useState(false);

  const navigate = useNavigate();

  const addLog = useCallback((message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage, data || "");
  }, []);

  const connectWallet = async () => {
    try {

      addLog("🔌 Connecting wallet...");

      const { web3, contract, account } = await loadBlockchain();

      if (web3 && contract) {

        addLog("✅ Wallet connected", {
          account: account,
          contractAddress: contract._address
        });

        setAccount(account);
        setContract(contract);
        setConnected(true);

      } else {

        addLog("❌ Failed to load blockchain");

      }

    } catch (error) {

      addLog("❌ Wallet connection error", error.message);

    }
  };

  // Fetch the on-chain name (patient name or doctor name) for display in header
  const fetchUserName = useCallback(async (detectedRole) => {
    if (!contract || !account) return;
    try {
      if (detectedRole === "patient") {
        const info = await contract.methods.getPatientInfo(account).call();
        setUserName(info.name || "");
      } else if (detectedRole === "doctor") {
        const info = await contract.methods.getDoctorDetails(account).call();
        setUserName(info.name || "");
      } else {
        setUserName("Admin");
      }
    } catch (e) {
      setUserName("");
    }
  }, [contract, account]);

  const detectRole = useCallback(async () => {
    if (!contract || !account) {
      addLog("⚠️ Skipping role detection: contract or account missing");
      return;
    }
    addLog("🔍 Detecting role via smart contract", { account });
    try {
      const roleFromContract = await contract.methods.getRole(account).call();
      addLog("✅ Role detected from contract", roleFromContract);
      setRole(roleFromContract);
      fetchUserName(roleFromContract);
    } catch (error) {
      addLog("❌ Error detecting role", error.message);
      setRole("unregistered");
    }
  }, [contract, account, addLog, fetchUserName]);


  useEffect(() => {

    if (contract && account) {
      detectRole();
    }

  }, [contract, account, detectRole]);


  useEffect(() => {

    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {

      console.log("Accounts changed:", accounts);

      if (accounts.length === 0) {

        setConnected(false);
        setAccount("");
        setRole("");

      } else {

        const newAccount = accounts[0];

        console.log("Switching to account:", newAccount);

        setAccount(newAccount);
        setRole("");

      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };

  }, []);


  useEffect(() => {
    if (connected && role === "unregistered") {
      const currentPath = window.location.pathname;
      if (currentPath !== "/register" && !currentPath.startsWith("/register/")) {
        console.log("Redirecting to registration");
        navigate("/register", { replace: true });
      }
    }
  }, [connected, role, navigate]);


  if (connected && !role) {

    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        <h2>Detecting your account...</h2>
        <p>Please wait while we check your registration status.</p>
      </div>
    );

  }


  if (!connected) {

    return <LoginPage connectWallet={connectWallet} />;

  }


  return (

    <div className="dashboard-layout">
      <Toaster position="top-right" />

      {role !== "unregistered" && <Navbar role={role} />}

      <div className="main-area">

        <div className="header">

          {/* Left — Role + Name */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              background: role === "admin" ? "#fee2e2" : role === "doctor" ? "#dbeafe" : "#dcfce7",
              color:      role === "admin" ? "#991b1b" : role === "doctor" ? "#1d4ed8" : "#14532d",
            }}>{role}</span>
            {userName && (
              <span style={{ fontWeight: "700", fontSize: "16px" }}>👋 {userName}</span>
            )}
          </div>

          {/* Right — Wallet with hide/show */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "13px", color: "#64748b" }}>
              {showWallet
                ? account
                : userName
                  ? `${userName.split(" ")[0]} ••••${account.slice(-4)}`
                  : `${account.slice(0, 8)}...${account.slice(-6)}`
              }
            </span>
            <button
              onClick={() => setShowWallet(!showWallet)}
              style={{
                padding: "5px 12px",
                fontSize: "12px",
                fontWeight: "600",
                background: "#f1f5f9",
                color: "#475569",
                border: "1.5px solid #e2e8f0",
                borderRadius: "6px",
                cursor: "pointer",
                boxShadow: "none"
              }}
            >
              {showWallet ? "🙈 Hide" : "👁 Show"}
            </button>
          </div>

        </div>

        <div className="content">

          <Routes>

            <Route
              path="/admin"
              element={
                <ProtectedRoute role={role} allowedRole="admin">
                  <Admin account={account} contract={contract} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctor"
              element={
                <ProtectedRoute role={role} allowedRole="doctor">
                  <DoctorPage account={account} contract={contract} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/patient"
              element={
                <ProtectedRoute role={role} allowedRole="patient">
                  <PatientPage account={account} contract={contract} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/register"
              element={
                role === "unregistered"
                  ? <RegisterChoice />
                  : <Navigate to="/" />
              }
            />

            <Route
              path="/register/patient"
              element={
                role === "unregistered"
                  ? <Patient account={account} contract={contract} detectRole={detectRole} />
                  : <Navigate to="/" />
              }
            />

            <Route
              path="/register/doctor"
              element={
                role === "unregistered"
                  ? <Doctor account={account} contract={contract} detectRole={detectRole} />
                  : <Navigate to="/" />
              }
            />

            <Route
              path="/assistant"
              element={<AIHealthAssistant />}
            />

            <Route
              path="/meeting"
              element={<MeetingRoom account={account} userName={userName} role={role} />}
            />

            <Route
              path="/"
              element={
                role === "admin"
                  ? <Navigate to="/admin" />
                  : role === "doctor"
                  ? <Navigate to="/doctor" />
                  : role === "patient"
                  ? <Navigate to="/patient" />
                  : <Navigate to="/register" />
              }
            />

          </Routes>

        </div>

      </div>

    </div>

  );

}

export default App;