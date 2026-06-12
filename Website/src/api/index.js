import { api, masterApi } from './client';
// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
    login: (data) => api.post('/auth/login', data).then(r => r.data),
    register: (data) => api.post('/auth/register', data).then(r => r.data),
    getMe: () => api.get('/auth/me').then(r => r.data),
    me: () => api.get('/auth/me').then(r => r.data), // Alias for compatibility
    logout: () => api.post('/auth/logout').then(r => r.data),
    changePassword: (data) => api.put('/auth/me/password', data).then(r => r.data),
    updateProfile: (data) => api.put('/auth/me', data).then(r => r.data),
};
export const login = (data) => api.post('/auth/login', data).then(r => r.data);
export const register = (data) => api.post('/auth/register', data).then(r => r.data);
export const getMe = () => api.get('/auth/me').then(r => r.data);
export const logout = () => api.post('/auth/logout').then(r => r.data);
export const changePassword = (data) => api.put('/auth/me/password', data).then(r => r.data);
export const updateProfile = (data) => api.put('/auth/me', data).then(r => r.data);
// ── Unidades (Salons) ──────────────────────────────────────────────────────────
export const salonsApi = {
    mine: () => api.get('/unidades/mine').then(r => r.data),
    myUnits: () => api.get('/unidades/my-units').then(r => r.data),
    getById: (id) => api.get(`/unidades/${id}`).then(r => r.data),
    update: (id, data) => api.put(`/unidades/${id}`, data).then(r => r.data),
    create: (data) => api.post('/unidades', data).then(r => r.data),
    delete: (id) => api.delete(`/unidades/${id}`).then(r => r.data),
};
export const getUnidades = (params) => api.get('/unidades', { params }).then(r => r.data);
export const getUnidadeById = (id) => api.get(`/unidades/${id}`).then(r => r.data);
export const getMyUnidades = () => api.get('/unidades/mine').then(r => r.data);
export const createUnidade = (data) => api.post('/unidades', data).then(r => r.data);
export const updateUnidade = (id, data) => api.put(`/unidades/${id}`, data).then(r => r.data);
export const deleteUnidade = (id) => api.delete(`/unidades/${id}`).then(r => r.data);
export const publishUnidade = (id, published) => api.put(`/unidades/${id}`, { published }).then(r => r.data);
// ── Agendamentos ──────────────────────────────────────────────────────────────
export const appointmentsApi = {
    list: (params) => api.get('/appointments', { params }).then(r => r.data),
    getById: (id) => api.get(`/appointments/${id}`).then(r => r.data),
    create: (data) => api.post('/appointments', data).then(r => r.data),
    update: (id, data) => api.put(`/appointments/${id}`, data).then(r => r.data),
    delete: (id) => api.delete(`/appointments/${id}`).then(r => r.data),
    updateStatus: (id, status) => api.patch(`/appointments/${id}/status`, { status }).then(r => r.data),
    clientHistory: (salonId, clientId) => api.get(`/appointments/${salonId}/client/${clientId}/history`).then(r => r.data),
    bySalon: (salonId, params) => api.get(`/appointments/salon/${salonId}`, { params }).then(r => r.data),
};
export const getMyAgendamentos = (page = 1, pageSize = 25, status, unidadeId, search, date, funcionarioId) => api.get(`/appointments/unidade/${unidadeId}/paged`, { params: { page, pageSize, search, status } }).then(r => r.data);
export const getAgendamentoById = (id) => api.get(`/appointments/${id}`).then(r => r.data);
export const createAgendamento = (data) => api.post('/appointments', data).then(r => r.data);
export const updateAgendamentoStatus = (id, status) => api.patch(`/appointments/${id}/status`, { status }).then(r => r.data);
export const cancelAgendamento = (id, reason) => api.delete(`/appointments/${id}`, { params: { reason } }).then(r => r.data);
export const reassignAgendamento = (id, funcionarioId) => api.patch(`/appointments/${id}/status`, { funcionarioId }).then(r => r.data);
export const getClientHistory = (clientId, unidadeId) => api.get(`/appointments/unidade/${unidadeId}/paged`, { params: { search: clientId, pageSize: 50 } }).then(r => r.data);
export const getAvailability = (unidadeId, servicoId, date) => api.get(`/appointments/unidade/${unidadeId}`, { params: { date } }).then(r => r.data);
// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboardSummary = (unidadeId) => api.get(`/appointments/unidade/${unidadeId}/dashboard-summary`).then(r => r.data);
// ── Categorias (Categories) ──────────────────────────────────────────────────
export const categoriesApi = {
    list: () => api.get('/categorias').then(r => r.data),
};
// ── Servicos (Services) ──────────────────────────────────────────────────────
export const servicesApi = {
    list: (salonId) => api.get(`/unidades/${salonId}/servicos`).then(r => r.data),
    create: (salonId, data) => api.post(`/unidades/${salonId}/servicos`, data).then(r => r.data),
    update: (salonId, id, data) => api.put(`/unidades/${salonId}/servicos/${id}`, data).then(r => r.data),
    delete: (salonId, id) => api.delete(`/unidades/${salonId}/servicos/${id}`).then(r => r.data),
};
export const getServicos = (unidadeId) => api.get(`/unidades/${unidadeId}/servicos`).then(r => r.data);
export const createServico = (data) => api.post(`/unidades/${data.unidadeId}/servicos`, data).then(r => r.data);
export const updateServico = (id, data) => api.put(`/unidades/${data.unidadeId}/servicos/${id}`, data).then(r => r.data);
export const deleteServico = (id) => api.delete(`/unidades/0/servicos/${id}`).then(r => r.data);
// ── Funcionarios (Professionals) ──────────────────────────────────────────────
export const professionalsApi = {
    bySalon: (salonId) => api.get(`/unidades/${salonId}/funcionarios`).then(r => r.data),
    timeOptions: (salonId) => api.get('/funcionarios/time-options', { params: salonId ? { salonId } : undefined }).then(r => r.data),
    createByDoc: (salonId, data) => api.post(`/unidades/${salonId}/funcionarios`, data).then(r => r.data),
    update: (id, data) => api.put(`/funcionarios/${id}`, data).then(r => r.data),
    delete: (id) => api.delete(`/funcionarios/${id}`).then(r => r.data),
    reviews: (professionalId) => api.get(`/funcionarios/${professionalId}/reviews`).then(r => r.data),
};
export const getFuncionarios = (unidadeId) => api.get(`/unidades/${unidadeId}/funcionarios`).then(r => r.data);
export const createFuncionario = (data) => api.post(`/unidades/${data.unidadeId}/funcionarios`, data).then(r => r.data);
export const updateFuncionario = (id, data) => api.put(`/funcionarios/${id}`, data).then(r => r.data);
export const deleteFuncionario = (id) => api.delete(`/funcionarios/${id}`).then(r => r.data);
// ── Veiculos ──────────────────────────────────────────────────────────────────
export const getVeiculos = () => api.get('/veiculos').then(r => r.data);
export const createVeiculo = (data) => api.post('/veiculos', data).then(r => r.data);
export const updateVeiculo = (id, data) => api.put(`/veiculos/${id}`, data).then(r => r.data);
export const deleteVeiculo = (id) => api.delete(`/veiculos/${id}`).then(r => r.data);
// ── Categorias ────────────────────────────────────────────────────────────────
export const getCategorias = () => api.get('/categorias').then(r => r.data);
export const createCategoria = (data) => api.post('/categorias', data).then(r => r.data);
export const deleteCategoria = (id) => api.delete(`/categorias/${id}`).then(r => r.data);
// ── Reviews (Avaliacoes) ─────────────────────────────────────────────────────
export const reviewsApi = {
    bySalon: (salonId) => api.get(`/reviews/salon/${salonId}`).then(r => r.data),
};
// ── Subscriptions (Assinaturas) ──────────────────────────────────────────────
export const subscriptionsApi = {
    current: () => api.get('/subscriptions/current').then(r => r.data),
    activateTrial: () => api.post('/subscriptions/trial').then(r => r.data),
    upgrade: (data) => api.post('/subscriptions/upgrade', data).then(r => r.data),
    startPaidCheckout: (planId) => api.post('/subscriptions/checkout', { planId }).then(r => r.data),
    pendingCheckout: () => api.get('/subscriptions/pending-checkout').then(r => r.data),
    cancel: () => api.delete('/subscriptions/current').then(r => r.data),
};
// ── Notificacoes ──────────────────────────────────────────────────────────────
export const getNotificacoes = () => api.get('/notificacoes').then(r => r.data);
export const markNotificacaoRead = (id) => api.patch(`/notificacoes/${id}/read`).then(r => r.data);
export const markAllNotificacoesRead = () => api.post('/notificacoes/mark-all-read').then(r => r.data);
// ── Marketing ─────────────────────────────────────────────────────────────────
export const marketingApi = {
    broadcast: (data) => api.post('/marketing/broadcast', data).then(r => r.data),
};
// ── Privacy ───────────────────────────────────────────────────────────────────
export const privacyApi = {
    exportData: () => api.get('/privacy/export').then(r => r.data),
    deleteAccount: () => api.delete('/privacy/account').then(r => r.data),
};
// ── Legal ─────────────────────────────────────────────────────────────────────
export const legalApi = {
    getPrivacyPolicy: () => api.get('/legal/privacy-policy').then(r => r.data),
    getTermsOfUse: () => api.get('/legal/terms-of-use').then(r => r.data),
    getLegalDocuments: (context) => api.get(`/legal/documents/${context}`).then(r => r.data),
};
export const legalDocumentsApi = {
    getByContext: (context) => api.get(`/legal/documents/${context}`).then(r => r.data),
    acceptConsent: (data) => api.post('/legal/consent', data).then(r => r.data),
    listActive: () => api.get('/legal/documents/active').then(r => r.data),
};
// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
    getBusinessReports: (period, unidadeId) => api.get('/reports/business', { params: { period, unidadeId } }).then(r => r.data),
};
export const supportApi = {
    getSettings: () => api.get('/support/settings').then(r => r.data),
    updateSettings: (data) => api.put('/support/settings', data).then(r => r.data),
    sendContact: (data) => api.post('/support/contact', data).then(r => r.data),
    getContact: () => api.get('/support/contact').then(r => r.data),
};
// ── Admin/Master ──────────────────────────────────────────────────────────────
export const getAllUsers = (params) => api.get('/admin/users', { params }).then(r => r.data);
export const getAdminStats = () => masterApi.get('/admin/stats').then(r => r.data);
export const getPlanos = () => api.get('/planos').then(r => r.data);
export const getAssinaturas = () => masterApi.get('/admin/assinaturas').then(r => r.data);
// ── Master Subscriptions ──────────────────────────────────────────────────────
export const masterSubscriptionsApi = {
    cancel: (id) => masterApi.patch(`/admin/assinaturas/${id}/cancel`).then(r => r.data),
    monitor: () => masterApi.get('/admin/assinaturas/monitor').then(r => r.data),
    manualGrant: (data) => masterApi.post('/admin/assinaturas/manual-grant', data).then(r => r.data),
};
// ── Master Payments ───────────────────────────────────────────────────────────
export const masterPaymentsApi = {
    list: (params) => masterApi.get('/admin/payments', { params }).then(r => r.data),
    getById: (id) => masterApi.get(`/admin/payments/${id}`).then(r => r.data),
};
// ── Plans (landing page) ──────────────────────────────────────────────────────
export const plansApi = {
    list: () => api.get('/planos').then(r => r.data),
};
// ── Support ───────────────────────────────────────────────────────────────────
export const getSupportContact = () => api.get('/support/contact').then(r => r.data);
