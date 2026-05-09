import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import DOMPurify from 'dompurify';
import { jobService } from '../../services/jobService';
import type { UpdateJobRequisitionRequest } from '../../types/index';
import styles from './EditJobPage.module.css';

const EditJobPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobService.getById(id!)
  });

  const [form, setForm] = useState<UpdateJobRequisitionRequest>({
    companyName: '',
    roleTitle: '',
    sourceUrl: '',
    companyCareerPortalUrl: '',
    jobDescription: '',
    dateDiscovered: '',
    applicationExpiryDate: '',
    dateSubmitted: ''
  });

  const [error, setError] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInitialized = useRef(false);
  const [editorEmpty, setEditorEmpty] = useState(true);

  useEffect(() => {
    if (job) {
      setForm({
        companyName: job.companyName,
        roleTitle: job.roleTitle,
        sourceUrl: job.sourceUrl || '',
        companyCareerPortalUrl: job.companyCareerPortalUrl || '',
        jobDescription: '',
        dateDiscovered: job.dateDiscovered,
        applicationExpiryDate: job.applicationExpiryDate || '',
        dateSubmitted: job.dateSubmitted || ''
      });
    }
  }, [job]);

  useEffect(() => {
    if (job && editorRef.current && !editorInitialized.current) {
      const sanitized = DOMPurify.sanitize(job.jobDescription || '');
      editorRef.current.innerHTML = sanitized;
      setEditorEmpty(!sanitized);
      editorInitialized.current = true;
    }
  }, [job]);

  const mutation = useMutation({
    mutationFn: (data: UpdateJobRequisitionRequest) => jobService.update(id!, data),
    onSuccess: () => navigate(`/jobs/${id}`),
    onError: () => setError('Failed to update job requisition. Please try again.'),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDescriptionPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    const sanitized = html
      ? DOMPurify.sanitize(html, {
          ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'a', 'div', 'span'],
          ALLOWED_ATTR: ['href', 'target'],
        })
      : text.replace(/\n/g, '<br>');
    document.execCommand('insertHTML', false, sanitized);
    setEditorEmpty(false);
  };

  const handleDescriptionInput = () => {
    setEditorEmpty(!editorRef.current?.textContent?.trim());
  };

  const handleSubmit = () => {
    if (!form.companyName.trim()) { setError('Company name is required.'); return; }
    if (!form.roleTitle.trim())   { setError('Role title is required.');   return; }
    if (!form.dateDiscovered)     { setError('Date discovered is required.'); return; }
    setError('');
    const jobDescription = editorRef.current?.innerHTML?.trim() || undefined;
    mutation.mutate({
      ...form,
      sourceUrl: form.sourceUrl || undefined,
      companyCareerPortalUrl: form.companyCareerPortalUrl || undefined,
      jobDescription,
      applicationExpiryDate: form.applicationExpiryDate || undefined,
      dateSubmitted: form.dateSubmitted || undefined,
    });
  };

  if (isLoading) return <div className={styles.state}>Loading…</div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate(`/jobs/${id}`)}>
          <ArrowLeft size={14} /> Back
        </button>
        <h1 className={styles.pageTitle}>Edit Job Requisition</h1>
      </div>

      <div className={styles.card}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.section}>
          <p className={styles.sectionTitle}>Position Details</p>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Company Name<span className={styles.required}>*</span></label>
              <input className={styles.input} name="companyName" value={form.companyName} onChange={handleChange} placeholder="e.g. Acme Corporation" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Role Title<span className={styles.required}>*</span></label>
              <input className={styles.input} name="roleTitle" value={form.roleTitle} onChange={handleChange} placeholder="e.g. Senior Software Engineer" />
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Found On URL</label>
              <input className={styles.input} name="sourceUrl" value={form.sourceUrl} onChange={handleChange} placeholder="Where you found the posting" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Apply At URL</label>
              <input className={styles.input} name="companyCareerPortalUrl" value={form.companyCareerPortalUrl} onChange={handleChange} placeholder="Direct link on company site" />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionTitle}>Timeline</p>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Date Discovered<span className={styles.required}>*</span></label>
              <input className={styles.input} type="date" name="dateDiscovered" value={form.dateDiscovered} onChange={handleChange} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Date Submitted</label>
              <input className={styles.input} type="date" name="dateSubmitted" value={form.dateSubmitted} onChange={handleChange} />
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Application Expiry Date</label>
              <input className={styles.input} type="date" name="applicationExpiryDate" value={form.applicationExpiryDate} onChange={handleChange} />
            </div>
            <div className={styles.field} />
          </div>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionTitle}>Job Description</p>
          <div className={styles.fieldFull}>
            <div className={styles.editorWrapper}>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onPaste={handleDescriptionPaste}
                onInput={handleDescriptionInput}
                className={styles.editor}
              />
              {editorEmpty && (
                <span className={styles.editorPlaceholder}>
                  Paste the full job description here — formatting, bullets, and structure will be preserved.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={() => navigate(`/jobs/${id}`)}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditJobPage;
