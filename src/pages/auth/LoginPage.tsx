import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';

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
      <div className={styles.container}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Job Tracker</h1>
        <p className={styles.subtitle}>Manage your job search in one place</p>

        <button
          className={styles.loginButton}
          onClick={() => loginWithRedirect()}
        >
          Sign In
        </button>

        <div className={styles.demoBox}>
          <p className={styles.demoTitle}>Demo Access</p>
          <p className={styles.demoText}>
            Use account <strong>demo@job-tracker-app.com</strong> with password <strong>Demo!2026</strong> to explore the app without creating an account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
