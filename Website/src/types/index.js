export var UserType;
(function (UserType) {
    UserType[UserType["Client"] = 0] = "Client";
    UserType[UserType["Profissional"] = 1] = "Profissional";
    UserType[UserType["Owner"] = 2] = "Owner";
    UserType[UserType["Admin"] = 3] = "Admin";
})(UserType || (UserType = {}));
export var AgendamentoStatus;
(function (AgendamentoStatus) {
    AgendamentoStatus[AgendamentoStatus["Pendente"] = 1] = "Pendente";
    AgendamentoStatus[AgendamentoStatus["Confirmado"] = 2] = "Confirmado";
    AgendamentoStatus[AgendamentoStatus["Cancelado"] = 3] = "Cancelado";
    AgendamentoStatus[AgendamentoStatus["Finalizado"] = 4] = "Finalizado";
    AgendamentoStatus[AgendamentoStatus["NoShow"] = 5] = "NoShow";
    AgendamentoStatus[AgendamentoStatus["ACaminho"] = 6] = "ACaminho";
    AgendamentoStatus[AgendamentoStatus["EmExecucao"] = 7] = "EmExecucao";
    AgendamentoStatus[AgendamentoStatus["Pronto"] = 8] = "Pronto";
})(AgendamentoStatus || (AgendamentoStatus = {}));
export var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus[SubscriptionStatus["None"] = 0] = "None";
    SubscriptionStatus[SubscriptionStatus["Active"] = 1] = "Active";
    SubscriptionStatus[SubscriptionStatus["Cancelled"] = 2] = "Cancelled";
    SubscriptionStatus[SubscriptionStatus["Expired"] = 3] = "Expired";
    SubscriptionStatus[SubscriptionStatus["Suspended"] = 4] = "Suspended";
    SubscriptionStatus[SubscriptionStatus["PaymentFailed"] = 5] = "PaymentFailed";
})(SubscriptionStatus || (SubscriptionStatus = {}));
