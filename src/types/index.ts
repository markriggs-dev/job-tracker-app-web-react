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
