import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServicos, createServico, updateServico, deleteServico, getCategorias, createCategoria } from '../../api';
import { useUnitSelection } from '../../hooks/useUnitSelection';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Plus, Edit2, Trash2, Wrench, Search, Tag } from 'lucide-react';

export default function AdminServicos() {
  const queryClient = useQueryClient();
  const { selectedUnitId } = useUnitSelection();
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [form, setForm] = useState({
    name: '', description: '', price: '', durationMinutes: '', categoryId: '', active: true,
  });

  const { data: servicos, isLoading } = useQuery({
    queryKey: ['servicos', selectedUnitId],
    queryFn: () => getServicos(selectedUnitId ?? undefined),
  });

  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: getCategorias,
  });

  const createMut = useMutation({
    mutationFn: (data: any) => createServico({ ...data, unidadeId: selectedUnitId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['servicos'] }); closeModal(); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateServico(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['servicos'] }); closeModal(); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteServico(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['servicos'] }); setDeleteConfirm(null); },
  });

  const createCatMut = useMutation({
    mutationFn: (data: any) => createCategoria(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      setShowCategoryModal(false);
      setNewCategoryName('');
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingService(null);
    setForm({ name: '', description: '', price: '', durationMinutes: '', categoryId: '', active: true });
  };

  const openEdit = (svc: any) => {
    setEditingService(svc);
    setForm({
      name: svc.name || '',
      description: svc.description || '',
      price: svc.price?.toString() || '',
      durationMinutes: svc.durationMinutes?.toString() || '',
      categoryId: svc.categoryId?.toString() || '',
      active: svc.active !== false,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: parseFloat(form.price) || 0,
      durationMinutes: parseInt(form.durationMinutes) || 30,
      categoryId: parseInt(form.categoryId) || 0,
    };
    if (editingService) {
      updateMut.mutate({ id: editingService.id, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const services = Array.isArray(servicos) ? servicos : [];
  const categories = Array.isArray(categorias) ? categorias : [];
  const filtered = search
    ? services.filter((s: any) => (s.name || '').toLowerCase().includes(search.toLowerCase()))
    : services;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCategoryModal(true)}>
            <Tag className="w-4 h-4 mr-1" /> Categoria
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-1" /> Novo Serviço
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar serviço..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Services Table */}
      <Card>
        <CardContent className="py-0">
          {isLoading ? (
            <div className="py-12 text-center text-gray-400 animate-pulse">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{search ? 'Nenhum serviço encontrado' : 'Nenhum serviço cadastrado'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Serviço</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Categoria</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Preço</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Duração</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((s: any) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{s.name}</p>
                        {s.description && <p className="text-sm text-gray-500 truncate max-w-xs">{s.description}</p>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{s.categoryName || '—'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">R$ {(s.price ?? 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{s.durationMinutes} min</td>
                      <td className="px-6 py-4">
                        <Badge variant={s.active !== false ? 'success' : 'gray'}>
                          {s.active !== false ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded mr-1">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteConfirm(s)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={closeModal} title={editingService ? 'Editar Serviço' : 'Novo Serviço'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nome" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm(f => ({ ...f, categoryId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Selecione...</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Preço (R$)" type="number" step="0.01" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} required />
            <Input label="Duração (min)" type="number" value={form.durationMinutes} onChange={(e) => setForm(f => ({ ...f, durationMinutes: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm(f => ({ ...f, active: e.target.checked }))} />
            <span className="text-sm text-gray-700">Ativo</span>
          </label>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" loading={createMut.isPending || updateMut.isPending}>
              {editingService ? 'Salvar' : 'Criar Serviço'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal open={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="Nova Categoria">
        <form onSubmit={(e) => { e.preventDefault(); createCatMut.mutate({ name: newCategoryName }); }} className="space-y-4">
          <Input label="Nome da Categoria" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} required />
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setShowCategoryModal(false)}>Cancelar</Button>
            <Button type="submit" loading={createCatMut.isPending}>Criar</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Excluir Serviço">
        <p className="text-sm text-gray-600 mb-4">
          Tem certeza que deseja excluir <strong>{deleteConfirm?.name}</strong>?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => deleteMut.mutate(deleteConfirm?.id)} loading={deleteMut.isPending}>Excluir</Button>
        </div>
      </Modal>
    </div>
  );
}
