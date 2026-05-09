import apiClient from './apiClient';
import type { AiProfileResponse, CreateAiProfileRequest, UpdateAiProfileRequest, GeneratedResumeResponse, GenerateResumeRequest } from '../types/index';

export const aiService = {
  // AI Profiles
  getAllProfiles: async (): Promise<AiProfileResponse[]> => {
    const response = await apiClient.get('/api/ai-profiles');
    return response.data;
  },

  createProfile: async (data: CreateAiProfileRequest): Promise<AiProfileResponse> => {
    const response = await apiClient.post('/api/ai-profiles', data);
    return response.data;
  },

  updateProfile: async (id: string, data: UpdateAiProfileRequest): Promise<AiProfileResponse> => {
    const response = await apiClient.put(`/api/ai-profiles/${id}`, data);
    return response.data;
  },

  deleteProfile: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/ai-profiles/${id}`);
  },

  // Generated Resumes
  getGeneratedResumes: async (jobId: string): Promise<GeneratedResumeResponse[]> => {
    const response = await apiClient.get(`/api/jobs/${jobId}/generated-resumes`);
    return response.data;
  },

  generateResume: async (jobId: string, data: GenerateResumeRequest): Promise<GeneratedResumeResponse> => {
    const response = await apiClient.post(`/api/jobs/${jobId}/generated-resumes`, data);
    return response.data;
  },

  downloadGeneratedResume: async (jobId: string, resumeId: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/jobs/${jobId}/generated-resumes/${resumeId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  deleteGeneratedResume: async (jobId: string, resumeId: string): Promise<void> => {
    await apiClient.delete(`/api/jobs/${jobId}/generated-resumes/${resumeId}`);
  }
};
