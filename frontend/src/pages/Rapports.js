import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { getRapportMensuel } from '../services/api';
import { useAuth } from '../context/AuthContext';

function fmt(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)); }

const MOIS_NOMS = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function Rapports() {
  const { user } = useAuth();
  const today = new Date();
  const [mois, setMois] = useState(today.getMonth() + 1);
  const [annee, setAnnee] = useState(today.getFullYear());
  const [rapport, setRapport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getRapportMensuel(mois, annee)
      .then(r => setRapport(r.data))
      .finally(() => setLoading(false));
  }, [mois, annee]);

  const annees = [today.getFullYear() - 1, today.getFullYear()];

  const dataBarChart = [
    { label: 'Revenus', value: rapport?.total_revenus || 0, color: '#10b981' },
    { label: 'Dépenses', value: rapport?.total_depenses || 0, color: '#ef4444' },
    { label: 'Résultat net', value: rapport?.resultat_net || 0, color: rapport?.resultat_net >= 0 ? '#3b82f6' : '#f59e0b' },
  ];

  const entreesCats = rapport?.par_categorie?.filter(c => c.type === 'entree') || [];
  const sortiesCats = rapport?.par_categorie?.filter(c => c.type === 'sortie') || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Rapports financiers</div>
          <div className="page-subtitle">{MOIS_NOMS[mois]} {annee}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select className="gf-select" style={{ width: 'auto' }} value={mois} onChange={e => setMois(+e.target.value)}>
            {MOIS_NOMS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="gf-select" style={{ width: 'auto' }} value={annee} onChange={e => setAnnee(+e.target.value)}>
            {annees.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loading-spinner"><div className="spinner-border text-primary" /></div>
        ) : (
          <>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Total revenus', value: rapport?.total_revenus, variation: rapport?.variation_revenus, color: '#059669', bg: '#d1fae5', icon: 'bi-arrow-down-circle-fill' },
                { label: 'Total dépenses', value: rapport?.total_depenses, variation: rapport?.variation_depenses, color: '#dc2626', bg: '#fee2e2', icon: 'bi-arrow-up-circle-fill' },
                { label: 'Résultat net', value: rapport?.resultat_net, color: rapport?.resultat_net >= 0 ? '#059669' : '#dc2626', bg: rapport?.resultat_net >= 0 ? '#d1fae5' : '#fee2e2', icon: 'bi-graph-up-arrow' },
                { label: 'Nb transactions', value: rapport?.nb_transactions, isCount: true, color: '#1d4ed8', bg: '#dbeafe', icon: 'bi-receipt' },
              ].map((k, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 12, padding: '20px', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
                  <div style={{ width: 40, height: 40, background: k.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <i className={`bi ${k.icon}`} style={{ color: k.color, fontSize: 18 }} />
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: k.color, fontFamily: 'DM Mono, monospace' }}>
                    {k.isCount ? k.value : `${fmt(k.value)}`}
                  </div>
                  {!k.isCount && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>FCFA</div>}
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
                  {k.variation !== undefined && (
                    <div style={{
                      marginTop: 8, fontSize: 12, fontWeight: 600,
                      color: k.variation >= 0 ? '#059669' : '#dc2626',
                      display: 'flex', alignItems: 'center', gap: 3
                    }}>
                      <i className={`bi bi-arrow-${k.variation >= 0 ? 'up' : 'down'}-short`} />
                      {Math.abs(k.variation)}% vs mois préc.
                    </div>
                  )}
                  {k.isCount && (
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                      {rapport?.nb_entrees} entrées · {rapport?.nb_sorties} sorties
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Graphiques */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              {/* Bar chart résumé */}
              <div className="gf-card">
                <div className="gf-card-header"><span className="gf-card-title">Résumé financier</span></div>
                <div className="gf-card-body">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={dataBarChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                        tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v) => [`${fmt(v)} FCFA`]} contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                      <Bar dataKey="value" radius={[6,6,0,0]}>
                        {dataBarChart.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie chart dépenses */}
              <div className="gf-card">
                <div className="gf-card-header"><span className="gf-card-title">Répartition des dépenses</span></div>
                <div className="gf-card-body">
                  {sortiesCats.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={sortiesCats} dataKey="total" nameKey="categorie"
                          cx="50%" cy="50%" innerRadius={50} outerRadius={80} label={({ categorie, percent }) => `${categorie} ${(percent*100).toFixed(0)}%`}
                          labelLine={false}>
                          {sortiesCats.map((e, i) => <Cell key={i} fill={e.couleur || `hsl(${i*60},60%,55%)`} />)}
                        </Pie>
                        <Tooltip formatter={(v) => [`${fmt(v)} FCFA`]} contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-state" style={{ padding: 40 }}><i className="bi bi-pie-chart" /><p>Aucune dépense ce mois</p></div>
                  )}
                </div>
              </div>
            </div>

            {/* Détails par catégorie */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              {[
                { title: '📈 Revenus par catégorie', cats: entreesCats, color: '#059669' },
                { title: '📉 Dépenses par catégorie', cats: sortiesCats, color: '#dc2626' },
              ].map(({ title, cats, color }, gi) => (
                <div key={gi} className="gf-card">
                  <div className="gf-card-header"><span className="gf-card-title">{title}</span></div>
                  <div className="gf-card-body">
                    {cats.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20, fontSize: 13 }}>Aucune donnée</div>
                    ) : (
                      cats.map((c, i) => {
                        const total = cats.reduce((s, x) => s + x.total, 0);
                        const pct = total ? (c.total / total * 100) : 0;
                        return (
                          <div key={i} style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 10, height: 10, borderRadius: 2, background: c.couleur || color, display: 'inline-block' }} />
                                {c.categorie}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'DM Mono, monospace' }}>
                                {fmt(c.total)} FCFA
                              </span>
                            </div>
                            <div className="progress-gf">
                              <div className="progress-gf-bar" style={{ width: `${pct}%`, background: c.couleur || color }} />
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{pct.toFixed(1)}% · {c.nb} transaction(s)</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Recommandations */}
            <div className="gf-card">
              <div className="gf-card-header">
                <span className="gf-card-title">Recommandations IA</span>
                <span style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>IA</span>
              </div>
              <div className="gf-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                {rapport?.recommandations?.length > 0
                  ? rapport.recommandations.map((r, i) => (
                    <div key={i} style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, fontSize: 13, borderLeft: '3px solid var(--primary-light)', lineHeight: 1.6 }}>{r}</div>
                  ))
                  : <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Aucune recommandation pour ce mois.</p>
                }
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
