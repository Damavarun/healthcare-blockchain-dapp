import React, { useCallback, useEffect, useState } from "react";
import Web3 from "web3";
import { QRCodeCanvas } from "qrcode.react";
import AccessNFT from "../contracts/AccessNFT.json";
import ipfs from "../ipfs";
import { encryptFile, decryptFile, fileToBase64 } from "../utils/encryption";
import { JitsiMeeting } from '@jitsi/react-sdk';
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";

function PatientPage({ contract, account }) {

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [specializationQuery, setSpecializationQuery] = useState("");
  const [healthIssue, setHealthIssue] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [ratingByAppt, setRatingByAppt] = useState({});
  const [accessContract, setAccessContract] = useState(null);
  const [consentDoctor, setConsentDoctor] = useState("");
  const [consentDurationDays, setConsentDurationDays] = useState("7");
  const [consentStatusByDoctor, setConsentStatusByDoctor] = useState({});
  const [records, setRecords] = useState([]);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [uploadRecordDiagnosis, setUploadRecordDiagnosis] = useState("");
  const [uploadRecordFile, setUploadRecordFile] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [uploadRecordType, setUploadRecordType] = useState("General Report");

  // =============================
  // Load Doctors
  // =============================
  const loadDoctors = useCallback(async () => {
    try {
      const count = await contract.methods.getDoctorCount().call();
      let temp = [];
      for (let i = 0; i < count; i++) {
        const addr = await contract.methods.doctorList(i).call();
        const details = await contract.methods.getDoctorDetails(addr).call();
        if (details.exists) {
          temp.push({
            address: addr,
            name: details.name,
            specialization: details.specialization,
            rating: details.rating,
            totalRatings: details.totalRatings,
            isVerified: details.isVerified
          });
        }
      }
      setDoctors(temp);
    } catch (error) {
      console.error(error);
    }
  }, [contract]);

  // =============================
  // Load Appointments
  // =============================
  const loadAppointments = useCallback(async () => {
    try {
      const count = await contract.methods.getAppointmentCount().call();
      let temp = [];

      for (let i = 0; i < count; i++) {
        const appt = await contract.methods.appointments(i).call();

        if (appt.patient.toLowerCase() === account.toLowerCase()) {
          temp.push(appt);
        }
      }

      setAppointments(temp);
    } catch (error) {
      console.error(error);
    }
  }, [contract, account]);

  // =============================
  // Load Medical Records
  // =============================
  const loadRecords = useCallback(async () => {
    try {
      const data = await contract.methods
        .getRecords(account)
        .call({ from: account });
      setRecords(data);
    } catch (error) {
      // If patient not registered yet or contract not upgraded on-chain,
      // we silently ignore to avoid breaking dashboard.
      console.error("Failed to load records", error);
    }
  }, [contract, account]);

  // =============================
  // Request Appointment
  // =============================
  const requestAppointment = async () => {
    try {
      if (!selectedDoctor || !healthIssue) {
        toast.error("Please select doctor and enter health issue");
        return;
      }

      await contract.methods
        .requestAppointment(selectedDoctor, healthIssue)
        .send({ from: account });

      toast.success("Appointment Requested");
      setHealthIssue("");
      loadAppointments();
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  // =============================
  // Patient Consent via AccessNFT
  // =============================
  const initAccessContract = useCallback(async () => {
    try {
      if (!window.ethereum) return;
      const web3 = new Web3(window.ethereum);
      const networkId = await web3.eth.net.getId();
      const deployed = AccessNFT.networks[networkId];
      if (!deployed) return;
      const instance = new web3.eth.Contract(AccessNFT.abi, deployed.address);
      setAccessContract(instance);
    } catch (error) {
      console.error("Failed to init AccessNFT", error);
      toast.error("Failed to initialize AccessNFT contract.");
    }
  }, []);

  const refreshConsentStatus = useCallback(async () => {
    try {
      if (!accessContract || !account || doctors.length === 0) return;
      const statusMap = {};
      for (const d of doctors) {
        const has = await accessContract.methods
          .hasValidAccess(account, d.address)
          .call();
        statusMap[d.address.toLowerCase()] = has;
      }
      setConsentStatusByDoctor(statusMap);
    } catch (error) {
      console.error("Failed to refresh consent status", error);
      toast.error("Failed to refresh consent status.");
    }
  }, [accessContract, account, doctors]);

  const grantAccess = async () => {
    try {
      if (!accessContract) {
        toast.error("Access contract not loaded yet");
        return;
      }
      if (!consentDoctor) {
        toast.error("Select a doctor to grant access");
        return;
      }
      const days = Number(consentDurationDays || "0");
      if (isNaN(days) || days <= 0) {
        toast.error("Enter a valid duration in days");
        return;
      }
      const durationSeconds = Math.floor(days * 24 * 60 * 60);
      await accessContract.methods
        .grantAccess(consentDoctor, durationSeconds)
        .send({ from: account });
      toast.success("Access granted via NFT");
      refreshConsentStatus();
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const revokeAccess = async () => {
    try {
      if (!accessContract) {
        toast.error("Access contract not loaded yet");
        return;
      }
      if (!consentDoctor) {
        toast.error("Select a doctor to revoke access");
        return;
      }
      await accessContract.methods
        .revokeAccess(consentDoctor)
        .send({ from: account });
      toast.success("Access revoked");
      refreshConsentStatus();
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  // =============================
  // Pay Consultation
  // =============================
  const payConsultation = async (id, fee) => {
    try {
      await contract.methods
        .payConsultation(id)
        .send({ from: account, value: fee });

      toast.success("Payment Successful");
      loadAppointments();
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  // =============================
  // Pay Treatment
  // =============================
  const payTreatment = async (id, fee) => {
    try {
      await contract.methods
        .payTreatment(id)
        .send({ from: account, value: fee });

      toast.success("Treatment payment successful");
      loadAppointments();
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  // =============================
  // Rate Doctor (after completion)
  // =============================
  const rateDoctor = async (appointmentId, rating) => {
    try {
      await contract.methods
        .rateDoctor(appointmentId, rating)
        .send({ from: account });

      toast.success("Thank you for your rating");
      loadDoctors();
      loadAppointments();
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  // =============================
  // Download & Decrypt File
  // =============================
  const downloadAndDecrypt = async (hash, address) => {
    try {
      const res = await fetch(`https://ipfs.io/ipfs/${hash}`);
      const encryptedData = await res.text();
      const base64Data = decryptFile(encryptedData, address.toLowerCase());
      if (!base64Data) {
         toast.error("Decryption failed. Ensure you have access.");
         return;
      }
      
      const link = document.createElement("a");
      link.href = base64Data;
      link.download = `decrypted_document_${hash.substring(0, 6)}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      toast.error("Failed to download or decrypt file.");
    }
  };

  // =============================
  // Upload Medical Record (Patient)
  // =============================
  const uploadPatientRecord = async () => {
    try {
      if (!uploadRecordDiagnosis || !uploadRecordFile) {
        toast.error("Enter diagnosis and select a file");
        return;
      }

      const base64 = await fileToBase64(uploadRecordFile);
      const encrypted = encryptFile(base64, account.toLowerCase());
      const added = await ipfs.add(encrypted);
      const hash = added.path || added.cid?.toString();

      if (!hash) {
        toast.error("Failed to get IPFS hash");
        return;
      }

      await contract.methods
        .addPatientRecord(uploadRecordDiagnosis, hash)
        .send({ from: account });

      alert("Encrypted medical record uploaded successfully!");
      setUploadRecordDiagnosis("");
      setUploadRecordFile(null);
      loadRecords();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  useEffect(() => {
    if (contract) {
      loadDoctors();
      loadAppointments();
      loadRecords();
    }
  }, [contract, loadAppointments, loadDoctors, loadRecords]);

  useEffect(() => {
    initAccessContract();
  }, [initAccessContract]);

  useEffect(() => {
    if (accessContract && doctors.length > 0) {
      refreshConsentStatus();
    }
  }, [accessContract, doctors, refreshConsentStatus]);

  const stats = appointments.reduce(
    (acc, appt) => {
      acc.total += 1;
      if (!appt.approved && !appt.rejected) acc.requested += 1;
      if (appt.rejected) acc.rejected += 1;
      if (appt.approved && !appt.paid) acc.awaitingConsultationPayment += 1;
      if (appt.paid && appt.treatmentFee !== "0" && !appt.treatmentPaid) acc.awaitingTreatmentPayment += 1;
      if (appt.completed) acc.completed += 1;
      return acc;
    },
    {
      total: 0,
      requested: 0,
      rejected: 0,
      awaitingConsultationPayment: 0,
      awaitingTreatmentPayment: 0,
      completed: 0
    }
  );

  const completionRate =
    stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);

  const filteredDoctors = doctors.filter((d) => {
    const q = specializationQuery.trim().toLowerCase();
    if (!q) return true;
    return (d.specialization || "").toLowerCase().includes(q);
  });

  const exportPrescriptionAsPDF = (rec) => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(16, 185, 129); // Primary green
      doc.text("CampusConnect+ Healthcare", 105, 20, null, null, "center");
      
      doc.setFontSize(16);
      doc.setTextColor(31, 41, 55);
      doc.text("Digital Prescription", 105, 30, null, null, "center");
      
      // Line
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 35, 190, 35);
      
      // Details
      doc.setFontSize(12);
      doc.text(`Patient Address: ${account}`, 20, 45);
      doc.text(`Doctor Address: ${rec.doctor}`, 20, 55);
      doc.text(`Date: ${new Date(Number(rec.createdAt) * 1000).toLocaleString()}`, 20, 65);
      doc.text(`Diagnosis: ${rec.diagnosis || "General Consultation"}`, 20, 75);
      
      // Line
      doc.line(20, 80, 190, 80);
      
      // Prescription text
      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.text("Medicines & Notes:", 20, 90);
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      
      const splitText = doc.splitTextToSize(rec.prescriptionText || "No additional notes.", 170);
      doc.text(splitText, 20, 100);
      
      // Footer
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("Generated securely via Smart Contract. This is a valid digital document.", 105, 280, null, null, "center");
      
      // Save
      doc.save(`Prescription_${rec.appointmentId || Date.now()}.pdf`);
      toast.success("Prescription PDF Downloaded!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div>
      {activeMeeting && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 9999, background: "#fff" }}>
          <button style={{ position: "absolute", top: 10, right: 10, zIndex: 10000, padding: "10px", background: "red", color: "#fff", border: "none", borderRadius: "5px" }} onClick={() => setActiveMeeting(null)}>
            Leave Meeting
          </button>
          <JitsiMeeting
            domain="meet.jit.si"
            roomName={activeMeeting}
            configOverwrite={{
              startWithAudioMuted: true,
              disableModeratorIndicator: true,
              startScreenSharing: true,
              enableEmailInStats: false
            }}
            interfaceConfigOverwrite={{
              DISABLE_JOIN_LEAVE_NOTIFICATIONS: true
            }}
            userInfo={{
              displayName: "Patient"
            }}
            getIFrameRef={(iframeRef) => { iframeRef.style.height = '100%'; }}
          />
        </div>
      )}

      {/* ================= Page Tabs ================= */}
      <div className="tabs-container">
        <button className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>Dashboard</button>
        <button className={activeTab === "appointments" ? "active" : ""} onClick={() => setActiveTab("appointments")}>Appointments</button>
        <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}>Medical History</button>
        <button className={activeTab === "sharing" ? "active" : ""} onClick={() => setActiveTab("sharing")}>Data Sharing</button>
      </div>

      {activeTab === "dashboard" && (
      <div className="card">
        <h2>Patient Dashboard</h2>
        <p><strong>Total appointments:</strong> {stats.total}</p>
        <p><strong>Requested / Pending:</strong> {stats.requested}</p>
        <p><strong>Rejected:</strong> {stats.rejected}</p>
        <p><strong>Awaiting consultation payment:</strong> {stats.awaitingConsultationPayment}</p>
        <p><strong>Awaiting treatment payment:</strong> {stats.awaitingTreatmentPayment}</p>
        <p><strong>Completed:</strong> {stats.completed}</p>

        <div style={{ marginTop: "15px" }}>
          <h4>My Completion Rate</h4>
          <div className="analytics-label">{completionRate}% of my appointments completed</div>
          <div className="analytics-bar-bg">
            <div
              className="analytics-bar-fill"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>
      )}

      {activeTab === "sharing" && (
      <>
      {/* ================= Consent Management ================= */}
      <div className="card">
        <h2>Doctor Access Control</h2>
        <p>
          Grant or revoke permission for doctors to view your detailed medical
          records. Access is represented by an on-chain NFT and automatically
          expires after the chosen duration.
        </p>

        <select
          value={consentDoctor}
          onChange={(e) => setConsentDoctor(e.target.value)}
          style={{ marginTop: "10px" }}
        >
          <option value="">Select Doctor</option>
          {doctors
            .filter((d) => d.isVerified)
            .map((doc) => (
              <option key={doc.address} value={doc.address}>
                {doc.name} — {doc.specialization}
              </option>
            ))}
        </select>

        <div style={{ marginTop: "10px", display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            type="number"
            min="1"
            value={consentDurationDays}
            onChange={(e) => setConsentDurationDays(e.target.value)}
            style={{ width: "120px" }}
          />
          <span>days of access</span>
        </div>

        <div style={{ marginTop: "10px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={grantAccess}>
            Grant Access
          </button>
          <button onClick={revokeAccess}>
            Revoke Access
          </button>
        </div>

        {consentDoctor && (
          <p style={{ marginTop: "10px" }}>
            Current status:{" "}
            {consentStatusByDoctor[consentDoctor.toLowerCase()]
              ? "✅ Access active"
              : "❌ No active access"}
          </p>
        )}
      </div>

      {/* ================= QR Code Sharing ================= */}
      <div className="card">
        <h2>QR Code Medical Sharing</h2>
        <p>
          Generate a QR code that encodes your wallet address and can be
          scanned by a doctor during check-in. Doctors still require consent
          on-chain, but this makes sharing your identity fast and avoids
          manual typing errors.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginTop: "10px" }}>
          <QRCodeCanvas
            value={JSON.stringify({ patient: account })}
            size={140}
            bgColor="#ffffff"
            fgColor="#1f3c88"
            includeMargin
          />
          <div>
            <p><strong>Your address:</strong></p>
            <p style={{ wordBreak: "break-all" }}>{account}</p>
          </div>
        </div>
      </div>
      </>
      )}

      {activeTab === "history" && (
      <>
      {/* ================= Upload Medical Record ================= */}
      <div className="card">
        <h2>Upload Past Medical Record</h2>
        <input 
          type="text" 
          placeholder="Diagnosis / Title" 
          value={uploadRecordDiagnosis}
          onChange={(e) => setUploadRecordDiagnosis(e.target.value)}
        />
        <select
          value={uploadRecordType}
          onChange={(e) => setUploadRecordType(e.target.value)}
        >
          <option>General Report</option>
          <option>Blood Test</option>
          <option>X-Ray</option>
          <option>MRI Scan</option>
          <option>CT Scan</option>
          <option>Ultrasound</option>
          <option>Prescription</option>
          <option>Discharge Summary</option>
          <option>Vaccination Record</option>
        </select>
        <input 
          style={{ marginTop: "10px" }}
          type="file" 
          onChange={(e) => setUploadRecordFile(e.target.files[0])}
        />
        <button style={{ marginTop: "10px" }} onClick={uploadPatientRecord}>
          Encrypt & Upload to IPFS
        </button>
      </div>
      </>
      )}

      {activeTab === "appointments" && (
      <>
      {/* ================= Request Appointment ================= */}
      <div className="card">
        <h2>Request Appointment</h2>

        <input
          type="text"
          placeholder="Search specialization (e.g., cardiology)"
          value={specializationQuery}
          onChange={(e) => setSpecializationQuery(e.target.value)}
        />

        <select
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
        >
          <option value="">Select Doctor</option>
          {filteredDoctors
            .filter((d) => d.isVerified)
            .map((doc) => (
            <option key={doc.address} value={doc.address}>
              {doc.name} — {doc.specialization} — ⭐ {doc.rating}/5
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Health Issue (fever / cancer / etc)"
          value={healthIssue}
          onChange={(e) => setHealthIssue(e.target.value)}
        />

        <button onClick={requestAppointment}>
          Request Appointment
        </button>
      </div>

      {/* ================= Appointment History ================= */}
      <div className="card">
        <h2>My Appointments</h2>

        {appointments.length === 0 && (
          <p>No Appointments Yet</p>
        )}

        {appointments.map((appt, index) => (
          <div key={index} className="appointment-card">

            <p><strong>Doctor:</strong> {appt.doctor}</p>
            <p><strong>Issue:</strong> {appt.healthIssue}</p>
            <p>
              <strong>Consultation Fee:</strong>{" "}
              {Web3.utils.fromWei(`${appt.consultationFee}`, "ether")} ETH
            </p>
            <p>
              <strong>Treatment Fee:</strong>{" "}
              {appt.treatmentFee && appt.treatmentFee !== "0"
                ? `${Web3.utils.fromWei(`${appt.treatmentFee}`, "ether")} ETH`
                : "Not Set"}
            </p>

            <div className="status-row">
              <span className={`status ${appt.approved ? "success" : appt.rejected ? "danger" : "pending"}`}>
                {appt.rejected ? "Rejected" : appt.approved ? "Approved" : "Pending"}
              </span>

              <span className={`status ${appt.paid ? "success" : "pending"}`}>
                {appt.paid ? "Paid" : "Not Paid"}
              </span>

              <span className={`status ${appt.treatmentPaid ? "success" : "pending"}`}>
                {appt.treatmentPaid ? "Treatment Paid" : "Treatment Not Paid"}
              </span>

              <span className={`status ${appt.completed ? "success" : "pending"}`}>
                {appt.completed ? "Completed" : "In Progress"}
              </span>
            </div>

            {appt.approved && (
              <div style={{ marginTop: "10px" }}>
                <p><strong>Meeting Key:</strong> {appt.meetingLink}</p>
                {appt.paid && !appt.completed && (
                  <button style={{ marginTop: "5px", background: "#28a745" }} onClick={() => setActiveMeeting(appt.meetingLink)}>
                    Join Meeting
                  </button>
                )}
              </div>
            )}

            {appt.approved && !appt.paid && (
              <button
                style={{ marginTop: "10px" }}
                onClick={() => payConsultation(appt.id, appt.consultationFee)}
              >
                Pay Consultation Fee
              </button>
            )}

            {appt.approved && appt.paid && appt.treatmentFee !== "0" && !appt.treatmentPaid && (
              <button
                style={{ marginTop: "10px" }}
                onClick={() => payTreatment(appt.id, appt.treatmentFee)}
              >
                Pay Treatment Fee
              </button>
            )}

            {appt.completed && !appt.rated && (
              <div style={{ marginTop: "15px" }}>
                <p style={{ marginBottom: "8px" }}><strong>Rate your doctor:</strong></p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      onClick={() => { setRatingByAppt({ ...ratingByAppt, [appt.id]: r }); rateDoctor(appt.id, r); }}
                      style={{
                        padding: "8px 14px",
                        fontWeight: "bold",
                        fontSize: "18px",
                        background: (ratingByAppt[appt.id] || 0) >= r ? "#f59e0b" : "rgba(245,158,11,0.15)",
                        color: (ratingByAppt[appt.id] || 0) >= r ? "#fff" : "#92400e",
                        border: "2px solid #f59e0b",
                        borderRadius: "8px",
                        cursor: "pointer",
                        boxShadow: (ratingByAppt[appt.id] || 0) >= r ? "0 4px 12px rgba(245,158,11,0.4)" : "none",
                        transition: "all 0.2s"
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            )}

            {appt.prescriptionHash && appt.prescriptionHash !== "" && (
              <div style={{ marginTop: "15px" }}>
                <button
                  onClick={() => downloadAndDecrypt(appt.prescriptionHash, account)}
                  style={{ background: "#17a2b8" }}
                >
                  Download & Decrypt Prescription
                </button>
              </div>
            )}

          </div>
        ))}

      </div>
      </>
      )}

      {activeTab === "history" && (
      <>
      {/* ================= Medical Record History ================= */}
      <div className="card">
        <h2>My Medical History Timeline</h2>

        {records.length === 0 && (
          <p>No medical records available yet.</p>
        )}

        <div className="timeline">
          {records
            .slice()
            .sort((a, b) => Number(a.createdAt) - Number(b.createdAt))
            .map((rec, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <div className="timeline-date">
                    {new Date(Number(rec.createdAt) * 1000).toLocaleString()}
                  </div>
                  <div className="timeline-title">
                    {rec.diagnosis || "Consultation"}
                  </div>
                  <p style={{ whiteSpace: "pre-line", marginTop: "4px" }}>
                    {rec.prescriptionText}
                  </p>
                  <p style={{ marginTop: "4px", fontSize: "0.9rem" }}>
                    <strong>Doctor:</strong> {rec.doctor}{" "}
                    <span style={{ opacity: 0.7 }}>
                      (Appointment #{String(rec.appointmentId)})
                    </span>
                  </p>
                  {rec.reportHash && rec.reportHash !== "" && (
                    <div style={{ marginTop: "8px" }}>
                      <button
                        onClick={() => downloadAndDecrypt(rec.reportHash, account)}
                        style={{ background: "#17a2b8", padding: "5px 10px", fontSize: "0.85rem", marginRight: "10px" }}
                      >
                        Download & Decrypt Report
                      </button>
                    </div>
                  )}
                  <div style={{ marginTop: "10px" }}>
                    <button
                      onClick={() => exportPrescriptionAsPDF(rec)}
                      style={{ background: "#f59e0b", padding: "5px 10px", fontSize: "0.85rem" }}
                    >
                      Export Prescription (PDF)
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
      </>
      )}

    </div>
  );
}

export default PatientPage;
