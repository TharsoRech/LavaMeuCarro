interface ApiErrorAlertProps {
  message: string;
  onRetry?: () => void;
  dark?: boolean;
}

export function ApiErrorAlert({ message, onRetry, dark = false }: ApiErrorAlertProps) {
  if (dark) {
    return (
      <div className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200 flex items-center justify-between gap-3">
        <span>{message}</span>
        {onRetry && (
          <button onClick={onRetry} className="px-2.5 py-1 text-xs rounded border border-red-700 hover:bg-red-900/40 transition-colors">
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center justify-between gap-3">
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="px-2.5 py-1 text-xs rounded border border-red-300 hover:bg-red-100 transition-colors">
          Tentar novamente
        </button>
      )}
    </div>
  );
}
