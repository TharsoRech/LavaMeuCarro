import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { marketingApi } from '../../api';
import { useUnitSelection } from '../../hooks/useUnitSelection';
import { logAction } from '../../utils/telemetry';

export default function AdminMarketing() {
  const { unidades } = useUnitSelection();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'unit' | 'inactive' | 'active'>('all');
  const [targetUnitId, setTargetUnitId] = useState<number | undefined>();
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setError('Preencha o título e a mensagem.');
      return;
    }
    setSending(true);
    setError('');
    setSuccess(false);
    try {
      await marketingApi.broadcast({
        title,
        message,
        targetAudience,
        targetUnitId: targetAudience === 'unit' ? targetUnitId : undefined,
      });
      logAction('marketing_broadcast', { targetAudience });
      setSuccess(true);
      setTitle('');
      setMessage('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao enviar notificação.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Marketing</h1>
      <p className="text-gray-500 mb-6">Envie notificações em massa para seus clientes.</p>

      <Card>
        <CardHeader>
          <CardTitle>Nova Campanha</CardTitle>
          <CardDescription>Compose e envie uma notificação push para seus clientes.</CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-700">Notificação enviada com sucesso!</p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <Select
              label="Público-alvo"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value as any)}
              options={[
                { value: 'all', label: 'Todos os clientes' },
                { value: 'active', label: 'Clientes ativos' },
                { value: 'inactive', label: 'Clientes inativos' },
                { value: 'unit', label: 'Clientes de uma unidade' },
              ]}
            />

            {targetAudience === 'unit' && (
              <Select
                label="Unidade"
                value={targetUnitId?.toString() || ''}
                onChange={(e) => setTargetUnitId(Number(e.target.value))}
                options={unidades.map((u) => ({ value: u.id.toString(), label: u.name }))}
              />
            )}

            <Input
              label="Título"
              placeholder="Ex: Promoção de Natal!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Escreva a mensagem da notificação..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <Button onClick={handleSend} loading={sending} disabled={!title.trim() || !message.trim()}>
              Enviar Notificação
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
