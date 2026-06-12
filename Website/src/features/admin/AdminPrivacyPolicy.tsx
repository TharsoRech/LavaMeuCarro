import { useQuery } from '@tanstack/react-query';
import { Shield, AlertCircle, Loader2, FileText } from 'lucide-react';
import { legalDocumentsApi } from '../../api';
import { Card } from '../../components/ui/Card';
import { ApiErrorAlert } from '../../components/ui/ApiErrorAlert';
import { getApiErrorMessage } from '../../utils/apiError';

export function AdminPrivacyPolicy() {
  const { data: documents, isLoading, error, isError } = useQuery({
    queryKey: ['legal-documents', 'privacy_policy'],
    queryFn: () => legalDocumentsApi.listActive().then(r => r.data),
  });

  // Filter for privacy policy specifically
  const privacyDoc = documents?.find(doc => 
    doc.code.toLowerCase().includes('privacy') || 
    doc.title.toLowerCase().includes('privacidade')
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-4" />
        <p className="text-gray-500">Carregando política de privacidade...</p>
      </div>
    );
  }

  if (isError) {
    return <ApiErrorAlert message={getApiErrorMessage(error, 'Falha ao carregar política de privacidade.')} />;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Política de Privacidade</h1>
        <p className="text-gray-500 text-sm">Como tratamos e protegemos seus dados pessoais.</p>
      </div>

      {!privacyDoc ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Documento de Política de Privacidade não encontrado ou não configurado.</p>
        </div>
      ) : (
        <Card title={`${privacyDoc.title} (v${privacyDoc.version})`}>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 pb-4 border-b border-gray-100">
            <FileText className="w-3.5 h-3.5" />
            <span>Última atualização: {new Date().toLocaleDateString('pt-BR')}</span>
          </div>
          
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {privacyDoc.content}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900">Seus dados estão protegidos</p>
                <p className="text-xs text-blue-700">A Lava Meu Carro está em conformidade com a Lei Geral de Proteção de Dados (LGPD).</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
