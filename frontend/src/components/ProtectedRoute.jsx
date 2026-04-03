import { Navigate } from "react-router-dom";

const hasToken = () => Boolean(localStorage.getItem("token"));

export const ProtectedRoute = ({ children }) => {
  if (!hasToken()) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

export const PublicOnlyRoute = ({ children }) => {
  if (hasToken()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
