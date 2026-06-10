export enum UserType { Client = 0, Profissional = 1, Owner = 2, Admin = 3 }
export enum AgendamentoStatus { Pendente = 1, Confirmado = 2, Cancelado = 3, Finalizado = 4, NoShow = 5, ACaminho = 6, EmExecucao = 7, Pronto = 8 }
export enum SubscriptionStatus { None = 0, Active = 1, Cancelled = 2, Expired = 3, Suspended = 4, PaymentFailed = 5 }

export interface User {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  tipo: UserType;
  active: boolean;
  createdAt: string;
  base64Image?: string;
}

export interface Unidade {
  id: number;
  ownerId: number;
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  cep?: string;
  phone?: string;
  email?: string;
  active: boolean;
  published: boolean;
  averageRating?: number;
  reviews: number;
  ofereceLevaTraz: boolean;
  coverImageUrl?: string;
  base64Image?: string;
  latitude?: number;
  longitude?: number;
  schedulingTimeInterval?: number;
  businessHours?: Record<string, { open: string; close: string }>;
  createdAt: string;
}

export interface Agendamento {
  id: number;
  clientId: number;
  funcionarioId: number;
  servicoId: number;
  unidadeId: number;
  veiculoId: number;
  scheduledAt: string;
  durationMinutes: number;
  totalPrice: number;
  status: AgendamentoStatus;
  modalidade: string;
  precoBruto: number;
  notes?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  servicoName?: string;
  funcionarioName?: string;
  unidadeName?: string;
  veiculoInfo?: string;
  createdAt: string;
}

export interface Servico {
  id: number;
  unidadeId: number;
  categoryId: number;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  active: boolean;
  categoryName?: string;
}

export interface Funcionario {
  id: number;
  userId: number;
  unidadeId: number;
  name?: string;
  email?: string;
  phone?: string;
  specialty?: string;
  bio?: string;
  averageRating?: number;
  active: boolean;
  services?: number[];
  reviewsCount?: number;
}

export interface Veiculo {
  id: number;
  clientId: number;
  placa: string;
  marca: string;
  modelo: string;
  cor?: string;
  tamanho: string;
  clientName?: string;
}

export interface Categoria {
  id: number;
  name: string;
  iconUrl?: string;
  active: boolean;
}

export interface Plano {
  id: number;
  name: string;
  description?: string;
  price: number;
  periodDays: number;
  appointmentLimit?: number;
  active: boolean;
}

export interface Assinatura {
  id: number;
  ownerId: number;
  planoId: number;
  status: SubscriptionStatus;
  startDate?: string;
  endDate?: string;
  agendamentosNoMes: number;
  ownerName?: string;
  planoName?: string;
  paymentStatus?: string;
}

export interface DashboardSummary {
  totalHoje: number;
  confirmados: number;
  pendentes: number;
  finalizadosMes: number;
  faturamentoMes: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PlanDto {
  id: number;
  name: string;
  description?: string;
  price: number;
  periodDays: number;
  appointmentLimit: number;
  active: boolean;
}

// Notification types
export interface NotificationDto {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  appointmentId?: number;
  metadata?: Record<string, unknown>;
}

// Review types
export interface ReviewDto {
  id: number;
  clientId: number;
  targetId: number;
  targetType: string;
  rating: number;
  comment?: string;
  clientName?: string;
  createdAt: string;
}

// Report types
export interface BusinessReportsDto {
  period: string;
  appointmentsOverTime: { date: string; count: number }[];
  revenueOverTime: { date: string; amount: number }[];
  servicesRanking: { name: string; count: number; revenue: number }[];
  statusBreakdown: { status: string; count: number }[];
  totalAppointments: number;
  totalRevenue: number;
  averageTicket: number;
  cancellationRate: number;
}

// Marketing types
export interface MarketingBroadcastRequest {
  title: string;
  message: string;
  targetAudience: 'all' | 'unit' | 'inactive' | 'active';
  targetUnitId?: number;
}

// Legal types
export interface LegalDocumentDto {
  id: number;
  type: 'privacy_policy' | 'terms_of_use';
  title: string;
  content: string;
  updatedAt: string;
}

// Privacy types
export interface PrivacyExportResponse {
  userData: Record<string, unknown>;
  exportedAt: string;
}

// Master types
export interface MasterStats {
  totalUsers: number;
  totalUnits: number;
  totalAppointments: number;
  totalRevenue: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
}

export interface MasterPaymentRecordDto {
  id: number;
  ownerId: number;
  ownerName?: string;
  amount: number;
  status: string;
  paymentDate?: string;
  dueDate?: string;
  method?: string;
  externalId?: string;
  createdAt: string;
}

export interface MasterManualSubscriptionRequest {
  ownerId: number;
  planoId: number;
  durationDays: number;
  notes?: string;
}

export interface MasterManualSubscriptionResponse {
  success: boolean;
  subscriptionId: number;
  endDate: string;
}

export interface MasterSubscriptionMonitorResponse {
  healthy: number;
  expiringSoon: number;
  expired: number;
  suspended: number;
  details: {
    ownerId: number;
    ownerName: string;
    planoName: string;
    status: string;
    endDate: string;
    daysRemaining: number;
  }[];
}

// Login response
export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

// Appointment creation
export interface CreateAppointmentRequest {
  clientId: number;
  funcionarioId: number;
  servicoId: number;
  unidadeId: number;
  veiculoId: number;
  scheduledAt: string;
  notes?: string;
  modalidade?: string;
}

// Client history
export interface ClientAppointmentHistoryResponse {
  totalAppointments: number;
  totalSpent: number;
  lastVisit?: string;
  appointments: Agendamento[];
}

// Availability
export interface AvailabilityDayDto {
  date: string;
  availableSlots: string[];
  bookedSlots: string[];
}

// Appointment professional options
export interface AppointmentProfessionalOptionDto {
  id: number;
  name: string;
  specialty?: string;
}

// Support
export interface SupportContactDto {
  email: string;
  phone?: string;
  whatsapp?: string;
}
