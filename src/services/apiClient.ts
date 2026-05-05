import axios from 'axios';

type TokenProvider = () => Promise<string>;
let tokenProvider: TokenProvider | null = null;

export const setTokenProvider = (fn: TokenProvider) => {
  tokenProvider = fn;
};

const authInterceptor = async (config: import('axios').InternalAxiosRequestConfig) => {
  if (tokenProvider) {
    const token = await tokenProvider();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

export const contactApiClient = axios.create({
  baseURL: import.meta.env.VITE_CONTACT_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' }
});

export const journalApiClient = axios.create({
  baseURL: import.meta.env.VITE_JOURNAL_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' }
});

export const resumeApiClient = axios.create({
  baseURL: import.meta.env.VITE_RESUME_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' }
});

apiClient.interceptors.request.use(authInterceptor);
contactApiClient.interceptors.request.use(authInterceptor);
journalApiClient.interceptors.request.use(authInterceptor);
resumeApiClient.interceptors.request.use(authInterceptor);

export default apiClient;
