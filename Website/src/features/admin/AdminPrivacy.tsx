import { useState } from 'react';
import { Shield, Download, Trash2, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { privacyApi } from '../../api';
import { useAdminAuth } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { logTelemetry } from '../../utils/telemetry';

export function AdminPrivacy() {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { clearAuth } = useAdminAuth();
  const navigate = useNavigate();

  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);
    try {
      const response = await privacyApi.exportData();
      const data = response;
      
      // Ensure we have valid data to export
      if (!data) {
        throw new Error('Nenhum dado retornado pela API.');
      }

      const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `meus-dados-hdb-${new Date().getTime()}.json`);
      
      // Required for some browsers
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      setMessage({ type: 'success', text: 'Seus dados foram exportados com sucesso!' });
      logTelemetry('Privacy data exported.', { level: 'Information' });
    } catch (err) {
      console.error('Export error:', err);
      setMessage({ type: 'error', text: 'Erro ao exportar dados. Tente novamente mais tarde.' });
      logTelemetry('Privacy data export failed.', { level: 'Error' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('TEM CERTEZA? Esta ação é irreversível. Sua conta será desativada e seus dados pessoais serão anonimizados conforme a LGPD.')) {
      return;
    }

    setIsDeleting(true);
    setMessage(null);
    try {
      await privacyApi.deleteAccount();
      logTelemetry('Account deletion requested.', { level: 'Warning' });
      alert('Sua conta foi excluída com sucesso. Você será deslogado.');
      clearAuth();
      navigate('/admin/login');
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao excluir conta. Se você tiver uma assinatura ativa, cancele-a primeiro no Perfil.' });
      logTelemetry('Account deletion failed.', { level: 'Error' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Privacidade e LGPD</h1>
        <p className="text-gray-500 text-sm">Gerencie seus dados pessoais e direitos de privacidade.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-start gap-3 border ${
          message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <Card title="Termos de Uso">
        <div className="flex items-start gap-6">
          <div className="p-4 bg-blue-50 rounded-xl">
            <FileText className="w-7 h-7 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-4">
              Acesse e revise os Termos de Uso da plataforma Lava Meu Carro.
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/termos-de-uso')}
            >
              Ver Termos de Uso
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Política de Privacidade">
        <div className="flex items-start gap-6">
          <div className="p-4 bg-blue-50 rounded-xl">
            <FileText className="w-7 h-7 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-4">
              Acesse e revise a Política de Privacidade da plataforma Lava Meu Carro.
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/politica-de-privacidade')}
            >
              Ver Política de Privacidade
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Portabilidade de Dados">
        <div className="flex items-start gap-6">
          <div className="p-4 bg-brand-50 rounded-xl">
            <Download className="w-7 h-7 text-brand-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-4">
              Você tem o direito de receber todos os seus dados pessoais armazenados em nossa plataforma em um formato estruturado (JSON).
            </p>
            <Button 
              variant="outline" 
              onClick={handleExport} 
              loading={isExporting}
            >
              Exportar Meus Dados
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Direito ao Esquecimento">
        <div className="flex items-start gap-6">
          <div className="p-4 bg-red-50 rounded-xl">
            <Trash2 className="w-7 h-7 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-4">
              Ao solicitar a exclusão, sua conta será desativada e seus dados pessoais (nome, documento, telefone, e-mail) serão anonimizados em nossos registros.
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <div className="flex gap-2 text-amber-800">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium">
                  Atenção: Esta ação não pode ser desfeita. Se você for proprietário de um salão, a unidade deixará de ser visível.
                </p>
              </div>
            </div>
            <Button 
              variant="danger" 
              onClick={handleDeleteAccount}
              loading={isDeleting}
            >
              Excluir Minha Conta
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Segurança">
        <div className="flex items-start gap-6">
          <div className="p-4 bg-blue-50 rounded-xl">
            <Shield className="w-7 h-7 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">
              Seus dados são protegidos por criptografia de ponta a ponta e seguimos as melhores práticas de segurança da informação para garantir a integridade da sua conta.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
