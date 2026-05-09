import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import styles from './LoginPage.module.css';

const FEATURES = [
  'Track every opportunity from discovery to offer',
  'Log contacts, interviews, and interactions',
  'Attach tailored resumes to each application',
];

const LoginPage = () => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingMark}>JT</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Left brand panel */}
      <div className={styles.brand}>
        <div className={styles.brandInner}>
          <div className={styles.logo}>
            <div className={styles.logoMark}>JT</div>
            <span className={styles.logoName}>Job Tracker</span>
          </div>
          <h1 className={styles.headline}>
            Manage your job search<br />like a professional.
          </h1>
          <p className={styles.subheadline}>
            One organized workspace for your entire pipeline — from first discovery to signed offer.
          </p>
          <ul className={styles.features}>
            {FEATURES.map(f => (
              <li key={f} className={styles.featureItem}>
                <CheckCircle2 size={16} className={styles.featureIcon} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right form panel */}
      <div className={styles.form}>
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Welcome back</h2>
          <p className={styles.formSubtitle}>Sign in to access your job pipeline.</p>

          <button className={styles.signInBtn} onClick={() => loginWithRedirect()}>
            Sign In
          </button>

          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>demo access</span>
            <span className={styles.dividerLine} />
          </div>

          <div className={styles.demoBox}>
            <p className={styles.demoLabel}>Try it without an account</p>
            <div className={styles.demoCredentials}>
              <div className={styles.demoRow}>
                <span className={styles.demoKey}>Email</span>
                <code className={styles.demoValue}>demo@job-tracker-app.com</code>
              </div>
              <div className={styles.demoRow}>
                <span className={styles.demoKey}>Password</span>
                <code className={styles.demoValue}>Demo!2026</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
