const fieldLabels: Record<string, string> = {
  Name: 'Nome',
  Address: 'Endereço',
  City: 'Cidade',
  State: 'Estado',
  Phone: 'Telefone',
  Email: 'E-mail',
  Description: 'Descrição',
};

export function getApiErrorMessage(error: unknown, fallback = 'Erro ao comunicar com a API. Tente novamente.'): string {
  if (!error || typeof error !== 'object') return fallback;

  const maybe = error as {
    response?: {
      data?: {
        message?: string;
        error?: string;
        title?: string;
        errors?: Record<string, string[]>;
      };
    };
    message?: string;
  };

  const validationErrors = maybe.response?.data?.errors;
  if (validationErrors && typeof validationErrors === 'object') {
    const messages = Object.entries(validationErrors)
      .flatMap(([field, msgs]) => {
        const label = fieldLabels[field] ?? field;
        return (Array.isArray(msgs) ? msgs : [String(msgs)]).map((msg) => `${label}: ${msg}`);
      });
    if (messages.length > 0) return messages.join(' | ');
  }

  return (
    maybe.response?.data?.message
    || maybe.response?.data?.error
    || (maybe.response?.data?.title && maybe.response.data.title !== 'One or more validation errors occurred.'
        ? maybe.response.data.title
        : undefined)
    || maybe.message
    || fallback
  );
}
