import { journalApiClient } from './apiClient';
import type {
  JournalEntryResponse,
  CreateJournalEntryRequest,
  UpdateJournalEntryRequest
} from '../types/index';

export const journalService = {
  getEntriesForJob: async (jobId: string): Promise<JournalEntryResponse[]> => {
    const response = await journalApiClient.get(`/api/jobs/${jobId}/journal`);
    return response.data;
  },

  create: async (jobId: string, data: CreateJournalEntryRequest): Promise<JournalEntryResponse> => {
    const response = await journalApiClient.post(`/api/jobs/${jobId}/journal`, data);
    return response.data;
  },

  update: async (jobId: string, id: string, data: UpdateJournalEntryRequest): Promise<JournalEntryResponse> => {
    const response = await journalApiClient.put(`/api/jobs/${jobId}/journal/${id}`, data);
    return response.data;
  },

  delete: async (jobId: string, id: string): Promise<void> => {
    await journalApiClient.delete(`/api/jobs/${jobId}/journal/${id}`);
  }
};
