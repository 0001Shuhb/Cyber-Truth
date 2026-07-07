import api from './api';
export const scanUrl = (payload) => api.post('/scan/url', payload);
export const scanEmail = (payload) => api.post('/scan/email', payload);
export const scanWebsite = (payload) => api.post('/scan/website', payload);
