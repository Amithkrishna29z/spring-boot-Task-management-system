import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Spinner from "./Spinner";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isBootstrapping } = useAuth();

  // wait for the session check first, otherwise a logged-in user who reloads
  // gets bounced to /login
  if (isBootstrapping) {
    return <Spinner label="Checking your session…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
