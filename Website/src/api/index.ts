import { api } from './client';

// Auth
export const login = (data: any) => api.post('/auth/login', data).then(r => r.data);
export const register = (data: any) => api.post('/auth/register', data).then(r => r.data);
export const getMe = () => api.get('/auth/me').then(r => r.data);
export const logout = () => api.post('/auth/logout').then(r => r.data);
export const changePassword = (data: any) => api.put('/auth/me/password', data).then(r => r.data);
export const updateProfile = (data: any) => api.put('/auth/profile', data).then(r => r.data);

// Unidades
export const getUnidades = (params?: any) => api.get('/unidades', { params }).then(r => r.data);
export const getUnidadeById = (id: string) => api.get(`/unidades/${id}`).then(r => r.data);
export const getMyUnidades = () => api.get('/unidades/minhas').then(r => r.data);
export const createUnidade = (data: any) => api.post('/unidades', data).then(r => r.data);
export const updateUnidade = (id: string, data: any) => api.put(`/unidades/${id}`, data).then(r => r.data);
export const deleteUnidade = (id: string) => api.delete(`/unidades/${id}`).then(r => r.data);

// Agendamentos
export const getMyAgendamentos = (page = 1, pageSize = 20, status?: string) =>
  api.get('/agendamentos', { params: { page, pageSize, status } }).then(r => r.data);
export const getAgendamentoById = (id: string) => api.get(`/agendamentos/${id}`).then(r => r.data);
export const createAgendamento = (data: any) => api.post('/agendamentos', data).then(r => r.data);
export const updateAgendamentoStatus = (id: string, status: string) =>
  api.patch(`/agendamentos/${id}/status`, { status }).then(r => r.data);
export const cancelAgendamento = (id: string, reason?: string) =>
  api.delete(`/agendamentos/${id}`, { params: { reason } }).then(r => r.data);

// Dashboard
export const getDashboardSummary = () => api.get('/agendamentos/dashboard-summary').then(r => r.data);

// Servicos
export const getServicos = (unidadeId?: string) => api.get('/servicos', { params: { unidadeId } }).then(r => r.data);
export const createServico = (data: any) => api.post('/servicos', data).then(r => r.data);
export const updateServico = (id: string, data: any) => api.put(`/servicos/${id}`, data).then(r => r.data);
export const deleteServico = (id: string) => api.delete(`/servicos/${id}`).then(r => r.data);

// Funcionarios
export const getFuncionarios = () => api.get('/funcionarios').then(r => r.data);
export const createFuncionario = (data: any) => api.post('/funcionarios', data).then(r => r.data);
export const deleteFuncionario = (id: string) => api.delete(`/funcionarios/${id}`).then(r => r.data);

// Veiculos
export const getVeiculos = () => api.get('/veiculos').then(r => r.data);
export const createVeiculo = (data: any) => api.post('/veiculos', data).then(r => r.data);
export const updateVeiculo = (id: string, data: any) => api.put(`/veiculos/${id}`, data).then(r => r.data);
export const deleteVeiculo = (id: string) => api.delete(`/veiculos/${id}`).then(r => r.data);

// Categorias
export const getCategorias = () => api.get('/categorias').then(r => r.data);
export const createCategoria = (data: any) => api.post('/categorias', data).then(r => r.data);
export const deleteCategoria = (id: string) => api.delete(`/categorias/${id}`).then(r => r.data);

// Notificacoes
export const getNotificacoes = () => api.get('/notificacoes').then(r => r.data);

// Admin/Master endpoints
export const getAllUsers = (params?: any) => api.get('/admin/users', { params }).then(r => r.data);
export const getAdminStats = () => api.get('/admin/stats').then(r => r.data);
export const getPlanos = () => api.get('/planos').then(r => r.data);
export const getAssinaturas = () => api.get('/admin/assinaturas').then(r => r.data);
