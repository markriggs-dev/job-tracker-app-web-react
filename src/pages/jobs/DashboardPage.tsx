import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { jobService } from '../../services/jobService';
import type { JobRequisitionListItem } from '../../types/index';
import { JobStatus } from '../../types/index';

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
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Job Tracker</h1>
        <div style={styles.headerRight}>
          <span style={styles.userEmail}>{user?.email}</span>
          <button
            style={styles.logoutButton}
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin + '/login' } })}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.filters}>
          <input
            style={styles.searchInput}
            type="text"
            placeholder="Search by company or role..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
          <select
            style={styles.statusSelect}
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
          style={styles.addButton}
          onClick={() => navigate('/jobs/new')}
        >
          + Add Job
        </button>
      </div>

      {/* Content */}
      {isLoading && <p style={styles.message}>Loading...</p>}
      {error && <p style={styles.errorMessage}>Failed to load jobs. Please try again.</p>}

      {jobs && jobs.length === 0 && (
        <div style={styles.emptyState}>
          <p style={styles.emptyTitle}>No job requisitions yet</p>
          <p style={styles.emptySubtitle}>Click "Add Job" to start tracking your first opportunity.</p>
        </div>
      )}

      {jobs && jobs.length > 0 && (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Company</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Discovered</th>
                <th style={styles.th}>Submitted</th>
                <th style={styles.th}>Expires</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job: JobRequisitionListItem, index: number) => (
                <tr
                  key={job.id}
                  style={{ ...styles.tableRow, backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9' }}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <td style={styles.td}>{job.companyName}</td>
                  <td style={styles.td}>{job.roleTitle}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: statusColors[job.status] || '#6c757d'
                    }}>
                      {job.statusDisplay}
                    </span>
                  </td>
                  <td style={styles.td}>{job.dateDiscovered}</td>
                  <td style={styles.td}>{job.dateSubmitted || '—'}</td>
                  <td style={styles.td}>{job.applicationExpiryDate || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { fontFamily: 'Arial, sans-serif', minHeight: '100vh', backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#1F3864', color: '#fff', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { margin: 0, fontSize: '22px', fontWeight: 'bold' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  userEmail: { fontSize: '14px', color: '#ccc' },
  logoutButton: { backgroundColor: 'transparent', border: '1px solid #ccc', color: '#fff', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', backgroundColor: '#fff', borderBottom: '1px solid #ddd' },
  filters: { display: 'flex', gap: '12px' },
  searchInput: { padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', width: '280px' },
  statusSelect: { padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' },
  addButton: { backgroundColor: '#2E75B6', color: '#fff', border: 'none', borderRadius: '4px', padding: '8px 20px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
  message: { padding: '32px', textAlign: 'center', color: '#666' },
  errorMessage: { padding: '32px', textAlign: 'center', color: '#c00' },
  emptyState: { textAlign: 'center', padding: '80px 32px' },
  emptyTitle: { fontSize: '20px', color: '#333', marginBottom: '8px' },
  emptySubtitle: { fontSize: '14px', color: '#888' },
  tableWrapper: { padding: '24px 32px' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  tableHeader: { backgroundColor: '#1F3864' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tableRow: { cursor: 'pointer', transition: 'background-color 0.1s' },
  td: { padding: '12px 16px', fontSize: '14px', color: '#333', borderBottom: '1px solid #eee' },
  statusBadge: { display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', color: '#fff' }
};

export default DashboardPage;
