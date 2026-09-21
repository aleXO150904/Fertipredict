import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

import { userService, type UserDTO } from "../services/userService";

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserDTO | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem("token")
  );

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
    localStorage.setItem("token", token);
    setIsAuthenticated(true);
  }

  function logout() {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
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
