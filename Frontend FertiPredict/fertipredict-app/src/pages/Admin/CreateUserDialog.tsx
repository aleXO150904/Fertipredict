import { useEffect, useRef, useState, type FormEvent } from "react";
import axios from "axios";
import { api } from "../../services/api";
import type { Account } from "./AdminUsers";

export default function CreateUserDialog({ onCancel, onCreated }: {
  onCancel: () => void; onCreated: (account: Account) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const backButton = useRef<HTMLButtonElement>(null);
  const submitButton = useRef<HTMLButtonElement>(null);
  const inFlight = useRef(false);
  const [form, setForm] = useState({ names: "", lastnames: "", username: "", password: "", confirmation: "", role: "USER" as Account["role"], active: true });
  const [reviewing, setReviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  useEffect(() => { if (reviewing) backButton.current?.focus(); }, [reviewing]);
  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = { ...form, names: form.names.trim(), lastnames: form.lastnames.trim(), username: form.username.trim() };
    if (!next.names || !next.lastnames) { setError("Completa el nombre y el apellido."); return; }
    if (next.password !== next.confirmation) { setError("Las contraseñas no coinciden."); return; }
    if (!next.password.trim() || next.password.length < 12 || new TextEncoder().encode(next.password).length > 72) {
      setError("La contraseña debe tener al menos 12 caracteres y un máximo de 72 bytes."); return;
    }
    setForm(next); setError(""); setReviewing(true);
  }
  function back() {
    setReviewing(false);
    requestAnimationFrame(() => submitButton.current?.focus());
  }
  async function create() {
    if (!reviewing || inFlight.current) return;
    inFlight.current = true; setSaving(true); setError("");
    try {
      const { names, lastnames, username, password, role, active } = form;
      const { data } = await api.post<Account>("/api/admin/users", { names, lastnames, username, password, role, active });
      onCreated(data);
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      setError(status === 409 ? "El correo ya está registrado. Usa uno diferente o revisa la lista de usuarios."
        : status === 400 ? "Revisa los campos y los requisitos de la contraseña."
        : status === 403 ? "Solo un administrador puede crear usuarios."
        : "No se pudo confirmar la creación. Revisa la lista antes de reintentar.");
      back();
    } finally { inFlight.current = false; setSaving(false); }
  }
  return <dialog ref={dialog} className="admin-profile-confirm admin-create-dialog" aria-labelledby="create-user-title"
    onCancel={event => { event.preventDefault(); if (!inFlight.current) { if (reviewing) back(); else onCancel(); } }}>
    <h2 id="create-user-title">{reviewing ? "¿Confirmas la creación del usuario?" : "Crear usuario"}</h2>
    {reviewing ? <>
      <dl><dt>Nombre y apellido</dt><dd>{form.names} {form.lastnames}</dd>
        <dt>Correo</dt><dd>{form.username}</dd><dt>Rol</dt><dd>{form.role === "ADMIN" ? "Administrador" : "Médico especialista"}</dd>
        <dt>Estado inicial</dt><dd>{form.active ? "Activo: puede iniciar sesión" : "Inactivo: acceso bloqueado"}</dd></dl>
      {form.role === "ADMIN" && <p>Esta cuenta podrá gestionar usuarios y acceder a todas las predicciones.</p>}
      <p>La cuenta usará la contraseña que ingresaste. No se enviará un correo automático.</p>
      <div className="admin-toolbar"><button ref={backButton} type="button" className="btn-outline" disabled={saving} onClick={back}>Volver a editar</button>
        <button type="button" className="btn-primary" disabled={saving} onClick={() => void create()}>{saving ? "Creando…" : "Sí, crear usuario"}</button></div>
    </> : <form onSubmit={review}>
      <div className="admin-profile-fields">
        <label>Nombre<input autoFocus required maxLength={255} autoComplete="off" value={form.names} onChange={e => setForm({ ...form, names: e.target.value })} /></label>
        <label>Apellido<input required maxLength={255} autoComplete="off" value={form.lastnames} onChange={e => setForm({ ...form, lastnames: e.target.value })} /></label>
        <label>Correo electrónico<input required type="email" maxLength={254} autoComplete="off" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></label>
        <label>Rol<select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Account["role"] })}><option value="USER">Médico especialista</option><option value="ADMIN">Administrador</option></select></label>
        <label>Contraseña<input required type="password" minLength={12} maxLength={72} autoComplete="new-password" aria-describedby="create-password-help" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
        <label>Confirmar contraseña<input required type="password" minLength={12} maxLength={72} autoComplete="new-password" value={form.confirmation} onChange={e => setForm({ ...form, confirmation: e.target.value })} /></label>
        <label>Estado inicial<select value={form.active ? "active" : "inactive"} onChange={e => setForm({ ...form, active: e.target.value === "active" })}><option value="active">Activo</option><option value="inactive">Inactivo</option></select></label>
      </div>
      <p id="create-password-help" className="admin-note">Contraseña de al menos 12 caracteres (máximo 72 bytes; las tildes y otros símbolos pueden ocupar más de uno).</p>
      {error && <p role="alert" className="admin-error">{error}</p>}
      <div className="admin-toolbar"><button type="button" className="btn-outline" onClick={onCancel}>Cancelar</button><button ref={submitButton} type="submit" className="btn-primary">Revisar y crear</button></div>
    </form>}
  </dialog>;
}
