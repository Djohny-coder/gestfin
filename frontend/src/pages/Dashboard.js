import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { getDashboard } from '../services/api';
import { useAuth } from '../context/AuthContext';

function fmt(n) {
  if (n === undefined || n === null) return '0';
  return new Intl.NumberFormat('fr-FR').format(Math.round(n));
}

function StatCard({ icon, label, value, devise, variation, type }) {
  const isUp = variation >= 0;
  return (
    <div className={`stat-card ${type}`}>
      <div className="stat-icon"><i className={`bi ${icon}`} /></div>
      <div className="stat-value">{fmt(value)}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{devise}</div>
      <div className="stat-label">{label}</div>
      {variation !== undefined && (
        <div className={`stat-badge ${isUp ? 'up' : 'down'}`}>
          <i className={`bi bi-arrow-${isUp ? 'up' : 'down'}-short`} />
          {Math.abs(variation)}% vs mois préc.
        </div>
      )}
    </div>
  );
}

const COLORS = ['#1a3a5c', '#2563a8', '#10b981', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Tableau de bord</div></div>
      </div>
      <div className="page-body">
        <div className="loading-spinner"><div className="spinner-border text-primary" /></div>
      </div>
    </div>
  );

  const today = new Date();
  const moisNom = today.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Tableau de bord</div>
          <div className="page-subtitle">
            Bonjour {user?.first_name || ''} — {moisNom}
          </div>
        </div>
        <Link to="/app/transactions" className="btn-gf-primary">
          <i className="bi bi-plus-lg" /> Nouvelle transaction
        </Link>
      </div>

      <div className="page-body">
        {/* Alertes */}
        {data?.alertes?.length > 0 && data.alertes.map((a, i) => (
          <div key={i} className="alerte-banner">
            <i className="bi bi-exclamation-triangle-fill" style={{ marginTop: 1 }} />
            <span>Alerte : budget <strong>{a.categorie}</strong> atteint à <strong>{a.pourcentage}%</strong> ce mois-ci</span>
          </div>
        ))}

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard icon="bi-wallet2" label="Solde actuel" value={data?.solde} devise="FCFA" type="primary" />
          <StatCard icon="bi-arrow-down-circle" label="Revenus (mois)" value={data?.revenus_mois} devise="FCFA"
            variation={data?.variation_revenus} type="success" />
          <StatCard icon="bi-arrow-up-circle" label="Dépenses (mois)" value={data?.depenses_mois} devise="FCFA"
            variation={data?.variation_depenses} type="danger" />
          <div className="stat-card warning">
            <div className="stat-icon"><i className="bi bi-credit-card-2-front" /></div>
            <div className="stat-value">{fmt(data?.total_dettes)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>FCFA</div>
            <div className="stat-label">Dettes en cours</div>
            {data?.nb_echeances > 0 && (
              <div className="stat-badge down">
                <i className="bi bi-clock" /> {data.nb_echeances} échéance(s) proche(s)
              </div>
            )}
          </div>
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Bar chart */}
          <div className="gf-card">
            <div className="gf-card-header">
              <span className="gf-card-title">Revenus vs Dépenses — 6 mois</span>
            </div>
            <div className="gf-card-body" style={{ padding: '20px 20px 8px' }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.graphique || []} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                    tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [`${fmt(v)} FCFA`]} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                  <Bar dataKey="revenus" fill="#10b981" radius={[4,4,0,0]} name="Revenus" />
                  <Bar dataKey="depenses" fill="#ef4444" radius={[4,4,0,0]} name="Dépenses" />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie chart */}
          <div className="gf-card">
            <div className="gf-card-header">
              <span className="gf-card-title">Répartition dépenses</span>
            </div>
            <div className="gf-card-body">
              {data?.repartition_depenses?.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={data.repartition_depenses} dataKey="total" nameKey="categorie"
                        cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
                        {data.repartition_depenses.map((e, i) => (
                          <Cell key={i} fill={e.couleur || COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`${fmt(v)} FCFA`]} contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: 8 }}>
                    {data.repartition_depenses.map((e, i) => {
                      const total = data.repartition_depenses.reduce((s, x) => s + x.total, 0);
                      const pct = total ? Math.round(e.total / total * 100) : 0;
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: e.couleur || COLORS[i % COLORS.length], flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: 12, color: 'var(--text-main)' }}>{e.categorie}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="empty-state" style={{ padding: 24 }}>
                  <i className="bi bi-pie-chart" style={{ fontSize: 32 }} />
                  <p style={{ fontSize: 13 }}>Aucune dépense ce mois</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          {/* Dernières transactions */}
          <div className="gf-card">
            <div className="gf-card-header">
              <span className="gf-card-title">Dernières transactions</span>
              <Link to="/app/transactions" style={{ fontSize: 13, color: 'var(--primary-light)', fontWeight: 600, textDecoration: 'none' }}>
                Voir tout <i className="bi bi-arrow-right" />
              </Link>
            </div>
            {data?.dernieres_transactions?.length > 0 ? (
              <table className="gf-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Catégorie</th>
                    <th>Montant</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {data.dernieres_transactions.map(t => (
                    <tr key={t.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        {new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                      </td>
                      <td style={{ fontWeight: 500 }}>{t.description || '—'}</td>
                      <td>
                        <span style={{
                          background: t.categorie_couleur + '22',
                          color: t.categorie_couleur,
                          padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 600
                        }}>
                          {t.categorie_nom || 'Sans cat.'}
                        </span>
                      </td>
                      <td className={t.type_transaction === 'entree' ? 'montant-entree' : 'montant-sortie'}>
                        {t.type_transaction === 'entree' ? '+' : '-'}{fmt(t.montant)} FCFA
                      </td>
                      <td><span className={`badge-${t.type_transaction}`}>{t.type_transaction === 'entree' ? 'Entrée' : 'Sortie'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state"><i className="bi bi-receipt" /><p>Aucune transaction</p></div>
            )}
          </div>

          {/* Recommandations IA */}
          <div className="gf-card">
            <div className="gf-card-header">
              <span className="gf-card-title">Recommandations Intelligentes</span>
              <span style={{
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                color: 'white', fontSize: 10, fontWeight: 700,
                padding: '2px 8px', borderRadius: 20, letterSpacing: '0.05em'
              }}>IA</span>
            </div>
            <div className="gf-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data?.recommandations?.length > 0
                ? data.recommandations.map((r, i) => (
                  <div key={i} style={{
                    padding: '10px 14px',
                    background: '#f8fafc',
                    borderRadius: 8,
                    fontSize: 13,
                    borderLeft: '3px solid var(--primary-light)',
                    color: 'var(--text-main)',
                    lineHeight: 1.5,
                  }}>{r}</div>
                ))
                : <div className="empty-state" style={{ padding: 20 }}><p style={{ fontSize: 13 }}>Aucune recommandation</p></div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
