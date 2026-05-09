import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Cpu } from 'lucide-react';
import { aiService } from '../../services/aiService';
import type { CreateAiProfileRequest, UpdateAiProfileRequest } from '../../types/index';
import styles from './AiProfilesPage.module.css';

const emptyForm: CreateAiProfileRequest = { name: '', instructions: '' };

const AiProfilesPage = () => {
  const queryClient = useQueryClient();

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<CreateAiProfileRequest>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateAiProfileRequest>({ name: '', instructions: '' });

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['ai-profiles'],
    queryFn: aiService.getAllProfiles,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAiProfileRequest) => aiService.createProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-profiles'] });
      setShowAdd(false);
      setAddForm(emptyForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAiProfileRequest }) =>
      aiService.updateProfile(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-profiles'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => aiService.deleteProfile(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-profiles'] }),
  });

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>AI Profiles</h1>
        <p className={styles.pageSubtitle}>Define reusable instructions that guide Claude when generating tailored resumes</p>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <p className={styles.sectionTitle}>Your Profiles</p>
          <button className={styles.addBtn} onClick={() => { setShowAdd(v => !v); setAddForm(emptyForm); }}>
            {showAdd ? 'Cancel' : <><Plus size={13} /> New Profile</>}
          </button>
        </div>

        {showAdd && (
          <div className={styles.addForm}>
            <input
              className={styles.input}
              placeholder="Profile name (e.g. Senior Engineering Manager, IC Focus)"
              value={addForm.name}
              onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
            />
            <textarea
              className={styles.textarea}
              placeholder="Instructions for Claude when generating resumes with this profile…&#10;&#10;Example: Emphasize leadership and cross-functional impact. Target Director-level roles. Limit to 2 pages. Use the STAR format for accomplishments."
              rows={8}
              value={addForm.instructions}
              onChange={e => setAddForm(f => ({ ...f, instructions: e.target.value }))}
            />
            <p className={styles.formHint}>
              These instructions are sent directly to Claude as part of the resume generation prompt. Be specific about tone, focus areas, length, and format preferences.
            </p>
            <div className={styles.formActions}>
              <button className={styles.cancelMiniBtn} onClick={() => setShowAdd(false)}>Cancel</button>
              <button
                className={styles.saveMiniBtn}
                disabled={!addForm.name.trim() || !addForm.instructions.trim() || createMutation.isPending}
                onClick={() => createMutation.mutate(addForm)}
              >
                {createMutation.isPending ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          </div>
        )}

        {isLoading && <p className={styles.loadingText}>Loading…</p>}

        {!isLoading && profiles.length === 0 && !showAdd && (
          <div className={styles.emptyState}>
            <Cpu size={36} color="#CBD5E1" strokeWidth={1.5} />
            <p className={styles.emptyTitle}>No AI profiles yet</p>
            <p className={styles.emptySubtitle}>
              Create a profile with custom instructions to guide Claude when tailoring your resume to a job.
            </p>
          </div>
        )}

        {profiles.length > 0 && (
          <div className={styles.profileList}>
            {profiles.map(p => (
              <div key={p.id} className={styles.profileCard}>
                {editingId === p.id ? (
                  <>
                    <input
                      className={styles.input}
                      value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    />
                    <div style={{ height: 8 }} />
                    <textarea
                      className={styles.textarea}
                      rows={8}
                      value={editForm.instructions}
                      onChange={e => setEditForm(f => ({ ...f, instructions: e.target.value }))}
                    />
                    <div style={{ height: 10 }} />
                    <div className={styles.formActions}>
                      <button className={styles.cancelMiniBtn} onClick={() => setEditingId(null)}>Cancel</button>
                      <button
                        className={styles.saveMiniBtn}
                        disabled={!editForm.name.trim() || !editForm.instructions.trim() || updateMutation.isPending}
                        onClick={() => updateMutation.mutate({ id: p.id, data: editForm })}
                      >
                        {updateMutation.isPending ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.profileCardHeader}>
                      <span className={styles.profileName}>{p.name}</span>
                      <span className={styles.profileDate}>
                        {new Date(p.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className={styles.profileInstructions}>{p.instructions}</p>
                    <div className={styles.profileActions}>
                      <button
                        className={styles.ghostBtn}
                        onClick={() => { setEditingId(p.id); setEditForm({ name: p.name, instructions: p.instructions }); }}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.ghostDangerBtn}
                        onClick={() => { if (window.confirm(`Delete "${p.name}"?`)) deleteMutation.mutate(p.id); }}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiProfilesPage;
