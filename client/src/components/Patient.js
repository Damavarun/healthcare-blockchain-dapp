import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function Patient({ contract, account, detectRole }) {

  const navigate = useNavigate();
  const [patientInfo, setPatientInfo] = useState(null);
  const [recordsCount, setRecordsCount] = useState(0);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [message, setMessage] = useState("");

  const loadPatientInfo = async () => {
    try {
      const patient = await contract.methods.patients(account).call();

      if (patient.exists) {
        setPatientInfo(patient);
      }

    } catch (error) {
      console.error(error);
    }
  };

  const loadRecordsCount = async () => {
    try {
      if (!contract || !contract.methods || !contract.methods.getRecords) {
        // Older ABI or contract without medical records yet
        return;
      }

      const records = await contract.methods
        .getRecords(account)
        .call({ from: account });

      setRecordsCount(records.length);
    } catch (error) {
      // ignore if not registered
    }
  };

  const registerPatient = async () => {
    try {
      await contract.methods
        .registerPatient(name, age, gender)
        .send({ from: account });

      toast.success("Patient Registered Successfully! Redirecting...");
      setName("");
      setAge("");
      setGender("");

      if (detectRole) {
        await detectRole();
      }
      
      // Wait a moment for blockchain to settle, then refresh and redirect
      setTimeout(() => {
        loadPatientInfo();
        // Auto-redirect to patient dashboard
        navigate("/patient", { replace: true });
      }, 1500);

    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (contract && account) {
      loadPatientInfo();
      loadRecordsCount();
    }
  }, [contract, account]);

  // =========================
  // If Not Registered
  // =========================
  if (!patientInfo) {
    return (
      <div className="card">
        <h2>Register as Patient</h2>

        <input
          className="input-field"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="input-field"
          placeholder="Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />

        <input
          className="input-field"
          placeholder="Gender"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        />

        <button className="primary-btn" onClick={registerPatient}>
          Register
        </button>
      </div>
    );
  }

  // =========================
  // If Registered
  // =========================
  return (
    <div>

      <div className="card">
        <h2>Welcome, Patient</h2>
        <p>
          View your personal information and medical record summary.
        </p>
      </div>

      <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>

        <div className="card" style={{ flex: 1 }}>
          <h4>Patient Name</h4>
          <h2>{patientInfo.name}</h2>
        </div>

        <div className="card" style={{ flex: 1 }}>
          <h4>Age</h4>
          <h2>{patientInfo.age}</h2>
        </div>

        <div className="card" style={{ flex: 1 }}>
          <h4>Total Records</h4>
          <h2>{recordsCount}</h2>
        </div>

      </div>

      <div className="card">
        <h3>Patient Information</h3>
        <p><strong>Name:</strong> {patientInfo.name}</p>
        <p><strong>Age:</strong> {patientInfo.age}</p>
        <p><strong>Gender:</strong> {patientInfo.gender}</p>
      </div>

    </div>
  );
}

export default Patient;
