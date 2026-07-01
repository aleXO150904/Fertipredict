import { useState, type FormEvent } from "react";
import { authService } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

type LoginProps = {
    onRegister: () => void; 
  }

export default function Login({onRegister} : LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { login } = useAuth();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authService.login({ username, password });
      setShowSuccess(true);
      setTimeout(() => {
        login(response.token);
      }, 1800);
    } catch (err) {
      setError("Usuario o contraseña incorrectos. Verifica tus datos e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      {showSuccess && (
        <div className="success-overlay">
          <div className="success-card">
            <div className="success-icon-container">
              <svg
                className="success-icon-svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2>¡Inicio de sesión exitoso!</h2>
            <p>Redireccionando al panel principal de FertiPredict...</p>
          </div>
        </div>
      )}
      <div className="login-panel">
        <div className="login-mark">
          <span className="login-mark-dot" />
          FertiPredict
        </div>

        <div className="login-header">
          <h1>Bienvenido de vuelta</h1>
          <p>Ingresa tus credenciales para acceder a tus predicciones clínicas.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingrese su usuario"
              autoComplete="username"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Ingresando…" : "Ingresar"}
          </button>

          <div className="login-register-link">
            <span>¿No tienes una cuenta?  </span>
            <button
              type = "button"
              className="link-button"
              onClick={onRegister}>
              Registrate aquí
            </button>
          </div>
        </form>
      </div>

      <div className="login-side">
        <div className="login-side-content">
          <span className="login-side-eyebrow">Soporte clínico predictivo</span>
          <h2>Decisiones informadas, antes de la primera consulta.</h2>
          <p>
            FertiPredict combina antecedentes clínicos de la pareja para estimar 
            el riesgo de infertilidad y orientar el plan de evaluación.
          </p>
        </div>
      </div>
    </div>
  );
}
