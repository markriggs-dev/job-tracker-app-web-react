import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, BriefcaseBusiness, Cpu, MessageSquare, LogOut, Menu, X } from 'lucide-react';
import styles from './Layout.module.css';

const NAV = [
  { path: '/',            label: 'Dashboard',   Icon: LayoutDashboard },
  { path: '/resumes',     label: 'Resumes',     Icon: FileText },
  { path: '/experience',  label: 'Experience',  Icon: BriefcaseBusiness },
  { path: '/ai-profiles', label: 'AI Profiles', Icon: Cpu },
  { path: '/feedback',    label: 'Feedback',    Icon: MessageSquare },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth0();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] ?? '?').toUpperCase();

  const displayName = user?.name ?? user?.email?.split('@')[0] ?? '';

  const handleNav = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: `${window.location.origin}${import.meta.env.BASE_URL}` } });
  };

  return (
    <div className={styles.shell}>

      {/* ── Desktop sidebar ── */}
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
          <button className={styles.signOut} title="Sign out" onClick={handleLogout}>
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>JT</div>
          <span className={styles.brandName}>Job Tracker</span>
        </div>
        <button
          className={styles.hamburger}
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* ── Mobile drawer ── */}
      {drawerOpen && (
        <>
          <div className={styles.drawerOverlay} onClick={() => setDrawerOpen(false)} />
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <div className={styles.brand}>
                <div className={styles.brandMark}>JT</div>
                <span className={styles.brandName}>Job Tracker</span>
              </div>
              <button
                className={styles.drawerClose}
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <nav className={styles.drawerNav}>
              {NAV.map(({ path, label, Icon }) => (
                <button
                  key={path}
                  className={`${styles.drawerNavItem} ${pathname === path ? styles.drawerNavItemActive : ''}`}
                  onClick={() => handleNav(path)}
                >
                  <Icon size={17} strokeWidth={pathname === path ? 2.5 : 2} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            <div className={styles.drawerFooter}>
              <div className={styles.drawerUser}>
                <div className={styles.avatar}>{initials}</div>
                <div className={styles.userMeta}>
                  <span className={styles.userName}>{displayName}</span>
                  <span className={styles.userEmail} title={user?.email}>{user?.email}</span>
                </div>
              </div>
              <button className={styles.drawerLogout} onClick={handleLogout}>
                <LogOut size={15} />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </>
      )}

      <main className={styles.main}>{children}</main>
    </div>
  );
};

export default Layout;
