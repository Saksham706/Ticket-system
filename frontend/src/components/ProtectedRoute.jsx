import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "./ui/LoadingScreen";

export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, user, bootstrapping } = useAuth();
  const location = useLocation();
  if (bootstrapping) return <LoadingScreen label="Checking your session..." />;
  if (!isAuthenticated)
    return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(String(user?.role || "").toLowerCase()))
    return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
