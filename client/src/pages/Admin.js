import React, { useCallback, useEffect, useState } from "react";
import EventViewer from "../components/EventViewer";
import toast from "react-hot-toast";

function Admin({ contract, account }) {

  const [doctorAddress, setDoctorAddress] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [appointmentCount, setAppointmentCount] = useState("0");
  const [patientCount, setPatientCount] = useState("0");
  const [recordCount, setRecordCount] = useState("0");
  const [completedAppointments, setCompletedAppointments] = useState("0");
  const [activeTab, setActiveTab] = useState("dashboard");

  // =========================
  // Load All Doctors
  // =========================
  const loadDoctors = useCallback(async () => {
    try {
      const count = await contract.methods.getDoctorCount().call();
      let temp = [];

      for (let i = 0; i < count; i++) {
        const addr = await contract.methods.doctorList(i).call();
        const details = await contract.methods.getDoctorDetails(addr).call();
        temp.push({
          address: addr,
          name: details.name,
          specialization: details.specialization,
          rating: details.rating,
          totalRatings: details.totalRatings,
          isVerified: details.isVerified,
          exists: details.exists
        });
      }

      setDoctors(temp);
    } catch (error) {
      console.error(error);
    }
  }, [contract]);

  const loadAppointmentsCount = useCallback(async () => {
    try {
      const count = await contract.methods.getAppointmentCount().call();
      setAppointmentCount(count);

      let completed = 0;
      for (let i = 0; i < Number(count); i++) {
        const appt = await contract.methods.appointments(i).call();
        if (appt.completed) {
          completed += 1;
        }
      }
      setCompletedAppointments(`${completed}`);
    } catch (error) {
      console.error(error);
    }
  }, [contract]);

  const loadPatientAndRecordStats = useCallback(async () => {
    try {
      const pCount = await contract.methods.getPatientCount().call();
      const rCount = await contract.methods.getTotalRecordCount().call();
      setPatientCount(pCount);
      setRecordCount(rCount);
    } catch (error) {
      console.error(error);
    }
  }, [contract]);

  // =========================
  // Verify Doctor
  // =========================
  const verifyDoctor = async () => {
    try {
      if (!doctorAddress) {
        toast.error("Enter doctor address");
        return;
      }

      await contract.methods
        .verifyDoctor(doctorAddress)
        .send({ from: account });

      alert("Doctor Verified Successfully");
      setDoctorAddress("");
      loadDoctors();
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (contract) {
      loadDoctors();
      loadAppointmentsCount();
      loadPatientAndRecordStats();
    }
  }, [contract, loadAppointmentsCount, loadDoctors, loadPatientAndRecordStats]);

  const verifiedCount = doctors.filter((d) => d.isVerified).length;
  const unverifiedCount = doctors.length - verifiedCount;
  const maxRating = doctors.reduce(
    (max, d) => (Number(d.rating) > max ? Number(d.rating) : max),
    0
  ) || 1;

  return (
    <div>

      {/* ================= Page Tabs ================= */}
      <div className="tabs-container">
        <button className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>Dashboard</button>
        <button className={activeTab === "doctors" ? "active" : ""} onClick={() => setActiveTab("doctors")}>Doctors Management</button>
        <button className={activeTab === "events" ? "active" : ""} onClick={() => setActiveTab("events")}>System Events</button>
      </div>

      {activeTab === "dashboard" && (
      <>
      {/* ================= Dashboard Header ================= */}
      <div className="card">
        <h2>Welcome, Administrator</h2>
        <p>Manage doctor verification and monitor the healthcare system.</p>
      </div>

      <div className="card">
        <h3>System Stats</h3>
        <p><strong>Total patients:</strong> {patientCount}</p>
        <p><strong>Total doctors:</strong> {doctors.length}</p>
        <p><strong>Verified doctors:</strong> {verifiedCount}</p>
        <p><strong>Unverified doctors:</strong> {unverifiedCount}</p>
        <p><strong>Total appointments:</strong> {appointmentCount}</p>
        <p><strong>Completed appointments:</strong> {completedAppointments}</p>
        <p><strong>Total medical records:</strong> {recordCount}</p>

        <div style={{ marginTop: "15px" }}>
          <h4>Ratings Overview</h4>
          {doctors.length === 0 && <p>No rating data yet.</p>}
          {doctors.map((doc) => (
            <div key={doc.address} className="analytics-row">
              <div className="analytics-label">
                {doc.name || doc.address.slice(0, 8)} — ⭐ {doc.rating}/5
              </div>
              <div className="analytics-bar-bg">
                <div
                  className="analytics-bar-fill"
                  style={{
                    width: `${(Number(doc.rating) / maxRating) * 100 || 0}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      </>
      )}

      {activeTab === "events" && (
      <>
      {/* ================= Blockchain Events ================= */}
      <div className="card">
        <EventViewer contract={contract} />
      </div>
      </>
      )}

      {activeTab === "doctors" && (
      <>
      {/* ================= Verify Doctor ================= */}
      <div className="card">
        <h3>Verify Doctor</h3>

        <input
          type="text"
          placeholder="Doctor Wallet Address"
          value={doctorAddress}
          onChange={(e) => setDoctorAddress(e.target.value)}
        />

        <button onClick={verifyDoctor}>
          Verify Doctor
        </button>
      </div>

      {/* ================= Doctor List ================= */}
      <div className="card">
        <h3>All Registered Doctors</h3>

        {doctors.length === 0 && (
          <p>No Doctors Registered Yet</p>
        )}

        {doctors.map((doc, index) => (
          <div key={index} style={{
            borderBottom: "1px solid #eee",
            padding: "15px 0"
          }}>
            <p><strong>Address:</strong> {doc.address}</p>
            <p><strong>Name:</strong> {doc.name}</p>
            <p><strong>Specialization:</strong> {doc.specialization}</p>
            <p><strong>Verified:</strong> {doc.isVerified ? "Yes" : "No"}</p>
            <p><strong>Rating:</strong> {doc.rating}</p>
            <p><strong>Total Reviews:</strong> {doc.totalRatings}</p>
          </div>
        ))}
      </div>
      </>
      )}

    </div>
  );
}

export default Admin;
