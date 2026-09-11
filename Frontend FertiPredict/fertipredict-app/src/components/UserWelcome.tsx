import { useEffect, useState } from "react";
import { userService, type UserDTO } from "../services/userService";

export default function UserWelcome() {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    let requestId = 0;
    async function load() {
      const current = ++requestId;
      try {
        const profile = await userService.getMe();
        if (active && current === requestId) { setUser(profile); setFailed(false); }
      } catch {
        if (active && current === requestId) { setFailed(true); setUser(null); }
      } finally { if (active && current === requestId) setLoading(false); }
    }
    void load();
    window.addEventListener("fertipredict:profile-updated", load);
    return () => { active = false; window.removeEventListener("fertipredict:profile-updated", load); };
  }, []);
  const name = [user?.names?.trim(), user?.lastnames?.trim()].filter(Boolean).join(" ") || user?.username || "";
  const initials = [user?.names, user?.lastnames].map(part => part?.trim().charAt(0) || "").join("").toLocaleUpperCase("es-PE") || "?";
  // USER is the existing clinical account type; this label does not grant permissions.
  const roles: Record<string, string> = { ADMIN: "Administrador", USER: "Médico", DOCTOR: "Médico", MEDICO: "Médico" };
  const role = roles[user?.role?.trim().toUpperCase() || ""] || "Rol no disponible";
  return <section className="sidebar-welcome" aria-label="Usuario conectado" aria-busy={loading}>
    <span className="sidebar-avatar" aria-hidden="true">{initials}</span>
    <div className="sidebar-welcome-text">
      <span className="sidebar-greeting">Bienvenido/a</span>
      <strong title={name}>{loading ? "Cargando perfil…" : failed ? "Perfil no disponible" : name || "Usuario"}</strong>
      {!loading && !failed && <span className="sidebar-role">{role}</span>}
    </div>
  </section>;
}
