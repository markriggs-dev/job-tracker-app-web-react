export const JobStatus = {
  Discovered: 'Discovered',
  Applied: 'Applied',
  InProgress: 'InProgress',
  WaitingOnResponse: 'WaitingOnResponse',
  InterviewScheduled: 'InterviewScheduled',
  OfferReceived: 'OfferReceived',
  Closed: 'Closed',
  Withdrawn: 'Withdrawn'
} as const;

export type JobStatus = typeof JobStatus[keyof typeof JobStatus];

export interface JobRequisition {
  id: string;
  companyName: string;
  roleTitle: string;
  sourceUrl?: string;
  companyCareerPortalUrl?: string;
  jobDescription?: string;
  status: JobStatus;
  statusDisplay: string;
  dateDiscovered: string;
  applicationExpiryDate?: string;
  dateSubmitted?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobRequisitionListItem {
  id: string;
  companyName: string;
  roleTitle: string;
  status: JobStatus;
  statusDisplay: string;
  dateDiscovered: string;
  dateSubmitted?: string;
  applicationExpiryDate?: string;
}

export interface CreateJobRequisitionRequest {
  companyName: string;
  roleTitle: string;
  sourceUrl?: string;
  companyCareerPortalUrl?: string;
  jobDescription?: string;
  dateDiscovered: string;
  applicationExpiryDate?: string;
}

export interface UpdateJobRequisitionRequest extends CreateJobRequisitionRequest {
  dateSubmitted?: string;
}

export interface UpdateJobStatusRequest {
  status: JobStatus;
}

export interface JobRequisitionAcceptedResponse {
  jobReqId: string;
  message: string;
}

export const ContactRoleType = {
  AgencyRecruiter: 'AgencyRecruiter',
  AgencyAccountManager: 'AgencyAccountManager',
  CompanyRecruiter: 'CompanyRecruiter',
  HiringManager: 'HiringManager',
  NetworkContact: 'NetworkContact'
} as const;

export type ContactRoleType = typeof ContactRoleType[keyof typeof ContactRoleType];

export interface ContactResponse {
  id: string;
  name: string;
  email?: string;
  linkedInUrl?: string;
  agencyName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobRequisitionContactResponse {
  id: string;
  jobRequisitionId: string;
  contactId: string;
  contactName: string;
  email?: string;
  linkedInUrl?: string;
  agencyName?: string;
  roleType: ContactRoleType;
  roleTypeDisplay: string;
  createdAt: string;
}

export interface CreateContactRequest {
  name: string;
  email?: string;
  linkedInUrl?: string;
  agencyName?: string;
}

export interface UpdateContactRequest {
  name: string;
  email?: string;
  linkedInUrl?: string;
  agencyName?: string;
}

export interface AddContactToJobRequest {
  contactId: string;
  roleType: ContactRoleType;
}

export interface UpdateJobRequisitionContactRequest {
  roleType: ContactRoleType;
}

export interface CreateAndAddContactRequest {
  name: string;
  email?: string;
  linkedInUrl?: string;
  agencyName?: string;
  roleType: ContactRoleType;
}

export const InteractionType = {
  PhoneScreen: 'PhoneScreen',
  Email: 'Email',
  Interview: 'Interview',
  OfferDiscussion: 'OfferDiscussion',
  Rejection: 'Rejection',
  FollowUp: 'FollowUp',
  ApplicationSubmitted: 'ApplicationSubmitted',
  RecruiterOutreach: 'RecruiterOutreach',
  Networking: 'Networking',
  Note: 'Note'
} as const;

export type InteractionType = typeof InteractionType[keyof typeof InteractionType];

export interface JournalEntryResponse {
  id: string;
  jobRequisitionId: string;
  interactionType: InteractionType;
  interactionTypeDisplay: string;
  notes?: string;
  entryDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJournalEntryRequest {
  interactionType: InteractionType;
  notes?: string;
  entryDate: string;
}

export interface UpdateJournalEntryRequest {
  interactionType: InteractionType;
  notes?: string;
  entryDate: string;
}

export interface ResumeResponse {
  id: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  fileSizeDisplay: string;
  uploadedAt: string;
}

export interface JobResumeLinkResponse {
  id: string;
  jobRequisitionId: string;
  resumeId: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  fileSizeDisplay: string;
  linkedAt: string;
}

export interface LinkResumeToJobRequest {
  resumeId: string;
}
