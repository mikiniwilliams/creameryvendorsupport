import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import NewTicket from "./pages/NewTicket";
import TicketDetail from "./pages/TicketDetail";
import Vendors from "./pages/Vendors";
import VendorProfile from "./pages/VendorProfile";
import UserManagement from "./pages/UserManagement";
import KnowledgeBase from "./pages/KnowledgeBase";
import Notifications from "./pages/Notifications";
import AdminApprovals from "./pages/AdminApprovals";
import AdminTickets from "./pages/AdminTickets";
import ArchivedTickets from "./pages/ArchivedTickets";
import DeletedTickets from "./pages/DeletedTickets";
import TicketTemplates from "./pages/TicketTemplates";
import SubmitRequest from "./pages/SubmitRequest";
import VendorProfilePage from "./pages/VendorProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AdminOnlyNewTicket = () => {
  const { role, loading } = useAuth();
  if (loading) return null;
  if (role !== "admin") return <Navigate to="/" replace />;
  return <NewTicket />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/submit-request" element={<SubmitRequest />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/tickets/new" element={<ProtectedRoute><AdminOnlyNewTicket /></ProtectedRoute>} />
            <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/knowledge-base" element={<ProtectedRoute><KnowledgeBase /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><VendorProfilePage /></ProtectedRoute>} />
            <Route path="/admin/approvals" element={<ProtectedAdminRoute><AdminApprovals /></ProtectedAdminRoute>} />
            <Route path="/admin/tickets" element={<ProtectedAdminRoute><AdminTickets /></ProtectedAdminRoute>} />
            <Route path="/admin/tickets/archived" element={<ProtectedAdminRoute><ArchivedTickets /></ProtectedAdminRoute>} />
            <Route path="/admin/tickets/deleted" element={<ProtectedAdminRoute><DeletedTickets /></ProtectedAdminRoute>} />
            <Route path="/admin/templates" element={<ProtectedAdminRoute><TicketTemplates /></ProtectedAdminRoute>} />
            <Route path="/vendors" element={<ProtectedAdminRoute><Vendors /></ProtectedAdminRoute>} />
            <Route path="/vendors/:id" element={<ProtectedAdminRoute><VendorProfile /></ProtectedAdminRoute>} />
            <Route path="/users" element={<ProtectedAdminRoute><UserManagement /></ProtectedAdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
