import axios from 'axios';

type TokenProvider = () => Promise<string>;
type LogoutHandler = () => void;

let tokenProvider: TokenProvider | null = null;
let logoutHandler: LogoutHandler | null = null;

export const setTokenProvider = (fn: TokenProvider) => { tokenProvider = fn; };
export const setLogoutHandler = (fn: LogoutHandler) => { logoutHandler = fn; };

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_GATEWAY_URL,
  headers: { 'Content-Type': 'application/json' }
});

apiClient.interceptors.request.use(async (config) => {
  if (tokenProvider) {
    try {
      const token = await tokenProvider();
      config.headers.Authorization = `Bearer ${token}`;
    } catch {
      logoutHandler?.();
      return Promise.reject(new Error('Session expired'));
    }
  }
  return config;
});

// On 401: retry once with a fresh token (uses the refresh token under the hood).
// If the refresh itself fails the session is truly dead — force logout.
apiClient.interceptors.response.use(
  response => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && tokenProvider) {
      original._retry = true;
      try {
        const freshToken = await tokenProvider();
        original.headers.Authorization = `Bearer ${freshToken}`;
        return apiClient(original);
      } catch {
        logoutHandler?.();
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
