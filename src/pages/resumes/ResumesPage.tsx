import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resumeService } from '../../services/resumeService';
import styles from './ResumesPage.module.css';

const ACCEPTED_TYPES = ['application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const ResumesPage = () => {
  const navigate = useNavigate();
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
    const url = resumeService.getDownloadUrl(id);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    // Inject auth token as query param is not ideal; use fetch + blob instead
    resumeService.downloadFile(id).then(blob => {
      const blobUrl = URL.createObjectURL(blob);
      a.href = blobUrl;
      a.click();
      URL.revokeObjectURL(blobUrl);
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/')}>← Back</button>
        <h1 className={styles.title}>My Resumes</h1>
      </div>

      <div className={styles.content}>
        {/* Upload */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Upload Resume</h2>
          <div
            className={`${styles.uploadZone} ${dragging ? styles.uploadZoneDragging : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={styles.uploadIcon}>📄</div>
            <p className={styles.uploadLabel}>Drag and drop your resume here, or click to browse</p>
            <p className={styles.uploadHint}>PDF, DOC, DOCX — max 10 MB</p>
            {uploadMutation.isPending && <p style={{ color: '#2E75B6', fontSize: '13px', marginTop: '8px' }}>Uploading...</p>}
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

        {/* List */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Uploaded Resumes</h2>
          {isLoading && <p className={styles.emptyText}>Loading...</p>}
          {!isLoading && resumes.length === 0 && (
            <p className={styles.emptyText}>No resumes uploaded yet.</p>
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
                    <button
                      className={styles.downloadButton}
                      onClick={() => handleDownload(r.id, r.fileName)}
                    >
                      Download
                    </button>
                    <button
                      className={styles.deleteButton}
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
    </div>
  );
};

export default ResumesPage;
