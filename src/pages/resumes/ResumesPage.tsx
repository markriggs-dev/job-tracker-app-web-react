import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileUp, FileText } from 'lucide-react';
import { resumeService } from '../../services/resumeService';
import styles from './ResumesPage.module.css';

const ACCEPTED_TYPES = ['application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const ResumesPage = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const { data: resumes = [], isLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: resumeService.getAll
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => resumeService.upload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      setUploadError('');
    },
    onError: (err: unknown) => {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response: { data: { error?: string } } }).response?.data?.error
        : undefined;
      setUploadError(msg ?? 'Upload failed. Please try again.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => resumeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['jobResume'] });
    }
  });

  const handleFile = (file: File) => {
    setUploadError('');
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError('Only PDF, DOC, and DOCX files are accepted.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must not exceed 10 MB.');
      return;
    }
    uploadMutation.mutate(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDownload = (id: string, fileName: string) => {
    resumeService.downloadFile(id).then(blob => {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(blobUrl);
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Resumes</h1>
        <p className={styles.pageSubtitle}>Manage and link resume versions to your applications</p>
      </div>

      <div className={styles.card}>
        <p className={styles.sectionTitle}>Upload Resume</p>
        <div
          className={`${styles.uploadZone} ${dragging ? styles.uploadZoneDragging : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className={styles.uploadIcon}>
            <FileUp size={20} />
          </div>
          <p className={styles.uploadLabel}>Drag and drop your resume, or click to browse</p>
          <p className={styles.uploadHint}>PDF, DOC, DOCX — max 10 MB</p>
          {uploadMutation.isPending && <p className={styles.uploadingText}>Uploading…</p>}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className={styles.fileInput}
          accept=".pdf,.doc,.docx"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
        />
        {uploadError && <p className={styles.uploadError}>{uploadError}</p>}
      </div>

      <div className={styles.card}>
        <p className={styles.sectionTitle}>Uploaded Resumes</p>
        {isLoading && <p className={styles.loadingText}>Loading…</p>}
        {!isLoading && resumes.length === 0 && (
          <div className={styles.emptyState}>
            <FileText size={36} color="#CBD5E1" strokeWidth={1.5} />
            <p className={styles.emptyTitle}>No resumes yet</p>
            <p className={styles.emptySubtitle}>Upload a resume above to start linking it to your applications.</p>
          </div>
        )}
        {resumes.length > 0 && (
          <div className={styles.resumeList}>
            {resumes.map(r => (
              <div key={r.id} className={styles.resumeRow}>
                <div className={styles.resumeInfo}>
                  <span className={styles.resumeName}>{r.fileName}</span>
                  <span className={styles.resumeMeta}>
                    {r.fileSizeDisplay} · {new Date(r.uploadedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className={styles.resumeActions}>
                  <button className={styles.ghostBtn} onClick={() => handleDownload(r.id, r.fileName)}>
                    Download
                  </button>
                  <button
                    className={styles.ghostDangerBtn}
                    onClick={() => {
                      if (window.confirm(`Delete "${r.fileName}"?`)) {
                        deleteMutation.mutate(r.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumesPage;
