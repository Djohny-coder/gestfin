import axios from 'axios';

const API = axios.create({ baseURL: "https://gestfin-backend.onrender.com/api/" });

API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('access_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

API.interceptors.response.use(
  res => res,
  async err => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post('/api/auth/refresh/', { refresh });
          localStorage.setItem('access_token', data.access);
          orig.headers.Authorization = `Bearer ${data.access}`;
          return API(orig);
        } catch {
          localStorage.clear();
          window.location.href = '/connexion';
        }
      } else {
        localStorage.clear();
        window.location.href = '/connexion';
      }
    }
    return Promise.reject(err);
  }
);

export default API;

// ── Auth ──
export const connexion = d => API.post('/auth/connexion/', d);
export const inscription = d => API.post('/auth/inscription/', d);
export const getProfil = () => API.get('/auth/profil/');
export const updateProfil = d => API.patch('/auth/profil/', d);
export const envoyerCode = d => API.post('/auth/envoyer-code/', d);
export const verifierCode = d => API.post('/auth/verifier-code/', d);


// ── Dashboard ──
export const getDashboard = () => API.get('/dashboard/');

// ── Transactions ──
export const getTransactions = (params) => API.get('/transactions/', { params });
export const createTransaction = d => API.post('/transactions/', d);
export const updateTransaction = (id, d) => API.patch(`/transactions/${id}/`, d);
export const deleteTransaction = id => API.delete(`/transactions/${id}/`);

// ── Catégories ──
export const getCategories = () => API.get('/categories/');
export const createCategorie = d => API.post('/categories/', d);
export const updateCategorie = (id, d) => API.patch(`/categories/${id}/`, d);
export const deleteCategorie = id => API.delete(`/categories/${id}/`);
export const getUsers = () => API.get('/auth/users/');
export const createUser = (data) => API.post('/auth/users/', data);

// ── Dettes ──
export const getDettes = (params) => API.get('/dettes/', { params });
export const createDette = d => API.post('/dettes/', d);
export const updateDette = (id, d) => API.patch(`/dettes/${id}/`, d);
export const deleteDette = id => API.delete(`/dettes/${id}/`);
export const rembourserDette = (id, montant) => API.post(`/dettes/${id}/rembourser/`, { montant });

// ── Rapports ──
export const getRapportMensuel = (mois, annee) => API.get('/rapports/mensuel/', { params: { mois, annee } });
