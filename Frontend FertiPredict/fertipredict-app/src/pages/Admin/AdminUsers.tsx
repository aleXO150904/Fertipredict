import { lastLoginLabel, lastLoginDate } from "../../utils/lastLogin";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./AdminUsers.css";
import CreateUserDialog from "./CreateUserDialog";
import DeleteUserDialog from "./DeleteUserDialog";

export type Account = { id: number; names: string; lastnames: string; username: string; role: "ADMIN" | "USER"; active: boolean; lastLoginAt?: string | null };
function ProfileConfirmation({ original, next, saving, onCancel, onConfirm }: {
  original: Account; next: Account; saving: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  const fields = [{ key: "names", label: "Nombre" }, { key: "lastnames", label: "Apellido" }, { key: "username", label: "Correo" }] as const;
  return <dialog ref={dialog} className="admin-profile-confirm" aria-labelledby="profile-confirm-title"
    aria-describedby="profile-confirm-description" onCancel={event => { event.preventDefault(); if (!saving) onCancel(); }}>
    <h2 id="profile-confirm-title">¿Confirmas los cambios?</h2>
    <p id="profile-confirm-description">Se actualizarán los siguientes datos de {original.names} {original.lastnames}:</p>
    <dl>{fields.filter(field => original[field.key] !== next[field.key]).map(field => <div key={field.key}>
      <dt>{field.label}</dt><dd><span>Actual: {original[field.key] || "Sin registro"}</span><strong>Nuevo: {next[field.key]}</strong></dd>
    </div>)}</dl>
    {original.role !== next.role && <dl><dt>Rol</dt><dd><span>Actual: {original.role === "ADMIN" ? "Administrador" : "Médico especialista"}</span><strong>Nuevo: {next.role === "ADMIN" ? "Administrador" : "Médico especialista"}</strong></dd></dl>}
    {original.username !== next.username && <p>El médico deberá volver a iniciar sesión con el nuevo correo y su contraseña actual. Los enlaces anteriores de recuperación quedarán invalidados.</p>}
    <div className="admin-toolbar"><button autoFocus type="button" className="btn-outline" disabled={saving} onClick={onCancel}>Volver a editar</button>
      <button type="button" className="btn-primary" disabled={saving} onClick={onConfirm}>{saving ? "Guardando…" : "Sí, guardar cambios"}</button></div>
  </dialog>;
}
export default function AdminUsers() {
  const { user } = useAuth();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const interval = window.setInterval(tick, 60000);
    window.addEventListener("focus", tick);
    return () => { clearInterval(interval); window.removeEventListener("focus", tick); };
  }, []);
  const [deleting, setDeleting] = useState<Account | null>(null);
  const [creating, setCreating] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [pendingKind, setPendingKind] = useState<"access" | "role">("access");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<Account | null>(null);
  const [editing, setEditing] = useState<Account | null>(null);
  const editorRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (editing) editorRef.current?.scrollIntoView({ block: "center", behavior: "instant" });
  }, [editing?.id]);
  const [confirmation, setConfirmation] = useState<Account | null>(null);
  const profileInFlight = useRef(false);
  const [profileError, setProfileError] = useState("");
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
      if (pendingKind === "role") setEditing(null);
      setPending(null); setMessage(pendingKind === "access" ? (data.active ? "Cuenta activada: el usuario puede iniciar sesión." : "Cuenta desactivada: el usuario ya no puede iniciar sesión y sus sesiones anteriores quedaron invalidadas.") : "Rol actualizado correctamente.");
    } catch (err) {
      setError(axios.isAxiosError(err) && err.response?.status === 409
        ? (pendingKind === "role" ? "No se puede cambiar el rol: activa la cuenta primero y comprueba que no sea tu propia cuenta. Actualiza la lista si el estado cambió." : "No puedes desactivar tu propia cuenta.")
        : axios.isAxiosError(err) && err.response?.status === 400 && pendingKind === "role" ? "Completa y guarda nombre, apellido y un correo válido antes de cambiar el rol." : "No se pudo guardar el cambio. Comprueba tu conexión y tus permisos.");
    } finally { setSaving(false); }
  }
  function reviewProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || saving) return;
    const next = { ...editing, names: editing.names.trim(), lastnames: editing.lastnames.trim(), username: editing.username.trim() };
    if (!editingProfileComplete || !next.names || !next.lastnames) { setProfileError("Completa el nombre, apellido y un correo válido."); return; }
    const original = accounts.find(a => a.id === next.id);
    if (!original) return;
    if (original.names === next.names && original.lastnames === next.lastnames && original.username === next.username && original.role === next.role) {
      setProfileError("No hay cambios para guardar."); return;
    }
    setProfileError(""); setConfirmation(next);
  }
  async function saveProfile() {
    if (!confirmation || profileInFlight.current) return;
    profileInFlight.current = true;
    const profile = { names: confirmation.names, lastnames: confirmation.lastnames, username: confirmation.username, role: confirmation.role };
    setSaving(true); setProfileError(""); setMessage("");
    try {
      const { data } = await api.put<Account>(`/api/admin/users/${confirmation.id}/profile`, profile);
      const emailChanged = accounts.find(a => a.id === data.id)?.username !== data.username;
      setAccounts(rows => rows.map(row => row.id === data.id ? data : row));
      setEditing(null);
      setMessage(emailChanged ? "Datos actualizados. El médico deberá iniciar sesión con el nuevo correo y su contraseña actual." : "Datos y rol guardados correctamente.");
    } catch (err) {
      const code = axios.isAxiosError(err) ? err.response?.status : undefined;
      setProfileError(code === 409 ? "No se pudo guardar: el correo puede estar en uso o la cuenta se desactivó antes del cambio de rol. Revisa los datos y actualiza la lista."
        : code === 400 ? "Revisa el nombre, apellido y correo ingresados."
        : code === 403 ? "Solo un administrador puede editar otras cuentas. No puedes modificar tu propia cuenta desde aquí."
        : code === 404 ? "El usuario ya no está disponible. Actualiza la lista."
        : "No se pudieron guardar los datos. Inténtalo de nuevo.");
    } finally { profileInFlight.current = false; setSaving(false); setConfirmation(null); }
  }
  const editingProfileComplete = !!editing && !!editing.names.trim() && !!editing.lastnames.trim()
    && editing.names.trim().length <= 255 && editing.lastnames.trim().length <= 255
    && editing.username.trim().length <= 254 && /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(editing.username.trim());
  const rows = accounts.filter(a => (status === "all" || a.active === (status === "active")) && `${a.names} ${a.lastnames} ${a.username}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return <section className="admin-users">
    <header><span className="admin-eyebrow">ADMINISTRACIÓN</span><h1>Usuarios y permisos</h1><p>Gestiona los roles y el acceso a FertiPredict.</p></header>
    <div className="admin-toolbar"><button className="btn-primary" disabled={loading || saving || !!pending || !!editing || creating} onClick={() => { setError(""); setMessage(""); setCreating(true); }}>Crear usuario</button></div>
    {deleting && <DeleteUserDialog account={deleting} onCancel={() => setDeleting(null)} onDeleted={() => {
      setAccounts(rows => rows.filter(row => row.id !== deleting.id));
      setMessage(`Usuario ${deleting.username} eliminado correctamente.`); setDeleting(null);
    }} />}
    {creating && <CreateUserDialog onCancel={() => setCreating(false)} onCreated={account => {
      setAccounts(rows => [...rows.filter(row => row.id !== account.id), account]);
      setSearch(""); setStatus("all"); setCreating(false);
      setMessage(`Usuario ${account.username} creado como ${account.role === "ADMIN" ? "administrador" : "médico especialista"}. ${account.active ? "Puede iniciar sesión con la contraseña asignada." : "Su acceso está desactivado."}`);
    }} />}
    <div className="admin-summary"><span><strong>{accounts.length}</strong> usuarios</span><span><strong>{accounts.filter(a => a.active).length}</strong> activos</span><span><strong>{accounts.filter(a => a.role === "ADMIN").length}</strong> administradores</span></div>
    <div className="admin-toolbar"><label>Buscar usuario<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nombre o correo electrónico" /></label><label>Estado de la cuenta<select value={status} onChange={e => setStatus(e.target.value)}><option value="all">Todos los usuarios</option><option value="active">Cuentas activas</option><option value="inactive">Cuentas inactivas</option></select></label><button className="btn-outline" onClick={() => void load()} disabled={loading || saving || (!!pending || !!editing)}>Actualizar lista</button></div>
    {error && <p role="alert" className="admin-error">{error}</p>}
    {message && <p role="status">{message}</p>}
    {loading ? <p role="status">Cargando usuarios…</p> : <div className="admin-table-wrap"><table><thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Días sin iniciar sesión</th><th>Estado</th><th>Permiso de inicio de sesión</th><th>Editar datos</th><th>Eliminar usuario</th></tr></thead><tbody>
      {rows.map(a => <tr key={a.id}><td><strong>{`${a.names || ""} ${a.lastnames || ""}`.trim() || a.username}</strong>{a.id === user?.id && <small>Tu cuenta</small>}</td><td className="admin-email-cell">{a.username}</td><td><span className="admin-role-label">{a.role === "ADMIN" ? "Administrador" : "Médico especialista"}</span></td><td><strong>{lastLoginLabel(a.lastLoginAt, now)}</strong><small>{lastLoginDate(a.lastLoginAt)}{a.lastLoginAt ? " (Lima)" : ""}</small></td><td><span className={`admin-status ${a.active ? "is-active" : ""}`}>{a.active ? "Activo" : "Inactivo"}</span></td><td><button className={`btn-outline admin-access-button ${a.active ? "revoke" : "grant"}`} aria-label={`${a.active ? "Desactivar" : "Activar"} cuenta de ${a.username}`} title={a.id === user?.id ? "No puedes desactivar tu propia cuenta" : undefined} disabled={a.id === user?.id || saving || (!!pending || !!editing)} onClick={() => { setError(""); setPendingKind("access"); setPending({ ...a, active: !a.active }); }}>{a.active ? "Desactivar cuenta" : "Activar cuenta"}</button><small>{a.active ? "Inicio de sesión permitido" : "Inicio de sesión bloqueado"}</small></td><td>{a.id !== user?.id ? <button className="btn-outline" disabled={saving || !!pending || !!editing} aria-label={`Editar datos de ${a.username}`} onClick={() => { setError(""); setProfileError(""); setEditing({ ...a, names: a.names || "", lastnames: a.lastnames || "" }); }}>Editar datos</button> : <span>—</span>}</td><td><button className="btn-outline admin-delete-button" disabled={a.id === user?.id || saving || !!pending || !!editing || creating || !!deleting} title={a.id === user?.id ? "No puedes eliminar tu propia cuenta" : undefined} aria-label={`Eliminar usuario ${a.username}`} onClick={() => { setError(""); setMessage(""); setDeleting(a); }}>Eliminar</button></td></tr>)}
      {!rows.length && <tr><td colSpan={8}>No se encontraron usuarios.</td></tr>}
    </tbody></table></div>}
    <p className="admin-note">El contador muestra periodos completos de 24 horas desde el último inicio de sesión exitoso. No indica si el usuario está conectado actualmente. Las cuentas sin historial mostrarán «Sin registro» hasta su próximo ingreso. Usa «Actualizar lista» para consultar nuevos ingresos.</p>
    <p className="admin-note">Al desactivar una cuenta se bloquea el inicio de sesión y se invalidan sus sesiones anteriores. Tu propia cuenta conserva el acceso de administrador.</p>
    {editing && <section ref={editorRef} className="admin-profile" aria-labelledby="admin-profile-title">
      <h2 id="admin-profile-title">Editar datos del usuario</h2>
      <p>{accounts.find(a => a.id === editing.id)?.username}</p>
      <div className="admin-role-editor">
        <label>Rol del usuario<select aria-describedby="admin-role-help" value={editing.role}
          disabled={!editingProfileComplete || !editing.active || editing.id === user?.id || saving || !!confirmation}
          onChange={e => setEditing({ ...editing, role: e.target.value as Account["role"] })}>
          <option value="USER">Médico especialista</option><option value="ADMIN">Administrador</option>
        </select></label>
        <p id="admin-role-help" className="admin-note">{!editing.active ? "Activa la cuenta para cambiar su rol." : !editingProfileComplete ? "Completa nombre, apellido y un correo válido para habilitar el cambio de rol." : "Los cambios de datos y rol se aplicarán juntos al pulsar Guardar datos y confirmar."}</p>
      </div>
      <form onSubmit={reviewProfile}>
        <div className="admin-profile-fields">
          <label>Nombre<input autoFocus required maxLength={255} autoComplete="given-name" value={editing.names} disabled={saving} onChange={e => setEditing({ ...editing, names: e.target.value })} /></label>
          <label>Apellido<input required maxLength={255} autoComplete="family-name" value={editing.lastnames} disabled={saving} onChange={e => setEditing({ ...editing, lastnames: e.target.value })} /></label>
          <label>Correo electrónico<input required type="email" maxLength={254} autoComplete="off" value={editing.username} disabled={saving} onChange={e => setEditing({ ...editing, username: e.target.value })} /></label>
        </div>
        <p className="admin-note">Si cambias el correo, el usuario deberá volver a iniciar sesión con el nuevo correo y su contraseña actual. Los enlaces anteriores de recuperación quedarán invalidados.</p>
        {profileError && <p className="admin-error" role="alert">{profileError}</p>}
        <div className="admin-toolbar"><button type="button" className="btn-outline" disabled={saving} onClick={() => setEditing(null)}>Cancelar</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? "Guardando…" : "Guardar datos"}</button></div>
      </form>
    </section>}
    {confirmation && accounts.find(a => a.id === confirmation.id) && <ProfileConfirmation
      original={accounts.find(a => a.id === confirmation.id)!} next={confirmation} saving={saving}
      onCancel={() => setConfirmation(null)} onConfirm={() => void saveProfile()} />}
    {pending && <div className="modal-overlay"><div className="modal-box admin-confirm" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title"><h2 id="admin-confirm-title">{pendingKind === "role" ? "Cambiar rol" : pending.active ? "Activar cuenta" : "Desactivar cuenta"}</h2><p><strong>{pending.username}</strong></p><p>{pendingKind === "role" ? `Nuevo rol: ${pending.role === "ADMIN" ? "Administrador" : "Médico"}.` : pending.active ? "El usuario podrá volver a iniciar sesión con su contraseña actual." : "Se bloqueará el inicio de sesión y sus sesiones abiertas perderán acceso en la siguiente solicitud. Sus datos y predicciones se conservarán."}</p>{error && <p role="alert" className="admin-error">{error}</p>}<div className="admin-toolbar"><button autoFocus className="btn-outline" disabled={saving} onClick={() => setPending(null)}>Cancelar</button><button className="btn-primary" disabled={saving} onClick={() => void save()}>{saving ? "Guardando…" : "Guardar cambio"}</button></div></div></div>}
  </section>;
}
