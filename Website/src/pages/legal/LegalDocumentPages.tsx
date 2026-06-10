import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { legalApi } from '../../api';
import type { LegalDocumentDto } from '../../types';

export function PrivacyPolicyPage() {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <a href="/" className="text-blue-600 hover:text-blue-700 text-sm mb-6 inline-block">
          &larr; Voltar ao início
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {doc?.title || 'Política de Privacidade'}
        </h1>
        {doc?.updatedAt && (
          <p className="text-sm text-gray-500 mb-8">
            Última atualização: {new Date(doc.updatedAt).toLocaleDateString('pt-BR')}
          </p>
        )}
        <div
          className="prose prose-gray max-w-none"
          dangerouslySetInnerHTML={{ __html: doc?.content || '' }}
        />
      </div>
    </div>
  );
}

export function TermsOfUsePage() {
  const [doc, setDoc] = useState<LegalDocumentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    legalApi
      .getTermsOfUse()
      .then(setDoc)
      .catch(() => setError('Não foi possível carregar os termos de uso.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <a href="/" className="text-blue-600 hover:text-blue-700 text-sm mb-6 inline-block">
          &larr; Voltar ao início
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {doc?.title || 'Termos de Uso'}
        </h1>
        {doc?.updatedAt && (
          <p className="text-sm text-gray-500 mb-8">
            Última atualização: {new Date(doc.updatedAt).toLocaleDateString('pt-BR')}
          </p>
        )}
        <div
          className="prose prose-gray max-w-none"
          dangerouslySetInnerHTML={{ __html: doc?.content || '' }}
        />
      </div>
    </div>
  );
}
