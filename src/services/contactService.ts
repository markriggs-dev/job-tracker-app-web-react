import apiClient from './apiClient';

import type {
  ContactResponse,
  JobRequisitionContactResponse,
  CreateContactRequest,
  UpdateContactRequest,
  AddContactToJobRequest,
  CreateAndAddContactRequest,
  UpdateJobRequisitionContactRequest
} from '../types/index';

export const contactService = {
  getAll: async (): Promise<ContactResponse[]> => {
    const response = await apiClient.get('/api/contacts');
    return response.data;
  },

  search: async (keyword?: string): Promise<ContactResponse[]> => {
    const params: Record<string, string> = {};
    if (keyword) params.keyword = keyword;
    const response = await apiClient.get('/api/contacts/search', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ContactResponse> => {
    const response = await apiClient.get(`/api/contacts/${id}`);
    return response.data;
  },

  create: async (data: CreateContactRequest): Promise<ContactResponse> => {
    const response = await apiClient.post('/api/contacts', data);
    return response.data;
  },

  update: async (id: string, data: UpdateContactRequest): Promise<ContactResponse> => {
    const response = await apiClient.put(`/api/contacts/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/contacts/${id}`);
  },

  getContactsForJob: async (jobId: string): Promise<JobRequisitionContactResponse[]> => {
    const response = await apiClient.get(`/api/jobs/${jobId}/contacts`);
    return response.data;
  },

  addContactToJob: async (jobId: string, data: AddContactToJobRequest): Promise<JobRequisitionContactResponse> => {
    const response = await apiClient.post(`/api/jobs/${jobId}/contacts`, data);
    return response.data;
  },

  createAndAddContactToJob: async (jobId: string, data: CreateAndAddContactRequest): Promise<JobRequisitionContactResponse> => {
    const response = await apiClient.post(`/api/jobs/${jobId}/contacts/new`, data);
    return response.data;
  },

  updateContactRole: async (jobId: string, linkId: string, data: UpdateJobRequisitionContactRequest): Promise<JobRequisitionContactResponse> => {
    const response = await apiClient.patch(`/api/jobs/${jobId}/contacts/${linkId}`, data);
    return response.data;
  },

  removeContactFromJob: async (jobId: string, linkId: string): Promise<void> => {
    await apiClient.delete(`/api/jobs/${jobId}/contacts/${linkId}`);
  }
};
