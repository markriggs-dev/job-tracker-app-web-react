import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import { ArrowLeft, Pencil, Plus, UserRound, BookOpen, FileText, Info, Cpu, X } from "lucide-react";
import { jobService } from "../../services/jobService";
import { contactService } from "../../services/contactService";
import { journalService } from "../../services/journalService";
import { resumeService } from "../../services/resumeService";
import { aiService } from "../../services/aiService";
import { experienceService } from "../../services/experienceService";
import { JobStatus, ContactRoleType, InteractionType } from "../../types";
import type { CreateAndAddContactRequest, UpdateContactRequest, CreateJournalEntryRequest, UpdateJournalEntryRequest } from "../../types";
import { formatJobDate } from "../../utils/jobUtils";
import styles from "./JobDetailPage.module.css";

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  Discovered:         { color: '#64748B', bg: '#F1F5F9' },
  Applied:            { color: '#2563EB', bg: '#EFF6FF' },
  InProgress:         { color: '#7C3AED', bg: '#F5F3FF' },
  WaitingOnResponse:  { color: '#D97706', bg: '#FFFBEB' },
  InterviewScheduled: { color: '#059669', bg: '#ECFDF5' },
  OfferReceived:      { color: '#0D9488', bg: '#F0FDFA' },
  Closed:             { color: '#DC2626', bg: '#FEF2F2' },
  Withdrawn:          { color: '#64748B', bg: '#F1F5F9' },
};

const STATUS_GUIDE = [
  { status: 'Discovered',          desc: 'Found this opportunity — evaluating whether to pursue it.' },
  { status: 'Applied',             desc: 'Resume submitted to a recruiter or job portal.' },
  { status: 'Waiting On Response', desc: 'Submission complete — awaiting feedback from the recruiter or company.' },
  { status: 'In Progress',         desc: 'Actively engaged with the hiring team; interviews or assessments underway.' },
  { status: 'Interview Scheduled', desc: 'Interview confirmed with the company.' },
  { status: 'Offer Received',      desc: 'Formal offer received from the company.' },
  { status: 'Closed',              desc: 'This opportunity is no longer active or available.' },
  { status: 'Withdrawn',           desc: 'You have removed yourself from consideration.' },
];

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

type Tab = "overview" | "contacts" | "journal" | "documents" | "ai";

const JobDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showStatusGuide, setShowStatusGuide] = useState(false);

  // ── Job ──
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
    onError: () => toast.error("Failed to update status. Please try again."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => jobService.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      navigate("/");
    },
    onError: () => toast.error("Failed to delete job. Please try again."),
  });

  // ── Contacts ──
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactForm, setContactForm] = useState<CreateAndAddContactRequest>(emptyContactForm);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editContactForm, setEditContactForm] = useState<UpdateContactRequest>({ name: "", email: "", linkedInUrl: "", agencyName: "" });
  const [editRoleType, setEditRoleType] = useState<ContactRoleType>(ContactRoleType.CompanyRecruiter);

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
    mutationFn: (data: CreateAndAddContactRequest) => contactService.createAndAddContactToJob(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobContacts", id] });
      setShowAddContact(false);
      setContactForm(emptyContactForm);
    },
    onError: () => toast.error("Failed to add contact. Please try again."),
  });

  const removeContactMutation = useMutation({
    mutationFn: (linkId: string) => contactService.removeContactFromJob(id!, linkId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobContacts", id] }),
    onError: () => toast.error("Failed to remove contact. Please try again."),
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ contactId, linkId, data, roleType }: { contactId: string; linkId: string; data: UpdateContactRequest; roleType: ContactRoleType }) => {
      await contactService.update(contactId, data);
      await contactService.updateContactRole(id!, linkId, { roleType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobContacts", id] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setEditingContactId(null);
    },
    onError: () => toast.error("Failed to update contact. Please try again."),
  });

  // ── Journal ──
  const emptyJournalForm: CreateJournalEntryRequest = {
    interactionType: InteractionType.Note,
    notes: "",
    entryDate: new Date().toISOString().split("T")[0],
  };

  const [showAddJournal, setShowAddJournal] = useState(false);
  const [journalForm, setJournalForm] = useState<CreateJournalEntryRequest>(emptyJournalForm);
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const addNotesRef = useRef<HTMLDivElement>(null);
  const editNotesRef = useRef<HTMLDivElement>(null);
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
    mutationFn: (data: CreateJournalEntryRequest) => journalService.create(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal", id] });
      setShowAddJournal(false);
      setJournalForm(emptyJournalForm);
    },
    onError: () => toast.error("Failed to save journal entry. Please try again."),
  });

  const updateJournalMutation = useMutation({
    mutationFn: ({ entryId, data }: { entryId: string; data: UpdateJournalEntryRequest }) =>
      journalService.update(id!, entryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal", id] });
      setEditingJournalId(null);
    },
    onError: () => toast.error("Failed to update journal entry. Please try again."),
  });

  const deleteJournalMutation = useMutation({
    mutationFn: (entryId: string) => journalService.delete(id!, entryId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["journal", id] }),
    onError: () => toast.error("Failed to delete journal entry. Please try again."),
  });

  useEffect(() => {
    if (editNotesRef.current) {
      editNotesRef.current.innerHTML = DOMPurify.sanitize(journalEditForm.notes ?? '');
    }
  }, [editingJournalId]);

  const handleJournalPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    const sanitized = html
      ? DOMPurify.sanitize(html, {
          ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li', 'a', 'span', 'div'],
          ALLOWED_ATTR: ['href', 'target'],
        })
      : text.replace(/\n/g, '<br>');
    document.execCommand('insertHTML', false, sanitized);
  };

  // ── Application Documents ──
  const [showSelectorFor, setShowSelectorFor] = useState<'Resume' | 'CoverLetter' | null>(null);
  const resumeFileInputRef = useRef<HTMLInputElement | null>(null);
  const coverLetterFileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: allResumes = [] } = useQuery({
    queryKey: ["resumes"],
    queryFn: resumeService.getAll,
    enabled: !!id,
  });

  const { data: jobDocuments = { resume: null, coverLetter: null } } = useQuery({
    queryKey: ["jobDocuments", id],
    queryFn: () => resumeService.getJobDocuments(id!),
    enabled: !!id,
  });

  const linkDocumentMutation = useMutation({
    mutationFn: ({ resumeId, documentType }: { resumeId: string; documentType: 'Resume' | 'CoverLetter' }) =>
      resumeService.linkDocumentToJob(id!, { resumeId, documentType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobDocuments", id] });
      setShowSelectorFor(null);
    },
    onError: () => toast.error("Failed to link document. Please try again."),
  });

  const uploadAndLinkMutation = useMutation({
    mutationFn: async ({ file, documentType }: { file: File; documentType: 'Resume' | 'CoverLetter' }) => {
      const uploaded = await resumeService.upload(file);
      await resumeService.linkDocumentToJob(id!, { resumeId: uploaded.id, documentType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      queryClient.invalidateQueries({ queryKey: ["jobDocuments", id] });
      setShowSelectorFor(null);
    },
    onError: () => toast.error("Failed to upload document. Please try again."),
  });

  const unlinkDocumentMutation = useMutation({
    mutationFn: (documentType: 'Resume' | 'CoverLetter') => resumeService.unlinkDocumentFromJob(id!, documentType),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobDocuments", id] }),
    onError: () => toast.error("Failed to remove document. Please try again."),
  });

  const handleDownloadDocument = (resumeId: string, fileName: string) => {
    resumeService.downloadFile(resumeId).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  // ── AI / Resume Generation ──
  const [apiExperienceId, setApiExperienceId] = useState("");
  const [apiAiProfileId, setApiAiProfileId] = useState("");
  const [claudeExperienceId, setClaudeExperienceId] = useState("");
  const [claudeAiProfileId, setClaudeAiProfileId] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [promptCopied, setPromptCopied] = useState(false);
  const [experienceEmbedded, setExperienceEmbedded] = useState(false);
  const [promptBuilding, setPromptBuilding] = useState(false);
  const [promptError, setPromptError] = useState("");

  const { data: experienceProfiles = [] } = useQuery({
    queryKey: ["experience-profiles"],
    queryFn: experienceService.getAll,
    enabled: !!id,
  });

  const { data: aiProfiles = [] } = useQuery({
    queryKey: ["ai-profiles"],
    queryFn: aiService.getAllProfiles,
    enabled: !!id,
  });

  const { data: generatedResumes = [] } = useQuery({
    queryKey: ["generated-resumes", id],
    queryFn: () => aiService.getGeneratedResumes(id!),
    enabled: !!id,
  });

  const handleGeneratePrompt = async () => {
    if (!claudeExperienceId || !claudeAiProfileId) return;
    setPromptBuilding(true);
    setPromptError("");
    setGeneratedPrompt("");
    try {
      const result = await aiService.buildPrompt(id!, {
        experienceProfileId: claudeExperienceId,
        aiProfileId: claudeAiProfileId,
      });
      setGeneratedPrompt(result.prompt);
      setExperienceEmbedded(result.experienceEmbedded);
      setPromptCopied(false);
    } catch {
      setPromptError("Failed to build prompt. Please try again.");
    } finally {
      setPromptBuilding(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt).then(() => {
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2500);
    });
  };

  const deleteGeneratedMutation = useMutation({
    mutationFn: (resumeId: string) => aiService.deleteGeneratedResume(id!, resumeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["generated-resumes", id] }),
    onError: () => toast.error("Failed to delete generated resume. Please try again."),
  });

  const handleDownloadGenerated = (resumeId: string, fileName: string) => {
    aiService.downloadGeneratedResume(id!, resumeId).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  if (isLoading) return <div className={styles.state}>Loading…</div>;
  if (error || !job) return <div className={styles.state}>Job not found.</div>;

  const s = STATUS_STYLE[job.status] ?? STATUS_STYLE.Discovered;

  return (
    <div className={styles.page}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate("/")}>
          <ArrowLeft size={14} /> Back
        </button>
        <div className={styles.jobMeta}>
          <h1 className={styles.jobTitle}>{job.roleTitle}</h1>
          <p className={styles.jobCompany}>{job.companyName}</p>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.statusBadge} style={{ color: s.color, background: s.bg }}>
            {job.statusDisplay}
          </span>
          <button className={styles.editBtn} onClick={() => navigate(`/jobs/${id}/edit`)}>
            <Pencil size={13} /> Edit
          </button>
        </div>
      </div>

      {/* Status selector */}
      <div className={styles.statusCard}>
        <div className={styles.statusCardHeader}>
          <p className={styles.statusLabel}>Update Status</p>
          <button className={styles.statusGuideBtn} onClick={() => setShowStatusGuide(true)}>
            <Info size={13} />
            Status Guide
          </button>
        </div>
        <div className={styles.statusButtons}>
          {Object.values(JobStatus).map(val => {
            const st = STATUS_STYLE[val] ?? STATUS_STYLE.Discovered;
            const isActive = job.status === val;
            return (
              <button
                key={val}
                className={styles.statusBtn}
                style={{
                  background: isActive ? st.bg : 'transparent',
                  color: isActive ? st.color : 'var(--color-text-muted)',
                  borderColor: isActive ? st.color : 'var(--color-border)',
                  fontWeight: isActive ? 600 : 400,
                }}
                onClick={() => statusMutation.mutate(val)}
                disabled={statusMutation.isPending}
              >
                {val.replace(/([A-Z])/g, " $1").trim()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {([
          { key: "overview", label: "Overview", icon: <Info size={14} /> },
          { key: "contacts", label: "Contacts", icon: <UserRound size={14} />, count: jobContacts.length },
          { key: "journal",  label: "Journal",  icon: <BookOpen size={14} />, count: journalEntries.length },
          { key: "documents", label: "Documents", icon: <FileText size={14} /> },
          { key: "ai",       label: "AI",       icon: <Cpu size={14} />, count: generatedResumes.length },
        ] as { key: Tab; label: string; icon: React.ReactNode; count?: number }[]).map(t => (
          <button
            key={t.key}
            className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.icon}
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span style={{
                background: activeTab === t.key ? '#EFF6FF' : 'var(--color-bg)',
                color: activeTab === t.key ? 'var(--color-accent)' : 'var(--color-text-muted)',
                fontSize: '11px',
                fontWeight: 600,
                padding: '1px 7px',
                borderRadius: '10px',
                marginLeft: '2px',
              }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "overview" && (
        <>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <p className={styles.sectionTitle}>Details</p>
            </div>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Discovered</span>
                <span className={styles.detailValue}>{job.dateDiscovered}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Submitted</span>
                <span className={styles.detailValue}>{job.dateSubmitted || "—"}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Expires</span>
                <span className={styles.detailValue}>{job.applicationExpiryDate || "—"}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Interview Date</span>
                <span className={styles.detailValue}>
                  {job.interviewDate
                    ? new Date(job.interviewDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
                    : "—"}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Found On</span>
                <span className={styles.detailValue}>
                  {job.sourceUrl ? <a href={job.sourceUrl} target="_blank" rel="noreferrer">View ↗</a> : "—"}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Apply At</span>
                <span className={styles.detailValue}>
                  {job.companyCareerPortalUrl ? <a href={job.companyCareerPortalUrl} target="_blank" rel="noreferrer">View ↗</a> : "—"}
                </span>
              </div>
            </div>
          </div>

          {job.jobDescription && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <p className={styles.sectionTitle}>Job Description</p>
              </div>
              <div
                className={styles.jobDescription}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.jobDescription) }}
              />
            </div>
          )}

          <div className={styles.dangerCard}>
            <p className={styles.dangerTitle}>Delete Requisition</p>
            <p className={styles.dangerText}>
              This action cannot be undone. All associated contacts and journal entries will also be removed.
            </p>
            <button
              className={styles.deleteBtn}
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this job requisition?")) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete Requisition"}
            </button>
          </div>
        </>
      )}

      {/* ── CONTACTS TAB ── */}
      {activeTab === "contacts" && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <p className={styles.sectionTitle}>Contacts</p>
            <button className={styles.addBtn} onClick={() => setShowAddContact(v => !v)}>
              {showAddContact ? "Cancel" : <><Plus size={13} /> Add Contact</>}
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
                  list="org-suggestions"
                  onChange={e => setContactForm(f => ({ ...f, agencyName: e.target.value }))}
                />
                <datalist id="org-suggestions">
                  {orgSuggestions.map(n => <option key={n} value={n} />)}
                </datalist>
              </div>
              {addContactMutation.isError && <p className={styles.fieldError}>Failed to add contact.</p>}
              <div className={styles.formActions}>
                <button className={styles.cancelMiniBtn} onClick={() => setShowAddContact(false)}>Cancel</button>
                <button
                  className={styles.saveMiniBtn}
                  disabled={!contactForm.name.trim() || addContactMutation.isPending}
                  onClick={() => addContactMutation.mutate(contactForm)}
                >
                  {addContactMutation.isPending ? "Saving…" : "Save Contact"}
                </button>
              </div>
            </div>
          )}

          {jobContacts.length === 0 && !showAddContact ? (
            <div className={styles.emptyState}>
              <UserRound size={36} color="#CBD5E1" strokeWidth={1.5} />
              <p className={styles.emptyTitle}>No contacts yet</p>
              <p className={styles.emptySubtitle}>Add recruiters, hiring managers, or other contacts for this role.</p>
            </div>
          ) : (
            <div className={styles.contactList}>
              {jobContacts.map(c => (
                <div
                  key={c.id}
                  className={`${styles.contactRow} ${editingContactId === c.id ? styles.contactRowEditing : ""}`}
                >
                  {editingContactId === c.id ? (
                    <>
                      <div className={styles.formRow}>
                        <input className={styles.input} placeholder="Name *" value={editContactForm.name} onChange={e => setEditContactForm(f => ({ ...f, name: e.target.value }))} />
                        <select className={styles.input} value={editRoleType} onChange={e => setEditRoleType(e.target.value as ContactRoleType)}>
                          {Object.values(ContactRoleType).map(r => (
                            <option key={r} value={r}>{r.replace(/([A-Z])/g, " $1").trim()}</option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.formRow}>
                        <input className={styles.input} placeholder="Email" value={editContactForm.email ?? ""} onChange={e => setEditContactForm(f => ({ ...f, email: e.target.value }))} />
                        <input className={styles.input} placeholder="LinkedIn URL" value={editContactForm.linkedInUrl ?? ""} onChange={e => setEditContactForm(f => ({ ...f, linkedInUrl: e.target.value }))} />
                      </div>
                      <div className={styles.formRow}>
                        <input className={styles.input} placeholder={`${getOrgLabel(editRoleType)} Name`} value={editContactForm.agencyName ?? ""} list="org-suggestions" onChange={e => setEditContactForm(f => ({ ...f, agencyName: e.target.value }))} />
                      </div>
                      {updateContactMutation.isError && <p className={styles.fieldError}>Failed to save changes.</p>}
                      <div className={styles.formActions}>
                        <button className={styles.cancelMiniBtn} onClick={() => setEditingContactId(null)}>Cancel</button>
                        <button
                          className={styles.saveMiniBtn}
                          disabled={!editContactForm.name.trim() || updateContactMutation.isPending}
                          onClick={() => updateContactMutation.mutate({ contactId: c.contactId, linkId: c.id, data: editContactForm, roleType: editRoleType })}
                        >
                          {updateContactMutation.isPending ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.contactInfo}>
                        <span className={styles.contactName}>{c.contactName}</span>
                        <span className={styles.roleBadge}>{c.roleTypeDisplay}</span>
                        {c.email && <a href={`mailto:${c.email}`} className={styles.contactLink}>{c.email}</a>}
                        {c.linkedInUrl && <a href={c.linkedInUrl} target="_blank" rel="noreferrer" className={styles.contactLink}>LinkedIn ↗</a>}
                        {c.agencyName && <span className={styles.contactMeta}>{getOrgLabel(c.roleType)}: {c.agencyName}</span>}
                      </div>
                      <div className={styles.rowActions}>
                        <button className={styles.ghostBtn} onClick={() => {
                          setEditingContactId(c.id);
                          setEditRoleType(c.roleType as ContactRoleType);
                          setEditContactForm({ name: c.contactName, email: c.email, linkedInUrl: c.linkedInUrl, agencyName: c.agencyName });
                        }}>Edit</button>
                        <button className={styles.ghostDangerBtn} onClick={() => removeContactMutation.mutate(c.id)} disabled={removeContactMutation.isPending}>Remove</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── JOURNAL TAB ── */}
      {activeTab === "journal" && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <p className={styles.sectionTitle}>Activity Journal</p>
            <button className={styles.addBtn} onClick={() => setShowAddJournal(v => !v)}>
              {showAddJournal ? "Cancel" : <><Plus size={13} /> Add Entry</>}
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
              <div
                ref={addNotesRef}
                contentEditable
                className={styles.journalNotesEditor}
                data-placeholder="Notes (optional)"
                onPaste={handleJournalPaste}
                suppressContentEditableWarning
              />
              {addJournalMutation.isError && <p className={styles.fieldError}>Failed to save entry.</p>}
              <div className={styles.formActions}>
                <button className={styles.cancelMiniBtn} onClick={() => setShowAddJournal(false)}>Cancel</button>
                <button
                  className={styles.saveMiniBtn}
                  disabled={addJournalMutation.isPending}
                  onClick={() => addJournalMutation.mutate({ ...journalForm, notes: addNotesRef.current?.innerHTML ?? '' })}
                >
                  {addJournalMutation.isPending ? "Saving…" : "Save Entry"}
                </button>
              </div>
            </div>
          )}

          {journalEntries.length === 0 && !showAddJournal ? (
            <div className={styles.emptyState}>
              <BookOpen size={36} color="#CBD5E1" strokeWidth={1.5} />
              <p className={styles.emptyTitle}>No journal entries yet</p>
              <p className={styles.emptySubtitle}>Log calls, emails, interviews, and notes as you progress.</p>
            </div>
          ) : (
            <div className={styles.journalList}>
              {journalEntries.map(entry => (
                <div key={entry.id} className={styles.journalEntry}>
                  {editingJournalId === entry.id ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
                      <div
                        ref={editNotesRef}
                        contentEditable
                        className={styles.journalNotesEditor}
                        onPaste={handleJournalPaste}
                        suppressContentEditableWarning
                      />
                      <div className={styles.formActions}>
                        <button className={styles.cancelMiniBtn} onClick={() => setEditingJournalId(null)}>Cancel</button>
                        <button
                          className={styles.saveMiniBtn}
                          disabled={updateJournalMutation.isPending}
                          onClick={() => updateJournalMutation.mutate({ entryId: entry.id, data: { ...journalEditForm, notes: editNotesRef.current?.innerHTML ?? '' } })}
                        >
                          {updateJournalMutation.isPending ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.journalEntryBody}>
                      <div className={styles.journalEntryHeader}>
                        <div className={styles.journalEntryMeta}>
                          <span className={styles.journalTypeBadge}>{entry.interactionTypeDisplay}</span>
                          <span className={styles.journalDate}>
                            {formatJobDate(entry.entryDate)}
                          </span>
                        </div>
                        <div className={styles.rowActions}>
                          <button className={styles.ghostBtn} onClick={() => {
                            setEditingJournalId(entry.id);
                            setJournalEditForm({ interactionType: entry.interactionType, notes: entry.notes, entryDate: entry.entryDate.split("T")[0] });
                          }}>Edit</button>
                          <button className={styles.ghostDangerBtn} onClick={() => deleteJournalMutation.mutate(entry.id)} disabled={deleteJournalMutation.isPending}>Delete</button>
                        </div>
                      </div>
                      {entry.notes && (
                        <div
                          className={styles.journalNotes}
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(entry.notes) }}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── DOCUMENTS TAB ── */}
      {activeTab === "documents" && (
        <div className={styles.card}>
          <p className={styles.sectionTitle}>Application Documents</p>

          {(["Resume", "CoverLetter"] as const).map(docType => {
            const label = docType === "Resume" ? "Resume" : "Cover Letter";
            const linked = docType === "Resume" ? jobDocuments.resume : jobDocuments.coverLetter;
            const fileInputRef = docType === "Resume" ? resumeFileInputRef : coverLetterFileInputRef;
            const isShowingSelector = showSelectorFor === docType;
            const isBusy = linkDocumentMutation.isPending || uploadAndLinkMutation.isPending;

            return (
              <div key={docType} className={styles.documentSlot}>
                <div className={styles.documentSlotHeader}>
                  <span className={styles.documentSlotLabel}>{label}</span>
                  {!isShowingSelector && (
                    <button className={styles.addBtn} onClick={() => setShowSelectorFor(docType)}>
                      {linked ? "Change" : <><Plus size={13} /> Link {label}</>}
                    </button>
                  )}
                </div>

                {isShowingSelector && (
                  <div className={styles.addForm}>
                    {allResumes.length > 0 && (
                      <select
                        className={styles.input}
                        defaultValue=""
                        onChange={e => { if (e.target.value) linkDocumentMutation.mutate({ resumeId: e.target.value, documentType: docType }); }}
                        disabled={isBusy}
                      >
                        <option value="" disabled>Select an existing file…</option>
                        {allResumes.map(r => (
                          <option key={r.id} value={r.id}>{r.fileName} ({r.fileSizeDisplay})</option>
                        ))}
                      </select>
                    )}
                    <div className={styles.orDivider}>
                      {allResumes.length > 0 ? 'or upload a new one' : `Upload a ${label.toLowerCase()}`}
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className={styles.fileInputHidden}
                      ref={fileInputRef}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) uploadAndLinkMutation.mutate({ file, documentType: docType });
                      }}
                    />
                    <button
                      className={styles.uploadInlineBtn}
                      disabled={isBusy}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FileText size={14} />
                      {uploadAndLinkMutation.isPending ? 'Uploading…' : 'Choose file (PDF, DOC, DOCX)'}
                    </button>
                    {uploadAndLinkMutation.isError && (
                      <p className={styles.fieldError}>Upload failed. Please try again.</p>
                    )}
                    <div className={styles.formActions}>
                      <button className={styles.cancelMiniBtn} onClick={() => setShowSelectorFor(null)}>Cancel</button>
                    </div>
                  </div>
                )}

                {linked ? (
                  <div className={styles.resumeLinked}>
                    <div className={styles.resumeInfo}>
                      <span className={styles.resumeName}>{linked.fileName}</span>
                      <span className={styles.resumeMeta}>
                        {linked.fileSizeDisplay} · Linked {new Date(linked.linkedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <div className={styles.rowActions}>
                      <button className={styles.ghostBtn} onClick={() => handleDownloadDocument(linked.resumeId, linked.fileName)}>Download</button>
                      <button className={styles.ghostDangerBtn} onClick={() => unlinkDocumentMutation.mutate(docType)} disabled={unlinkDocumentMutation.isPending}>Remove</button>
                    </div>
                  </div>
                ) : (
                  !isShowingSelector && (
                    <div className={styles.documentSlotEmpty}>
                      <span className={styles.documentSlotEmptyText}>No {label.toLowerCase()} linked</span>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* ── AI TAB ── */}
      {activeTab === "ai" && (
        <>
          {/* Claude.AI Model */}
          <div className={styles.card}>
            <div className={styles.aiModelHeader}>
              <p className={styles.sectionTitle}>Claude.AI Model</p>
              <span className={styles.availableBadge}>Available</span>
            </div>
            <p className={styles.aiModelDesc}>
              Works with your Claude.ai subscription — generates a ready-to-use prompt you paste directly into Claude.ai with your experience document attached.
            </p>
            <div className={styles.addForm}>
              <div className={styles.formRow}>
                <select className={styles.input} value={claudeExperienceId} onChange={e => { setClaudeExperienceId(e.target.value); setGeneratedPrompt(""); }}>
                  <option value="">Select experience profile…</option>
                  {experienceProfiles.map(p => <option key={p.id} value={p.id}>{p.profileName}</option>)}
                </select>
                <select className={styles.input} value={claudeAiProfileId} onChange={e => { setClaudeAiProfileId(e.target.value); setGeneratedPrompt(""); }}>
                  <option value="">Select AI profile…</option>
                  {aiProfiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              {experienceProfiles.length === 0 && (
                <p className={styles.fieldError}>
                  No experience profiles found.{" "}
                  <button className={styles.linkBtn} onClick={() => navigate("/experience")}>Upload one</button> first.
                </p>
              )}
              {aiProfiles.length === 0 && (
                <p className={styles.fieldError}>
                  No AI profiles found.{" "}
                  <button className={styles.linkBtn} onClick={() => navigate("/ai-profiles")}>Create one</button> first.
                </p>
              )}
              <div className={styles.formActions}>
                <button
                  className={styles.saveMiniBtn}
                  disabled={!claudeExperienceId || !claudeAiProfileId || promptBuilding}
                  onClick={handleGeneratePrompt}
                >
                  {promptBuilding ? "Building prompt…" : "Generate Prompt"}
                </button>
              </div>
              {promptError && <p className={styles.fieldError}>{promptError}</p>}
            </div>

            {generatedPrompt && (
              <div className={styles.promptBlock}>
                <div className={styles.promptBlockHeader}>
                  <p className={styles.promptBlockTitle}>Your prompt is ready</p>
                  <button className={styles.copyBtn} onClick={handleCopyPrompt}>
                    {promptCopied ? "Copied!" : "Copy to Clipboard"}
                  </button>
                </div>
                <textarea className={styles.promptTextarea} readOnly rows={10} value={generatedPrompt} />
                <ol className={styles.promptSteps}>
                  <li>Copy the prompt above</li>
                  <li>Open <a href="https://claude.ai" target="_blank" rel="noreferrer">claude.ai</a> and start a new conversation</li>
                  {!experienceEmbedded && (
                    <li>Attach your <strong>{experienceProfiles.find(p => p.id === claudeExperienceId)?.fileName}</strong> experience document</li>
                  )}
                  <li>Paste the prompt and send</li>
                </ol>
              </div>
            )}
          </div>

          {/* API Service Model */}
          <div className={styles.card}>
            <div className={styles.aiModelHeader}>
              <p className={styles.sectionTitle}>API Service Model</p>
              <span className={styles.comingSoonBadge}>Coming Soon</span>
            </div>
            <p className={styles.aiModelDesc}>
              Direct in-app generation via Anthropic API — resumes are created and stored without leaving the app.
            </p>
            <div className={styles.addForm}>
              <div className={styles.formRow}>
                <select className={styles.input} value={apiExperienceId} onChange={e => setApiExperienceId(e.target.value)}>
                  <option value="">Select experience profile…</option>
                  {experienceProfiles.map(p => <option key={p.id} value={p.id}>{p.profileName}</option>)}
                </select>
                <select className={styles.input} value={apiAiProfileId} onChange={e => setApiAiProfileId(e.target.value)}>
                  <option value="">Select AI profile…</option>
                  {aiProfiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className={styles.formActions}>
                <button className={styles.saveMiniBtn} disabled title="API integration coming soon">
                  Generate Resume
                </button>
              </div>
            </div>
          </div>

          {/* Generated Resumes */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <p className={styles.sectionTitle}>Generated Resumes</p>
            </div>
            {generatedResumes.length === 0 ? (
              <div className={styles.emptyState}>
                <Cpu size={36} color="#CBD5E1" strokeWidth={1.5} />
                <p className={styles.emptyTitle}>No generated resumes yet</p>
                <p className={styles.emptySubtitle}>Generated resumes from the API Service Model will appear here.</p>
              </div>
            ) : (
              <div className={styles.contactList}>
                {generatedResumes.map(r => (
                  <div key={r.id} className={styles.contactRow}>
                    <div className={styles.contactInfo}>
                      <span className={styles.contactName}>{r.fileName}</span>
                      <span className={styles.contactMeta}>
                        {r.fileSizeDisplay} · {new Date(r.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className={styles.rowActions}>
                      <button className={styles.ghostBtn} onClick={() => handleDownloadGenerated(r.id, r.fileName)}>Download</button>
                      <button className={styles.ghostDangerBtn} onClick={() => deleteGeneratedMutation.mutate(r.id)} disabled={deleteGeneratedMutation.isPending}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Status Guide Modal / Bottom Sheet */}
      {showStatusGuide && (
        <div className={styles.modalOverlay} onClick={() => setShowStatusGuide(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <p className={styles.modalTitle}>Status Guide</p>
              <button className={styles.modalClose} onClick={() => setShowStatusGuide(false)}>
                <X size={16} />
              </button>
            </div>
            <div className={styles.statusGuideTable}>
              {STATUS_GUIDE.map(({ status, desc }) => (
                <div key={status} className={styles.statusGuideRow}>
                  <span className={styles.statusGuideName}>{status}</span>
                  <span className={styles.statusGuideDesc}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetailPage;
