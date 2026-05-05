import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { setTokenProvider } from '../services/apiClient';

export const useApi = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  useEffect(() => {
    if (isAuthenticated) {
      setTokenProvider(() =>
        getAccessTokenSilently({
          authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE }
        })
      );
    }
  }, [isAuthenticated, getAccessTokenSilently]);
};
