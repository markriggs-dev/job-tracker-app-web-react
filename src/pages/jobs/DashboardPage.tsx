import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { jobService } from '../../services/jobService';
import type { JobRequisitionListItem } from '../../types/index';
import { JobStatus } from '../../types/index';
import styles from './DashboardPage.module.css';

const statusColors: Record<string, string> = {
  Discovered: '#6c757d',
  Applied: '#2E75B6',
  InProgress: '#7030A0',
  WaitingOnResponse: '#C55A11',
  InterviewScheduled: '#375623',
  OfferReceived: '#1F3864',
  Closed: '#c00000',
  Withdrawn: '#999'
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth0();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | ''>('');

  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['jobs', keyword, statusFilter],
    queryFn: () => keyword || statusFilter
      ? jobService.search(keyword || undefined, statusFilter as JobStatus || undefined)
      : jobService.getAll()
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Job Tracker</h1>
        <div className={styles.headerRight}>
          <button className={styles.navLink} onClick={() => navigate('/resumes')}>Resumes</button>
          <span className={styles.userEmail}>{user?.email}</span>
          <button
            className={styles.logoutButton}
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search by company or role..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
          <select
            className={styles.statusSelect}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as JobStatus | '')}
          >
            <option value="">All Statuses</option>
            {Object.values(JobStatus).map(s => (
              <option key={s} value={s}>{s.replace(/([A-Z])/g, ' $1').trim()}</option>
            ))}
          </select>
        </div>
        <button
          className={styles.addButton}
          onClick={() => navigate('/jobs/new')}
        >
          + Add Job
        </button>
      </div>

      {isLoading && <p className={styles.message}>Loading...</p>}
      {error && <p className={styles.errorMessage}>Failed to load jobs. Please try again.</p>}

      {jobs && jobs.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No job requisitions yet</p>
          <p className={styles.emptySubtitle}>Click "Add Job" to start tracking your first opportunity.</p>
        </div>
      )}

      {jobs && jobs.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeader}>
                <th className={styles.th}>Company</th>
                <th className={styles.th}>Role</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Discovered</th>
                <th className={styles.th}>Submitted</th>
                <th className={styles.th}>Expires</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job: JobRequisitionListItem, index: number) => (
                <tr
                  key={job.id}
                  className={styles.tableRow}
                  style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9' }}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <td className={styles.td}>{job.companyName}</td>
                  <td className={styles.td}>{job.roleTitle}</td>
                  <td className={styles.td}>
                    <span
                      className={styles.statusBadge}
                      style={{ backgroundColor: statusColors[job.status] || '#6c757d' }}
                    >
                      {job.statusDisplay}
                    </span>
                  </td>
                  <td className={styles.td}>{job.dateDiscovered}</td>
                  <td className={styles.td}>{job.dateSubmitted || '—'}</td>
                  <td className={styles.td}>{job.applicationExpiryDate || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
