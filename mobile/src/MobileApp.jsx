import { useState } from "react";
import { useProgress } from "@/components/ProgressContext";
import { LayoutDashboard, BookOpen, CreditCard } from "lucide-react";

export default function MobileApp() {
  const { progress } = useProgress();
  const [view, setView] = useState("home");          // home | modules | lesson | flash
  const [activeModule, setActiveModule] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);

  if (!progress) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid var(--blue)", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Tab → top-level view. "modules" tab shows the module list (or a drilled-in module/lesson).
  const tab = view === "lesson" ? "modules" : view;

  let body;
  if (view === "home") body = <div className="card" style={{ padding: 20 }}>Home (Task 3)</div>;
  else if (view === "flash") body = <div className="card" style={{ padding: 20 }}>Flashcards (Task 6)</div>;
  else body = <div className="card" style={{ padding: 20 }}>Modules (Task 4/5)</div>;

  const TABS = [
    { id: "home",   label: "Home",       icon: LayoutDashboard },
    { id: "modules",label: "Modules",    icon: BookOpen },
    { id: "flash",  label: "Flashcards", icon: CreditCard },
  ];

  return (
    <>
      <div className="mobile-main">{body}</div>
      <nav className="tab-bar">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`tab-btn ${tab === id ? "active" : ""}`}
            onClick={() => { setView(id); setActiveModule(null); setActiveLesson(null); }}>
            <Icon size={20} />
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}
