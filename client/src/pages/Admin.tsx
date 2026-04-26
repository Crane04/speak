import AdminDashboard from "../components/AdminDashboard";
import AppShell from "../components/AppShell";

export default function Admin() {
  return (
    <AppShell>
      <div className="px-5 py-8">
        <AdminDashboard />
      </div>
    </AppShell>
  );
}
