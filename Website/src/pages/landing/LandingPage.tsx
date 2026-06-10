import { useEffect, useState } from 'react';
import {
  Car, Calendar, Users, Shield, ChevronRight, ChevronLeft, MessageCircle,
  MapPin, Clock, CheckCircle, MailCheck, BellRing, X, PlayCircle,
  Lock, Eye, Trash2, Tag, Cookie, BarChart3, MonitorSmartphone, Droplets,
  Sparkles
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <ProductScreenshots />
      <Features />
      <HowItWorks />
      <ForProfessionals />
      <CompleteSuite />
      <PlansSection />
      <AboutSection />
      <FaqSection />
      <PrivacyCommitmentSection />
      <Testimonials />
      <DownloadCta />
      <Footer />
      <WhatsAppFloat />
      <CookieConsentBanner />
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">Lava Meu Carro</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <a href="#produto-real" className="hover:text-blue-600 transition-colors">Produto real</a>
          <a href="#como-funciona" className="hover:text-blue-600 transition-colors">Agendamento do cliente</a>
          <a href="#quem-somos" className="hover:text-blue-600 transition-colors">Quem somos</a>
          <a href="#funcionalidades" className="hover:text-blue-600 transition-colors">Funcionalidades</a>
          <a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a>
          <a href="#profissionais" className="hover:text-blue-600 transition-colors">Para Profissionais</a>
          <a href="#planos" className="hover:text-blue-600 transition-colors">Planos</a>
          <a href="#contato" className="hover:text-blue-600 transition-colors">Contato</a>
        </nav>
        <a href="/admin/login" className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          Área do Cliente
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>
    </header>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50 pt-20 pb-32">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-100 rounded-full opacity-40 blur-3xl" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
          <span className="text-blue-500">✨</span>
          Sistema completo: app para clientes agendarem + Web Admin para você gerenciar
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6 text-balance">
          Seu centro automotivo com agenda online,
          <span className="text-blue-600"> equipe organizada e menos faltas</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          O cliente agenda pelo app em poucos toques e seu centro recebe tudo no painel Web Admin: horários, confirmações, notificações e relatórios para crescer com controle.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://wa.me/5554999374583?text=Oi!%20Quero%20conhecer%20o%20Lava%20Meu%20Carro"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 px-6 py-4 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors shadow-lg"
          >
            <MessageCircle className="w-6 h-6" />
            Falar no WhatsApp
          </a>
          <a href="#como-funciona" className="inline-flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors">
            Como funciona
            <ChevronRight className="w-5 h-5" />
          </a>
        </div>
        <p className="mt-6 text-sm text-gray-600">
          Sem cartão de crédito no teste. Cadastro rápido e acesso imediato aos recursos principais.
        </p>
      </div>
    </section>
  );
}

// ── Product Screenshots ───────────────────────────────────────────────────────

function ProductScreenshots() {
  const [activeView, setActiveView] = useState<'mobile' | 'webAdmin'>('mobile');
  const [activeIndex, setActiveIndex] = useState(0);

  const mobileShots = [
    { src: '/screenshots/mobile/home.png', title: 'Tela inicial' },
    { src: '/screenshots/mobile/busca.png', title: 'Busca de centros automotivos' },
    { src: '/screenshots/mobile/agendamentos.png', title: 'Agendamentos do cliente' },
    { src: '/screenshots/mobile/minhas-unidades.png', title: 'Minhas unidades' },
    { src: '/screenshots/mobile/relatorios.png', title: 'Relatórios no app' },
    { src: '/screenshots/mobile/perfil.png', title: 'Perfil e configurações' },
  ];

  const webAdminShots = [
    { src: '/screenshots/webadmin/painel.png', title: 'Painel da unidade' },
    { src: '/screenshots/webadmin/agendamentos.png', title: 'Agenda e status' },
    { src: '/screenshots/webadmin/equipe.png', title: 'Equipe e profissionais' },
    { src: '/screenshots/webadmin/servicos.png', title: 'Serviços e catálogo' },
    { src: '/screenshots/webadmin/notificacoes.png', title: 'Notificações' },
    { src: '/screenshots/webadmin/relatorios.png', title: 'Relatórios' },
  ];

  const shots = activeView === 'mobile' ? mobileShots : webAdminShots;
  const currentShot = shots[activeIndex] ?? shots[0];

  const goToPrevious = () => setActiveIndex((c) => (c - 1 + shots.length) % shots.length);
  const goToNext = () => setActiveIndex((c) => (c + 1) % shots.length);

  return (
    <section id="produto-real" className="py-24 bg-gray-50 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Produto real em uso: Mobile e Web Admin</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">Veja telas reais do aplicativo e do painel Web Admin.</p>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={() => { setActiveView('mobile'); setActiveIndex(0); }}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${activeView === 'mobile' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}>
            Aplicativo
          </button>
          <button type="button" onClick={() => { setActiveView('webAdmin'); setActiveIndex(0); }}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${activeView === 'webAdmin' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}>
            Web Admin
          </button>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="relative rounded-2xl border border-gray-100 bg-gray-50 p-2 sm:p-3">
            <button type="button" onClick={goToPrevious} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/90 border border-gray-200 text-gray-700 hover:bg-white" aria-label="Imagem anterior">
              <ChevronLeft className="w-5 h-5 mx-auto" />
            </button>
            <button type="button" onClick={goToNext} className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/90 border border-gray-200 text-gray-700 hover:bg-white" aria-label="Próxima imagem">
              <ChevronRight className="w-5 h-5 mx-auto" />
            </button>
            <div className="block w-full">
              <div className="w-full h-[280px] sm:h-[420px] rounded-xl bg-gradient-to-br from-blue-100 to-cyan-50 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <MonitorSmartphone className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">Screenshots em breve</p>
                  <p className="text-xs mt-1">{currentShot.title}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-sm text-gray-600">
            <p className="font-medium text-gray-800">{currentShot.title}</p>
            <p>{activeIndex + 1} / {shots.length}</p>
          </div>
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
            {shots.map((shot, index) => (
              <button key={shot.src} type="button" onClick={() => setActiveIndex(index)}
                className={`rounded-lg border p-2 transition-colors text-xs font-medium ${index === activeIndex ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white hover:border-blue-300 text-gray-500'}`}>
                {shot.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── About ─────────────────────────────────────────────────────────────────────

function AboutSection() {
  return (
    <section id="quem-somos" className="py-24 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
          <div>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">Quem somos</span>
            <h2 className="mt-6 text-3xl sm:text-4xl font-bold text-gray-900">
              Criei o Lava Meu Carro para facilitar a rotina de quem vive de estética automotiva.
            </h2>
            <div className="mt-6 space-y-4 text-gray-600 leading-relaxed">
              <p>
                Sou <strong className="text-gray-900">Tharso Francisco Rech Curia</strong> e idealizei o Lava Meu Carro para resolver um problema real: simplificar agendamentos, organização e presença digital de centros automotivos e profissionais de estética veicular.
              </p>
              <p>
                Este é um projeto solo, desenvolvido de forma independente, com uma proposta clara: entregar uma plataforma simples, confiável e prática para ajudar negócios automotivos a ganhar tempo e profissionalismo.
              </p>
              <p>
                Cada melhoria no produto nasce da rotina de uso, do contato com profissionais e do compromisso de evoluir a experiência de quem agenda e de quem atende.
              </p>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href="https://www.linkedin.com/in/tharso-francisco-rech-curia-821951199/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-colors">
                Conhecer o fundador <ChevronRight className="w-4 h-4" />
              </a>
              <a href="#planos" className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Ver planos <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700"><Users className="w-7 h-7" /></div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Projeto solo</p>
                <h3 className="text-xl font-bold text-gray-900">Construído de forma independente para o mercado automotivo</h3>
              </div>
            </div>
            <div className="mt-8 space-y-4">
              <div className="rounded-2xl bg-white p-4 border border-gray-100">
                <p className="text-sm font-semibold text-gray-900">Missão</p>
                <p className="mt-1 text-sm text-gray-600">Tornar o agendamento e a gestão de centros automotivos mais simples, acessíveis e profissionais.</p>
              </div>
              <div className="rounded-2xl bg-white p-4 border border-gray-100">
                <p className="text-sm font-semibold text-gray-900">Visão de produto</p>
                <p className="mt-1 text-sm text-gray-600">Criar uma experiência prática para profissionais e clientes, sem burocracia desnecessária.</p>
              </div>
              <div className="rounded-2xl bg-white p-4 border border-gray-100">
                <p className="text-sm font-semibold text-gray-900">Compromisso</p>
                <p className="mt-1 text-sm text-gray-600">Evoluir continuamente a plataforma com melhorias reais, baseadas em uso e feedback.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────

const features = [
  { icon: <Calendar className="w-6 h-6" />, title: 'Agendamento Fácil', desc: 'Agende em segundos pelo app. Escolha o serviço, profissional e horário disponível sem precisar ligar.', color: 'blue' },
  { icon: <MapPin className="w-6 h-6" />, title: 'Perto de Você', desc: 'Encontre os melhores centros automotivos na sua cidade ou bairro com busca por localização.', color: 'green' },
  { icon: <Clock className="w-6 h-6" />, title: 'Avaliações Reais', desc: 'Veja avaliações de clientes reais antes de escolher. Transparência total para a sua decisão.', color: 'yellow' },
  { icon: <BellRing className="w-6 h-6" />, title: 'Lembretes Automáticos', desc: 'Clientes recebem lembretes diários por push no celular. Ninguém mais esquece o agendamento.', color: 'purple' },
  { icon: <Droplets className="w-6 h-6" />, title: 'Status em Tempo Real', desc: 'Acompanhe cada etapa: pendente, confirmado, a caminho, em execução, pronto e finalizado.', color: 'cyan' },
  { icon: <Shield className="w-6 h-6" />, title: 'Seguro e Confiável', desc: 'Dados protegidos com criptografia, autenticação JWT e conformidade com LGPD.', color: 'red' },
  { icon: <Tag className="w-6 h-6" />, title: 'Promoções de Serviços', desc: 'Crie promoções com preços especiais. Serviços em destaque aparecem para clientes próximos.', color: 'orange' },
  { icon: <Car className="w-6 h-6" />, title: 'Leva e Traz', desc: 'Suporte completo para modalidade leva e traz: busca e entrega do veículo com cálculo de distância.', color: 'indigo' },
];

const featureColors: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600', yellow: 'bg-yellow-50 text-yellow-600',
  purple: 'bg-purple-50 text-purple-600', cyan: 'bg-cyan-50 text-cyan-600', red: 'bg-red-50 text-red-600',
  orange: 'bg-orange-50 text-orange-600', indigo: 'bg-indigo-50 text-indigo-600',
};

function Features() {
  return (
    <section id="funcionalidades" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Tudo que você precisa em um só lugar</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">O Lava Meu Carro foi criado para tornar sua experiência automotiva mais simples, rápida e agradável.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map(({ icon, title, desc, color }) => (
            <div key={title} className="group p-6 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${featureColors[color]}`}>{icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    { num: 1, title: 'Cliente escolhe o centro e profissional', desc: 'Pelo app, o cliente encontra sua unidade, vê serviços e seleciona o profissional ideal.' },
    { num: 2, title: 'Seleciona serviço, data e horário', desc: 'A agenda exibe horários disponíveis e o cliente conclui o agendamento em poucos toques.' },
    { num: 3, title: 'Seu centro recebe no painel Web Admin', desc: 'A solicitação entra direto na agenda da unidade com status e dados do cliente.' },
    { num: 4, title: 'Confirmações e acompanhamento', desc: 'Cliente e centro recebem notificações, reduzindo esquecimentos e melhorando a presença.' },
  ];
  return (
    <section id="como-funciona" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Como o cliente agenda no seu centro</h2>
          <p className="text-lg text-gray-600">Fluxo simples para o cliente, operação organizada para sua equipe.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map(({ num, title, desc }) => (
            <div key={num} className="text-center">
              <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md shadow-blue-200">{num}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-600 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── For Professionals ─────────────────────────────────────────────────────────

function ForProfessionals() {
  const benefits = [
    'Agenda digital integrada', 'Notificações automáticas para clientes', 'Gestão de serviços e preços',
    'Vários centros/unidades com a mesma licença', 'Relatório de agendamentos', 'Painel de gerenciamento completo',
    'Suporte dedicado', 'Leva e traz com cálculo de distância',
  ];
  return (
    <section id="profissionais" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
              <Car className="w-4 h-4" /> Para Profissionais e Centros Automotivos
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Gerencie seu centro de qualquer lugar</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Baixe o app, faça seu cadastro e em minutos tenha agenda, serviços, equipe, clientes e comunicações automáticas funcionando.
            </p>
            <p className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-6">
              Você começa hoje com <strong>30 dias grátis</strong>, testa tudo e ativa um sistema profissional completo sem burocracia.
            </p>
            <ul className="space-y-3 mb-8">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-3 text-gray-700"><CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />{b}</li>
              ))}
            </ul>
            <a href="https://wa.me/5554999374583?text=Oi!%20Quero%20começar%20a%20usar%20o%20Lava%20Meu%20Carro" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors">
              Começar teste grátis <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-8 text-center">
              <div className="w-24 h-24 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl shadow-blue-200">
                <Car className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Lava Meu Carro Pro</h3>
              <p className="text-gray-600 mb-6">Para profissionais que querem crescer</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm"><p className="text-2xl font-bold text-blue-600">∞</p><p className="text-xs text-gray-500">Agendamentos</p></div>
                <div className="bg-white rounded-xl p-4 shadow-sm"><p className="text-2xl font-bold text-blue-600">24/7</p><p className="text-xs text-gray-500">Online</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Complete Suite ────────────────────────────────────────────────────────────

const fullAccessFeatures = [
  { icon: <MonitorSmartphone className="w-6 h-6" />, title: 'App + painel Web Admin', desc: 'Operação completa no celular e no navegador, com a mesma conta.' },
  { icon: <Calendar className="w-6 h-6" />, title: 'Agenda com controle total', desc: 'Organize horários, encaixes, confirmações e status dos agendamentos.' },
  { icon: <Users className="w-6 h-6" />, title: 'Gestão de clientes, equipe e unidades', desc: 'Centralize histórico, profissionais, serviços e múltiplos centros na mesma licença.' },
  { icon: <BarChart3 className="w-6 h-6" />, title: 'Relatórios e indicadores', desc: 'Acompanhe desempenho para decidir com mais segurança e rapidez.' },
  { icon: <MailCheck className="w-6 h-6" />, title: 'Confirmações e status por e-mail', desc: 'Comunicação automática para reduzir dúvidas e faltas dos clientes.' },
  { icon: <BellRing className="w-6 h-6" />, title: 'Notificações e lembretes', desc: 'Avisos automáticos para profissional e cliente em cada etapa.' },
];

function CompleteSuite() {
  return (
    <section className="py-24 bg-gray-50 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Tudo que o sistema entrega para o seu centro</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">Você faz o registro rápido e já entra com um sistema completo em mãos. Todos os planos liberam os mesmos módulos.</p>
        </div>
        <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-800">
          O que muda entre os planos é apenas o limite de agendamentos por ciclo. Recursos como painel Web Admin, múltiplos centros/unidades, relatórios, notificações e e-mails automáticos continuam inclusos em todos.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {fullAccessFeatures.map((item) => (
            <article key={item.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">{item.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{item.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Plans ─────────────────────────────────────────────────────────────────────

function PlansSection() {
  const plans = [
    { name: 'Starter', price: 'R$ 89', period: '/mês', limit: 'Até 100 agendamentos/mês', features: ['1 unidade', 'Painel web completo', 'Notificações push', 'Suporte por email'], recommended: false },
    { name: 'Professional', price: 'R$ 149', period: '/mês', limit: 'Agendamentos ilimitados', features: ['Até 3 unidades', 'Painel web + app', 'Notificações push', 'Relatórios avançados', 'Suporte prioritário'], recommended: true },
    { name: 'Enterprise', price: 'R$ 249', period: '/mês', limit: 'Agendamentos ilimitados', features: ['Unidades ilimitadas', 'API dedicada', 'White-label', 'Gerente de conta', 'SLA garantido'], recommended: false },
  ];
  return (
    <section id="planos" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Planos de assinatura</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Escolha o plano ideal e comece a usar com 30 dias grátis, sem cartão de crédito.</p>
          <p className="mt-3 text-sm font-medium text-blue-700">Registro rápido e acesso completo: app, painel Web Admin, agenda, equipe, relatórios e comunicações automáticas.</p>
        </div>
        <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-sm text-emerald-800">
          A assinatura é por volume de uso: muda somente o limite de agendamentos por ciclo. O sistema completo continua liberado em qualquer plano.
        </div>
        <div className="mb-10 rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-cyan-50 p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">30 dias grátis • sem cartão de crédito</span>
              <h3 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">Começar é simples e rápido</h3>
              <p className="mt-3 text-gray-600">Para usar o Lava Meu Carro como profissional, basta entrar em contato pelo WhatsApp e fazemos seu cadastro. Em poucos minutos você ativa um sistema completo.</p>
            </div>
            <a href="https://wa.me/5554999374583?text=Oi!%20Quero%20começar%20a%20usar%20o%20Lava%20Meu%20Carro" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-5 py-3 text-sm font-semibold text-white hover:bg-green-600 transition-colors whitespace-nowrap">
              <MessageCircle className="w-4 h-4" /> Falar no WhatsApp <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-bold">1</div><h4 className="font-semibold text-gray-900">Fale conosco</h4><p className="mt-1 text-sm text-gray-600">Entre em contato pelo WhatsApp para iniciar seu cadastro.</p></div>
            <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-bold">2</div><h4 className="font-semibold text-gray-900">Configure seu centro</h4><p className="mt-1 text-sm text-gray-600">Cadastre serviços, profissionais, horários e unidades.</p></div>
            <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-bold">3</div><h4 className="font-semibold text-gray-900">Teste grátis por 30 dias</h4><p className="mt-1 text-sm text-gray-600">Use a plataforma completa sem pagar nada no início.</p></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <article key={plan.name} className={`rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow ${plan.recommended ? 'border-2 border-blue-500' : 'border border-gray-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div><h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3></div>
                {plan.recommended && <span className="rounded-full px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white">Mais vantajoso</span>}
              </div>
              <div className="mt-5 border-t border-gray-100 pt-5">
                <p className="text-2xl font-bold text-gray-900">{plan.price}</p>
                <p className="mt-1 text-sm text-gray-500">{plan.period}</p>
                <p className="mt-2 text-xs font-medium text-blue-700">{plan.limit}</p>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-gray-700">
                {plan.features.map((f) => <li key={f} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-600" />{f}</li>)}
                <li className="flex items-center gap-2 font-medium text-emerald-700"><CheckCircle className="w-4 h-4 text-emerald-600" />Acesso completo ao app e painel Web Admin</li>
              </ul>
              <a href="https://wa.me/5554999374583?text=Oi!%20Quero%20saber%20mais%20sobre%20o%20plano%20" target="_blank" rel="noopener noreferrer" className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${plan.recommended ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                Começar teste grátis <ChevronRight className="w-4 h-4" />
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  { question: 'Como começo a usar o Lava Meu Carro?', answer: 'Entre em contato pelo WhatsApp, fazemos seu cadastro e configuração inicial. Em minutos você está operando com agenda, serviços e clientes.' },
  { question: 'O cliente precisa ter o app?', answer: 'Sim. O cliente precisa baixar o aplicativo Lava Meu Carro para criar uma conta, encontrar centros automotivos e agendar serviços. Após o cadastro, ele acompanha status, histórico e notificações diretamente pelo app.' },
  { question: 'Funciona para lava-jato, estética e detalhamento?', answer: 'Sim! O sistema atende todos os tipos de serviços automotivos: lavagem, polimento, cristalização, higienização, insulfilm e mais.' },
  { question: 'Como funciona o agendamento pelo cliente?', answer: 'O cliente cria uma conta, encontra centros automotivos, escolhe o serviço, visualiza horários disponíveis e agenda pelo próprio app. Depois, acompanha status, histórico e notificações.' },
  { question: 'Como funciona para centros automotivos?', answer: 'O centro cadastra unidade, profissionais, serviços, horários e passa a controlar agenda, clientes, relatórios e notificações. Também é possível usar o Web Admin para uma gestão mais confortável no computador.' },
  { question: 'O que é a licença/assinatura?', answer: 'A licença/assinatura é por centro/unidade e habilita a publicação do negócio na plataforma. O uso é limitado pelo volume de agendamentos por mês, conforme o plano contratado.' },
  { question: 'Existe teste grátis?', answer: 'Sim. Cada conta tem direito a um período de teste gratuito de 30 dias. Após o período, é necessário contratar um plano para continuar utilizando.' },
  { question: 'Posso usar pelo celular e pelo computador?', answer: 'Sim. O cliente normalmente usa o app mobile. Já o centro pode operar tanto no app quanto no Web Admin, com recursos de gestão, agenda, cadastro e relatórios.' },
  { question: 'Consigo ver relatórios do meu negócio?', answer: 'Sim. A plataforma possui relatórios com indicadores visuais para acompanhar faturamento, atendimentos, profissionais, serviços e desempenho operacional.' },
  { question: 'Dá para cadastrar mais de uma unidade?', answer: 'Sim. O sistema foi preparado para gestão por unidade, permitindo separar profissionais, serviços, agenda e relatórios conforme a estrutura do negócio.' },
  { question: 'O cliente recebe confirmações e avisos?', answer: 'Sim. O sistema envia notificações push em cada etapa do agendamento, reduzindo faltas e mantendo todos informados.' },
  { question: 'Meus dados estão seguros?', answer: 'Sim. A plataforma utiliza HTTPS/TLS para transmissão, armazenamento protegido de credenciais e controles de acesso por perfil. O tratamento de dados segue diretrizes da LGPD.' },
];

function FaqSection() {
  return (
    <section id="faq" className="py-24 bg-white border-y border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4">FAQ</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Perguntas frequentes</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Tire suas dúvidas sobre o Lava Meu Carro.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FAQ_ITEMS.map(({ question, answer }) => (
            <details key={question} className="group bg-white rounded-2xl border border-gray-200 px-5 py-4 shadow-sm open:shadow-md transition-shadow">
              <summary className="list-none cursor-pointer flex items-start justify-between gap-4">
                <span className="text-sm sm:text-base font-semibold text-gray-900">{question}</span>
                <ChevronRight className="w-5 h-5 text-blue-600 flex-shrink-0 transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-7">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Privacy / LGPD ────────────────────────────────────────────────────────────

function PrivacyCommitmentSection() {
  return (
    <section id="privacidade" className="py-24 bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4">LGPD</span>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Seu dado é seu. Protegemos de verdade.</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">O Lava Meu Carro foi desenvolvido em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Lock, title: 'Dados mínimos necessários', text: 'Coletamos apenas nome, e-mail e informações de agendamento — nada além do essencial.' },
            { icon: Eye, title: 'Transparência total', text: 'Você sabe exatamente o que coletamos, com quem compartilhamos e por quê.' },
            { icon: Trash2, title: 'Direito ao esquecimento', text: 'A qualquer momento você pode solicitar a exclusão de todos os seus dados.' },
            { icon: Shield, title: 'Segurança na transmissão', text: 'Toda comunicação é criptografada via HTTPS/TLS. Senhas com hash seguro (bcrypt).' },
            { icon: Cookie, title: 'Cookies com consentimento', text: 'Cookies analíticos são ativados somente após sua permissão explícita, conforme a LGPD.' },
            { icon: MailCheck, title: 'E-mails só quando necessário', text: 'Enviamos e-mails transacionais (confirmações, lembretes) e nunca vendemos sua lista de contatos.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-gray-50 rounded-2xl p-6 flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><Icon className="w-5 h-5 text-blue-600" /></div>
              <div><h4 className="font-semibold text-gray-900 mb-1">{title}</h4><p className="text-sm text-gray-500 leading-relaxed">{text}</p></div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">
          Dúvidas ou solicitações LGPD? Fale conosco via <a href="https://wa.me/5554999374583" className="underline">WhatsApp</a>.
        </p>
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────────

function Testimonials() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Comunidade em crescimento</h2>
        <p className="text-lg text-gray-600">Estamos começando nossa jornada e você pode ser parte dela. Em breve, teremos histórias reais de nossos primeiros clientes e profissionais.</p>
      </div>
    </section>
  );
}

// ── Download CTA ──────────────────────────────────────────────────────────────

function DownloadCta() {
  return (
    <section className="py-24 bg-blue-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Pronto para transformar a gestão do seu centro automotivo?</h2>
        <p className="text-blue-100 text-lg mb-10">Ative o Lava Meu Carro e ofereça agendamento online com controle total no app e no Web Admin.</p>
        <a href="https://wa.me/5554999374583?text=Oi!%20Quero%20começar%20a%20usar%20o%20Lava%20Meu%20Carro" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors shadow-lg text-lg">
          <MessageCircle className="w-6 h-6" /> Falar no WhatsApp
        </a>
      </div>
    </section>
  );
}

// ── WhatsApp Float ────────────────────────────────────────────────────────────

function WhatsAppFloat() {
  return (
    <a href="https://wa.me/5554999374583?text=Oi!%20Quero%20conhecer%20o%20Lava%20Meu%20Carro" target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors" aria-label="WhatsApp">
      <MessageCircle className="w-7 h-7 text-white" />
    </a>
  );
}

// ── Cookie Consent ────────────────────────────────────────────────────────────

function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(true);

  useEffect(() => {
    const consent = localStorage.getItem('lmc_cookie_consent');
    if (!consent) { const t = setTimeout(() => setVisible(true), 1200); return () => clearTimeout(t); }
  }, []);

  if (!visible) return null;

  const acceptAll = () => { localStorage.setItem('lmc_cookie_consent', JSON.stringify({ analytics: true })); setVisible(false); };
  const rejectAll = () => { localStorage.setItem('lmc_cookie_consent', JSON.stringify({ analytics: false })); setVisible(false); };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center pointer-events-none">
      <div className="pointer-events-auto bg-white border border-gray-200 shadow-2xl rounded-2xl max-w-xl w-full p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2"><Cookie className="w-5 h-5 text-blue-600 flex-shrink-0" /><span className="font-bold text-gray-900 text-sm">Cookies e privacidade</span></div>
          <button onClick={rejectAll} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed mb-4">
          Usamos cookies <strong>necessários</strong> para o funcionamento do site e, com sua permissão, cookies <strong>analíticos</strong> para melhorar nossos serviços. Conforme a <strong>LGPD</strong>, você tem controle total.
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={acceptAll} className="flex-1 min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-colors">Aceitar todos</button>
          <button onClick={rejectAll} className="flex-1 min-w-[120px] border border-gray-200 hover:border-gray-300 text-gray-500 text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors">Recusar opcionais</button>
        </div>
      </div>
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer id="contato" className="bg-gray-900 text-gray-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><Car className="w-5 h-5 text-white" /></div>
              <span className="font-bold text-white">Lava Meu Carro</span>
            </div>
            <p className="text-sm leading-relaxed">A plataforma completa para gestão de estéticas automotivas.</p>
            <p className="mt-3 text-xs leading-relaxed text-gray-500">Projeto criado e evoluído por Tharso Francisco Rech Curia, fundador.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#quem-somos" className="hover:text-white transition-colors">Quem somos</a></li>
              <li><a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a></li>
              <li><a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a></li>
              <li><a href="#profissionais" className="hover:text-white transition-colors">Para Profissionais</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              <li><a href="#privacidade" className="hover:text-white transition-colors">Privacidade (LGPD)</a></li>
              <li><a href="#planos" className="hover:text-white transition-colors">Planos</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contato</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-green-400" /><a href="https://wa.me/5554999374583" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm">© {new Date().getFullYear()} Lava Meu Carro. Todos os direitos reservados.</p>
          <div className="flex gap-4 text-sm">
            <a href="#privacidade" className="hover:text-white transition-colors">Política de Privacidade</a>
            <a href="/admin/login" className="hover:text-white transition-colors">Área do Cliente</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
