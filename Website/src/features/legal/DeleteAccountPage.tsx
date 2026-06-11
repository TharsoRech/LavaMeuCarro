import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { privacyApi } from '../../api';
import { Button } from '../../components/ui/Button';

export default function DeleteAccountPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'confirm' | 'processing' | 'done' | 'error'>('confirm');
  const [errorMsg, setErrorMsg] = useState('');

  const handleDelete = async () => {
    setStep('processing');
    try {
      await privacyApi.deleteAccount();
      localStorage.clear();
      setStep('done');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Erro ao excluir conta. Tente novamente.');
      setStep('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Excluir Conta</h1>

        {step === 'confirm' && (
          <>
            <p className="text-sm text-gray-600 mb-6">
              Tem certeza que deseja excluir sua conta? Esta ação é <strong>irreversível</strong> e todos os seus dados serão removidos permanentemente.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700">
                Seus agendamentos, histórico e todas as informações associadas à sua conta serão excluídos.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/')}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Excluir minha conta
              </Button>
            </div>
          </>
        )}

        {step === 'processing' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4" />
            <p className="text-gray-600">Processando exclusão...</p>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-900 font-medium mb-2">Conta excluída com sucesso</p>
            <p className="text-sm text-gray-500 mb-6">
              Sua conta e todos os dados associados foram removidos permanentemente.
            </p>
            <Button onClick={() => navigate('/')}>Voltar ao início</Button>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-4">
            <p className="text-red-600 mb-4">{errorMsg}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/')}>Voltar</Button>
              <Button variant="danger" onClick={handleDelete}>Tentar novamente</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
