import React from "react";
import { useNavigate } from "react-router-dom";

function RegisterChoice() {

  const navigate = useNavigate();

  return (
    <div style={{ padding: "60px", textAlign: "center" }}>
      <h2>Select Your Role</h2>
      <p>Please choose how you want to register.</p>

      <div style={{ marginTop: "30px" }}>

        <button
          style={{
            padding: "12px 20px",
            marginRight: "20px",
            backgroundColor: "#3f51b5",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer"
          }}
          onClick={() => navigate("/register/patient")}
        >
          Register as Patient
        </button>

        <button
          style={{
            padding: "12px 20px",
            backgroundColor: "#2e7d32",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer"
          }}
          onClick={() => navigate("/register/doctor")}
        >
          Register as Doctor
        </button>

      </div>
    </div>
  );
}

export default RegisterChoice;