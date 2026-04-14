import React, { useEffect, useState, useCallback } from 'react';
import { getDettes, createDette, updateDette, deleteDette, rembourserDette } from '../services/api';
import { useAuth } from '../context/AuthContext';

function fmt(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)); }

const STATUT_LABELS = {
  en_cours: 'En cours', proche: 'Proche échéance',
  en_retard: 'En retard', regle: 'Réglé'
};

function ModalDette({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    creancier: '', montant: '', echeance: '',
    montant_rembourse: 0, description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (initial?.id) await updateDette(initial.id, form);
      else await createDette(form);
      onSave();
    } catch (err) {
      const d = err.response?.data;
      setError(d ? Object.values(d).flat().join(' ') : 'Erreur.');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-title">{initial?.id ? 'Modifier la dette' : 'Ajouter une dette'}</div>
        {error && <div style={{ background: '#fee2e2', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{error}</div>}
        <form onSubmit={submit}>
          <div className="gf-form-group">
            <label className="gf-label">Créancier</label>
            <input name="creancier" className="gf-input" placeholder="Nom du créancier" value={form.creancier} onChange={handle} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="gf-form-group">
              <label className="gf-label">Montant total (FCFA)</label>
              <input type="number" name="montant" className="gf-input" placeholder="0" min="1"
                value={form.montant} onChange={handle} required />
            </div>
            <div className="gf-form-group">
              <label className="gf-label">Montant remboursé</label>
              <input type="number" name="montant_rembourse" className="gf-input" placeholder="0" min="0"
                value={form.montant_rembourse} onChange={handle} />
            </div>
          </div>
          <div className="gf-form-group">
            <label className="gf-label">Date d'échéance</label>
            <input type="date" name="echeance" className="gf-input" value={form.echeance} onChange={handle} required />
          </div>
          <div className="gf-form-group">
            <label className="gf-label">Description (optionnel)</label>
            <textarea name="description" className="gf-input" rows={2} placeholder="Notes..."
              value={form.description} onChange={handle} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn-gf-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-gf-primary" disabled={loading}>
              {loading && <span className="spinner-border spinner-border-sm me-2" />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalRembourser({ dette, onSave, onClose }) {
  const [montant, setMontant] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await rembourserDette(dette.id, montant); onSave(); }
    finally { setLoading(false); }
  };

  const restant = dette.montant - dette.montant_rembourse;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 380 }}>
        <div className="modal-title">Rembourser — {dette.creancier}</div>
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: 'var(--text-muted)' }}>Montant total</span>
            <span style={{ fontWeight: 700 }}>{fmt(dette.montant)} FCFA</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: 'var(--text-muted)' }}>Déjà remboursé</span>
            <span style={{ fontWeight: 700, color: '#059669' }}>{fmt(dette.montant_rembourse)} FCFA</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Restant</span>
            <span style={{ fontWeight: 700, color: '#dc2626' }}>{fmt(restant)} FCFA</span>
          </div>
        </div>
        <form onSubmit={submit}>
          <div className="gf-form-group">
            <label className="gf-label">Montant à rembourser (FCFA)</label>
            <input type="number" className="gf-input" placeholder="0" min="1" max={restant}
              value={montant} onChange={e => setMontant(e.target.value)} required />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-gf-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-gf-primary" disabled={loading}>
              {loading && <span className="spinner-border spinner-border-sm me-2" />}
              Confirmer le remboursement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Dettes() {
  const { user } = useAuth();
  const [dettes, setDettes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState('actif');
  const [modal, setModal] = useState(null);
  const [rembModal, setRembModal] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = filtre === 'actif' ? {} : { statut: filtre };
      const res = await getDettes(params);
      let data = res.data.results || res.data;
      if (filtre === 'actif') data = data.filter(d => d.statut !== 'regle');
      setDettes(data);
    } finally { setLoading(false); }
  }, [filtre]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette dette ?')) return;
    await deleteDette(id); loadData();
  };

  const onSave = () => { setModal(null); setRembModal(null); loadData(); };

  const totalDettes = dettes.filter(d => d.statut !== 'regle').reduce((s, d) => s + parseFloat(d.montant_restant || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dettes & Factures</div>
          <div className="page-subtitle">
            {dettes.filter(d => d.statut !== 'regle').length} dette(s) active(s) — {fmt(totalDettes)} FCFA restant
          </div>
        </div>
        <button className="btn-gf-primary" onClick={() => setModal('new')}>
          <i className="bi bi-plus-lg" /> Ajouter une dette
        </button>
      </div>

      <div className="page-body">
        {/* Stats rapides */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { statut: 'en_cours', label: 'En cours', color: '#3b82f6', bg: '#dbeafe', icon: 'bi-hourglass-split' },
            { statut: 'proche', label: 'Proches échéance', color: '#d97706', bg: '#fef3c7', icon: 'bi-exclamation-triangle' },
            { statut: 'en_retard', label: 'En retard', color: '#dc2626', bg: '#fee2e2', icon: 'bi-x-circle' },
          ].map(s => {
            const nb = dettes.filter(d => d.statut === s.statut).length;
            return (
              <div key={s.statut} style={{ background: s.bg, borderRadius: 12, padding: '16px 20px', border: `1px solid ${s.color}33` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className={`bi ${s.icon}`} style={{ color: s.color, fontSize: 20 }} />
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{nb}</div>
                    <div style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="gf-card">
          {/* Filtres */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div className="filter-tabs">
              {[
                { k: 'actif', l: 'Actives' },
                { k: 'en_retard', l: 'En retard' },
                { k: 'proche', l: 'Proches' },
                { k: 'regle', l: 'Réglées' },
              ].map(f => (
                <button key={f.k} className={`filter-tab ${filtre === f.k ? 'active' : ''}`}
                  onClick={() => setFiltre(f.k)}>{f.l}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="loading-spinner"><div className="spinner-border text-primary" /></div>
          ) : dettes.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-credit-card-2-front" />
              <p>Aucune dette dans cette catégorie</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="gf-table">
                <thead>
                  <tr>
                    <th>Créancier</th>
                    <th>Montant total</th>
                    <th>Remboursé</th>
                    <th>Restant</th>
                    <th>Progression</th>
                    <th>Échéance</th>
                    <th>Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {dettes.map(d => {
                    const pct = d.montant > 0 ? Math.round(d.montant_rembourse / d.montant * 100) : 0;
                    return (
                      <tr key={d.id}>
                        <td style={{ fontWeight: 600 }}>{d.creancier}</td>
                        <td className="montant-neutral">{fmt(d.montant)} FCFA</td>
                        <td style={{ color: '#059669', fontWeight: 600, fontFamily: 'DM Mono, monospace' }}>{fmt(d.montant_rembourse)} FCFA</td>
                        <td style={{ color: '#dc2626', fontWeight: 600, fontFamily: 'DM Mono, monospace' }}>{fmt(d.montant_restant)} FCFA</td>
                        <td style={{ minWidth: 120 }}>
                          <div className="progress-gf" style={{ marginBottom: 4 }}>
                            <div className="progress-gf-bar" style={{
                              width: `${pct}%`,
                              background: pct >= 100 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'
                            }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pct}%</span>
                        </td>
                        <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                          {new Date(d.echeance).toLocaleDateString('fr-FR')}
                        </td>
                        <td><span className={`badge-${d.statut}`}>{STATUT_LABELS[d.statut]}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {d.statut !== 'regle' && (
                              <button onClick={() => setRembModal(d)} style={{ border: 'none', background: '#d1fae5', color: '#059669', padding: '4px 8px', cursor: 'pointer', borderRadius: 6, fontSize: 12, fontWeight: 600 }}
                                title="Rembourser">
                                <i className="bi bi-check2" />
                              </button>
                            )}
                            <button onClick={() => setModal(d)} style={{ border: 'none', background: 'none', padding: '4px 8px', cursor: 'pointer', borderRadius: 6, color: 'var(--text-muted)' }}>
                              <i className="bi bi-pencil" />
                            </button>
                            <button onClick={() => handleDelete(d.id)} style={{ border: 'none', background: 'none', padding: '4px 8px', cursor: 'pointer', borderRadius: 6, color: '#dc2626' }}>
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal && <ModalDette initial={modal === 'new' ? null : modal} onSave={onSave} onClose={() => setModal(null)} />}
      {rembModal && <ModalRembourser dette={rembModal} onSave={onSave} onClose={() => setRembModal(null)} />}
    </div>
  );
}
