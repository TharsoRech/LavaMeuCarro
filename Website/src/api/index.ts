import { api, masterApi } from './client';
import type {
  MarketingBroadcastRequest,
  BusinessReportsDto,
  MasterManualSubscriptionRequest,
  MasterManualSubscriptionResponse,
  MasterSubscriptionMonitorResponse,
  MasterPaymentRecordDto,
  MasterStats,
  LegalDocumentDto,
  PrivacyExportResponse,
} from '../types';

// ── Auth ──────────────────────────────────────────────────────────────────────

export const login = (data: any) => api.post('/auth/login', data).then(r => r.data);
export const register = (data: any) => api.post('/auth/register', data).then(r => r.data);
export const getMe = () => api.get('/auth/me').then(r => r.data);
export const logout = () => api.post('/auth/logout').then(r => r.data);
export const changePassword = (data: any) => api.put('/auth/me/password', data).then(r => r.data);
export const updateProfile = (data: any) => api.put('/auth/me', data).then(r => r.data);

// ── Unidades ──────────────────────────────────────────────────────────────────

export const getUnidades = (params?: any) => api.get('/unidades', { params }).then(r => r.data);
export const getUnidadeById = (id: number) => api.get(`/unidades/${id}`).then(r => r.data);
export const getMyUnidades = () => api.get('/unidades/mine').then(r => r.data);
export const createUnidade = (data: any) => api.post('/unidades', data).then(r => r.data);
export const updateUnidade = (id: number, data: any) => api.put(`/unidades/${id}`, data).then(r => r.data);
export const deleteUnidade = (id: number) => api.delete(`/unidades/${id}`).then(r => r.data);
export const publishUnidade = (id: number, published: boolean) => api.put(`/unidades/${id}`, { published }).then(r => r.data);

// ── Agendamentos ──────────────────────────────────────────────────────────────

export const getMyAgendamentos = (page = 1, pageSize = 25, status?: string, unidadeId?: number, search?: string, date?: string, funcionarioId?: number) =>
  api.get(`/appointments/unidade/${unidadeId}/paged`, { params: { page, pageSize, search, status } }).then(r => r.data);
export const getAgendamentoById = (id: number) => api.get(`/appointments/${id}`).then(r => r.data);
export const createAgendamento = (data: any) => api.post('/appointments', data).then(r => r.data);
export const updateAgendamentoStatus = (id: number, status: string) =>
  api.patch(`/appointments/${id}/status`, { status }).then(r => r.data);
export const cancelAgendamento = (id: number, reason?: string) =>
  api.delete(`/appointments/${id}`, { params: { reason } }).then(r => r.data);
export const reassignAgendamento = (id: number, funcionarioId: number) =>
  api.patch(`/appointments/${id}/status`, { funcionarioId }).then(r => r.data);
export const getClientHistory = (clientId: number, unidadeId?: number) =>
  api.get(`/appointments/unidade/${unidadeId}/paged`, { params: { search: clientId, pageSize: 50 } }).then(r => r.data);
export const getAvailability = (unidadeId: number, servicoId: number, date: string) =>
  api.get(`/appointments/unidade/${unidadeId}`, { params: { date } }).then(r => r.data);

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const getDashboardSummary = (unidadeId?: number) =>
  api.get(`/appointments/unidade/${unidadeId}/dashboard-summary`).then(r => r.data);

// ── Servicos ──────────────────────────────────────────────────────────────────

export const getServicos = (unidadeId?: number) => api.get(`/unidades/${unidadeId}/servicos`).then(r => r.data);
export const createServico = (data: any) => api.post(`/unidades/${data.unidadeId}/servicos`, data).then(r => r.data);
export const updateServico = (id: number, data: any) => api.put(`/unidades/${data.unidadeId}/servicos/${id}`, data).then(r => r.data);
export const deleteServico = (id: number) => api.delete(`/unidades/0/servicos/${id}`).then(r => r.data);

// ── Funcionarios ──────────────────────────────────────────────────────────────

export const getFuncionarios = (unidadeId?: number) => api.get(`/unidades/${unidadeId}/funcionarios`).then(r => r.data);
export const createFuncionario = (data: any) => api.post(`/unidades/${data.unidadeId}/funcionarios`, data).then(r => r.data);
export const updateFuncionario = (id: number, data: any) => api.put(`/funcionarios/${id}`, data).then(r => r.data);
export const deleteFuncionario = (id: number) => api.delete(`/funcionarios/${id}`).then(r => r.data);

// ── Veiculos ──────────────────────────────────────────────────────────────────

export const getVeiculos = () => api.get('/veiculos').then(r => r.data);
export const createVeiculo = (data: any) => api.post('/veiculos', data).then(r => r.data);
export const updateVeiculo = (id: number, data: any) => api.put(`/veiculos/${id}`, data).then(r => r.data);
export const deleteVeiculo = (id: number) => api.delete(`/veiculos/${id}`).then(r => r.data);

// ── Categorias ────────────────────────────────────────────────────────────────

export const getCategorias = () => api.get('/categorias').then(r => r.data);
export const createCategoria = (data: any) => api.post('/categorias', data).then(r => r.data);
export const deleteCategoria = (id: number) => api.delete(`/categorias/${id}`).then(r => r.data);

// ── Notificacoes ──────────────────────────────────────────────────────────────

export const getNotificacoes = () => api.get('/notificacoes').then(r => r.data);
export const markNotificacaoRead = (id: number) => api.patch(`/notificacoes/${id}/read`).then(r => r.data);
export const markAllNotificacoesRead = () => api.post('/notificacoes/mark-all-read').then(r => r.data);

// ── Marketing ─────────────────────────────────────────────────────────────────

export const marketingApi = {
  broadcast: (data: MarketingBroadcastRequest) => api.post('/marketing/broadcast', data).then(r => r.data),
};

// ── Privacy ───────────────────────────────────────────────────────────────────

export const privacyApi = {
  exportData: () => api.get<PrivacyExportResponse>('/privacy/export').then(r => r.data),
  deleteAccount: () => api.delete('/privacy/account').then(r => r.data),
};

// ── Legal ─────────────────────────────────────────────────────────────────────

export const legalApi = {
  getPrivacyPolicy: () => api.get<LegalDocumentDto>('/legal/privacy-policy').then(r => r.data),
  getTermsOfUse: () => api.get<LegalDocumentDto>('/legal/terms-of-use').then(r => r.data),
  getLegalDocuments: (context: string) => api.get<LegalDocumentDto[]>(`/legal/documents/${context}`).then(r => r.data),
};

// ── Reports ───────────────────────────────────────────────────────────────────

export const reportsApi = {
  getBusinessReports: (period: string, unidadeId?: number) =>
    api.get<BusinessReportsDto>('/reports/business', { params: { period, unidadeId } }).then(r => r.data),
};

// ── Admin/Master ──────────────────────────────────────────────────────────────

export const getAllUsers = (params?: any) => api.get('/admin/users', { params }).then(r => r.data);
export const getAdminStats = () => masterApi.get<MasterStats>('/admin/stats').then(r => r.data);
export const getPlanos = () => api.get('/planos').then(r => r.data);
export const getAssinaturas = () => masterApi.get('/admin/assinaturas').then(r => r.data);

// ── Master Subscriptions ──────────────────────────────────────────────────────

export const masterSubscriptionsApi = {
  cancel: (id: number) => masterApi.patch(`/admin/assinaturas/${id}/cancel`).then(r => r.data),
  monitor: () => masterApi.get<MasterSubscriptionMonitorResponse>('/admin/assinaturas/monitor').then(r => r.data),
  manualGrant: (data: MasterManualSubscriptionRequest) =>
    masterApi.post<MasterManualSubscriptionResponse>('/admin/assinaturas/manual-grant', data).then(r => r.data),
};

// ── Master Payments ───────────────────────────────────────────────────────────

export const masterPaymentsApi = {
  list: (params?: { status?: string; page?: number; pageSize?: number }) =>
    masterApi.get<{ items: MasterPaymentRecordDto[]; total: number }>('/admin/payments', { params }).then(r => r.data),
  getById: (id: number) => masterApi.get(`/admin/payments/${id}`).then(r => r.data),
};

// ── Plans (landing page) ──────────────────────────────────────────────────────

export const plansApi = {
  list: () => api.get<any[]>('/planos').then(r => r.data),
};

// ── Support ───────────────────────────────────────────────────────────────────

export const getSupportContact = () => api.get('/support/contact').then(r => r.data);
