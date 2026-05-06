import apiClient from './apiClient';
import type { ResumeResponse, JobResumeLinkResponse, LinkResumeToJobRequest } from '../types/index';

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

  getDownloadUrl: (id: string): string =>
    `${import.meta.env.VITE_GATEWAY_URL}/api/resumes/${id}/download`,

  downloadFile: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/resumes/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/resumes/${id}`);
  },

  getJobResume: async (jobId: string): Promise<JobResumeLinkResponse | null> => {
    const response = await apiClient.get(`/api/jobs/${jobId}/resume`);
    return response.data;
  },

  linkToJob: async (jobId: string, data: LinkResumeToJobRequest): Promise<JobResumeLinkResponse> => {
    const response = await apiClient.put(`/api/jobs/${jobId}/resume`, data);
    return response.data;
  },

  unlinkFromJob: async (jobId: string): Promise<void> => {
    await apiClient.delete(`/api/jobs/${jobId}/resume`);
  }
};
