import apiClient from './apiClient';

export interface FeedbackPayload {
  content: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
}

const feedbackService = {
  submit: (payload: FeedbackPayload) =>
    apiClient.post('/api/feedback', payload),
};

export default feedbackService;
