import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { setTokenProvider, setLogoutHandler } from '../services/apiClient';

export const useApi = () => {
  const { getAccessTokenSilently, isAuthenticated, logout } = useAuth0();

  useEffect(() => {
    if (isAuthenticated) {
      setTokenProvider(() =>
        getAccessTokenSilently({
          authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE }
        })
      );
      setLogoutHandler(() => {
        logout({ openUrl: false });
        window.location.assign(window.location.origin + import.meta.env.BASE_URL + 'login');
      });
    }
  }, [isAuthenticated, getAccessTokenSilently, logout]);
};
