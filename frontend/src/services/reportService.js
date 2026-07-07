import api from './api';
export const generateReport = (id) => api.get(`/report/${id}`);
