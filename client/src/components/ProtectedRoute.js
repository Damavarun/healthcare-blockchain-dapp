import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ role, allowedRole, children }) {

  if (role === "") {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        Loading...
      </div>
    );
  }

  if (role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
