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
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};
