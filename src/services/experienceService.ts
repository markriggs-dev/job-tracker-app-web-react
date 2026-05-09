import apiClient from './apiClient';
import type { ExperienceProfileResponse } from '../types/index';

export const experienceService = {
  getAll: async (): Promise<ExperienceProfileResponse[]> => {
    const response = await apiClient.get('/api/experience-profiles');
    return response.data;
  },

  upload: async (profileName: string, file: File): Promise<ExperienceProfileResponse> => {
    const form = new FormData();
    form.append('profileName', profileName);
    form.append('file', file);
    const response = await apiClient.post('/api/experience-profiles', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  downloadFile: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/experience-profiles/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/experience-profiles/${id}`);
  }
};
