import { useAuth } from "@/contexts/AuthContext";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import VendorDashboard from "@/components/dashboard/VendorDashboard";
import AppLayout from "@/components/AppLayout";

const Index = () => {
  const { role } = useAuth();

  return (
    <AppLayout>
      {role === "admin" && <AdminDashboard />}
      {role === "vendor" && <VendorDashboard />}
      {!role && (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No role assigned. Contact an administrator.</p>
        </div>
      )}
    </AppLayout>
  );
};

export default Index;
