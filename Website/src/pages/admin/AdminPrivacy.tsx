import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { privacyApi } from '../../api';
import { useAdminAuth } from '../../stores/authStore';
import { logAction } from '../../utils/telemetry';

export default function AdminPrivacy() {
  const { user } = useAdminAuth();
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [error, setError] = useState('');

  const handleExport = async () => {
    setExporting(true);
    setError('');
    try {
      const data = await privacyApi.exportData();
      logAction('privacy_export');
      // Download as JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meus-dados-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao exportar dados.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Privacidade</h1>
      <p className="text-gray-500 mb-6">Gerencie seus dados pessoais conforme a LGPD.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Seus Dados</CardTitle>
            <CardDescription>Informações associadas à sua conta.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Nome</span>
                <span className="font-medium text-gray-900">{user?.nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-900">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Telefone</span>
                <span className="font-medium text-gray-900">{user?.telefone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Conta criada em</span>
                <span className="font-medium text-gray-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exportar Dados</CardTitle>
            <CardDescription>
              Baixe uma cópia de todos os dados associados à sua conta em formato JSON.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {exportDone && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-700">Dados exportados com sucesso!</p>
              </div>
            )}
            <Button onClick={handleExport} loading={exporting} variant="outline">
              Exportar meus dados
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Excluir Conta</CardTitle>
            <CardDescription>
              Esta ação é irreversível. Todos os seus dados serão removidos permanentemente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/delete-account" target="_blank" rel="noopener noreferrer">
              <Button variant="danger">Ir para exclusão de conta</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
