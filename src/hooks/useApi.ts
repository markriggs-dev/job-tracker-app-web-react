import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { setAuthToken } from '../services/apiClient';

export const useApi = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  useEffect(() => {
    const setToken = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: import.meta.env.VITE_AUTH0_AUDIENCE
            }
          });
          setAuthToken(token);
        } catch (error) {
          console.error('Failed to get access token:', error);
          setAuthToken(null);
        }
      } else {
        setAuthToken(null);
      }
    };

    setToken();
  }, [isAuthenticated, getAccessTokenSilently]);
};
