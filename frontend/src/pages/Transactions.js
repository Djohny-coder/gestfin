import React, { useEffect, useState, useCallback } from 'react';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, getCategories } from '../services/api';

function fmt(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)); }

function ModalTransaction({ initial, categories, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    type_transaction: 'entree', montant: '', date: new Date().toISOString().split('T')[0],
    categorie: '', description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const payload = { ...form, categorie: form.categorie || null };
      if (initial?.id) { await updateTransaction(initial.id, payload); }
      else { await createTransaction(payload); }
      onSave();
    } catch (err) {
      const d = err.response?.data;
      setError(d ? Object.values(d).flat().join(' ') : 'Erreur lors de l\'enregistrement.');
    } finally { setLoading(false); }
  };

  const filteredCats = categories.filter(c =>
    c.type_categorie === form.type_transaction || c.type_categorie === 'les_deux'
  );

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-title">{initial?.id ? 'Modifier la transaction' : 'Nouvelle transaction'}</div>
        {error && <div style={{ background: '#fee2e2', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{error}</div>}
        <form onSubmit={submit}>
          <div className="gf-form-group">
            <label className="gf-label">Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ v: 'entree', l: '📈 Entrée (revenu)', c: '#d1fae5', tc: '#059669' }, { v: 'sortie', l: '📉 Sortie (dépense)', c: '#fee2e2', tc: '#dc2626' }].map(opt => (
                <label key={opt.v} style={{
                  flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer',
                  border: `2px solid ${form.type_transaction === opt.v ? opt.tc : 'var(--border)'}`,
                  background: form.type_transaction === opt.v ? opt.c : 'white',
                  display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600
                }}>
                  <input type="radio" name="type_transaction" value={opt.v} checked={form.type_transaction === opt.v} onChange={handle} style={{ display: 'none' }} />
                  {opt.l}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="gf-form-group">
              <label className="gf-label">Montant (FCFA)</label>
              <input type="number" name="montant" className="gf-input" placeholder="0" min="1"
                value={form.montant} onChange={handle} required />
            </div>
            <div className="gf-form-group">
              <label className="gf-label">Date</label>
              <input type="date" name="date" className="gf-input" value={form.date} onChange={handle} required />
            </div>
          </div>
          <div className="gf-form-group">
            <label className="gf-label">Catégorie</label>
            <select name="categorie" className="gf-select" value={form.categorie || ''} onChange={handle}>
              <option value="">Choisir une catégorie</option>
              {filteredCats.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <div className="gf-form-group">
            <label className="gf-label">Description</label>
            <textarea name="description" className="gf-input" rows={2} placeholder="Détails de la transaction..."
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

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState('tous');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | transaction object
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, search };
      if (filtre !== 'tous') params.type = filtre;
      const [tRes, cRes] = await Promise.all([getTransactions(params), getCategories()]);
      setTransactions(tRes.data.results || tRes.data);
      setTotal(tRes.data.count || 0);
      setCategories(cRes.data.results || cRes.data);
    } finally { setLoading(false); }
  }, [filtre, search, page]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette transaction ?')) return;
    await deleteTransaction(id);
    loadData();
  };

  const onSave = () => { setModal(null); loadData(); };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Transactions</div>
          <div className="page-subtitle">{total} transaction(s) au total</div>
        </div>
        <button className="btn-gf-primary" onClick={() => setModal('new')}>
          <i className="bi bi-plus-lg" /> Nouvelle transaction
        </button>
      </div>

      <div className="page-body">
        <div className="gf-card">
          {/* Filtres */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="filter-tabs">
              {[{ k: 'tous', l: 'Toutes' }, { k: 'entree', l: 'Entrées' }, { k: 'sortie', l: 'Sorties' }].map(f => (
                <button key={f.k} className={`filter-tab ${filtre === f.k ? 'active' : ''}`}
                  onClick={() => { setFiltre(f.k); setPage(1); }}>
                  {f.l}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }} />
              <input type="text" className="gf-input" placeholder="Rechercher..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{ paddingLeft: 36 }} />
            </div>
          </div>

          {loading ? (
            <div className="loading-spinner"><div className="spinner-border text-primary" /></div>
          ) : transactions.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-receipt" />
              <p>Aucune transaction trouvée</p>
              <button className="btn-gf-primary" style={{ marginTop: 12 }} onClick={() => setModal('new')}>
                <i className="bi bi-plus-lg" /> Ajouter une transaction
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="gf-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Catégorie</th>
                    <th>Type</th>
                    <th>Montant</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13, whiteSpace: 'nowrap' }}>
                        {new Date(t.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td style={{ fontWeight: 500 }}>{t.description || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                      <td>
                        {t.categorie_nom ? (
                          <span style={{
                            background: (t.categorie_couleur || '#6c757d') + '22',
                            color: t.categorie_couleur || '#6c757d',
                            padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600
                          }}>{t.categorie_nom}</span>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Sans catégorie</span>}
                      </td>
                      <td><span className={`badge-${t.type_transaction}`}>{t.type_transaction === 'entree' ? 'Entrée' : 'Sortie'}</span></td>
                      <td className={t.type_transaction === 'entree' ? 'montant-entree' : 'montant-sortie'}>
                        {t.type_transaction === 'entree' ? '+' : '-'}{fmt(t.montant)} FCFA
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => setModal(t)} style={{ border: 'none', background: 'none', padding: '4px 8px', cursor: 'pointer', borderRadius: 6, color: 'var(--text-muted)' }}
                            title="Modifier">
                            <i className="bi bi-pencil" />
                          </button>
                          <button onClick={() => handleDelete(t.id)} style={{ border: 'none', background: 'none', padding: '4px 8px', cursor: 'pointer', borderRadius: 6, color: '#dc2626' }}
                            title="Supprimer">
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > 20 && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn-gf-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <i className="bi bi-chevron-left" /> Préc.
              </button>
              <span style={{ padding: '8px 16px', fontSize: 13, color: 'var(--text-muted)' }}>Page {page}</span>
              <button className="btn-gf-secondary" disabled={transactions.length < 20} onClick={() => setPage(p => p + 1)}>
                Suiv. <i className="bi bi-chevron-right" />
              </button>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <ModalTransaction
          initial={modal === 'new' ? null : modal}
          categories={categories}
          onSave={onSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
