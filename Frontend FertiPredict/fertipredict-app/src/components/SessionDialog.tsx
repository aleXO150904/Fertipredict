import { useEffect, useRef } from "react";
import "./SessionDialog.css";

export type SessionDialogKind = "warning" | "confirm" | "expired";
export default function SessionDialog({ kind, onAccept, onCancel }: {
  kind: SessionDialogKind; onAccept: () => void; onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  const title = kind === "warning" ? "Tu sesión está por terminar" : kind === "confirm" ? "¿Cerrar sesión?" : "Sesión finalizada por inactividad";
  const message = kind === "warning"
    ? "Han pasado 20 minutos sin actividad. Tu sesión se cerrará al llegar a los 30 minutos. Pulsa Aceptar para continuar y reiniciar el tiempo de inactividad."
    : kind === "confirm" ? "¿Estás de acuerdo con cerrar tu sesión? Los cambios que no hayas guardado se perderán."
    : "Han pasado 30 minutos sin actividad y se ha cerrado tu sesión. Pulsa Aceptar para volver al inicio de sesión.";
  return <dialog ref={dialog} className="session-dialog" aria-labelledby="session-dialog-title" aria-describedby="session-dialog-description"
    onCancel={event => { event.preventDefault(); if (kind === "confirm") onCancel(); }}>
    <h2 id="session-dialog-title">{title}</h2>
    <p id="session-dialog-description">{message}</p>
    <div className="session-dialog-actions">
      {kind === "confirm" && <button type="button" className="btn-outline" autoFocus onClick={onCancel}>Cancelar</button>}
      <button type="button" className="btn-primary" autoFocus={kind !== "confirm"} onClick={onAccept}>{kind === "confirm" ? "Sí, cerrar sesión" : "Aceptar"}</button>
    </div>
  </dialog>;
}
