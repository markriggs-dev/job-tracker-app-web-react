import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService } from '../../services/jobService';
import type { CreateJobRequisitionRequest } from '../../types/index';

const CreateJobPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<CreateJobRequisitionRequest>({
    companyName: '',
    roleTitle: '',
    sourceUrl: '',
    companyCareerPortalUrl: '',
    jobDescription: '',
    dateDiscovered: new Date().toISOString().split('T')[0],
    applicationExpiryDate: ''
  });

  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: jobService.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      navigate(`/jobs/${data.id}`);
    },
    onError: () => {
      setError('Failed to create job requisition. Please try again.');
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = () => {
    if (!form.companyName.trim()) { setError('Company name is required.'); return; }
    if (!form.roleTitle.trim()) { setError('Role title is required.'); return; }
    if (!form.dateDiscovered) { setError('Date discovered is required.'); return; }
    setError('');
    mutation.mutate({
      ...form,
      sourceUrl: form.sourceUrl || undefined,
      companyCareerPortalUrl: form.companyCareerPortalUrl || undefined,
      jobDescription: form.jobDescription || undefined,
      applicationExpiryDate: form.applicationExpiryDate || undefined
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate('/')}>← Back</button>
        <h1 style={styles.title}>Add Job Requisition</h1>
      </div>

      <div style={styles.card}>
        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Company Name *</label>
            <input style={styles.input} name="companyName" value={form.companyName} onChange={handleChange} placeholder="e.g. World Wide Technology" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Role Title *</label>
            <input style={styles.input} name="roleTitle" value={form.roleTitle} onChange={handleChange} placeholder="e.g. Senior Engineering Manager" />
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Source URL</label>
            <input style={styles.input} name="sourceUrl" value={form.sourceUrl} onChange={handleChange} placeholder="Where you found the posting" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Company Career Portal URL</label>
            <input style={styles.input} name="companyCareerPortalUrl" value={form.companyCareerPortalUrl} onChange={handleChange} placeholder="Direct link on company site" />
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Date Discovered *</label>
            <input style={styles.input} type="date" name="dateDiscovered" value={form.dateDiscovered} onChange={handleChange} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Application Expiry Date</label>
            <input style={styles.input} type="date" name="applicationExpiryDate" value={form.applicationExpiryDate} onChange={handleChange} />
          </div>
        </div>

        <div style={styles.fieldFull}>
          <label style={styles.label}>Job Description</label>
          <textarea
            style={styles.textarea}
            name="jobDescription"
            value={form.jobDescription}
            onChange={handleChange}
            placeholder="Paste the full job description here for reference..."
            rows={10}
          />
        </div>

        <div style={styles.actions}>
          <button style={styles.cancelButton} onClick={() => navigate('/')}>Cancel</button>
          <button
            style={styles.saveButton}
            onClick={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving...' : 'Save Job'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { fontFamily: 'Arial, sans-serif', minHeight: '100vh', backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#1F3864', color: '#fff', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '20px' },
  backButton: { backgroundColor: 'transparent', border: '1px solid #ccc', color: '#fff', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
  title: { margin: 0, fontSize: '20px', fontWeight: 'bold' },
  card: { margin: '32px auto', maxWidth: '900px', backgroundColor: '#fff', borderRadius: '8px', padding: '32px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  error: { color: '#c00', fontSize: '14px', marginBottom: '16px', padding: '10px', backgroundColor: '#fff0f0', borderRadius: '4px' },
  row: { display: 'flex', gap: '24px', marginBottom: '20px' },
  field: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  fieldFull: { marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: 'bold', color: '#444' },
  input: { padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' },
  textarea: { padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', resize: 'vertical', fontFamily: 'Arial, sans-serif' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' },
  cancelButton: { backgroundColor: '#fff', border: '1px solid #ccc', color: '#333', padding: '8px 24px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  saveButton: { backgroundColor: '#2E75B6', color: '#fff', border: 'none', padding: '8px 24px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }
};

export default CreateJobPage;
