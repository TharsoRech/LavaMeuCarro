import { useQuery } from '@tanstack/react-query';
import { FileText, AlertCircle, Loader2 } from 'lucide-react';
import { legalDocumentsApi } from '../../api';
import { Card } from '../../components/ui/Card';
import { ApiErrorAlert } from '../../components/ui/ApiErrorAlert';
import { getApiErrorMessage } from '../../utils/apiError';

export function AdminTermsOfUse() {
  const { data: documents, isLoading, error, isError } = useQuery({
    queryKey: ['legal-documents', 'terms_of_use'],
    queryFn: () => legalDocumentsApi.listActive().then(r => r.data), 
    // Note: In your current API, 'registration' might be the context for terms/privacy
    // If you have a specific context for terms_of_use, change 'registration' to 'terms_of_use'
  });

  // Filter for terms of use specifically if multiple docs are returned
  const termsDoc = documents?.find(doc => 
    doc.code.toLowerCase().includes('terms') || 
    doc.title.toLowerCase().includes('termos')
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-4" />
        <p className="text-gray-500">Carregando termos de uso...</p>
      </div>
    );
  }

  if (isError) {
    return <ApiErrorAlert message={getApiErrorMessage(error, 'Falha ao carregar termos de uso.')} />;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Termos de Uso</h1>
        <p className="text-gray-500 text-sm">Regras e diretrizes para utilização da plataforma Lava Meu Carro.</p>
      </div>

      {!termsDoc ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Documento de Termos de Uso não encontrado ou não configurado.</p>
        </div>
      ) : (
        <Card title={`${termsDoc.title} (v${termsDoc.version})`}>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 pb-4 border-b border-gray-100">
            <FileText className="w-3.5 h-3.5" />
            <span>Última atualização: {new Date().toLocaleDateString('pt-BR')}</span>
          </div>
          
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {termsDoc.content}
          </div>
        </Card>
      )}
    </div>
  );
}
