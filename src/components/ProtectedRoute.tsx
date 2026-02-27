import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, status, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Admins always have access regardless of status
  if (role === "admin") return <>{children}</>;

  // Non-active vendor users go to onboarding
  if (status !== "active") return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
