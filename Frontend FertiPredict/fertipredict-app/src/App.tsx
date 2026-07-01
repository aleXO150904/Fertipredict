import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login/Login";
import PredictionsPage from "./pages/Predictions/Predictions";
import NewPrediction from "./pages/Predictions/NewPrediction";
import "./App.css";
import Register from "./pages/Register/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import Settings from "./pages/Settings/Settings";

type Page = "predictions" | "new_prediction" | "edit_prediction" | "dashboard" | "settings";

function Sidebar({ page, setPage, logout }: {
  page: Page;
  setPage: (p: Page) => void;
  logout: () => void;
}) {
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">FertiPredict</span>
          <span className="sidebar-brand-sub">Sistema ML Predictivo</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <button
          id="nav-predicciones"
          className={`sidebar-nav-item ${page === "predictions" ? "active" : ""}`}
          onClick={() => setPage("predictions")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          Predicciones
        </button>

        <button
          id="nav-dashboard"
          className={`sidebar-nav-item ${page === "dashboard" ? "active" : ""}`}
          onClick={() => setPage("dashboard")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          Dashboard
        </button>

        <button
          id="nav-configuracion"
          className={`sidebar-nav-item ${page === "settings" ? "active" : ""}`}
          onClick={() => setPage("settings")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Configuración
        </button>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button id="btn-logout" className="sidebar-logout-btn" onClick={logout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}



function AppContent() {
  const { isAuthenticated, logout } = useAuth();
  const [page, setPage] = useState<Page>("predictions");
  const [editPrediction, setEditPrediction] = useState<any>(null);
  const [authPage, setAuthPage] = useState<"login" | "register">("login")

  if (!isAuthenticated) {
    return authPage === "login"
      ? (
          <Login 
            onRegister={() => setAuthPage("register")} 
          />
        )
      : (
          <Register onLogin={() => setAuthPage("login")} 
          />
        )
  }

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={setPage} logout={logout} />
      <main className="main-content">
        {page === "predictions" && <PredictionsPage
          onNewPrediction={() => setPage("new_prediction")}
          onEditPrediction={(pred) => { setEditPrediction(pred); setPage("edit_prediction"); }}
        />}
        {page === "new_prediction" && <NewPrediction onBack={() => setPage("predictions")} />}
        {page === "edit_prediction" && <NewPrediction onBack={() => { setEditPrediction(null); setPage("predictions"); }} predictionToEdit={editPrediction} />}
        {page === "dashboard" && <Dashboard/>}
        {page === "settings" && <Settings />}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
