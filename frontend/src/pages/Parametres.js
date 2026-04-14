import React, { useEffect, useState } from 'react';
import { getCategories, createCategorie, updateCategorie, deleteCategorie, updateProfil } from '../services/api';
import { useAuth } from '../context/AuthContext';

function fmt(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)); }

const TYPE_LABELS = { entree: 'Entrée', sortie: 'Sortie', les_deux: 'Les deux' };
const TYPE_COLORS = { entree: '#059669', sortie: '#dc2626', les_deux: '#6c757d' };

function ModalCategorie({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    nom: '', type_categorie: 'sortie', couleur: '#007bff', budget_mensuel: ''
  });
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    const payload = { ...form, budget_mensuel: form.budget_mensuel || null };
    try {
      if (initial?.id) await updateCategorie(initial.id, payload);
      else await createCategorie(payload);
      onSave();
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 400 }}>
        <div className="modal-title">{initial?.id ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</div>
        <form onSubmit={submit}>
          <div className="gf-form-group">
            <label className="gf-label">Nom</label>
            <input name="nom" className="gf-input" placeholder="Nom de la catégorie" value={form.nom} onChange={handle} required />
          </div>
          <div className="gf-form-group">
            <label className="gf-label">Type</label>
            <select name="type_categorie" className="gf-select" value={form.type_categorie} onChange={handle}>
              <option value="entree">Entrée</option>
              <option value="sortie">Sortie</option>
              <option value="les_deux">Les deux</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="gf-form-group">
              <label className="gf-label">Couleur</label>
              <input type="color" name="couleur" className="gf-input" value={form.couleur} onChange={handle}
                style={{ padding: '4px 8px', height: 44, cursor: 'pointer' }} />
            </div>
            <div className="gf-form-group">
              <label className="gf-label">Budget mensuel (FCFA)</label>
              <input type="number" name="budget_mensuel" className="gf-input" placeholder="Optionnel" min="0"
                value={form.budget_mensuel || ''} onChange={handle} />
            </div>
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

export default function Parametres() {
  const { user, updateUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState(null);
  const [profil, setProfil] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    nom_entreprise: user?.nom_entreprise || '',
    devise: user?.devise || 'FCFA',
  });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    getCategories().then(r => setCategories(r.data.results || r.data));
  }, []);

  const loadCategories = () => getCategories().then(r => setCategories(r.data.results || r.data));

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    await deleteCategorie(id); loadCategories();
  };

  const saveProfil = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await updateProfil(profil);
      updateUser(res.data);
      setSavedMsg('Profil enregistré avec succès !');
      setTimeout(() => setSavedMsg(''), 3000);
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Paramètres</div>
          <div className="page-subtitle">Gérez votre profil et vos catégories</div>
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Profil entreprise */}
          <div className="gf-card">
            <div className="gf-card-header">
              <span className="gf-card-title"><i className="bi bi-building me-2" />Profil entreprise</span>
            </div>
            <div className="gf-card-body">
              {savedMsg && (
                <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 8, padding: '10px 14px', color: '#059669', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="bi bi-check-circle-fill" /> {savedMsg}
                </div>
              )}
              <form onSubmit={saveProfil}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="gf-form-group">
                    <label className="gf-label">Prénom</label>
                    <input className="gf-input" placeholder="Prénom" value={profil.first_name}
                      onChange={e => setProfil(p => ({ ...p, first_name: e.target.value }))} />
                  </div>
                  <div className="gf-form-group">
                    <label className="gf-label">Nom</label>
                    <input className="gf-input" placeholder="Nom" value={profil.last_name}
                      onChange={e => setProfil(p => ({ ...p, last_name: e.target.value }))} />
                  </div>
                </div>
                <div className="gf-form-group">
                  <label className="gf-label">Nom de l'entreprise</label>
                  <input className="gf-input" placeholder="Mon entreprise" value={profil.nom_entreprise}
                    onChange={e => setProfil(p => ({ ...p, nom_entreprise: e.target.value }))} />
                </div>
                <div className="gf-form-group">
                  <label className="gf-label">Email</label>
                  <input className="gf-input" value={user?.email || ''} disabled style={{ background: '#f8fafc', color: 'var(--text-muted)' }} />
                </div>
                <div className="gf-form-group">
                  <label className="gf-label">Devise</label>
                  <select className="gf-select" value={profil.devise}
                    onChange={e => setProfil(p => ({ ...p, devise: e.target.value }))}>
                    <option value="FCFA">FCFA (XOF)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="USD">Dollar (USD)</option>
                    <option value="GNF">Franc guinéen (GNF)</option>
                    <option value="XAF">Franc CFA CEMAC (XAF)</option>
                  </select>
                </div>
                <button type="submit" className="btn-gf-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-save me-2" />}
                  Enregistrer
                </button>
              </form>
            </div>
          </div>

          {/* Catégories */}
          <div className="gf-card">
            <div className="gf-card-header">
              <span className="gf-card-title"><i className="bi bi-tags me-2" />Catégories</span>
              <button className="btn-gf-primary" onClick={() => setModal('new')} style={{ fontSize: 12, padding: '6px 14px' }}>
                <i className="bi bi-plus-lg" /> Ajouter
              </button>
            </div>
            <div style={{ maxHeight: 460, overflowY: 'auto' }}>
              {categories.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}><i className="bi bi-tags" /><p>Aucune catégorie</p></div>
              ) : (
                <table className="gf-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Type</th>
                      <th>Budget</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(c => (
                      <tr key={c.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 12, height: 12, borderRadius: 3, background: c.couleur, flexShrink: 0 }} />
                            <span style={{ fontWeight: 600, fontSize: 13 }}>{c.nom}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ background: TYPE_COLORS[c.type_categorie] + '22', color: TYPE_COLORS[c.type_categorie], padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                            {TYPE_LABELS[c.type_categorie]}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                          {c.budget_mensuel ? `${fmt(c.budget_mensuel)} F` : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 2 }}>
                            <button onClick={() => setModal(c)} style={{ border: 'none', background: 'none', padding: '4px 6px', cursor: 'pointer', borderRadius: 4, color: 'var(--text-muted)', fontSize: 13 }}>
                              <i className="bi bi-pencil" />
                            </button>
                            <button onClick={() => handleDelete(c.id)} style={{ border: 'none', background: 'none', padding: '4px 6px', cursor: 'pointer', borderRadius: 4, color: '#dc2626', fontSize: 13 }}>
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <ModalCategorie
          initial={modal === 'new' ? null : modal}
          onSave={() => { setModal(null); loadCategories(); }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
