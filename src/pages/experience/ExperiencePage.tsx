import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileUp, BriefcaseBusiness } from 'lucide-react';
import { experienceService } from '../../services/experienceService';
import styles from './ExperiencePage.module.css';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const ExperiencePage = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [uploadError, setUploadError] = useState('');

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['experience-profiles'],
    queryFn: experienceService.getAll,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ name, file }: { name: string; file: File }) =>
      experienceService.upload(name, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experience-profiles'] });
      setUploadError('');
      setProfileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (err: unknown) => {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response: { data: { error?: string } } }).response?.data?.error
        : undefined;
      setUploadError(msg ?? 'Upload failed. Please try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => experienceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experience-profiles'] });
    },
  });

  const handleFile = (file: File) => {
    setUploadError('');
    if (!profileName.trim()) {
      setUploadError('Please enter a profile name before uploading.');
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError('Only PDF, DOC, DOCX, and TXT files are accepted.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must not exceed 10 MB.');
      return;
    }
    uploadMutation.mutate({ name: profileName.trim(), file });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDownload = (id: string, fileName: string) => {
    experienceService.downloadFile(id).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Experience Profiles</h1>
        <p className={styles.pageSubtitle}>Upload your work experience documents for AI-assisted resume generation</p>
      </div>

      <div className={styles.card}>
        <p className={styles.sectionTitle}>Upload Experience Profile</p>
        <div className={styles.uploadFields}>
          <input
            className={styles.profileNameInput}
            placeholder="Profile name (e.g. LinkedIn Export 2026, 15-Year Focus)"
            value={profileName}
            onChange={e => setProfileName(e.target.value)}
          />
        </div>
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
          <p className={styles.uploadLabel}>Drag and drop your experience document, or click to browse</p>
          <p className={styles.uploadHint}>PDF, DOC, DOCX, TXT — max 10 MB</p>
          {uploadMutation.isPending && <p className={styles.uploadingText}>Uploading…</p>}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className={styles.fileInput}
          accept=".pdf,.doc,.docx,.txt"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />
        {uploadError && <p className={styles.uploadError}>{uploadError}</p>}
      </div>

      <div className={styles.card}>
        <p className={styles.sectionTitle}>Uploaded Profiles</p>
        {isLoading && <p className={styles.loadingText}>Loading…</p>}
        {!isLoading && profiles.length === 0 && (
          <div className={styles.emptyState}>
            <BriefcaseBusiness size={36} color="#CBD5E1" strokeWidth={1.5} />
            <p className={styles.emptyTitle}>No experience profiles yet</p>
            <p className={styles.emptySubtitle}>Upload a LinkedIn export or experience document to use with AI resume generation.</p>
          </div>
        )}
        {profiles.length > 0 && (
          <div className={styles.profileList}>
            {profiles.map(p => (
              <div key={p.id} className={styles.profileRow}>
                <div className={styles.profileInfo}>
                  <span className={styles.profileName}>{p.profileName}</span>
                  <span className={styles.profileMeta}>
                    {p.fileName} · {p.fileSizeDisplay} · {new Date(p.uploadedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className={styles.profileActions}>
                  <button className={styles.ghostBtn} onClick={() => handleDownload(p.id, p.fileName)}>
                    Download
                  </button>
                  <button
                    className={styles.ghostDangerBtn}
                    onClick={() => {
                      if (window.confirm(`Delete "${p.profileName}"?`)) {
                        deleteMutation.mutate(p.id);
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

export default ExperiencePage;
