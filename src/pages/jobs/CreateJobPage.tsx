import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { jobService } from '../../services/jobService';
import styles from './CreateJobPage.module.css';

const CreateJobPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    companyName: '',
    roleTitle: '',
    sourceUrl: '',
    companyCareerPortalUrl: '',
    dateDiscovered: new Date().toISOString().split('T')[0],
    applicationExpiryDate: ''
  });

  const [error, setError] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorEmpty, setEditorEmpty] = useState(true);

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

  const mutation = useMutation({
    mutationFn: jobService.create,
    onSuccess: () => {
      // Navigate to dashboard — SignalR jobCreated event will trigger list refresh
      navigate('/');
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
    const jobDescription = editorRef.current?.innerHTML?.trim() || undefined;
    mutation.mutate({
      ...form,
      sourceUrl: form.sourceUrl || undefined,
      companyCareerPortalUrl: form.companyCareerPortalUrl || undefined,
      jobDescription,
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
            <label className={styles.label}>Found On URL</label>
            <input className={styles.input} name="sourceUrl" value={form.sourceUrl} onChange={handleChange} placeholder="Where you found the posting" />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Apply At URL</label>
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
              <span className={styles.editorPlaceholder} onClick={() => editorRef.current?.focus()}>
                Paste the full job description here — formatting, bullets, and structure will be preserved.
              </span>
            )}
          </div>
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
