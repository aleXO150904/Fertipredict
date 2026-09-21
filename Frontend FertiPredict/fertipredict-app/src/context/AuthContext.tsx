import SessionDialog, { type SessionDialogKind } from "../components/SessionDialog";
import { ACTIVITY_KEY, idleStage } from "../utils/sessionIdle";
import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";

import { userService, type UserDTO } from "../services/userService";

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserDTO | null;
  login: (token: string) => void;
  logout: () => void;
  requestLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem("token")
  );

  const [dialog, setDialog] = useState<SessionDialogKind | null>(null);
  const dialogRef = useRef<SessionDialogKind | null>(null);
  function showDialog(kind: SessionDialogKind | null) { dialogRef.current = kind; setDialog(kind); }
  function lastActivity() {
    const value = Number(localStorage.getItem(ACTIVITY_KEY));
    return Number.isFinite(value) && value > 0 ? value : Date.now();
  }
  function expire() { logout(); showDialog("expired"); }
  function acceptDialog() {
    if (dialogRef.current === "warning") {
      if (idleStage(lastActivity(), Date.now()) === "expired") { expire(); return; }
      localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
    } else if (dialogRef.current === "confirm") { logout(); }
    showDialog(null);
  }
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!localStorage.getItem(ACTIVITY_KEY)) localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
    function check() {
      const stage = idleStage(lastActivity(), Date.now());
      if (stage === "expired") { expire(); return; }
      if (stage === "warning") showDialog("warning");
      else if (dialogRef.current === "warning") showDialog(null);
    }
    function activity() {
      const now = Date.now();
      const last = lastActivity();
      if (idleStage(last, now) === "expired") { expire(); return; }
      if (dialogRef.current === "warning") return;
      if (now - last >= 1000) localStorage.setItem(ACTIVITY_KEY, String(now));
    }
    function storage(event: StorageEvent) {
      if (event.key === "token" && !event.newValue) {
        if (idleStage(lastActivity(), Date.now()) === "expired") expire();
        else logout();
      } else if (event.key === ACTIVITY_KEY) check();
    }
    const events = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart"];
    events.forEach(name => window.addEventListener(name, activity, { passive: true }));
    window.addEventListener("storage", storage);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    const timer = window.setInterval(check, 1000);
    check();
    return () => {
      clearInterval(timer);
      events.forEach(name => window.removeEventListener(name, activity));
      window.removeEventListener("storage", storage);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [isAuthenticated]);

  const [user, setUser] = useState<UserDTO | null>(null);
  useEffect(() => {
    let active = true;
    const refresh = () => { if (isAuthenticated) userService.getMe().then(value => { if (active) setUser(value); }).catch(() => { if (active) setUser(null); }); };
    refresh();
    window.addEventListener("fertipredict:profile-updated", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("fertipredict:unauthorized", logout);
    return () => { active = false; window.removeEventListener("fertipredict:profile-updated", refresh); window.removeEventListener("focus", refresh); window.removeEventListener("fertipredict:unauthorized", logout); };
  }, [isAuthenticated]);

  function login(token: string) {
    localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
    showDialog(null);
    localStorage.setItem("token", token);
    setIsAuthenticated(true);
  }

  function logout() {
    if (dialogRef.current !== "expired") showDialog(null);
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, requestLogout: () => showDialog("confirm") }}>
      {children}
      {dialog && <SessionDialog key={dialog} kind={dialog} onAccept={acceptDialog} onCancel={() => showDialog(null)} />}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
