import { AdminProvider, useAdmin } from "../contexts/adminContext";
import AdminAuth from "./admin/AdminAuth";
import AdminFilters from "./admin/AdminFilters";
import AdminHeader from "./admin/AdminHeader";
import AdminMessageList from "./admin/AdminMessageList";

export default function AdminDashboard() {
  return (
    <AdminProvider>
      <AdminDashboardInner />
    </AdminProvider>
  );
}

function AdminDashboardInner() {
  const { state } = useAdmin();
  if (!state.authed) return <AdminAuth />;

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto">
        <AdminHeader />
        <AdminFilters />
        <AdminMessageList />
      </div>
    </div>
  );
}
