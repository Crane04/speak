import { useNavigate } from "react-router-dom";
import AdminDashboard from "../components/AdminDashboard";

export default function Admin() {
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Back link */}
      <button
        onClick={() => navigate("/")}
        className="fixed top-5 left-5 z-20 flex items-center gap-2 text-slate-700 hover:text-sky-400 text-[10px] font-display tracking-widest uppercase transition-colors"
      >
        ← Globe
      </button>

      <AdminDashboard />
    </div>
  );
}
