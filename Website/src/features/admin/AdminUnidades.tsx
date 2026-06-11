import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyUnidades, createUnidade, updateUnidade, deleteUnidade, publishUnidade } from '../../api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { MapPin, Clock, Phone, Plus, Edit2, Trash2, Eye, EyeOff, Star } from 'lucide-react';

export default function AdminUnidades() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);

  const [form, setForm] = useState({
    name: '', description: '', address: '', city: '', state: '', cep: '',
    phone: '', email: '', ofereceLevaTraz: false,
  });

  const { data: unidades, isLoading } = useQuery({
    queryKey: ['minhas-unidades'],
    queryFn: getMyUnidades,
  });

  const createMut = useMutation({
    mutationFn: createUnidade,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['minhas-unidades'] }); closeModal(); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateUnidade(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['minhas-unidades'] }); closeModal(); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteUnidade(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['minhas-unidades'] }); setDeleteConfirm(null); },
  });

  const publishMut = useMutation({
    mutationFn: ({ id, published }: { id: number; published: boolean }) => publishUnidade(id, published),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['minhas-unidades'] }),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingUnit(null);
    setForm({ name: '', description: '', address: '', city: '', state: '', cep: '', phone: '', email: '', ofereceLevaTraz: false });
  };

  const openEdit = (unit: any) => {
    setEditingUnit(unit);
    setForm({
      name: unit.name || '',
      description: unit.description || '',
      address: unit.address || '',
      city: unit.city || '',
      state: unit.state || '',
      cep: unit.cep || '',
      phone: unit.phone || '',
      email: unit.email || '',
      ofereceLevaTraz: unit.ofereceLevaTraz || false,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUnit) {
      updateMut.mutate({ id: editingUnit.id, data: form });
    } else {
      createMut.mutate(form);
    }
  };

  const units = Array.isArray(unidades) ? unidades : [];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Minhas Unidades</h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1" /> Nova Unidade
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <p className="text-gray-400 col-span-2 text-center py-8 animate-pulse">Carregando...</p>
        ) : units.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-gray-100">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma unidade cadastrada</p>
          </div>
        ) : (
          units.map((u: any) => (
            <Card key={u.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{u.name}</h3>
                    {u.description && <p className="text-sm text-gray-500 mt-1">{u.description}</p>}
                  </div>
                  <button onClick={() => openEdit(u)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" />{u.address || 'Endereço não informado'}{u.city ? `, ${u.city}` : ''}{u.state ? ` - ${u.state}` : ''}</p>
                  <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" />{u.phone || 'Não informado'}</p>
                  {u.email && <p className="flex items-center gap-2">Email: {u.email}</p>}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant={u.active ? 'success' : 'gray'}>{u.active ? 'Ativo' : 'Inativo'}</Badge>
                  <Badge variant={u.published ? 'success' : 'warning'}>
                    {u.published ? 'Publicado' : 'Não publicado'}
                  </Badge>
                  {u.ofereceLevaTraz && <Badge variant="info">Leva e Traz</Badge>}
                  {u.averageRating && (
                    <Badge variant="warning">
                      <Star className="w-3 h-3 mr-1" /> {u.averageRating.toFixed(1)}
                    </Badge>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => publishMut.mutate({ id: u.id, published: !u.published })}
                    loading={publishMut.isPending}
                  >
                    {u.published ? <><EyeOff className="w-4 h-4 mr-1" /> Despublicar</> : <><Eye className="w-4 h-4 mr-1" /> Publicar</>}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(u)}>
                    <Trash2 className="w-4 h-4 mr-1" /> Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={closeModal} title={editingUnit ? 'Editar Unidade' : 'Nova Unidade'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nome" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              rows={2} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <Input label="Endereço" value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} required />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Cidade" value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} required />
            <Input label="Estado" value={form.state} onChange={(e) => setForm(f => ({ ...f, state: e.target.value }))} required maxLength={2} />
            <Input label="CEP" value={form.cep} onChange={(e) => setForm(f => ({ ...f, cep: e.target.value }))} placeholder="00000-000" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Telefone" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.ofereceLevaTraz} onChange={(e) => setForm(f => ({ ...f, ofereceLevaTraz: e.target.checked }))} />
            <span className="text-sm text-gray-700">Oferece serviço leva e traz</span>
          </label>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" loading={createMut.isPending || updateMut.isPending}>
              {editingUnit ? 'Salvar' : 'Criar Unidade'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Excluir Unidade">
        <p className="text-sm text-gray-600 mb-4">
          Tem certeza que deseja excluir <strong>{deleteConfirm?.name}</strong>? Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => deleteMut.mutate(deleteConfirm?.id)} loading={deleteMut.isPending}>Excluir</Button>
        </div>
      </Modal>
    </div>
  );
}
