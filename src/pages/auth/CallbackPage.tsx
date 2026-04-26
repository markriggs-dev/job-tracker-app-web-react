import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CallbackPage = () => {
  const { isAuthenticated, isLoading, error } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (error) {
    return (
      <div style={styles.container}>
        <p style={styles.error}>Authentication error: {error.message}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <p style={styles.text}>Signing you in...</p>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontFamily: 'Arial, sans-serif'
  },
  text: {
    fontSize: '16px',
    color: '#555'
  },
  error: {
    fontSize: '16px',
    color: '#c00'
  }
};

export default CallbackPage;
