import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function Doctor({ contract, account, detectRole }) {

  const navigate = useNavigate();
  const [doctorInfo, setDoctorInfo] = useState(null);

  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [license, setLicense] = useState("");
  const [message, setMessage] = useState("");

  const loadDoctorInfo = async () => {
    try {
      const doctor = await contract.methods.doctors(account).call();
      if (doctor.exists) {
        setDoctorInfo(doctor);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const registerDoctor = async () => {
    try {
      await contract.methods
        .registerDoctor(name, specialization, license)
        .send({ from: account });

      toast.success("Doctor Registered Successfully! Waiting for Admin Verification...");
      setName("");
      setSpecialization("");
      setLicense("");
      
      if (detectRole) {
        await detectRole();
      }
      
      // Wait a moment for blockchain to settle, then refresh and redirect
      setTimeout(() => {
        loadDoctorInfo();
        // Auto-redirect to doctor dashboard
        navigate("/doctor", { replace: true });
      }, 1500);

    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    loadDoctorInfo();
  }, []);

  /* =========================
     If Not Registered
  ========================= */

  if (!doctorInfo) {
    return (
      <div className="card register-card">
        <h2>👨‍⚕️ Register as Doctor</h2>

        <input
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Specialization"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
        />

        <input
          placeholder="Medical License ID"
          value={license}
          onChange={(e) => setLicense(e.target.value)}
        />

        <button className="primary-btn" onClick={registerDoctor}>
          Register
        </button>
      </div>
    );
  }

  /* =========================
     If Registered
  ========================= */

  return (
    <div className="doctor-dashboard">

      {/* Welcome Card */}
      <div className="card welcome-card">
        <div>
          <h2>👨‍⚕️ Welcome, Dr. {doctorInfo.name}</h2>
          <p>Manage your professional profile and verification status.</p>
        </div>

        <div className={`status-badge ${doctorInfo.isVerified ? "verified" : "pending"}`}>
          {doctorInfo.isVerified ? "✔ Verified" : "⏳ Pending"}
        </div>
      </div>

      {/* Info Grid */}
      <div className="info-grid">

        <div className="card info-card">
          <h4>Doctor Name</h4>
          <h2>{doctorInfo.name}</h2>
        </div>

        <div className="card info-card">
          <h4>Specialization</h4>
          <h2>{doctorInfo.specialization}</h2>
        </div>

        <div className="card info-card">
          <h4>License ID</h4>
          <h2>{doctorInfo.license}</h2>
        </div>

      </div>

      {/* Detailed Profile */}
      <div className="card profile-card">
        <h3>Professional Details</h3>

        <div className="profile-row">
          <span>Name</span>
          <strong>{doctorInfo.name}</strong>
        </div>

        <div className="profile-row">
          <span>Specialization</span>
          <strong>{doctorInfo.specialization}</strong>
        </div>

        <div className="profile-row">
          <span>License</span>
          <strong>{doctorInfo.license}</strong>
        </div>
      </div>

    </div>
  );
}

export default Doctor;
