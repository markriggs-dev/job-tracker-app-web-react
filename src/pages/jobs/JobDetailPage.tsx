import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobService } from "../../services/jobService";
import { contactService } from "../../services/contactService";
import { JobStatus, ContactRoleType } from "../../types";
import type { CreateAndAddContactRequest } from "../../types";

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

  const {
    data: job,
    isLoading,
    error,
  } = useQuery({
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

  if (isLoading) return <div style={styles.message}>Loading...</div>;
  if (error || !job) return <div style={styles.message}>Job not found.</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate("/")}>
          ← Back
        </button>
        <button
          style={styles.editButton}
          onClick={() => navigate(`/jobs/${id}/edit`)}
        >
          Edit
        </button>
        <div>
          <h1 style={styles.title}>{job.roleTitle}</h1>
          <p style={styles.company}>{job.companyName}</p>
        </div>
        <span
          style={{
            ...styles.statusBadge,
            backgroundColor: statusColors[job.status] || "#6c757d",
          }}
        >
          {job.statusDisplay}
        </span>
      </div>

      <div style={styles.content}>
        {/* Status Update */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Update Status</h2>
          <div style={styles.statusButtons}>
            {Object.values(JobStatus).map((s) => (
              <button
                key={s}
                style={{
                  ...styles.statusButton,
                  backgroundColor:
                    job.status === s ? statusColors[s] : "#f0f0f0",
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
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Details</h2>
          <div style={styles.detailGrid}>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Date Discovered</span>
              <span style={styles.detailValue}>{job.dateDiscovered}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Date Submitted</span>
              <span style={styles.detailValue}>{job.dateSubmitted || "—"}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Expiry Date</span>
              <span style={styles.detailValue}>
                {job.applicationExpiryDate || "—"}
              </span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Source URL</span>
              <span style={styles.detailValue}>
                {job.sourceUrl ? (
                  <a href={job.sourceUrl} target="_blank" rel="noreferrer">
                    {job.sourceUrl}
                  </a>
                ) : (
                  "—"
                )}
              </span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Career Portal URL</span>
              <span style={styles.detailValue}>
                {job.companyCareerPortalUrl ? (
                  <a
                    href={job.companyCareerPortalUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {job.companyCareerPortalUrl}
                  </a>
                ) : (
                  "—"
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Contacts */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.sectionTitle}>Contacts</h2>
            <button style={styles.addButton} onClick={() => setShowAddContact(v => !v)}>
              {showAddContact ? "Cancel" : "+ Add Contact"}
            </button>
          </div>

          {showAddContact && (
            <div style={styles.addForm}>
              <div style={styles.formRow}>
                <input
                  style={styles.input}
                  placeholder="Name *"
                  value={contactForm.name}
                  onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                />
                <select
                  style={styles.input}
                  value={contactForm.roleType}
                  onChange={e => setContactForm(f => ({ ...f, roleType: e.target.value as CreateAndAddContactRequest["roleType"] }))}
                >
                  {Object.values(ContactRoleType).map(r => (
                    <option key={r} value={r}>{r.replace(/([A-Z])/g, " $1").trim()}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formRow}>
                <input
                  style={styles.input}
                  placeholder="Email"
                  value={contactForm.email ?? ""}
                  onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                />
                <input
                  style={styles.input}
                  placeholder="LinkedIn URL"
                  value={contactForm.linkedInUrl ?? ""}
                  onChange={e => setContactForm(f => ({ ...f, linkedInUrl: e.target.value }))}
                />
              </div>
              <div style={styles.formRow}>
                <input
                  style={styles.input}
                  placeholder="Agency Name"
                  value={contactForm.agencyName ?? ""}
                  onChange={e => setContactForm(f => ({ ...f, agencyName: e.target.value }))}
                />
                <button
                  style={styles.saveButton}
                  disabled={!contactForm.name.trim() || addContactMutation.isPending}
                  onClick={() => addContactMutation.mutate(contactForm)}
                >
                  {addContactMutation.isPending ? "Saving..." : "Save Contact"}
                </button>
              </div>
              {addContactMutation.isError && (
                <p style={{ color: "#c00", fontSize: "13px", margin: "4px 0 0" }}>Failed to add contact.</p>
              )}
            </div>
          )}

          {jobContacts.length === 0 && !showAddContact ? (
            <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>No contacts added yet.</p>
          ) : (
            <div style={styles.contactList}>
              {jobContacts.map(c => (
                <div key={c.id} style={styles.contactRow}>
                  <div style={styles.contactInfo}>
                    <span style={styles.contactName}>{c.contactName}</span>
                    <span style={{ ...styles.roleBadge, backgroundColor: "#e8f0fb", color: "#1F3864" }}>
                      {c.roleTypeDisplay}
                    </span>
                    {c.email && <a href={`mailto:${c.email}`} style={styles.contactLink}>{c.email}</a>}
                    {c.linkedInUrl && <a href={c.linkedInUrl} target="_blank" rel="noreferrer" style={styles.contactLink}>LinkedIn</a>}
                    {c.agencyName && <span style={styles.contactMeta}>{c.agencyName}</span>}
                  </div>
                  <button
                    style={styles.removeButton}
                    onClick={() => removeContactMutation.mutate(c.id)}
                    disabled={removeContactMutation.isPending}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Job Description */}
        {job.jobDescription && (
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Job Description</h2>
            <pre style={styles.jobDescription}>{job.jobDescription}</pre>
          </div>
        )}

        {/* Danger Zone */}
        <div style={{ ...styles.card, borderColor: "#ffcccc" }}>
          <h2 style={{ ...styles.sectionTitle, color: "#c00" }}>
            Delete Requisition
          </h2>
          <p style={styles.deleteWarning}>
            This action cannot be undone. All associated journal entries and
            contacts will also be removed.
          </p>
          <button
            style={styles.deleteButton}
            onClick={() => {
              if (
                window.confirm(
                  "Are you sure you want to delete this job requisition?",
                )
              ) {
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

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: "Arial, sans-serif",
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
  },
  message: {
    padding: "48px",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
    color: "#666",
  },
  header: {
    backgroundColor: "#1F3864",
    color: "#fff",
    padding: "16px 32px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  backButton: {
    backgroundColor: "transparent",
    border: "1px solid #ccc",
    color: "#fff",
    padding: "6px 14px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },
  editButton: {
    backgroundColor: "#2E75B6",
    border: "none",
    color: "#fff",
    padding: "6px 14px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "13px",
  },
  title: { margin: 0, fontSize: "20px", fontWeight: "bold" },
  company: { margin: "4px 0 0", fontSize: "14px", color: "#ccc" },
  statusBadge: {
    marginLeft: "auto",
    display: "inline-block",
    padding: "4px 14px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "bold",
    color: "#fff",
    whiteSpace: "nowrap",
  },
  content: {
    maxWidth: "900px",
    margin: "32px auto",
    padding: "0 32px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    border: "1px solid #eee",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#1F3864",
    marginTop: 0,
    marginBottom: "16px",
  },
  statusButtons: { display: "flex", flexWrap: "wrap", gap: "8px" },
  statusButton: {
    padding: "6px 14px",
    borderRadius: "4px",
    border: "1px solid #ddd",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "bold",
  },
  detailGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  detailItem: { display: "flex", flexDirection: "column", gap: "4px" },
  detailLabel: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  detailValue: { fontSize: "14px", color: "#333" },
  jobDescription: {
    fontSize: "13px",
    color: "#444",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    backgroundColor: "#f9f9f9",
    padding: "16px",
    borderRadius: "4px",
    margin: 0,
  },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  addButton: {
    backgroundColor: "#2E75B6", color: "#fff", border: "none",
    padding: "6px 14px", borderRadius: "4px", cursor: "pointer", fontSize: "13px",
  },
  addForm: { marginBottom: "16px", display: "flex", flexDirection: "column", gap: "8px" },
  formRow: { display: "flex", gap: "8px" },
  input: {
    flex: 1, padding: "7px 10px", border: "1px solid #ddd",
    borderRadius: "4px", fontSize: "13px",
  },
  saveButton: {
    backgroundColor: "#375623", color: "#fff", border: "none",
    padding: "7px 16px", borderRadius: "4px", cursor: "pointer", fontSize: "13px",
    whiteSpace: "nowrap" as const,
  },
  contactList: { display: "flex", flexDirection: "column", gap: "8px" },
  contactRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 12px", backgroundColor: "#f9f9f9",
    borderRadius: "4px", border: "1px solid #eee",
  },
  contactInfo: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" as const },
  contactName: { fontWeight: "bold", fontSize: "14px", color: "#222" },
  roleBadge: {
    fontSize: "11px", fontWeight: "bold", padding: "2px 8px",
    borderRadius: "10px", letterSpacing: "0.3px",
  },
  contactLink: { fontSize: "13px", color: "#2E75B6" },
  contactMeta: { fontSize: "12px", color: "#888" },
  removeButton: {
    backgroundColor: "transparent", color: "#c00", border: "1px solid #c00",
    padding: "4px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px",
    whiteSpace: "nowrap" as const,
  },
  deleteWarning: { fontSize: "13px", color: "#666", marginBottom: "16px" },
  deleteButton: {
    backgroundColor: "#c00000",
    color: "#fff",
    border: "none",
    padding: "8px 20px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  },
};

export default JobDetailPage;
