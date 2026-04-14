import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Accueil from "./pages/Accueil";
import Connexion from './pages/Connexion';
import Inscription from './pages/Inscription';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Dettes from './pages/Dettes';
import Rapports from './pages/Rapports';
import Parametres from './pages/Parametres';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-spinner" style={{ height: '100vh' }}>
      <div className="spinner-border text-primary" style={{ width: 40, height: 40 }} />
    </div>
  );
  return user ? children : <Navigate to="/connexion" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/app" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/connexion" element={<PublicRoute><Connexion /></PublicRoute>} />
          <Route path="/inscription" element={<PublicRoute><Inscription /></PublicRoute>} />
          <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="dettes" element={<Dettes />} />
            <Route path="rapports" element={<Rapports />} />
            <Route path="parametres" element={<Parametres />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
