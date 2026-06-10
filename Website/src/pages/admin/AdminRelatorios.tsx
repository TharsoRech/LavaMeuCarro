import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, Calendar, Star } from 'lucide-react';

const monthlyData = [
  { mes: 'Jan', receita: 3200, agendamentos: 45 },
  { mes: 'Fev', receita: 4100, agendamentos: 58 },
  { mes: 'Mar', receita: 3800, agendamentos: 52 },
  { mes: 'Abr', receita: 5200, agendamentos: 72 },
  { mes: 'Mai', receita: 4800, agendamentos: 65 },
  { mes: 'Jun', receita: 6100, agendamentos: 84 },
];

export default function AdminRelatorios() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Relatórios</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Receita Total', value: 'R$ 27.200', icon: DollarSign, change: '+12%' },
          { label: 'Total Agendamentos', value: '376', icon: Calendar, change: '+8%' },
          { label: 'Ticket Médio', value: 'R$ 72,34', icon: TrendingUp, change: '+5%' },
          { label: 'Avaliação Média', value: '4.7', icon: Star, change: '+0.2' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className="w-5 h-5 text-gray-400" />
              <span className="text-xs font-medium text-green-600">{stat.change}</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Receita Mensal</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip />
              <Bar dataKey="receita" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Agendamentos Mensal</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="agendamentos" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
