import { useEffect, useState } from 'react';
import { legalApi } from '../../api';
import type { LegalDocumentDto } from '../../types';

export default function AdminPrivacyPolicy() {
  const [doc, setDoc] = useState<LegalDocumentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    legalApi
      .getPrivacyPolicy()
      .then(setDoc)
      .catch(() => setError('Não foi possível carregar a política de privacidade.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Política de Privacidade</h1>
      <p className="text-gray-500 mb-6">Visualize a política de privacidade da plataforma.</p>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          {doc?.updatedAt && (
            <p className="text-sm text-gray-500 mb-4">
              Última atualização: {new Date(doc.updatedAt).toLocaleDateString('pt-BR')}
            </p>
          )}
          <div
            className="prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{ __html: doc?.content || 'Nenhum conteúdo disponível.' }}
          />
        </div>
      )}
    </div>
  );
}
