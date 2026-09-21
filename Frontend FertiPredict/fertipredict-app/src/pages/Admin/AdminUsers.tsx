import { useEffect, useState } from "react";
import axios from "axios";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./AdminUsers.css";

type Account = { id: number; names: string; lastnames: string; username: string; role: "ADMIN" | "USER"; active: boolean };
export default function AdminUsers() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [pendingKind, setPendingKind] = useState<"access" | "role">("access");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<Account | null>(null);
  const [saving, setSaving] = useState(false);
  async function load() {
    setLoading(true); setError("");
    try { setAccounts((await api.get<Account[]>("/api/admin/users")).data); }
    catch { setError("No se pudieron cargar los usuarios. Comprueba tu conexión y tus permisos."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  async function save() {
    if (!pending) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const { data } = await api.put<Account>(`/api/admin/users/${pending.id}/${pendingKind}`, pendingKind === "access" ? { active: pending.active } : { role: pending.role });
      setAccounts(rows => rows.map(row => row.id === data.id ? data : row));
      setPending(null); setMessage(pendingKind === "access" ? (data.active ? "Cuenta activada: el usuario puede iniciar sesión." : "Cuenta desactivada: el usuario ya no puede iniciar sesión y sus sesiones anteriores quedaron invalidadas.") : "Rol actualizado correctamente.");
    } catch (err) {
      setError(axios.isAxiosError(err) && err.response?.status === 409
        ? "No puedes desactivar tu propia cuenta ni quitarte el rol de administrador."
        : "No se pudo guardar el cambio. Comprueba tu conexión y tus permisos.");
    } finally { setSaving(false); }
  }
  const rows = accounts.filter(a => (status === "all" || a.active === (status === "active")) && `${a.names} ${a.lastnames} ${a.username}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return <section className="admin-users">
    <header><span className="admin-eyebrow">ADMINISTRACIÓN</span><h1>Usuarios y permisos</h1><p>Gestiona los roles y el acceso a FertiPredict.</p></header>
    <div className="admin-summary"><span><strong>{accounts.length}</strong> usuarios</span><span><strong>{accounts.filter(a => a.active).length}</strong> activos</span><span><strong>{accounts.filter(a => a.role === "ADMIN").length}</strong> administradores</span></div>
    <div className="admin-toolbar"><label>Buscar usuario<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nombre o correo electrónico" /></label><label>Estado de la cuenta<select value={status} onChange={e => setStatus(e.target.value)}><option value="all">Todos los usuarios</option><option value="active">Cuentas activas</option><option value="inactive">Cuentas inactivas</option></select></label><button className="btn-outline" onClick={() => void load()} disabled={loading || saving || !!pending}>Actualizar lista</button></div>
    {error && <p role="alert" className="admin-error">{error}</p>}
    {message && <p role="status">{message}</p>}
    {loading ? <p role="status">Cargando usuarios…</p> : <div className="admin-table-wrap"><table><thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Permiso de inicio de sesión</th></tr></thead><tbody>
      {rows.map(a => <tr key={a.id}><td><strong>{`${a.names || ""} ${a.lastnames || ""}`.trim() || a.username}</strong>{a.id === user?.id && <small>Tu cuenta</small>}</td><td>{a.username}</td><td><select aria-label={`Rol de ${a.username}`} value={a.role} disabled={a.id === user?.id || saving || !!pending} onChange={e => { setError(""); setPendingKind("role"); setPending({ ...a, role: e.target.value as Account["role"] }); }}><option value="USER">Médico</option><option value="ADMIN">Administrador</option></select></td><td><span className={`admin-status ${a.active ? "is-active" : ""}`}>{a.active ? "Activo" : "Inactivo"}</span></td><td><button className={`btn-outline admin-access-button ${a.active ? "revoke" : "grant"}`} aria-label={`${a.active ? "Desactivar" : "Activar"} cuenta de ${a.username}`} title={a.id === user?.id ? "No puedes desactivar tu propia cuenta" : undefined} disabled={a.id === user?.id || saving || !!pending} onClick={() => { setError(""); setPendingKind("access"); setPending({ ...a, active: !a.active }); }}>{a.active ? "Desactivar cuenta" : "Activar cuenta"}</button><small>{a.active ? "Inicio de sesión permitido" : "Inicio de sesión bloqueado"}</small></td></tr>)}
      {!rows.length && <tr><td colSpan={5}>No se encontraron usuarios.</td></tr>}
    </tbody></table></div>}
    <p className="admin-note">Al desactivar una cuenta se bloquea el inicio de sesión y se invalidan sus sesiones anteriores. Tu propia cuenta conserva el acceso de administrador.</p>
    {pending && <div className="modal-overlay"><div className="modal-box admin-confirm" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title"><h2 id="admin-confirm-title">{pendingKind === "role" ? "Cambiar rol" : pending.active ? "Activar cuenta" : "Desactivar cuenta"}</h2><p><strong>{pending.username}</strong></p><p>{pendingKind === "role" ? `Nuevo rol: ${pending.role === "ADMIN" ? "Administrador" : "Médico"}.` : pending.active ? "El usuario podrá volver a iniciar sesión con su contraseña actual." : "Se bloqueará el inicio de sesión y sus sesiones abiertas perderán acceso en la siguiente solicitud. Sus datos y predicciones se conservarán."}</p>{error && <p role="alert" className="admin-error">{error}</p>}<div className="admin-toolbar"><button autoFocus className="btn-outline" disabled={saving} onClick={() => setPending(null)}>Cancelar</button><button className="btn-primary" disabled={saving} onClick={() => void save()}>{saving ? "Guardando…" : "Guardar cambio"}</button></div></div></div>}
  </section>;
}
