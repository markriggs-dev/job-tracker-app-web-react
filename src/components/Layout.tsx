import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, BriefcaseBusiness, LogOut } from 'lucide-react';
import styles from './Layout.module.css';

const NAV = [
  { path: '/',           label: 'Dashboard',  Icon: LayoutDashboard },
  { path: '/resumes',    label: 'Resumes',    Icon: FileText },
  { path: '/experience', label: 'Experience', Icon: BriefcaseBusiness },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth0();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const initials = user?.name
    ? user.name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] ?? '?').toUpperCase();

  const displayName = user?.name ?? user?.email?.split('@')[0] ?? '';

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>JT</div>
          <span className={styles.brandName}>Job Tracker</span>
        </div>

        <nav className={styles.nav}>
          {NAV.map(({ path, label, Icon }) => (
            <button
              key={path}
              className={`${styles.navItem} ${pathname === path ? styles.active : ''}`}
              onClick={() => navigate(path)}
            >
              <Icon size={17} strokeWidth={pathname === path ? 2.5 : 2} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.user}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.userMeta}>
            <span className={styles.userName}>{displayName}</span>
            <span className={styles.userEmail} title={user?.email}>{user?.email}</span>
          </div>
          <button
            className={styles.signOut}
            title="Sign out"
            onClick={() => logout({ logoutParams: { returnTo: `${window.location.origin}${import.meta.env.BASE_URL}` } })}
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  );
};

export default Layout;
