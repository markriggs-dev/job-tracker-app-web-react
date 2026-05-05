import { resumeApiClient } from './apiClient';
import type { ResumeResponse, JobResumeLinkResponse, LinkResumeToJobRequest } from '../types/index';

export const resumeService = {
  getAll: async (): Promise<ResumeResponse[]> => {
    const response = await resumeApiClient.get('/api/resumes');
    return response.data;
  },

  upload: async (file: File): Promise<ResumeResponse> => {
    const form = new FormData();
    form.append('file', file);
    const response = await resumeApiClient.post('/api/resumes', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getDownloadUrl: (id: string): string =>
    `${resumeApiClient.defaults.baseURL}/api/resumes/${id}/download`,

  downloadFile: async (id: string): Promise<Blob> => {
    const response = await resumeApiClient.get(`/api/resumes/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await resumeApiClient.delete(`/api/resumes/${id}`);
  },

  getJobResume: async (jobId: string): Promise<JobResumeLinkResponse | null> => {
    try {
      const response = await resumeApiClient.get(`/api/jobs/${jobId}/resume`);
      return response.data;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response: { status: number } };
        if (axiosErr.response?.status === 404) return null;
      }
      throw err;
    }
  },

  linkToJob: async (jobId: string, data: LinkResumeToJobRequest): Promise<JobResumeLinkResponse> => {
    const response = await resumeApiClient.put(`/api/jobs/${jobId}/resume`, data);
    return response.data;
  },

  unlinkFromJob: async (jobId: string): Promise<void> => {
    await resumeApiClient.delete(`/api/jobs/${jobId}/resume`);
  }
};
