import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService } from '../../services/jobService';
import { JobStatus } from '../../types';

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

const JobDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobService.getById(id!)
  });

  const statusMutation = useMutation({
    mutationFn: (status: JobStatus) => jobService.updateStatus(id!, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => jobService.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      navigate('/');
    }
  });

  if (isLoading) return <div style={styles.message}>Loading...</div>;
  if (error || !job) return <div style={styles.message}>Job not found.</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate('/')}>← Back</button>
        <div>
          <h1 style={styles.title}>{job.roleTitle}</h1>
          <p style={styles.company}>{job.companyName}</p>
        </div>
        <span style={{ ...styles.statusBadge, backgroundColor: statusColors[job.status] || '#6c757d' }}>
          {job.statusDisplay}
        </span>
      </div>

      <div style={styles.content}>

        {/* Status Update */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Update Status</h2>
          <div style={styles.statusButtons}>
            {Object.values(JobStatus).map(s => (
              <button
                key={s}
                style={{
                  ...styles.statusButton,
                  backgroundColor: job.status === s ? statusColors[s] : '#f0f0f0',
                  color: job.status === s ? '#fff' : '#333'
                }}
                onClick={() => statusMutation.mutate(s)}
                disabled={statusMutation.isPending}
              >
                {s.replace(/([A-Z])/g, ' $1').trim()}
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Details</h2>
          <div style={styles.detailGrid}>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Date Discovered</span>
              <span style={styles.detailValue}>{job.dateDiscovered}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Date Submitted</span>
              <span style={styles.detailValue}>{job.dateSubmitted || '—'}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Expiry Date</span>
              <span style={styles.detailValue}>{job.applicationExpiryDate || '—'}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Source URL</span>
              <span style={styles.detailValue}>
                {job.sourceUrl ? <a href={job.sourceUrl} target="_blank" rel="noreferrer">{job.sourceUrl}</a> : '—'}
              </span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Career Portal URL</span>
              <span style={styles.detailValue}>
                {job.companyCareerPortalUrl ? <a href={job.companyCareerPortalUrl} target="_blank" rel="noreferrer">{job.companyCareerPortalUrl}</a> : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Job Description */}
        {job.jobDescription && (
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Job Description</h2>
            <pre style={styles.jobDescription}>{job.jobDescription}</pre>
          </div>
        )}

        {/* Danger Zone */}
        <div style={{ ...styles.card, borderColor: '#ffcccc' }}>
          <h2 style={{ ...styles.sectionTitle, color: '#c00' }}>Delete Requisition</h2>
          <p style={styles.deleteWarning}>This action cannot be undone. All associated journal entries and contacts will also be removed.</p>
          <button
            style={styles.deleteButton}
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this job requisition?')) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Requisition'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { fontFamily: 'Arial, sans-serif', minHeight: '100vh', backgroundColor: '#f5f5f5' },
  message: { padding: '48px', textAlign: 'center', fontFamily: 'Arial, sans-serif', color: '#666' },
  header: { backgroundColor: '#1F3864', color: '#fff', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '20px' },
  backButton: { backgroundColor: 'transparent', border: '1px solid #ccc', color: '#fff', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' },
  title: { margin: 0, fontSize: '20px', fontWeight: 'bold' },
  company: { margin: '4px 0 0', fontSize: '14px', color: '#ccc' },
  statusBadge: { marginLeft: 'auto', display: 'inline-block', padding: '4px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap' },
  content: { maxWidth: '900px', margin: '32px auto', padding: '0 32px', display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { backgroundColor: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #eee' },
  sectionTitle: { fontSize: '16px', fontWeight: 'bold', color: '#1F3864', marginTop: 0, marginBottom: '16px' },
  statusButtons: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  statusButton: { padding: '6px 14px', borderRadius: '4px', border: '1px solid #ddd', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  detailItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  detailLabel: { fontSize: '12px', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' },
  detailValue: { fontSize: '14px', color: '#333' },
  jobDescription: { fontSize: '13px', color: '#444', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word', backgroundColor: '#f9f9f9', padding: '16px', borderRadius: '4px', margin: 0 },
  deleteWarning: { fontSize: '13px', color: '#666', marginBottom: '16px' },
  deleteButton: { backgroundColor: '#c00000', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }
};

export default JobDetailPage;
