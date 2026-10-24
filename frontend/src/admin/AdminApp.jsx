import { Routes, Route, Navigate } from "react-router-dom";
import { AdminAuthProvider, useAdminAuth } from "./AdminAuth";
import AdminLayout from "./AdminLayout";
import AdminLogin from "./AdminLogin";
import LoadingSplash from "@/components/LoadingSplash";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import MemberDetail from "./pages/MemberDetail";
import NetworkPage from "./pages/Network";
import Leaderboard from "./pages/Leaderboard";
import Ranks from "./pages/Ranks";
import Deposits from "./pages/Deposits";
import Withdrawals from "./pages/Withdrawals";
import Income from "./pages/Income";
import Reconciliation from "./pages/Reconciliation";
import Growth from "./pages/Growth";
import Commission from "./pages/Commission";
import Rewards from "./pages/Rewards";
import Autopool from "./pages/Autopool";
import Token from "./pages/Token";
import Treasury from "./pages/Treasury";
import Liquidity from "./pages/Liquidity";
import Rules from "./pages/Rules";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import Support from "./pages/Support";
import AdminUsers from "./pages/Users";
import Audit from "./pages/Audit";
import Health from "./pages/Health";
import Emergency from "./pages/Emergency";
import SystemSettings from "./pages/SystemSettings";
import SwapSettings from "./pages/SwapSettings";

function Shell() {
  const { admin, loading } = useAdminAuth();
  if (loading) {
    return <LoadingSplash label="LOADING CONSOLE" />;
  }
  if (!admin) return <AdminLogin />;
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="members" element={<Members />} />
        <Route path="members/:address" element={<MemberDetail />} />
        <Route path="network" element={<NetworkPage />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="ranks" element={<Ranks />} />
        <Route path="deposits" element={<Deposits />} />
        <Route path="withdrawals" element={<Withdrawals />} />
        <Route path="income" element={<Income />} />
        <Route path="reconciliation" element={<Reconciliation />} />
        <Route path="growth" element={<Growth />} />
        <Route path="commission" element={<Commission />} />
        <Route path="rewards" element={<Rewards />} />
        <Route path="autopool" element={<Autopool />} />
        <Route path="token" element={<Token />} />
        <Route path="treasury" element={<Treasury />} />
        <Route path="liquidity" element={<Liquidity />} />
        <Route path="rules" element={<Rules />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="support" element={<Support />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="audit" element={<Audit />} />
        <Route path="health" element={<Health />} />
        <Route path="emergency" element={<Emergency />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="swap" element={<SwapSettings />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
}

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <Shell />
    </AdminAuthProvider>
  );
}
