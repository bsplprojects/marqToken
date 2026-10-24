import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import LoadingSplash from "@/components/LoadingSplash";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Network from "@/pages/Network";
import IncomeStream from "@/pages/IncomeStream";
import Transactions from "@/pages/Transactions";
import WalletPage from "@/pages/WalletPage";
import Swap from "@/pages/Swap";
import TechPass from "@/pages/TechPass";
import Port from "@/pages/Port";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import AdminApp from "@/admin/AdminApp";
import MarketingLanding from "@/pages/MarketingLanding";

function Protected({ children, adminOnly }) {
  const { member, loading } = useAuth();
  if (loading) {
    return <LoadingSplash />;
  }
  if (!member) return <Navigate to="/app" replace />;
  if (adminOnly && !member.is_admin) return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <div className="App merq-bg merq-grain">
      <AuthProvider>
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(243,186,47,0.2)",
              color: "#F8FAFC",
              backdropFilter: "blur(12px)",
            },
          }}
        />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MarketingLanding />} />
            <Route path="/app" element={<Landing />} />
            <Route path="/register" element={<Landing />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/network" element={<Protected><Network /></Protected>} />
            <Route path="/income/:slug" element={<Protected><IncomeStream /></Protected>} />
            <Route path="/transactions" element={<Protected><Transactions /></Protected>} />
            <Route path="/wallet" element={<Protected><WalletPage /></Protected>} />
            <Route path="/swap" element={<Protected><Swap /></Protected>} />
            <Route path="/techpass" element={<Protected><TechPass /></Protected>} />
            <Route path="/ports/:port" element={<Protected><Port /></Protected>} />
            <Route path="/profile" element={<Protected><Profile /></Protected>} />
            <Route path="/settings" element={<Protected><Settings /></Protected>} />
            <Route path="/admin/*" element={<AdminApp />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
