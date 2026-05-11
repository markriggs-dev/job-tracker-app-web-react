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
  // Always parse just the date portion as local midnight — avoids UTC offset rollback
  // regardless of whether the string is date-only or a full DateTimeOffset from the API
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};
