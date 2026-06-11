import { useState } from 'react';
import { Settings, Globe, Mail, Bell, Shield } from 'lucide-react';

export default function MasterConfiguracoes() {
  const [activeTab, setActiveTab] = useState('geral');

  const tabs = [
    { id: 'geral', label: 'Geral', icon: Settings },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configurações</h1>
      <div className="flex gap-6">
        <div className="w-48 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id ? 'bg-slate-100 text-slate-900' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {activeTab === 'geral' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Configurações Gerais</h2>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nome da Plataforma</label><input defaultValue="Lava Meu Carro" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">URL do Site</label><input defaultValue="https://lavameucarro.com.br" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Suporte Email</label><input defaultValue="suporte@lavameucarro.com.br" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none" /></div>
              <button className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">Salvar</button>
            </div>
          )}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Configurações de Email</h2>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label><input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Senha</label><input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none" /></div>
              <button className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">Salvar</button>
            </div>
          )}
          {activeTab === 'notificacoes' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Notificações Push</h2>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">FCM Server Key</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">FCM Sender ID</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none" /></div>
              <button className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">Salvar</button>
            </div>
          )}
          {activeTab === 'seguranca' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Segurança</h2>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">JWT Secret</label><input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none font-mono text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Token Expiry (days)</label><input type="number" defaultValue="7" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none" /></div>
              <button className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">Salvar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
