import { api } from './client';

// Auth
export const login = (data: any) => api.post('/auth/login', data);
export const register = (data: any) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');
export const logout = () => api.post('/auth/logout');
export const changePassword = (data: any) => api.put('/auth/me/password', data);
export const updateProfile = (data: any) => api.put('/auth/profile', data);

// Unidades
export const getUnidades = (params?: any) => api.get('/unidades', { params });
export const getUnidadeById = (id: string) => api.get(`/unidades/${id}`);
export const getMyUnidades = () => api.get('/unidades/minhas');
export const createUnidade = (data: any) => api.post('/unidades', data);
export const updateUnidade = (id: string, data: any) => api.put(`/unidades/${id}`, data);
export const deleteUnidade = (id: string) => api.delete(`/unidades/${id}`);

// Agendamentos
export const getMyAgendamentos = (page = 1, pageSize = 20, status?: string) =>
  api.get('/agendamentos', { params: { page, pageSize, status } });
export const getAgendamentoById = (id: string) => api.get(`/agendamentos/${id}`);
export const createAgendamento = (data: any) => api.post('/agendamentos', data);
export const updateAgendamentoStatus = (id: string, status: string) =>
  api.patch(`/agendamentos/${id}/status`, { status });
export const cancelAgendamento = (id: string, reason?: string) =>
  api.delete(`/agendamentos/${id}`, { params: { reason } });

// Dashboard
export const getDashboardSummary = () => api.get('/agendamentos/dashboard-summary');

// Servicos
export const getServicos = (unidadeId?: string) => api.get('/servicos', { params: { unidadeId } });
export const createServico = (data: any) => api.post('/servicos', data);
export const updateServico = (id: string, data: any) => api.put(`/servicos/${id}`, data);
export const deleteServico = (id: string) => api.delete(`/servicos/${id}`);

// Funcionarios
export const getFuncionarios = () => api.get('/funcionarios');
export const createFuncionario = (data: any) => api.post('/funcionarios', data);
export const deleteFuncionario = (id: string) => api.delete(`/funcionarios/${id}`);

// Veiculos
export const getVeiculos = () => api.get('/veiculos');
export const createVeiculo = (data: any) => api.post('/veiculos', data);
export const updateVeiculo = (id: string, data: any) => api.put(`/veiculos/${id}`, data);
export const deleteVeiculo = (id: string) => api.delete(`/veiculos/${id}`);

// Categorias
export const getCategorias = () => api.get('/categorias');
export const createCategoria = (data: any) => api.post('/categorias', data);
export const deleteCategoria = (id: string) => api.delete(`/categorias/${id}`);

// Notificacoes
export const getNotificacoes = () => api.get('/notificacoes');

// Admin/Master endpoints
export const getAllUsers = (params?: any) => api.get('/admin/users', { params });
export const getAdminStats = () => api.get('/admin/stats');
export const getPlanos = () => api.get('/planos');
export const getAssinaturas = () => api.get('/admin/assinaturas');
