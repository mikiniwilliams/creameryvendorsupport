import { useAuth } from "@/contexts/AuthContext";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import VendorDashboard from "@/components/dashboard/VendorDashboard";
import NoRolePage from "@/components/dashboard/NoRolePage";
import AppLayout from "@/components/AppLayout";

const Index = () => {
  const { role } = useAuth();

  return (
    <AppLayout>
      {role === "admin" && <AdminDashboard />}
      {role === "vendor" && <VendorDashboard />}
      {!role && <NoRolePage />}
    </AppLayout>
  );
};

export default Index;
