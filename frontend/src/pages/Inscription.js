import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { envoyerCode, verifierCode, inscription, connexion, getProfil } from '../services/api';
import { useAuth } from '../context/AuthContext';

function AlerteErreur({ message }) {
  return (
    <div style={{
      background: '#fee2e2', border: '1px solid #fca5a5',
      borderRadius: 8, padding: '10px 14px',
      color: '#dc2626', fontSize: 13, marginBottom: 16,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <i className="bi bi-exclamation-circle-fill" />
      {message}
    </div>
  );
}

function Etapes({ etape }) {
  const etapes = ['Email', 'Code', 'Compte'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, gap: 8 }}>
      {etapes.map((label, i) => {
        const num = i + 1;
        const actif = etape === num;
        const fait = etape > num;
        return (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: fait ? '#10b981' : actif ? 'var(--primary)' : '#e2e8f0',
                color: fait || actif ? 'white' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13, transition: 'all 0.3s',
              }}>
                {fait ? '✓' : num}
              </div>
              <span style={{ fontSize: 11, color: actif ? 'var(--primary)' : 'var(--text-muted)', fontWeight: actif ? 700 : 400 }}>
                {label}
              </span>
            </div>
            {i < etapes.length - 1 && (
              <div style={{ width: 40, height: 2, background: etape > num ? '#10b981' : '#e2e8f0', marginBottom: 16, transition: 'background 0.3s' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function EtapeEmail({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await envoyerCode({ email });
      onSuccess(email);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'envoi du code.");
    } finally { setLoading(false); }
  };

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📧</div>
        <h1 className="auth-title">Vérification email</h1>
        <p className="auth-subtitle">Entrez votre email pour recevoir un code</p>
      </div>
      {error && <AlerteErreur message={error} />}
      <form className="auth-form" onSubmit={submit}>
        <div className="mb-4">
          <label className="form-label">Adresse email</label>
          <input type="email" className="form-control" placeholder="exemple@entreprise.com"
            value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
        </div>
        <button type="submit" className="btn-primary-custom" disabled={loading}>
          {loading ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-send me-2" />}
          Envoyer le code
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
        Déjà un compte ?{' '}
        <Link to="/connexion" style={{ color: 'var(--primary-light)', fontWeight: 700, textDecoration: 'none' }}>
          Se connecter
        </Link>
      </p>
    </>
  );
}

function EtapeCode({ email, onSuccess, onRetour }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempsRestant, setTempsRestant] = useState(180);
  const [renvoi, setRenvoi] = useState(false);
  const inputsRef = useRef([]);

  useEffect(() => {
    setTempsRestant(180);
    const timer = setInterval(() => {
      setTempsRestant(t => { if (t <= 1) { clearInterval(timer); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [renvoi]);

  const formatTemps = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleChange = (index, val) => {
    if (!/^\d*$/.test(val)) return;
    const nouveau = [...code];
    nouveau[index] = val.slice(-1);
    setCode(nouveau);
    if (val && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) inputsRef.current[index - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) { setCode(pasted.split('')); inputsRef.current[5]?.focus(); }
  };

  const submit = async (e) => {
    e.preventDefault();
    const codeFinal = code.join('');
    if (codeFinal.length < 6) { setError('Entrez les 6 chiffres du code.'); return; }
    if (tempsRestant === 0) { setError('Code expiré. Demandez un nouveau code.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await verifierCode({ email, code: codeFinal });
      onSuccess(email, res.data.verification_id);
    } catch (err) {
      setError(err.response?.data?.error || 'Code incorrect.');
      setCode(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const renvoyer = async () => {
    setError(''); setLoading(true);
    try {
      await envoyerCode({ email });
      setCode(['', '', '', '', '', '']);
      setRenvoi(r => !r);
      inputsRef.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du renvoi.');
    } finally { setLoading(false); }
  };

  const pctTemps = (tempsRestant / 180) * 100;
  const couleurTimer = tempsRestant > 60 ? '#10b981' : tempsRestant > 30 ? '#f59e0b' : '#ef4444';

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🔐</div>
        <h1 className="auth-title">Code de vérification</h1>
        <p className="auth-subtitle">Code envoyé à <strong>{email}</strong></p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
          <span style={{ color: 'var(--text-muted)' }}>Temps restant</span>
          <span style={{ fontWeight: 700, color: couleurTimer, fontFamily: 'DM Mono, monospace' }}>
            {tempsRestant === 0 ? '⏰ Expiré' : formatTemps(tempsRestant)}
          </span>
        </div>
        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 3, width: `${pctTemps}%`, background: couleurTimer, transition: 'width 1s linear, background 0.3s' }} />
        </div>
      </div>

      {error && <AlerteErreur message={error} />}

      <form onSubmit={submit}>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }} onPaste={handlePaste}>
          {code.map((c, i) => (
            <input key={i} ref={el => inputsRef.current[i] = el}
              type="text" inputMode="numeric" maxLength={1} value={c}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              style={{
                width: 48, height: 56, textAlign: 'center',
                fontSize: 22, fontWeight: 700, fontFamily: 'DM Mono, monospace',
                border: `2px solid ${c ? 'var(--primary-light)' : 'var(--border)'}`,
                borderRadius: 10, outline: 'none',
                background: c ? '#eff6ff' : 'white', transition: 'all 0.15s',
              }} />
          ))}
        </div>
        <button type="submit" className="btn-primary-custom"
          disabled={loading || tempsRestant === 0 || code.join('').length < 6}>
          {loading ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-check2-circle me-2" />}
          Vérifier le code
        </button>
      </form>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
        <button onClick={onRetour} style={{ border: 'none', background: 'none', fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
          ← Changer d'email
        </button>
        <button onClick={renvoyer} disabled={loading || tempsRestant > 150}
          style={{ border: 'none', background: 'none', fontSize: 13, fontWeight: 600, cursor: tempsRestant > 150 ? 'default' : 'pointer', color: tempsRestant > 150 ? 'var(--text-muted)' : 'var(--primary-light)' }}>
          {tempsRestant > 150 ? `Renvoyer dans ${tempsRestant - 150}s` : '🔄 Renvoyer le code'}
        </button>
      </div>
    </>
  );
}

function EtapeFormulaire({ email, verificationId, onSuccess }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', nom_entreprise: '', password: '', password2: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) { setError('Les mots de passe ne correspondent pas.'); return; }
    setError(''); setLoading(true);
    try {
      await inscription({ ...form, email, verification_id: verificationId });
      onSuccess(email, form.password);
    } catch (err) {
      const d = err.response?.data;
      setError(d ? Object.values(d).flat().join(' ') : 'Erreur lors de la création du compte.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
        <h1 className="auth-title">Créer votre compte</h1>
        <p className="auth-subtitle">Email vérifié : <strong style={{ color: '#10b981' }}>{email} ✓</strong></p>
      </div>
      {error && <AlerteErreur message={error} />}
      <form className="auth-form" onSubmit={submit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="mb-3">
            <label className="form-label">Prénom</label>
            <input type="text" name="first_name" className="form-control" placeholder="Prénom" value={form.first_name} onChange={handle} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Nom</label>
            <input type="text" name="last_name" className="form-control" placeholder="Nom" value={form.last_name} onChange={handle} />
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label">Nom de l'entreprise</label>
          <input type="text" name="nom_entreprise" className="form-control" placeholder="Votre entreprise" value={form.nom_entreprise} onChange={handle} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <label className="form-label">Mot de passe</label>
            <input type="password" name="password" className="form-control" placeholder="••••••••" value={form.password} onChange={handle} required minLength={6} />
          </div>
          <div>
            <label className="form-label">Confirmer</label>
            <input type="password" name="password2" className="form-control" placeholder="••••••••" value={form.password2} onChange={handle} required />
          </div>
        </div>
        <button type="submit" className="btn-primary-custom" disabled={loading}>
          {loading ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-person-check me-2" />}
          Créer mon compte
        </button>
      </form>
    </>
  );
}

export default function Inscription() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [etape, setEtape] = useState(1);
  const [email, setEmail] = useState('');
  const [verificationId, setVerificationId] = useState(null);

  const handleCompteCreé = async (emailUser, password) => {
    try {
      const { data: tokens } = await connexion({ email: emailUser, password });
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      const { data: profil } = await getProfil();
      login(tokens, profil);
      navigate('/');
    } catch { navigate('/connexion'); }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: etape === 2 ? 400 : 440 }}>
        <div className="auth-logo">GF</div>
        <Etapes etape={etape} />
        {etape === 1 && <EtapeEmail onSuccess={(e) => { setEmail(e); setEtape(2); }} />}
        {etape === 2 && <EtapeCode email={email} onSuccess={(e, id) => { setVerificationId(id); setEtape(3); }} onRetour={() => setEtape(1)} />}
        {etape === 3 && <EtapeFormulaire email={email} verificationId={verificationId} onSuccess={handleCompteCreé} />}
      </div>
    </div>
  );
}
