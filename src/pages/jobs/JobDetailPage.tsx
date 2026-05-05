import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import { jobService } from "../../services/jobService";
import { contactService } from "../../services/contactService";
import { journalService } from "../../services/journalService";
import { resumeService } from "../../services/resumeService";
import { JobStatus, ContactRoleType, InteractionType } from "../../types";
import type { CreateAndAddContactRequest, UpdateContactRequest, CreateJournalEntryRequest, UpdateJournalEntryRequest } from "../../types";
import styles from "./JobDetailPage.module.css";

const statusColors: Record<string, string> = {
  Discovered: "#6c757d",
  Applied: "#2E75B6",
  InProgress: "#7030A0",
  WaitingOnResponse: "#C55A11",
  InterviewScheduled: "#375623",
  OfferReceived: "#1F3864",
  Closed: "#c00000",
  Withdrawn: "#999",
};

const AGENCY_ROLES = new Set<string>([ContactRoleType.AgencyRecruiter, ContactRoleType.AgencyAccountManager]);
const COMPANY_ROLES = new Set<string>([ContactRoleType.CompanyRecruiter, ContactRoleType.HiringManager]);

function getOrgLabel(roleType: string): string {
  if (AGENCY_ROLES.has(roleType)) return "Agency";
  if (COMPANY_ROLES.has(roleType)) return "Company";
  return "Organization";
}

const emptyContactForm: CreateAndAddContactRequest = {
  name: "",
  email: "",
  linkedInUrl: "",
  agencyName: "",
  roleType: ContactRoleType.CompanyRecruiter,
};

const JobDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactForm, setContactForm] = useState<CreateAndAddContactRequest>(emptyContactForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateContactRequest>({ name: "", email: "", linkedInUrl: "", agencyName: "" });
  const [editRoleType, setEditRoleType] = useState<ContactRoleType>(ContactRoleType.CompanyRecruiter);

  const { data: job, isLoading, error } = useQuery({
    queryKey: ["job", id],
    queryFn: () => jobService.getById(id!),
  });

  const statusMutation = useMutation({
    mutationFn: (status: JobStatus) => jobService.updateStatus(id!, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job", id] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => jobService.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      navigate("/");
    },
  });

  const { data: jobContacts = [] } = useQuery({
    queryKey: ["jobContacts", id],
    queryFn: () => contactService.getContactsForJob(id!),
    enabled: !!id,
  });

  const { data: allContacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => contactService.getAll(),
  });

  const orgSuggestions = Array.from(
    new Set(allContacts.map(c => c.agencyName).filter((n): n is string => !!n))
  );

  const addContactMutation = useMutation({
    mutationFn: (data: CreateAndAddContactRequest) =>
      contactService.createAndAddContactToJob(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobContacts", id] });
      setShowAddContact(false);
      setContactForm(emptyContactForm);
    },
  });

  const removeContactMutation = useMutation({
    mutationFn: (linkId: string) =>
      contactService.removeContactFromJob(id!, linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobContacts", id] });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ contactId, linkId, data, roleType }: { contactId: string; linkId: string; data: UpdateContactRequest; roleType: ContactRoleType }) => {
      await contactService.update(contactId, data);
      await contactService.updateContactRole(id!, linkId, { roleType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobContacts", id] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setEditingId(null);
    },
  });

  const emptyJournalForm: CreateJournalEntryRequest = {
    interactionType: InteractionType.Note,
    notes: "",
    entryDate: new Date().toISOString().split("T")[0],
  };

  const [showAddJournal, setShowAddJournal] = useState(false);
  const [journalForm, setJournalForm] = useState<CreateJournalEntryRequest>(emptyJournalForm);
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [journalEditForm, setJournalEditForm] = useState<UpdateJournalEntryRequest>({
    interactionType: InteractionType.Note,
    notes: "",
    entryDate: new Date().toISOString().split("T")[0],
  });

  const { data: journalEntries = [] } = useQuery({
    queryKey: ["journal", id],
    queryFn: () => journalService.getEntriesForJob(id!),
    enabled: !!id,
  });

  const addJournalMutation = useMutation({
    mutationFn: (data: CreateJournalEntryRequest) =>
      journalService.create(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal", id] });
      setShowAddJournal(false);
      setJournalForm(emptyJournalForm);
    },
  });

  const updateJournalMutation = useMutation({
    mutationFn: ({ entryId, data }: { entryId: string; data: UpdateJournalEntryRequest }) =>
      journalService.update(id!, entryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal", id] });
      setEditingJournalId(null);
    },
  });

  const deleteJournalMutation = useMutation({
    mutationFn: (entryId: string) => journalService.delete(id!, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal", id] });
    },
  });

  const [showResumeSelector, setShowResumeSelector] = useState(false);

  const { data: allResumes = [] } = useQuery({
    queryKey: ["resumes"],
    queryFn: resumeService.getAll,
    enabled: !!id,
  });

  const { data: jobResume = null } = useQuery({
    queryKey: ["jobResume", id],
    queryFn: () => resumeService.getJobResume(id!),
    enabled: !!id,
  });

  const linkResumeMutation = useMutation({
    mutationFn: (resumeId: string) => resumeService.linkToJob(id!, { resumeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobResume", id] });
      setShowResumeSelector(false);
    },
  });

  const unlinkResumeMutation = useMutation({
    mutationFn: () => resumeService.unlinkFromJob(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobResume", id] });
    },
  });

  const handleDownloadResume = (resumeId: string, fileName: string) => {
    resumeService.downloadFile(resumeId).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  if (isLoading) return <div className={styles.message}>Loading...</div>;
  if (error || !job) return <div className={styles.message}>Job not found.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate("/")}>
          ← Back
        </button>
        <button
          className={styles.editButton}
          onClick={() => navigate(`/jobs/${id}/edit`)}
        >
          Edit
        </button>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>{job.roleTitle}</h1>
          <p className={styles.company}>{job.companyName}</p>
        </div>
        <span
          className={styles.statusBadge}
          style={{ backgroundColor: statusColors[job.status] || "#6c757d" }}
        >
          {job.statusDisplay}
        </span>
      </div>

      <div className={styles.content}>
        {/* Status Update */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Update Status</h2>
          <div className={styles.statusButtons}>
            {Object.values(JobStatus).map((s) => (
              <button
                key={s}
                className={styles.statusButton}
                style={{
                  backgroundColor: job.status === s ? statusColors[s] : "#f0f0f0",
                  color: job.status === s ? "#fff" : "#333",
                }}
                onClick={() => statusMutation.mutate(s)}
                disabled={statusMutation.isPending}
              >
                {s.replace(/([A-Z])/g, " $1").trim()}
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Details</h2>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Date Discovered</span>
              <span className={styles.detailValue}>{job.dateDiscovered}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Date Submitted</span>
              <span className={styles.detailValue}>{job.dateSubmitted || "—"}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Expiry Date</span>
              <span className={styles.detailValue}>{job.applicationExpiryDate || "—"}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Source URL</span>
              <span className={styles.detailValue}>
                {job.sourceUrl ? (
                  <a href={job.sourceUrl} target="_blank" rel="noreferrer">{job.sourceUrl}</a>
                ) : "—"}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Career Portal URL</span>
              <span className={styles.detailValue}>
                {job.companyCareerPortalUrl ? (
                  <a href={job.companyCareerPortalUrl} target="_blank" rel="noreferrer">{job.companyCareerPortalUrl}</a>
                ) : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Contacts */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.sectionTitle}>Contacts</h2>
            <button className={styles.addButton} onClick={() => setShowAddContact(v => !v)}>
              {showAddContact ? "Cancel" : "+ Add Contact"}
            </button>
          </div>

          {showAddContact && (
            <div className={styles.addForm}>
              <div className={styles.formRow}>
                <input
                  className={styles.input}
                  placeholder="Name *"
                  value={contactForm.name}
                  onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                />
                <select
                  className={styles.input}
                  value={contactForm.roleType}
                  onChange={e => setContactForm(f => ({ ...f, roleType: e.target.value as CreateAndAddContactRequest["roleType"] }))}
                >
                  {Object.values(ContactRoleType).map(r => (
                    <option key={r} value={r}>{r.replace(/([A-Z])/g, " $1").trim()}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formRow}>
                <input
                  className={styles.input}
                  placeholder="Email"
                  value={contactForm.email ?? ""}
                  onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                />
                <input
                  className={styles.input}
                  placeholder="LinkedIn URL"
                  value={contactForm.linkedInUrl ?? ""}
                  onChange={e => setContactForm(f => ({ ...f, linkedInUrl: e.target.value }))}
                />
              </div>
              <div className={styles.formRow}>
                <input
                  className={styles.input}
                  placeholder={`${getOrgLabel(contactForm.roleType)} Name`}
                  value={contactForm.agencyName ?? ""}
                  list="org-name-suggestions"
                  onChange={e => setContactForm(f => ({ ...f, agencyName: e.target.value }))}
                />
                <datalist id="org-name-suggestions">
                  {orgSuggestions.map(name => <option key={name} value={name} />)}
                </datalist>
                <button
                  className={styles.saveButton}
                  disabled={!contactForm.name.trim() || addContactMutation.isPending}
                  onClick={() => addContactMutation.mutate(contactForm)}
                >
                  {addContactMutation.isPending ? "Saving..." : "Save Contact"}
                </button>
              </div>
              {addContactMutation.isError && (
                <p className={styles.fieldError}>Failed to add contact.</p>
              )}
            </div>
          )}

          {jobContacts.length === 0 && !showAddContact ? (
            <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>No contacts added yet.</p>
          ) : (
            <div className={styles.contactList}>
              {jobContacts.map(c => (
                <div
                  key={c.id}
                  className={`${styles.contactRow} ${editingId === c.id ? styles.contactRowEditing : ""}`}
                >
                  {editingId === c.id ? (
                    <>
                      <div className={styles.formRow}>
                        <input
                          className={styles.input}
                          placeholder="Name *"
                          value={editForm.name}
                          onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        />
                        <select
                          className={styles.input}
                          value={editRoleType}
                          onChange={e => setEditRoleType(e.target.value as ContactRoleType)}
                        >
                          {Object.values(ContactRoleType).map(r => (
                            <option key={r} value={r}>{r.replace(/([A-Z])/g, " $1").trim()}</option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.formRow}>
                        <input
                          className={styles.input}
                          placeholder="Email"
                          value={editForm.email ?? ""}
                          onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                        />
                        <input
                          className={styles.input}
                          placeholder="LinkedIn URL"
                          value={editForm.linkedInUrl ?? ""}
                          onChange={e => setEditForm(f => ({ ...f, linkedInUrl: e.target.value }))}
                        />
                      </div>
                      <div className={styles.formRow}>
                        <input
                          className={styles.input}
                          placeholder={`${getOrgLabel(editRoleType)} Name`}
                          value={editForm.agencyName ?? ""}
                          list="org-name-suggestions"
                          onChange={e => setEditForm(f => ({ ...f, agencyName: e.target.value }))}
                        />
                      </div>
                      <div className={styles.formActions}>
                        <button className={styles.cancelEditButton} onClick={() => setEditingId(null)}>Cancel</button>
                        <button
                          className={styles.saveButton}
                          disabled={!editForm.name.trim() || updateContactMutation.isPending}
                          onClick={() => updateContactMutation.mutate({ contactId: c.contactId, linkId: c.id, data: editForm, roleType: editRoleType })}
                        >
                          {updateContactMutation.isPending ? "Saving..." : "Save"}
                        </button>
                      </div>
                      {updateContactMutation.isError && (
                        <p className={styles.fieldError}>Failed to save changes.</p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className={styles.contactInfo}>
                        <span className={styles.contactName}>{c.contactName}</span>
                        <span className={styles.roleBadge}>{c.roleTypeDisplay}</span>
                        {c.email && <a href={`mailto:${c.email}`} className={styles.contactLink}>{c.email}</a>}
                        {c.linkedInUrl && <a href={c.linkedInUrl} target="_blank" rel="noreferrer" className={styles.contactLink}>LinkedIn</a>}
                        {c.agencyName && <span className={styles.contactMeta}>{getOrgLabel(c.roleType)}: {c.agencyName}</span>}
                      </div>
                      <div className={styles.contactActions}>
                        <button
                          className={styles.editContactButton}
                          onClick={() => {
                            setEditingId(c.id);
                            setEditRoleType(c.roleType as ContactRoleType);
                            setEditForm({ name: c.contactName, email: c.email, linkedInUrl: c.linkedInUrl, agencyName: c.agencyName });
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className={styles.removeButton}
                          onClick={() => removeContactMutation.mutate(c.id)}
                          disabled={removeContactMutation.isPending}
                        >
                          Remove
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Journal */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.sectionTitle}>Journal</h2>
            <button className={styles.addButton} onClick={() => setShowAddJournal(v => !v)}>
              {showAddJournal ? "Cancel" : "+ Add Entry"}
            </button>
          </div>

          {showAddJournal && (
            <div className={styles.addForm}>
              <div className={styles.formRow}>
                <select
                  className={styles.input}
                  value={journalForm.interactionType}
                  onChange={e => setJournalForm(f => ({ ...f, interactionType: e.target.value as CreateJournalEntryRequest["interactionType"] }))}
                >
                  {Object.values(InteractionType).map(t => (
                    <option key={t} value={t}>{t.replace(/([A-Z])/g, " $1").trim()}</option>
                  ))}
                </select>
                <input
                  type="date"
                  className={styles.input}
                  value={journalForm.entryDate}
                  onChange={e => setJournalForm(f => ({ ...f, entryDate: e.target.value }))}
                />
              </div>
              <textarea
                className={styles.textarea}
                placeholder="Notes (optional)"
                value={journalForm.notes ?? ""}
                rows={3}
                onChange={e => setJournalForm(f => ({ ...f, notes: e.target.value }))}
              />
              <div className={styles.formActions}>
                <button
                  className={styles.saveButton}
                  disabled={addJournalMutation.isPending}
                  onClick={() => addJournalMutation.mutate(journalForm)}
                >
                  {addJournalMutation.isPending ? "Saving..." : "Save Entry"}
                </button>
              </div>
              {addJournalMutation.isError && (
                <p className={styles.fieldError}>Failed to save entry.</p>
              )}
            </div>
          )}

          {journalEntries.length === 0 && !showAddJournal ? (
            <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>No journal entries yet.</p>
          ) : (
            <div className={styles.journalList}>
              {journalEntries.map(entry => (
                <div key={entry.id} className={styles.journalEntry}>
                  {editingJournalId === entry.id ? (
                    <div className={styles.addForm}>
                      <div className={styles.formRow}>
                        <select
                          className={styles.input}
                          value={journalEditForm.interactionType}
                          onChange={e => setJournalEditForm(f => ({ ...f, interactionType: e.target.value as UpdateJournalEntryRequest["interactionType"] }))}
                        >
                          {Object.values(InteractionType).map(t => (
                            <option key={t} value={t}>{t.replace(/([A-Z])/g, " $1").trim()}</option>
                          ))}
                        </select>
                        <input
                          type="date"
                          className={styles.input}
                          value={journalEditForm.entryDate}
                          onChange={e => setJournalEditForm(f => ({ ...f, entryDate: e.target.value }))}
                        />
                      </div>
                      <textarea
                        className={styles.textarea}
                        rows={3}
                        value={journalEditForm.notes ?? ""}
                        onChange={e => setJournalEditForm(f => ({ ...f, notes: e.target.value }))}
                      />
                      <div className={styles.formActions}>
                        <button className={styles.cancelEditButton} onClick={() => setEditingJournalId(null)}>Cancel</button>
                        <button
                          className={styles.saveButton}
                          disabled={updateJournalMutation.isPending}
                          onClick={() => updateJournalMutation.mutate({ entryId: entry.id, data: journalEditForm })}
                        >
                          {updateJournalMutation.isPending ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={styles.journalEntryHeader}>
                        <div className={styles.journalEntryMeta}>
                          <span className={styles.journalTypeBadge}>{entry.interactionTypeDisplay}</span>
                          <span className={styles.journalDate}>
                            {new Date(entry.entryDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <div className={styles.contactActions}>
                          <button
                            className={styles.editContactButton}
                            onClick={() => {
                              setEditingJournalId(entry.id);
                              setJournalEditForm({
                                interactionType: entry.interactionType,
                                notes: entry.notes,
                                entryDate: entry.entryDate.split("T")[0],
                              });
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className={styles.removeButton}
                            onClick={() => deleteJournalMutation.mutate(entry.id)}
                            disabled={deleteJournalMutation.isPending}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {entry.notes && <p className={styles.journalNotes}>{entry.notes}</p>}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resume */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.sectionTitle}>Resume Submitted</h2>
            {!showResumeSelector && (
              <button className={styles.addButton} onClick={() => setShowResumeSelector(true)}>
                {jobResume ? "Change" : "+ Link Resume"}
              </button>
            )}
          </div>

          {showResumeSelector && (
            <div className={styles.addForm}>
              <select
                className={styles.input}
                defaultValue=""
                onChange={e => { if (e.target.value) linkResumeMutation.mutate(e.target.value); }}
                disabled={linkResumeMutation.isPending}
              >
                <option value="" disabled>Select a resume…</option>
                {allResumes.map(r => (
                  <option key={r.id} value={r.id}>{r.fileName} ({r.fileSizeDisplay})</option>
                ))}
              </select>
              <div className={styles.formActions}>
                <button className={styles.cancelEditButton} onClick={() => setShowResumeSelector(false)}>Cancel</button>
              </div>
              {allResumes.length === 0 && (
                <p className={styles.fieldError}>No resumes uploaded yet. <button className={styles.linkButton} onClick={() => navigate('/resumes')}>Upload one</button> first.</p>
              )}
            </div>
          )}

          {jobResume ? (
            <div className={styles.contactRow}>
              <div className={styles.contactInfo}>
                <span className={styles.contactName}>{jobResume.fileName}</span>
                <span className={styles.contactMeta}>
                  {jobResume.fileSizeDisplay} · Linked {new Date(jobResume.linkedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </span>
              </div>
              <div className={styles.contactActions}>
                <button
                  className={styles.editContactButton}
                  onClick={() => handleDownloadResume(jobResume.resumeId, jobResume.fileName)}
                >
                  Download
                </button>
                <button
                  className={styles.removeButton}
                  onClick={() => unlinkResumeMutation.mutate()}
                  disabled={unlinkResumeMutation.isPending}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            !showResumeSelector && (
              <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>No resume linked to this application yet.</p>
            )
          )}
        </div>

        {/* Job Description */}
        {job.jobDescription && (
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Job Description</h2>
            <div
              className={styles.jobDescription}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.jobDescription) }}
            />
          </div>
        )}

        {/* Danger Zone */}
        <div className={styles.card} style={{ borderColor: "#ffcccc" }}>
          <h2 className={styles.sectionTitle} style={{ color: "#c00" }}>Delete Requisition</h2>
          <p className={styles.deleteWarning}>
            This action cannot be undone. All associated journal entries and contacts will also be removed.
          </p>
          <button
            className={styles.deleteButton}
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this job requisition?")) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete Requisition"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobDetailPage;
