import React, { useCallback, useEffect, useState } from "react";
import Web3 from "web3";
import ipfs from "../ipfs";
import { encryptFile, fileToBase64 } from "../utils/encryption";
import { JitsiMeeting } from '@jitsi/react-sdk';
import toast from "react-hot-toast";

function DoctorPage({ contract, account }) {

  const [appointments, setAppointments] = useState([]);
  const [meetingLinks, setMeetingLinks] = useState({});
  const [treatmentFees, setTreatmentFees] = useState({});
  const [earningsWei, setEarningsWei] = useState("0");
  const [prescriptionFiles, setPrescriptionFiles] = useState({});
  const [recordDiagnosis, setRecordDiagnosis] = useState({});
  const [recordPrescriptionText, setRecordPrescriptionText] = useState({});
  const [recordReportFiles, setRecordReportFiles] = useState({});
  const [emergencyPatient, setEmergencyPatient] = useState("");
  const [medicinesByAppt, setMedicinesByAppt] = useState({}); // appointmentId -> [{ name, dosage, duration }, ...]
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [recordType, setRecordType] = useState({});

  // =============================
  // Load Appointments
  // =============================
  const loadAppointments = useCallback(async () => {
    try {
      const count = await contract.methods.getAppointmentCount().call();
      let temp = [];

      for (let i = 0; i < count; i++) {
        const appt = await contract.methods.appointments(i).call();

        if (appt.doctor.toLowerCase() === account.toLowerCase()) {
          temp.push(appt);
        }
      }

      setAppointments(temp);
    } catch (error) {
      console.error(error);
    }
  }, [contract, account]);

  const loadEarnings = useCallback(async () => {
    try {
      const wei = await contract.methods.doctorEarnings(account).call();
      setEarningsWei(wei);
    } catch (error) {
      console.error(error);
    }
  }, [contract, account]);

  // =============================
  // Approve Appointment
  // =============================
  const approveAppointment = async (id) => {
    try {
      const link = meetingLinks[id];

      if (!link || link.trim() === "") {
        toast.error("Enter meeting link first");
        return;
      }

      await contract.methods
        .approveAppointment(id, link)
        .send({ from: account });

      alert("Appointment Approved");
      loadAppointments();
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  // =============================
  // Reject Appointment
  // =============================
  const rejectAppointment = async (id) => {
    try {
      await contract.methods
        .rejectAppointment(id)
        .send({ from: account });

      alert("Appointment Rejected");
      loadAppointments();
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  // =============================
  // Complete Appointment
  // =============================
  const completeAppointment = async (id) => {
    try {
      await contract.methods
        .completeAppointment(id)
        .send({ from: account });

      alert("Appointment Completed");
      loadAppointments();
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  // =============================
  // Set Treatment Fee
  // =============================
  const setTreatmentFee = async (id) => {
    try {
      const feeEth = treatmentFees[id];
      if (!feeEth || `${feeEth}`.trim() === "" || Number(feeEth) <= 0) {
        toast.error("Enter a valid treatment fee (ETH)");
        return;
      }

      const feeWei = Web3.utils.toWei(`${feeEth}`, "ether");

      await contract.methods
        .setTreatmentFee(id, feeWei)
        .send({ from: account });

      alert("Treatment fee set");
      loadAppointments();
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  // =============================
  // Upload Prescription to IPFS (Encrypted)
  // =============================
  const uploadPrescription = async (id, patientAddr) => {
    try {
      const file = prescriptionFiles[id];
      if (!file) {
        toast.error("Select a prescription file first");
        return;
      }

      const base64 = await fileToBase64(file);
      const encrypted = encryptFile(base64, patientAddr.toLowerCase());
      const added = await ipfs.add(encrypted);
      const hash = added.path || added.cid?.toString();

      if (!hash) {
        toast.error("Failed to get IPFS hash");
        return;
      }

      await contract.methods
        .addPrescription(id, hash)
        .send({ from: account });

      toast.success("Encrypted prescription uploaded");
      loadAppointments();
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  // =============================
  // Create Full Medical Record
  // =============================
  const createMedicalRecord = async (id, patientAddr) => {
    try {
      const diagnosis = recordDiagnosis[id];
      const notes = recordPrescriptionText[id];
      const meds = medicinesByAppt[id] || [];
      const file = recordReportFiles[id];

      if (!diagnosis || diagnosis.trim() === "") {
        toast.error("Enter a diagnosis before creating the record");
        return;
      }

      let combinedNotes = notes && notes.trim() !== "" ? notes.trim() : "";

      if (meds.length > 0) {
        const medsText = meds
          .map(
            (m, idx) =>
              `${idx + 1}. ${m.name} — ${m.dosage} — ${m.duration}`
          )
          .join("\n");
        combinedNotes =
          (combinedNotes ? combinedNotes + "\n\n" : "") +
          "Prescription medicines:\n" +
          medsText;
      }

      if (!combinedNotes) {
        toast.error("Add prescription notes or at least one medicine");
        return;
      }

      let reportHash = "";

      if (file) {
        const base64 = await fileToBase64(file);
        const encrypted = encryptFile(base64, patientAddr.toLowerCase());
        const added = await ipfs.add(encrypted);
        reportHash = added.path || added.cid?.toString() || "";

        if (!reportHash) {
          toast.error("Failed to upload report file to IPFS");
          return;
        }
      }

      await contract.methods
        .addMedicalRecord(id, diagnosis, combinedNotes, reportHash)
        .send({ from: account });

      toast.success("Medical record created successfully!");
      loadAppointments();
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const addMedicineRow = (appointmentId) => {
    const current = medicinesByAppt[appointmentId] || [];
    setMedicinesByAppt({
      ...medicinesByAppt,
      [appointmentId]: [
        ...current,
        { name: "", dosage: "", duration: "" }
      ]
    });
  };

  const updateMedicineField = (appointmentId, index, field, value) => {
    const current = medicinesByAppt[appointmentId] || [];
    const updated = current.map((m, i) =>
      i === index ? { ...m, [field]: value } : m
    );
    setMedicinesByAppt({
      ...medicinesByAppt,
      [appointmentId]: updated
    });
  };

  const triggerEmergencyAccess = async () => {
    try {
      if (!emergencyPatient || emergencyPatient.trim() === "") {
        toast.error("Enter patient wallet address for emergency access");
        return;
      }
      await contract.methods
        .triggerEmergencyAccess(emergencyPatient)
        .send({ from: account });
      alert("Emergency access logged on-chain");
      setEmergencyPatient("");
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (contract) {
      loadAppointments();
      loadEarnings();
    }
  }, [contract, loadAppointments, loadEarnings]);

  const stats = appointments.reduce(
    (acc, appt) => {
      acc.total += 1;
      if (!appt.approved && !appt.rejected) acc.pending += 1;
      if (appt.rejected) acc.rejected += 1;
      if (appt.approved && !appt.paid) acc.awaitingConsultationPayment += 1;
      if (appt.paid && appt.treatmentFee !== "0" && !appt.treatmentPaid) acc.awaitingTreatmentPayment += 1;
      if (appt.completed) acc.completed += 1;
      return acc;
    },
    {
      total: 0,
      pending: 0,
      rejected: 0,
      awaitingConsultationPayment: 0,
      awaitingTreatmentPayment: 0,
      completed: 0
    }
  );

  const completionRate =
    stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);

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
              displayName: "Doctor"
            }}
            getIFrameRef={(iframeRef) => { iframeRef.style.height = '100%'; }}
          />
        </div>
      )}

      {/* ================= Page Tabs ================= */}
      <div className="tabs-container">
        <button className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>Dashboard</button>
        <button className={activeTab === "appointments" ? "active" : ""} onClick={() => setActiveTab("appointments")}>Appointments</button>
        <button className={activeTab === "emergency" ? "active" : ""} onClick={() => setActiveTab("emergency")}>Emergency Access</button>
      </div>

      {activeTab === "dashboard" && (
      <>
      {/* ================= Dashboard Header ================= */}
      <div className="card">
        <h2>Doctor Dashboard</h2>
        <p>Manage patient appointments and consultations.</p>
      </div>

      <div className="card">
        <h3>Stats</h3>
        <p><strong>Total appointments:</strong> {stats.total}</p>
        <p><strong>Pending requests:</strong> {stats.pending}</p>
        <p><strong>Rejected requests:</strong> {stats.rejected}</p>
        <p><strong>Awaiting consultation payment:</strong> {stats.awaitingConsultationPayment}</p>
        <p><strong>Awaiting treatment payment:</strong> {stats.awaitingTreatmentPayment}</p>
        <p><strong>Completed:</strong> {stats.completed}</p>
        <p>
          <strong>Total earnings:</strong>{" "}
          {Web3.utils.fromWei(`${earningsWei}`, "ether")} ETH
        </p>

        <div style={{ marginTop: "15px" }}>
          <h4>Completion Rate</h4>
          <div className="analytics-label">{completionRate}% of appointments completed</div>
          <div className="analytics-bar-bg">
            <div
              className="analytics-bar-fill"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>
      </>
      )}

      {activeTab === "emergency" && (
      <>
      {/* ================= Emergency Access ================= */}
      <div className="card">
        <h3>Emergency Access</h3>
        <p>
          In life-threatening scenarios where a patient cannot grant consent,
          you can request emergency access. This will be logged immutably on
          the blockchain for audit.
        </p>
        <input
          type="text"
          placeholder="Patient wallet address"
          value={emergencyPatient}
          onChange={(e) => setEmergencyPatient(e.target.value)}
        />
        <button
          style={{ marginTop: "10px" }}
          onClick={triggerEmergencyAccess}
        >
          Trigger Emergency Access
        </button>
      </div>
      </>
      )}

      {activeTab === "appointments" && (
      <>
      {/* ================= Appointment List ================= */}
      <div className="card">
        <h3>My Appointments</h3>

        {appointments.length === 0 && (
          <p>No Appointments Yet</p>
        )}

        {appointments.map((appt, index) => (
          <div key={index} className="appointment-card">

            <p><strong>Patient:</strong> {appt.patient}</p>
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

            {/* Approve/Reject Section */}
            {!appt.approved && !appt.rejected && (
              <div style={{ marginTop: "15px" }}>
                <input
                  type="text"
                  placeholder="Enter Meeting Link / Phrase"
                  value={meetingLinks[appt.id] || ""}
                  onChange={(e) =>
                    setMeetingLinks({
                      ...meetingLinks,
                      [appt.id]: e.target.value
                    })
                  }
                />

                <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => approveAppointment(appt.id)}
                  >
                    Approve & Set Link
                  </button>
                  <button
                    onClick={() => rejectAppointment(appt.id)}
                    style={{ background: "#d9534f" }}
                  >
                    Reject Appt
                  </button>
                </div>
              </div>
            )}

            {/* Set Treatment Fee */}
            {appt.approved && appt.paid && !appt.completed && (
              <div style={{ marginTop: "15px" }}>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  placeholder="Treatment Fee (ETH)"
                  value={treatmentFees[appt.id] || ""}
                  onChange={(e) =>
                    setTreatmentFees({
                      ...treatmentFees,
                      [appt.id]: e.target.value
                    })
                  }
                />
                <button
                  style={{ marginTop: "10px" }}
                  onClick={() => setTreatmentFee(appt.id)}
                >
                  Set Treatment Fee
                </button>
              </div>
            )}

            {/* Upload Prescription after completion */}
            {appt.completed && (
              <div style={{ marginTop: "15px" }}>
                <p>
                  <strong>Prescription:</strong>{" "}
                  {appt.prescriptionHash && appt.prescriptionHash !== ""
                    ? "Uploaded"
                    : "Not uploaded yet"}
                </p>
                <input
                  type="file"
                  onChange={(e) =>
                    setPrescriptionFiles({
                      ...prescriptionFiles,
                      [appt.id]: e.target.files[0],
                    })
                  }
                />
                <button
                  style={{ marginTop: "10px" }}
                  onClick={() => uploadPrescription(appt.id, appt.patient)}
                >
                  Upload Encrypted Prescription
                </button>
              </div>
            )}

            {/* Create full medical record after completion */}
            {appt.completed && (
              <div style={{ marginTop: "20px", paddingTop: "10px", borderTop: "1px solid #eee" }}>
                <h4>Create Medical Record</h4>
                <select
                  value={recordType[appt.id] || "General Consultation"}
                  onChange={(e) => setRecordType({ ...recordType, [appt.id]: e.target.value })}
                  style={{ marginBottom: "10px" }}
                >
                  <option>General Consultation</option>
                  <option>Blood Test</option>
                  <option>X-Ray</option>
                  <option>MRI Scan</option>
                  <option>CT Scan</option>
                  <option>Ultrasound</option>
                  <option>Surgery Report</option>
                  <option>Discharge Summary</option>
                  <option>Prescription Only</option>
                </select>
                <textarea
                  placeholder="Diagnosis"
                  value={recordDiagnosis[appt.id] || ""}
                  onChange={(e) =>
                    setRecordDiagnosis({
                      ...recordDiagnosis,
                      [appt.id]: e.target.value
                    })
                  }
                  style={{ width: "100%", minHeight: "60px", marginTop: "8px" }}
                />
                <textarea
                  placeholder="Prescription / Treatment Notes"
                  value={recordPrescriptionText[appt.id] || ""}
                  onChange={(e) =>
                    setRecordPrescriptionText({
                      ...recordPrescriptionText,
                      [appt.id]: e.target.value
                    })
                  }
                  style={{ width: "100%", minHeight: "60px", marginTop: "8px" }}
                />

                <div style={{ marginTop: "15px" }}>
                  <h5>Medicines</h5>
                  {(medicinesByAppt[appt.id] || []).map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr",
                        gap: "8px",
                        marginTop: "8px"
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Medicine name"
                        value={m.name}
                        onChange={(e) =>
                          updateMedicineField(appt.id, idx, "name", e.target.value)
                        }
                      />
                      <input
                        type="text"
                        placeholder="Dosage (e.g. 500mg)"
                        value={m.dosage}
                        onChange={(e) =>
                          updateMedicineField(appt.id, idx, "dosage", e.target.value)
                        }
                      />
                      <input
                        type="text"
                        placeholder="Duration (e.g. 5 days)"
                        value={m.duration}
                        onChange={(e) =>
                          updateMedicineField(appt.id, idx, "duration", e.target.value)
                        }
                      />
                    </div>
                  ))}
                  <button
                    style={{ marginTop: "8px" }}
                    type="button"
                    onClick={() => addMedicineRow(appt.id)}
                  >
                    + Add Medicine
                  </button>
                </div>
                <div style={{ marginTop: "10px" }}>
                  <label style={{ display: "block", marginBottom: "4px" }}>
                    Attach report file (optional)
                  </label>
                  <input
                    type="file"
                    onChange={(e) =>
                      setRecordReportFiles({
                        ...recordReportFiles,
                        [appt.id]: e.target.files[0],
                      })
                    }
                  />
                </div>
                <button
                  style={{ marginTop: "10px" }}
                  onClick={() => createMedicalRecord(appt.id, appt.patient)}
                >
                  Save Encrypted Medical Record
                </button>
              </div>
            )}

            {/* Complete Section */}
            {appt.approved && appt.paid && (appt.treatmentFee === "0" || appt.treatmentPaid) && !appt.completed && (
              <button
                style={{ marginTop: "15px" }}
                onClick={() => completeAppointment(appt.id)}
              >
                Mark as Completed
              </button>
            )}

            {appt.approved && (
              <div style={{ marginTop: "10px" }}>
                <p>
                  <strong>Meeting Key:</strong> {appt.meetingLink}
                </p>
                {appt.paid && !appt.completed && (
                  <button style={{ marginTop: "5px", background: "#28a745" }} onClick={() => setActiveMeeting(appt.meetingLink)}>
                    Join Meeting
                  </button>
                )}
              </div>
            )}

          </div>
        ))}

      </div>
      </>
      )}

    </div>
  );
}

export default DoctorPage;
