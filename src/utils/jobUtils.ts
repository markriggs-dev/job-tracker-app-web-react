import { JobStatus } from '../types/index';

export const SUBMITTED_STATUSES = new Set<JobStatus>([
  JobStatus.Applied,
  JobStatus.InProgress,
  JobStatus.WaitingOnResponse,
  JobStatus.InterviewScheduled,
  JobStatus.OfferReceived,
]);

export const isSubmissionImplied = (status: JobStatus): boolean =>
  SUBMITTED_STATUSES.has(status);

export const formatJobDate = (dateString: string | undefined): string => {
  if (!dateString) return '—';
  // Date-only strings (no T) are UTC midnight — append local time marker to prevent day rollback
  const normalized = dateString.includes('T') ? dateString : dateString + 'T00:00:00';
  return new Date(normalized).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};
