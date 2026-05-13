import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useQueryClient } from '@tanstack/react-query';
import * as signalR from '@microsoft/signalr';

export const useJobsHub = () => {
  const { user, isAuthenticated, getAccessTokenSilently, logout } = useAuth0();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !user?.sub) return;

    const userId = user.sub;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_GATEWAY_URL}/hubs/jobs`, {
        accessTokenFactory: () =>
          getAccessTokenSilently({
            authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE }
          }),
        transport: signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on('jobCreated', () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    });

    connection.on('jobUpdated', (payload: { jobReqId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job', payload.jobReqId] });
    });

    connection.onreconnected(() => {
      connection.invoke('JoinUserGroup', userId).catch(console.error);
    });

    connection.start()
      .then(() => connection.invoke('JoinUserGroup', userId))
      .catch(err => {
        console.error('SignalR connection error:', err);
        const msg: string = err?.message ?? '';
        if (msg.includes('Refresh Token') || msg.includes('login_required') || msg.includes('Login required')) {
          logout({ logoutParams: { returnTo: window.location.origin } });
        }
      });

    return () => {
      connection.stop();
    };
  }, [isAuthenticated, user?.sub, getAccessTokenSilently, logout, queryClient]);
};
