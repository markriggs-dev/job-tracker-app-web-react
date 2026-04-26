import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div style={styles.container}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Job Tracker</h1>
        <p style={styles.subtitle}>Manage your job search in one place</p>

        <button
          style={styles.loginButton}
          onClick={() => loginWithRedirect()}
        >
          Sign In
        </button>

        <div style={styles.demoBox}>
          <p style={styles.demoTitle}>Demo Access</p>
          <p style={styles.demoText}>
            Use account <strong>demo@job-tracker-app.com</strong> with password <strong>Demo!2026</strong> to explore the app without creating an account.
          </p>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: 'Arial, sans-serif'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '48px',
    maxWidth: '420px',
    width: '100%',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1F3864',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '32px'
  },
  loginButton: {
    backgroundColor: '#2E75B6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '12px 48px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%',
    marginBottom: '24px'
  },
  demoBox: {
    backgroundColor: '#f0f4ff',
    borderRadius: '6px',
    padding: '16px',
    textAlign: 'left'
  },
  demoTitle: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#2E75B6',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  demoText: {
    fontSize: '13px',
    color: '#444',
    lineHeight: '1.5',
    margin: 0
  }
};

export default LoginPage;
