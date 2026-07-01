import { useState, type FormEvent } from "react";
import { authService } from "../../services/authService";

type RegisterProps = {
        onLogin: () => void;
    };

export default function Register({onLogin}: RegisterProps) {

    const [names, setNames] = useState("");
    const [lastnames, setLastNames] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    async function handleSubmit(e: FormEvent) {

        e.preventDefault();

        setError(null);

        if(password !== confirmPassword){
            setError("Las contraseñas no coinciden.");
            return;
        }

        setLoading(true);

        try{

            await authService.register({

                username,
                password,
                names,
                lastnames

            });

            setShowSuccess(true);
            setTimeout(() => {
                onLogin();
            }, 1800);
        }catch{

            setError("No fue posible crear la cuenta.");

        }finally{

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
                        
                        <h2>¡Cuenta creada!</h2>
                        
                        <p>
                            Tu cuenta se registró correctamente.
                            Redireccionando al inicio de sesión...
                        </p>
                    </div>
                </div>
            )}

            <div className="login-panel">

                <div className="login-mark">
                    <span className="login-mark-dot"/>
                    FertiPredict
                </div>

                <div className="login-header">
                    <h1>Crear una cuenta</h1>
                    <p>
                        Complete los datos para registrarse en el sistema.
                    </p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>

                    <div className="field">
                        <label>Nombres</label>
                        <input
                            required
                            value={names}
                            placeholder="Ingrese sus nombres"
                            onChange={(e)=>setNames(e.target.value)}
                        />
                    </div>

                    <div className="field">
                        <label>Apellidos</label>
                        <input
                            required
                            value={lastnames}
                            placeholder="Ingrese sus apellidos"
                            onChange={(e)=>setLastNames(e.target.value)}
                        />
                    </div>

                    <div className="field">
                        <label>Correo Electrónico</label>
                        <input
                            required
                            type="email"
                            value={username}
                            placeholder="Ingrese correo electrónico"
                            onChange={(e)=>setUsername(e.target.value)}
                        />
                    </div>

                    <div className="field">
                        <label>Contraseña</label>
                        <input
                            required
                            type="password"
                            value={password}
                            placeholder="Ingrese una contraseña"
                            onChange={(e)=>setPassword(e.target.value)}
                        />
                    </div>

                    <div className="field">
                        <label>Confirmar contraseña</label>
                        <input
                            required
                            type="password"
                            value={confirmPassword}
                            placeholder="Confirme su contraseña"
                            onChange={(e)=>setConfirmPassword(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    <button
                        className="login-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Creando..."
                            : "Crear cuenta"}
                    </button>

                </form>
            <div className="login-register-link">
              <span>¿Ya tienes una cuenta? </span>           
              <button
                type="button"
                className="link-button"
                onClick={onLogin}
              >
                Inicia sesión
              </button>
            </div>
            </div>

            <div className="login-side">
                <div className="login-side-content">

                    <span className="login-side-eyebrow">
                        Inteligencia Artificial Clínica
                    </span>

                    <h2>
                        Empieza a utilizar FertiPredict hoy.
                    </h2>

                    <p>
                        Registra tu cuenta para acceder al modelo predictivo
                        basado en Ensemble Learning y apoyar la evaluación
                        temprana del riesgo de infertilidad.
                    </p>

                </div>
            </div>

        </div>
    );

}