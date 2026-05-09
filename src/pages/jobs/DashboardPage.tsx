import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Send, CalendarCheck, Award, Plus, Search, Inbox } from 'lucide-react';
import { jobService } from '../../services/jobService';
import type { JobRequisitionListItem } from '../../types/index';
import { JobStatus } from '../../types/index';
import styles from './DashboardPage.module.css';

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  Discovered:         { color: '#64748B', bg: '#F1F5F9' },
  Applied:            { color: '#2563EB', bg: '#EFF6FF' },
  InProgress:         { color: '#7C3AED', bg: '#F5F3FF' },
  WaitingOnResponse:  { color: '#D97706', bg: '#FFFBEB' },
  InterviewScheduled: { color: '#059669', bg: '#ECFDF5' },
  OfferReceived:      { color: '#0D9488', bg: '#F0FDFA' },
  Closed:             { color: '#DC2626', bg: '#FEF2F2' },
  Withdrawn:          { color: '#64748B', bg: '#F1F5F9' },
};

const SUBMITTED_STATUSES = new Set<JobStatus>([
  JobStatus.Applied, JobStatus.InProgress, JobStatus.WaitingOnResponse,
  JobStatus.InterviewScheduled, JobStatus.OfferReceived,
]);

const DashboardPage = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | ''>('');

  const { data: allJobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: jobService.getAll,
  });

  const { data: displayJobs, isLoading, error } = useQuery({
    queryKey: keyword || statusFilter ? ['jobs', 'search', keyword, statusFilter] : ['jobs'],
    queryFn: () => keyword || statusFilter
      ? jobService.search(keyword || undefined, statusFilter as JobStatus || undefined)
      : jobService.getAll(),
  });

  const stats = useMemo(() => ({
    total:      allJobs.length,
    submitted:  allJobs.filter(j => SUBMITTED_STATUSES.has(j.status as JobStatus)).length,
    interviews: allJobs.filter(j => j.status === JobStatus.InterviewScheduled).length,
    offers:     allJobs.filter(j => j.status === JobStatus.OfferReceived).length,
  }), [allJobs]);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Job Pipeline</h1>
          <p className={styles.pageSubtitle}>Track and manage your active opportunities</p>
        </div>
        <button className={styles.addBtn} onClick={() => navigate('/jobs/new')}>
          <Plus size={15} strokeWidth={2.5} />
          Add Job
        </button>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#EFF6FF' }}>
            <Briefcase size={18} color="#2563EB" />
          </div>
          <div>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total Opportunities</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#F5F3FF' }}>
            <Send size={18} color="#7C3AED" />
          </div>
          <div>
            <div className={styles.statValue}>{stats.submitted}</div>
            <div className={styles.statLabel}>Applications Submitted</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#ECFDF5' }}>
            <CalendarCheck size={18} color="#059669" />
          </div>
          <div>
            <div className={styles.statValue}>{stats.interviews}</div>
            <div className={styles.statLabel}>Interviews Scheduled</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#F0FDFA' }}>
            <Award size={18} color="#0D9488" />
          </div>
          <div>
            <div className={styles.statValue}>{stats.offers}</div>
            <div className={styles.statLabel}>Offers Received</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search by company or role…"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
        </div>
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

      {isLoading && <div className={styles.state}>Loading…</div>}
      {error     && <div className={styles.stateError}>Failed to load jobs. Please try again.</div>}

      {!isLoading && !error && displayJobs?.length === 0 && (
        <div className={styles.empty}>
          <Inbox size={40} color="#CBD5E1" strokeWidth={1.5} />
          <p className={styles.emptyTitle}>
            {keyword || statusFilter ? 'No jobs match your filters' : 'No job requisitions yet'}
          </p>
          <p className={styles.emptySubtitle}>
            {keyword || statusFilter
              ? 'Try adjusting your search or status filter.'
              : 'Click "Add Job" to start tracking your first opportunity.'}
          </p>
        </div>
      )}

      {!isLoading && !error && displayJobs && displayJobs.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Company</th>
                <th className={styles.th}>Role</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Discovered</th>
                <th className={styles.th}>Submitted</th>
                <th className={styles.th}>Expires</th>
              </tr>
            </thead>
            <tbody>
              {displayJobs.map((job: JobRequisitionListItem) => {
                const s = STATUS_STYLE[job.status] ?? STATUS_STYLE.Discovered;
                return (
                  <tr key={job.id} className={styles.row} onClick={() => navigate(`/jobs/${job.id}`)}>
                    <td className={`${styles.td} ${styles.tdBold}`}>{job.companyName}</td>
                    <td className={styles.td}>{job.roleTitle}</td>
                    <td className={styles.td}>
                      <span className={styles.badge} style={{ color: s.color, background: s.bg }}>
                        {job.statusDisplay}
                      </span>
                    </td>
                    <td className={styles.td}>{job.dateDiscovered}</td>
                    <td className={styles.td}>{job.dateSubmitted || '—'}</td>
                    <td className={styles.td}>{job.applicationExpiryDate || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
