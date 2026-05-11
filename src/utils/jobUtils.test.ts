import { describe, it, expect } from 'vitest';
import { JobStatus } from '../types/index';
import { SUBMITTED_STATUSES, isSubmissionImplied, formatJobDate } from './jobUtils';

describe('SUBMITTED_STATUSES', () => {
  it('includes all statuses that imply an application was sent', () => {
    expect(SUBMITTED_STATUSES.has(JobStatus.Applied)).toBe(true);
    expect(SUBMITTED_STATUSES.has(JobStatus.InProgress)).toBe(true);
    expect(SUBMITTED_STATUSES.has(JobStatus.WaitingOnResponse)).toBe(true);
    expect(SUBMITTED_STATUSES.has(JobStatus.InterviewScheduled)).toBe(true);
    expect(SUBMITTED_STATUSES.has(JobStatus.OfferReceived)).toBe(true);
  });

  it('excludes statuses that do not imply submission', () => {
    expect(SUBMITTED_STATUSES.has(JobStatus.Discovered)).toBe(false);
    expect(SUBMITTED_STATUSES.has(JobStatus.Closed)).toBe(false);
    expect(SUBMITTED_STATUSES.has(JobStatus.Withdrawn)).toBe(false);
  });
});

describe('isSubmissionImplied', () => {
  it.each([
    JobStatus.Applied,
    JobStatus.InProgress,
    JobStatus.WaitingOnResponse,
    JobStatus.InterviewScheduled,
    JobStatus.OfferReceived,
  ])('returns true for %s', (status) => {
    expect(isSubmissionImplied(status)).toBe(true);
  });

  it.each([
    JobStatus.Discovered,
    JobStatus.Closed,
    JobStatus.Withdrawn,
  ])('returns false for %s', (status) => {
    expect(isSubmissionImplied(status)).toBe(false);
  });
});

describe('formatJobDate', () => {
  it('returns em dash for undefined input', () => {
    expect(formatJobDate(undefined)).toBe('—');
  });

  it('formats a full ISO datetime string', () => {
    const result = formatJobDate('2026-05-10T00:00:00Z');
    expect(result).toMatch(/May/);
    expect(result).toMatch(/2026/);
  });

  it('formats a date-only string without rolling back a day due to UTC offset', () => {
    const result = formatJobDate('2026-05-05');
    expect(result).toMatch(/May/);
    expect(result).toMatch(/5/);
    expect(result).toMatch(/2026/);
    expect(result).not.toMatch(/May 4/);
  });
});
