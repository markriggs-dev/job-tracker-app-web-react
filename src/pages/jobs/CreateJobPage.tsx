import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService } from '../../services/jobService';
import type { CreateJobRequisitionRequest } from '../../types/index';
import styles from './CreateJobPage.module.css';

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
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/')}>← Back</button>
        <h1 className={styles.title}>Add Job Requisition</h1>
      </div>

      <div className={styles.card}>
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Company Name *</label>
            <input className={styles.input} name="companyName" value={form.companyName} onChange={handleChange} placeholder="e.g. World Wide Technology" />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Role Title *</label>
            <input className={styles.input} name="roleTitle" value={form.roleTitle} onChange={handleChange} placeholder="e.g. Senior Engineering Manager" />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Source URL</label>
            <input className={styles.input} name="sourceUrl" value={form.sourceUrl} onChange={handleChange} placeholder="Where you found the posting" />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Company Career Portal URL</label>
            <input className={styles.input} name="companyCareerPortalUrl" value={form.companyCareerPortalUrl} onChange={handleChange} placeholder="Direct link on company site" />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Date Discovered *</label>
            <input className={styles.input} type="date" name="dateDiscovered" value={form.dateDiscovered} onChange={handleChange} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Application Expiry Date</label>
            <input className={styles.input} type="date" name="applicationExpiryDate" value={form.applicationExpiryDate} onChange={handleChange} />
          </div>
        </div>

        <div className={styles.fieldFull}>
          <label className={styles.label}>Job Description</label>
          <textarea
            className={styles.textarea}
            name="jobDescription"
            value={form.jobDescription}
            onChange={handleChange}
            placeholder="Paste the full job description here for reference..."
            rows={10}
          />
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={() => navigate('/')}>Cancel</button>
          <button
            className={styles.saveButton}
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

export default CreateJobPage;
