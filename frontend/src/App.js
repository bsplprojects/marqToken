import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Network from "@/pages/Network";
import Income from "@/pages/Income";
import Autopool from "@/pages/Autopool";
import Rewards from "@/pages/Rewards";
import Transactions from "@/pages/Transactions";
import WalletPage from "@/pages/WalletPage";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Admin from "@/pages/Admin";

function Protected({ children, adminOnly }) {
  const { member, loading } = useAuth();
  if (loading) {
    return (
      <div className="merq-bg min-h-screen flex items-center justify-center">
        <div className="font-mono-merq text-amber-400 animate-pulse tracking-widest">LOADING MERQON…</div>
      </div>
    );
  }
  if (!member) return <Navigate to="/" replace />;
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
            <Route path="/" element={<Landing />} />
            <Route path="/register" element={<Landing />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/network" element={<Protected><Network /></Protected>} />
            <Route path="/income" element={<Protected><Income /></Protected>} />
            <Route path="/autopool" element={<Protected><Autopool /></Protected>} />
            <Route path="/rewards" element={<Protected><Rewards /></Protected>} />
            <Route path="/transactions" element={<Protected><Transactions /></Protected>} />
            <Route path="/wallet" element={<Protected><WalletPage /></Protected>} />
            <Route path="/profile" element={<Protected><Profile /></Protected>} />
            <Route path="/settings" element={<Protected><Settings /></Protected>} />
            <Route path="/admin" element={<Protected adminOnly><Admin /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
