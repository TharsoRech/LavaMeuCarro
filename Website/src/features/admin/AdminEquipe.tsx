import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFuncionarios, createFuncionario, updateFuncionario, deleteFuncionario, getServicos } from '../../api';
import { useUnitSelection } from '../../hooks/useUnitSelection';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Plus, Edit2, Trash2, Users, Search, Star } from 'lucide-react';

export default function AdminEquipe() {
  const queryClient = useQueryClient();
  const { selectedUnitId } = useUnitSelection();
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);

  const [form, setForm] = useState({ name: '', email: '', phone: '', specialty: '', bio: '' });

  const { data: funcionarios, isLoading } = useQuery({
    queryKey: ['funcionarios', selectedUnitId],
    queryFn: () => getFuncionarios(selectedUnitId ?? undefined),
  });

  const { data: servicos } = useQuery({
    queryKey: ['servicos-for-team'],
    queryFn: () => getServicos(selectedUnitId ?? undefined),
  });

  const createMut = useMutation({
    mutationFn: createFuncionario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      closeModal();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateFuncionario(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      closeModal();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteFuncionario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      setDeleteConfirm(null);
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingMember(null);
    setForm({ name: '', email: '', phone: '', specialty: '', bio: '' });
  };

  const openEdit = (member: any) => {
    setEditingMember(member);
    setForm({
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      specialty: member.specialty || '',
      bio: member.bio || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, unidadeId: selectedUnitId };
    if (editingMember) {
      updateMut.mutate({ id: editingMember.id, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const members = Array.isArray(funcionarios) ? funcionarios : [];
  const filtered = search
    ? members.filter((m: any) =>
        (m.name || m.specialty || '').toLowerCase().includes(search.toLowerCase())
      )
    : members;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Equipe</h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1" /> Adicionar Membro
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou especialidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="text-gray-400 col-span-3 text-center py-8 animate-pulse">Carregando...</p>
        ) : filtered.length === 0 ? (
          <div className="col-span-3 text-center py-12 bg-white rounded-xl border border-gray-100">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{search ? 'Nenhum resultado encontrado' : 'Nenhum membro cadastrado'}</p>
          </div>
        ) : (
          filtered.map((f: any) => (
            <Card key={f.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-lg">
                        {(f.name || f.email || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{f.name || 'Sem nome'}</h3>
                      <p className="text-sm text-gray-500">{f.email || 'Sem email'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(f)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteConfirm(f)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant={f.active !== false ? 'success' : 'gray'}>
                    {f.active !== false ? 'Ativo' : 'Inativo'}
                  </Badge>
                  {f.specialty && <Badge variant="info">{f.specialty}</Badge>}
                  {f.averageRating && (
                    <Badge variant="warning">
                      <Star className="w-3 h-3 mr-1" /> {f.averageRating.toFixed(1)}
                    </Badge>
                  )}
                </div>
                {f.bio && <p className="text-sm text-gray-500 mt-3 line-clamp-2">{f.bio}</p>}
                {f.phone && <p className="text-sm text-gray-500 mt-2">Tel: {f.phone}</p>}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title={editingMember ? 'Editar Membro' : 'Novo Membro'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nome" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
          <Input label="Telefone" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
          <Input label="Especialidade" value={form.specialty} onChange={(e) => setForm(f => ({ ...f, specialty: e.target.value }))} placeholder="Ex: Lavagem detalhada, Polimento..." />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
              value={form.bio}
              onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Breve descrição do membro..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" loading={createMut.isPending || updateMut.isPending}>
              {editingMember ? 'Salvar Alterações' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Remover Membro"
      >
        <p className="text-sm text-gray-600 mb-4">
          Tem certeza que deseja remover <strong>{deleteConfirm?.name || 'este membro'}</strong> da equipe?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => deleteMut.mutate(deleteConfirm?.id)} loading={deleteMut.isPending}>
            Remover
          </Button>
        </div>
      </Modal>
    </div>
  );
}
