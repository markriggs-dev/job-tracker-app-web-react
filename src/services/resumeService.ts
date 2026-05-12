import apiClient from './apiClient';
import type { ResumeResponse, JobDocumentsResponse, LinkDocumentToJobRequest } from '../types/index';

export const resumeService = {
  getAll: async (): Promise<ResumeResponse[]> => {
    const response = await apiClient.get('/api/resumes');
    return response.data;
  },

  upload: async (file: File): Promise<ResumeResponse> => {
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.post('/api/resumes', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  downloadFile: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/resumes/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/resumes/${id}`);
  },

  getJobDocuments: async (jobId: string): Promise<JobDocumentsResponse> => {
    const response = await apiClient.get(`/api/jobs/${jobId}/documents`);
    return response.data;
  },

  linkDocumentToJob: async (jobId: string, data: LinkDocumentToJobRequest): Promise<void> => {
    await apiClient.put(`/api/jobs/${jobId}/documents`, data);
  },

  unlinkDocumentFromJob: async (jobId: string, documentType: 'Resume' | 'CoverLetter'): Promise<void> => {
    await apiClient.delete(`/api/jobs/${jobId}/documents/${documentType}`);
  }
};
