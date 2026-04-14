import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { connexion, getProfil } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Connexion() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data: tokens } = await connexion(form);
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      const { data: profil } = await getProfil();
      login(tokens, profil);
      navigate('/app');
    } catch (err) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setError(
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Email ou mot de passe incorrect.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">GF</div>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 className="auth-title">Bienvenue</h1>
          <p className="auth-subtitle">Connectez-vous à votre espace pour accéder à votre tableau de bord.</p>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2', border: '1px solid #fca5a5',
            borderRadius: 8, padding: '10px 14px', color: '#dc2626',
            fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <i className="bi bi-exclamation-circle-fill" />
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={submit} autoComplete="off">
          <input type="text" name="fakeusernameremembered" style={{ display: 'none' }} autoComplete="username" />
          <input type="password" name="fakepasswordremembered" style={{ display: 'none' }} autoComplete="new-password" />
          <div className="mb-3">
            <label className="form-label">Adresse email</label>
            <input
              type="email" name="email" className="form-control"
              placeholder="exemple@entreprise.com"
              value={form.email} onChange={handle} required
              autoComplete="username"
            />
          </div>
          <div className="mb-4">
            <label className="form-label">Mot de passe</label>
            <input
              type="password" name="password" className="form-control"
              placeholder="••••••••"
              value={form.password} onChange={handle} required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn-primary-custom" disabled={loading}>
            {loading
              ? <span className="spinner-border spinner-border-sm me-2" />
              : <i className="bi bi-box-arrow-in-right me-2" />
            }
            Se connecter
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
          Pas de compte ?{' '}
          <Link to="/inscription" style={{ color: 'var(--primary-light)', fontWeight: 700, textDecoration: 'none' }}>
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
