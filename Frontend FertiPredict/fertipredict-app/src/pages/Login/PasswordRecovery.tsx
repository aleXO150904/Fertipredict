import { useState, type FormEvent } from "react";
import axios from "axios";
import { authService } from "../../services/authService";
import "./Login.css";

export default function PasswordRecovery({ token, onLogin }: { token?: string; onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (token && (password !== confirmation || password.length < 12 || new TextEncoder().encode(password).length > 72)) {
      setError("Las contraseñas deben coincidir y tener al menos 12 caracteres (máximo 72 bytes).");
      return;
    }
    setBusy(true);
    try {
      if (token) await authService.resetPassword(token, password);
      else await authService.forgotPassword(email.trim());
      setDone(true);
      setPassword(""); setConfirmation("");
    } catch (cause) {
      const status = axios.isAxiosError(cause) ? cause.response?.status : undefined;
      setError(status === 503 ? "La recuperación por correo no está disponible en este momento. Inténtalo más tarde."
        : status === 429 ? "Hay muchas solicitudes. Espera unos minutos e inténtalo de nuevo."
        : token && status === 400 ? "El enlace no es válido o ha caducado. Vuelve al inicio y solicita uno nuevo."
        : "No se pudo completar la solicitud. Revisa tu conexión e inténtalo de nuevo.");
    } finally { setBusy(false); }
  }

  return <div className="login-screen">
    <div className="login-panel">
      <div className="login-mark"><span className="login-mark-dot" />FertiPredict</div>
      <div className="login-header">
        <h1>{token ? "Nueva contraseña" : "¿Olvidaste tu contraseña?"}</h1>
        <p>{token ? "Define una contraseña de al menos 12 caracteres." : "Ingresa el correo con el que te registraste y te enviaremos un enlace de recuperación."}</p>
      </div>
      {done ? <div className="recovery-status" role="status">
        {token ? "Tu contraseña se actualizó. Inicia sesión con la nueva contraseña."
          : "Si existe una cuenta con ese correo, recibirás un enlace. Revisa también la carpeta de spam. El enlace caduca en 20 minutos."}
      </div> : <form className="login-form" onSubmit={submit}>
        {token ? <>
          <div className="field"><label htmlFor="new-password">Nueva contraseña</label>
            <input id="new-password" type="password" autoComplete="new-password" minLength={12} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} required /></div>
          <div className="field"><label htmlFor="confirm-password">Confirmar contraseña</label>
            <input id="confirm-password" type="password" autoComplete="new-password" minLength={12} maxLength={72} value={confirmation} onChange={e => setConfirmation(e.target.value)} required /></div>
        </> : <div className="field"><label htmlFor="recovery-email">Correo electrónico</label>
          <input id="recovery-email" type="email" autoComplete="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} required /></div>}
        {error && <div className="login-error" role="alert">{error}</div>}
        <button className="login-button" disabled={busy}>{busy ? "Procesando…" : token ? "Guardar contraseña" : "Enviar enlace"}</button>
      </form>}
      <button className="link-button recovery-back" type="button" onClick={onLogin} disabled={busy}>Volver al inicio de sesión</button>
    </div>
    <div className="login-side"><div className="login-side-content"><h2>Recupera el acceso a tu cuenta</h2><p>El enlace es personal y solo se puede utilizar una vez.</p></div></div>
  </div>;
}
