import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { api } from "../../services/api";
import type { Account } from "./AdminUsers";

export default function DeleteUserDialog({ account, onCancel, onDeleted }: {
  account: Account; onCancel: () => void; onDeleted: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const inFlight = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  async function remove() {
    if (inFlight.current) return;
    inFlight.current = true; setSaving(true); setError("");
    try {
      await api.delete(`/api/admin/users/${account.id}`);
      onDeleted();
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 404) { onDeleted(); return; }
      setError(status === 409 ? "No se puede eliminar una cuenta con predicciones o registros asociados, ni tu propia cuenta. Puedes desactivarla para conservar su historial."
        : status === 403 ? "No tienes permisos para eliminar usuarios."
        : "No se pudo confirmar la eliminación. Actualiza la lista antes de reintentar.");
    } finally { inFlight.current = false; setSaving(false); }
  }
  return <dialog ref={dialog} className="admin-profile-confirm" aria-labelledby="delete-user-title" aria-describedby="delete-user-description"
    onCancel={event => { event.preventDefault(); if (!inFlight.current) onCancel(); }}>
    <h2 id="delete-user-title">¿Eliminar este usuario?</h2>
    <p><strong>{account.names} {account.lastnames}</strong></p><p>{account.username}</p>
    <p id="delete-user-description">Se eliminará permanentemente la cuenta y perderá el acceso. Esta acción no se puede deshacer.</p>
    <p>Si tiene predicciones registradas, no se eliminará. En ese caso, desactiva la cuenta para conservar el historial.</p>
    {error && <p role="alert" className="admin-error">{error}</p>}
    <div className="admin-toolbar"><button autoFocus type="button" className="btn-outline" disabled={saving} onClick={onCancel}>Cancelar</button>
      <button type="button" className="btn-outline admin-delete-button" disabled={saving} onClick={() => void remove()}>{saving ? "Eliminando…" : "Sí, eliminar usuario"}</button></div>
  </dialog>;
}
