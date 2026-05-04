import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const contactApiClient = axios.create({
  baseURL: import.meta.env.VITE_CONTACT_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' }
});

export const journalApiClient = axios.create({
  baseURL: import.meta.env.VITE_JOURNAL_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Token will be injected by the useApi hook
export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    contactApiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    journalApiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
    delete contactApiClient.defaults.headers.common['Authorization'];
    delete journalApiClient.defaults.headers.common['Authorization'];
  }
};

export default apiClient;
