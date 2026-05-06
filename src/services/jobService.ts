import apiClient from './apiClient';

import type {
  JobRequisition,
  JobRequisitionListItem,
  JobRequisitionAcceptedResponse,
  CreateJobRequisitionRequest,
  UpdateJobRequisitionRequest,
  UpdateJobStatusRequest
} from '../types/index';

import { JobStatus } from '../types/index';

export const jobService = {
  getAll: async (): Promise<JobRequisitionListItem[]> => {
    const response = await apiClient.get('/api/jobs');
    return response.data;
  },

  search: async (keyword?: string, status?: JobStatus): Promise<JobRequisitionListItem[]> => {
    const params: Record<string, string> = {};
    if (keyword) params.keyword = keyword;
    if (status) params.status = status;
    const response = await apiClient.get('/api/jobs/search', { params });
    return response.data;
  },

  getById: async (id: string): Promise<JobRequisition> => {
    const response = await apiClient.get(`/api/jobs/${id}`);
    return response.data;
  },

  create: async (data: CreateJobRequisitionRequest): Promise<JobRequisitionAcceptedResponse> => {
    const response = await apiClient.post('/api/jobs', data);
    return response.data;
  },

  update: async (id: string, data: UpdateJobRequisitionRequest): Promise<JobRequisitionAcceptedResponse> => {
    const response = await apiClient.put(`/api/jobs/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: string, data: UpdateJobStatusRequest): Promise<JobRequisition> => {
    const response = await apiClient.patch(`/api/jobs/${id}/status`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/jobs/${id}`);
  }
};
