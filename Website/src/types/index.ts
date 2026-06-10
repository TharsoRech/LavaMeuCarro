export enum UserType { Client = 0, Profissional = 1, Owner = 2, Admin = 3 }
export enum AgendamentoStatus { Pendente = 1, Confirmado = 2, Cancelado = 3, Finalizado = 4, NoShow = 5, ACaminho = 6, EmExecucao = 7, Pronto = 8 }
export enum SubscriptionStatus { None = 0, Active = 1, Cancelled = 2, Expired = 3, Suspended = 4, PaymentFailed = 5 }

export interface User { id: number; nome: string; email: string; telefone?: string; tipo: UserType; active: boolean; createdAt: string; }
export interface Unidade { id: number; ownerId: number; name: string; description?: string; address: string; city: string; state: string; phone?: string; active: boolean; published: boolean; averageRating?: number; reviews: number; ofereceLevaTraz: boolean; }
export interface Agendamento { id: number; clientId: number; funcionarioId: number; servicoId: number; unidadeId: number; veiculoId: number; scheduledAt: string; durationMinutes: number; totalPrice: number; status: AgendamentoStatus; modalidade: string; precoBruto: number; notes?: string; clientName?: string; servicoName?: string; }
export interface Servico { id: number; unidadeId: number; categoryId: number; name: string; description?: string; price: number; durationMinutes: number; active: boolean; }
export interface Funcionario { id: number; userId: number; unidadeId: number; specialty?: string; bio?: string; averageRating?: number; active: boolean; }
export interface Veiculo { id: number; clientId: number; placa: string; marca: string; modelo: string; cor?: string; tamanho: string; }
export interface Categoria { id: number; name: string; iconUrl?: string; active: boolean; }
export interface Plano { id: number; name: string; description?: string; price: number; periodDays: number; appointmentLimit?: number; active: boolean; }
export interface Assinatura { id: number; ownerId: number; planoId: number; status: SubscriptionStatus; startDate?: string; endDate?: string; agendamentosNoMes: number; }
export interface DashboardSummary { totalHoje: number; confirmados: number; pendentes: number; finalizadosMes: number; faturamentoMes: number; }
export interface PagedResult<T> { items: T[]; total: number; page: number; pageSize: number; }

export interface PlanDto {
  id: number;
  name: string;
  description?: string;
  price: number;
  periodDays: number;
  appointmentLimit: number;
  active: boolean;
}
