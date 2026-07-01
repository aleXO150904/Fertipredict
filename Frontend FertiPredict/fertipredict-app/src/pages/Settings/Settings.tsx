import React, { useState, useEffect } from 'react';
import './Settings.css';
import { userService } from '../../services/userService';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'perfil' | 'notificaciones' | 'seguridad'>('perfil');
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    currentPassword: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await userService.getMe();
        setFormData(prev => ({
          ...prev,
          nombres: user.names || '',
          apellidos: user.lastnames || '',
          email: user.username || ''
        }));
      } catch (error) {
        console.error("Error fetching user data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setMessage({ type: '', text: '' });

    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
        return;
      }
    }

    setSaving(true);
    try {
      await userService.updateUser({
        username: formData.email,
        names: formData.nombres,
        lastnames: formData.apellidos,
        password: formData.password
      });
      setMessage({ type: 'success', text: 'Información actualizada correctamente.' });
      setFormData(prev => ({ ...prev, currentPassword: '', password: '', confirmPassword: '' })); 
    } catch (error) {
      console.error("Error updating user", error);
      setMessage({ type: 'error', text: 'Ocurrió un error al actualizar la información.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Configuración</h1>
          <p>Personaliza el sistema según tus necesidades y preferencias</p>
        </div>
      </div>

      <div className="settings-tabs">
        <button 
          className={`settings-tab ${activeTab === 'perfil' ? 'active' : ''}`}
          onClick={() => { setActiveTab('perfil'); setMessage({ type: '', text: '' }); }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Perfil
        </button>
        <button 
          className={`settings-tab ${activeTab === 'notificaciones' ? 'active' : ''}`}
          onClick={() => { setActiveTab('notificaciones'); setMessage({ type: '', text: '' }); }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          Notificaciones
        </button>
        <button 
          className={`settings-tab ${activeTab === 'seguridad' ? 'active' : ''}`}
          onClick={() => { setActiveTab('seguridad'); setMessage({ type: '', text: '' }); }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Seguridad
        </button>
      </div>

      <div className="settings-content">
        {message.text && (
          <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', backgroundColor: message.type === 'success' ? '#eaf6ef' : '#fdecea', color: message.type === 'success' ? '#2e7d55' : '#c0392b', border: `1px solid ${message.type === 'success' ? '#a3d9b5' : '#f5c6c2'}` }}>
            {message.text}
          </div>
        )}

        {activeTab === 'perfil' && (
          <div className="settings-card">
            <div className="settings-card-header">
              <h3>Información del Usuario</h3>
            </div>
            <div className="settings-card-body">
              {loading ? (
                <p>Cargando información...</p>
              ) : (
                <>
                  <div className="settings-field">
                    <label>Nombres</label>
                    <input type="text" name="nombres" value={formData.nombres} onChange={handleChange} />
                  </div>
                  <div className="settings-field">
                    <label>Apellidos</label>
                    <input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} />
                  </div>
                  <div className="settings-field">
                    <label>Correo Electrónico (username)</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'notificaciones' && (
          <div className="settings-card">
            <div className="settings-card-header">
              <h3>Preferencias de Notificaciones</h3>
            </div>
            <div className="settings-card-body">
              <p>Configuración de notificaciones próximamente...</p>
            </div>
          </div>
        )}

        {activeTab === 'seguridad' && (
          <div className="settings-card">
            <div className="settings-card-header">
              <h3>Seguridad y Privacidad</h3>
            </div>
            <div className="settings-card-body">
              <div className="settings-field">
                <label>Contraseña Actual</label>
                <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} placeholder="••••••••" />
              </div>
              <div className="settings-field">
                <label>Nueva Contraseña</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" />
              </div>
              <div className="settings-field">
                <label>Confirmar Nueva Contraseña</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="settings-actions">
        <button className="btn-outline">Cancelar</button>
        <button className="btn-primary with-icon" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Guardar Configuración
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Settings;
