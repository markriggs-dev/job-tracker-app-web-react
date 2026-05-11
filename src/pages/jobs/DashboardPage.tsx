import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Send, CalendarCheck, Award, Plus, Search, Inbox, ChevronDown } from 'lucide-react';
import { jobService } from '../../services/jobService';
import type { JobRequisitionListItem } from '../../types/index';
import { JobStatus } from '../../types/index';
import { SUBMITTED_STATUSES } from '../../utils/jobUtils';
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

const ALL_STATUSES = Object.values(JobStatus);

const DashboardPage = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState(() => sessionStorage.getItem('dashboard_keyword') ?? '');
  const [selectedStatuses, setSelectedStatuses] = useState<Set<JobStatus>>(() => {
    try {
      const saved = sessionStorage.getItem('dashboard_statuses');
      return saved ? new Set(JSON.parse(saved) as JobStatus[]) : new Set();
    } catch { return new Set(); }
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => { sessionStorage.setItem('dashboard_keyword', keyword); }, [keyword]);
  useEffect(() => {
    sessionStorage.setItem('dashboard_statuses', JSON.stringify([...selectedStatuses]));
  }, [selectedStatuses]);

  const { data: allJobs = [], isLoading, error } = useQuery({
    queryKey: ['jobs'],
    queryFn: jobService.getAll,
  });

  useEffect(() => {
    if (!filterOpen) return;
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [filterOpen]);

  const stats = useMemo(() => ({
    total:      allJobs.length,
    submitted:  allJobs.filter(j => SUBMITTED_STATUSES.has(j.status as JobStatus)).length,
    interviews: allJobs.filter(j => j.status === JobStatus.InterviewScheduled).length,
    offers:     allJobs.filter(j => j.status === JobStatus.OfferReceived).length,
  }), [allJobs]);

  const displayJobs = useMemo(() => {
    let jobs = allJobs;
    if (keyword.trim()) {
      const k = keyword.toLowerCase();
      jobs = jobs.filter(j =>
        j.companyName.toLowerCase().includes(k) ||
        j.roleTitle.toLowerCase().includes(k)
      );
    }
    if (selectedStatuses.size > 0) {
      jobs = jobs.filter(j => selectedStatuses.has(j.status as JobStatus));
    }
    return jobs;
  }, [allJobs, keyword, selectedStatuses]);

  const toggleStatus = (status: JobStatus) => {
    setSelectedStatuses(prev => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const filterLabel = selectedStatuses.size === 0
    ? 'All Statuses'
    : selectedStatuses.size === 1
    ? [...selectedStatuses][0].replace(/([A-Z])/g, ' $1').trim()
    : `${selectedStatuses.size} selected`;

  const isFiltered = keyword.trim() || selectedStatuses.size > 0;

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

        <div className={styles.filterWrap} ref={filterRef}>
          <button
            className={`${styles.filterBtn} ${selectedStatuses.size > 0 ? styles.filterBtnActive : ''}`}
            onClick={() => setFilterOpen(v => !v)}
          >
            <span>{filterLabel}</span>
            {selectedStatuses.size > 0 && (
              <span className={styles.filterCount}>{selectedStatuses.size}</span>
            )}
            <ChevronDown size={13} className={`${styles.filterChevron} ${filterOpen ? styles.filterChevronOpen : ''}`} />
          </button>

          {filterOpen && (
            <div className={styles.filterMenu}>
              {ALL_STATUSES.map(status => {
                const st = STATUS_STYLE[status];
                const checked = selectedStatuses.has(status);
                return (
                  <label key={status} className={styles.filterItem}>
                    <input
                      type="checkbox"
                      className={styles.filterCheckbox}
                      checked={checked}
                      onChange={() => toggleStatus(status)}
                    />
                    <span
                      className={styles.filterDot}
                      style={{ background: st.color }}
                    />
                    <span className={styles.filterItemLabel}>
                      {status.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </label>
                );
              })}
              {selectedStatuses.size > 0 && (
                <button
                  className={styles.filterClear}
                  onClick={() => { setSelectedStatuses(new Set()); setFilterOpen(false); }}
                >
                  Clear filter
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {isLoading && <div className={styles.state}>Loading…</div>}
      {error     && <div className={styles.stateError}>Failed to load jobs. Please try again.</div>}

      {!isLoading && !error && displayJobs.length === 0 && (
        <div className={styles.empty}>
          <Inbox size={40} color="#CBD5E1" strokeWidth={1.5} />
          <p className={styles.emptyTitle}>
            {isFiltered ? 'No jobs match your filters' : 'No job requisitions yet'}
          </p>
          <p className={styles.emptySubtitle}>
            {isFiltered
              ? 'Try adjusting your search or status filter.'
              : 'Click "Add Job" to start tracking your first opportunity.'}
          </p>
        </div>
      )}

      {!isLoading && !error && displayJobs.length > 0 && (
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
