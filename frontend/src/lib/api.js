import axios from 'axios';

let API_URL = import.meta.env.VITE_API_URL;
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  API_URL = '/_/backend';
} else if (!API_URL) {
  API_URL = 'http://localhost:8000';
}
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getCustomers = (params) => api.get('/customers/', { params });
export const getCustomerStats = () => api.get('/customers/stats');
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const getCities = () => api.get('/customers/cities');

export const getCampaigns = () => api.get('/campaigns/');
export const createCampaign = (data) => api.post('/campaigns/', data);
export const launchCampaign = (id) => api.post(`/campaigns/${id}/send`);
export const getCampaign = (id) => api.get(`/campaigns/${id}`);
export const getCampaignStats = (id) => api.get(`/campaigns/${id}/stats`);

export const aiSegment = (query) => api.post('/ai/segment', { query });
export const aiDraftMessage = (data) => api.post('/ai/draft-message', data);
export const aiRefineMessage = (data) => api.post('/ai/refine-message', data);
export const aiWhatIf = (data) => api.post('/ai/what-if', data);
export const aiInsights = (question, campaign_id) => api.post('/ai/insights', { question, campaign_id });
export const aiDiagnose = (customer_id) => api.post(`/ai/diagnose/${customer_id}`);

export const getFeedbacks = (params) => api.get('/feedback/', { params });
export const submitFeedback = (data) => api.post('/feedback/', data);
export const getFeedbackAnalysis = () => api.get('/feedback/analysis');
export const deleteFeedback = (id) => api.delete(`/feedback/${id}`);
export const exportFeedbackCSV = () => `${API_URL}/feedback/export`;

export default api;

