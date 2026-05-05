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
  baseURL: import.meta.env.VITE_GATEWAY_URL,
  headers: { 'Content-Type': 'application/json' }
});

apiClient.interceptors.request.use(authInterceptor);

export default apiClient;
