import { Car, MapPin, Clock, Shield, Star, ChevronRight, MessageCircle, Phone, CheckCircle, Sparkles, Droplets, Timer } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <ForOwners />
      <Plans />
      <AboutSection />
      <FAQ />
      <DownloadCta />
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}

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
          <a href="#funcionalidades" className="hover:text-blue-600 transition-colors">Funcionalidades</a>
          <a href="#como-funciona" className="hover:text-blue-600 transition-colors">Como Funciona</a>
          <a href="#planos" className="hover:text-blue-600 transition-colors">Planos</a>
          <a href="#quem-somos" className="hover:text-blue-600 transition-colors">Quem Somos</a>
          <a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a>
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

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 pt-20 pb-32">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400 rounded-full opacity-20 blur-3xl" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
          <Sparkles className="w-4 h-4" />
          Sistema completo para estéticas automotivas
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 text-balance">
          Seu centro automotivo com
          <span className="text-cyan-300"> agenda online, controle total e mais clientes</span>
        </h1>
        <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-10">
          O cliente agenda pelo app ou site, você recebe tudo no painel administrativo: horários, confirmações, notificações e relatórios para crescer com controle.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="https://wa.me/5554999374583?text=Oi!%20Quero%20conhecer%20o%20Lava%20Meu%20Carro" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-3 px-6 py-4 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors shadow-lg">
            <MessageCircle className="w-6 h-6" />
            Falar no WhatsApp
          </a>
          <a href="#como-funciona" className="inline-flex items-center justify-center gap-3 px-6 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20">
            Como funciona
            <ChevronRight className="w-5 h-5" />
          </a>
        </div>
        <p className="mt-6 text-sm text-blue-200">
          Teste grátis por 30 dias • Sem cartão de crédito • Setup rápido
        </p>
      </div>
    </section>
  );
}

const features = [
  { icon: <Droplets className="w-6 h-6" />, title: 'Lavagem & Estética', desc: 'Controle completo de serviços: lavagem simples, detalhada, polimento, cristalização, higienização interna e mais.' },
  { icon: <Clock className="w-6 h-6" />, title: 'Agendamento Online', desc: 'Cliente agenda pelo app ou site, escolhe serviço, data e horário. Você recebe direto no painel.' },
  { icon: <MapPin className="w-6 h-6" />, title: 'Leva e Traz', desc: 'Suporte completo para modalidade leva e traz: busca e entrega do veículo com cálculo de distância.' },
  { icon: <Timer className="w-6 h-6" />, title: 'Status em Tempo Real', desc: 'Acompanhe cada etapa: pendente, confirmado, a caminho, em execução, pronto e finalizado.' },
  { icon: <Star className="w-6 h-6" />, title: 'Avaliações', desc: 'Clientes avaliam o serviço. Construa reputação e fidelize clientes com avaliações positivas.' },
  { icon: <Shield className="w-6 h-6" />, title: 'Seguro e Confiável', desc: 'Dados protegidos com criptografia, autenticação JWT e conformidade com LGPD.' },
  { icon: <MessageCircle className="w-6 h-6" />, title: 'Notificações Push', desc: 'Clientes recebem lembretes automáticos. Reduza faltas e mantenha todos informados.' },
  { icon: <Car className="w-6 h-6" />, title: 'Gestão de Frota', desc: 'Cadastre veículos dos clientes com placa, marca, modelo, cor e tamanho para controle total.' },
];

function Features() {
  return (
    <section id="funcionalidades" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Tudo que seu centro automotivo precisa</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Sistema completo para gerenciar serviços, agendamentos, equipe e clientes.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map(({ icon, title, desc }) => (
            <div key={title} className="group p-6 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-blue-50 text-blue-600">{icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { num: 1, title: 'Cliente encontra seu centro', desc: 'Pelo app ou site, o cliente encontra sua unidade, vê serviços disponíveis e escolhe o ideal.' },
    { num: 2, title: 'Agenda serviço e horário', desc: 'A agenda mostra horários disponíveis e o cliente confirma o agendamento em poucos toques.' },
    { num: 3, title: 'Você recebe no painel', desc: 'A solicitação entra no painel administrativo com todos os dados do cliente e veículo.' },
    { num: 4, title: 'Execução e finalização', desc: 'Acompanhe cada etapa do serviço, atualize o status e finalize. O cliente é notificado.' },
  ];
  return (
    <section id="como-funciona" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Como funciona</h2>
          <p className="text-lg text-gray-600">Simples para o cliente, organizado para você.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map(({ num, title, desc }) => (
            <div key={num} className="text-center">
              <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg shadow-blue-200">{num}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-600 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ForOwners() {
  const benefits = [
    'Agenda digital completa',
    'Notificações automáticas para clientes',
    'Gestão de serviços, preços e categorias',
    'Múltiplas unidades com a mesma conta',
    'Relatórios de agendamentos e faturamento',
    'Painel web e app mobile',
    'Controle de equipe e funcionários',
    'Suporte a leva e traz com cálculo de distância',
  ];
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
              <Car className="w-4 h-4" /> Para Proprietários
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Gerencie seu centro automotivo de qualquer lugar</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Configure sua unidade, serviços, equipe e em minutos tenha agenda, clientes e comunicações automáticas funcionando.
            </p>
            <ul className="space-y-3 mb-8">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />{b}
                </li>
              ))}
            </ul>
            <a href="https://wa.me/5554999374583?text=Oi!%20Quero%20começar%20a%20usar%20o%20Lava%20Meu%20Carro" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors">
              Começar agora <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-8 text-center">
              <div className="w-24 h-24 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl shadow-blue-200">
                <Car className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Lava Meu Carro Pro</h3>
              <p className="text-gray-600 mb-6">Para quem quer crescer com profissionalismo</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-2xl font-bold text-blue-600">∞</p>
                  <p className="text-xs text-gray-500">Agendamentos</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-2xl font-bold text-blue-600">24/7</p>
                  <p className="text-xs text-gray-500">Online</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Plans() {
  const plans = [
    { name: 'Starter', price: 'R$ 89', period: '/mês', features: ['1 unidade', 'Até 100 agendamentos/mês', 'Painel web completo', 'Notificações push', 'Suporte por email'], recommended: false },
    { name: 'Professional', price: 'R$ 149', period: '/mês', features: ['Até 3 unidades', 'Agendamentos ilimitados', 'Painel web + app', 'Notificações push', 'Relatórios avançados', 'Suporte prioritário'], recommended: true },
    { name: 'Enterprise', price: 'R$ 249', period: '/mês', features: ['Unidades ilimitadas', 'Agendamentos ilimitados', 'API dedicada', 'White-label', 'Gerente de conta', 'SLA garantido'], recommended: false },
  ];
  return (
    <section id="planos" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Planos que cabem no seu bolso</h2>
          <p className="text-lg text-gray-600">Comece com 30 dias grátis, sem cartão de crédito.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.name} className={`rounded-2xl bg-white p-8 shadow-sm ${plan.recommended ? 'border-2 border-blue-500 relative' : 'border border-gray-200'}`}>
              {plan.recommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">Mais popular</span>
              )}
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-gray-500">{plan.period}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <a href="https://wa.me/5554999374583?text=Oi!%20Quero%20saber%20mais%20sobre%20o%20plano%20" target="_blank" rel="noopener noreferrer" className={`mt-8 block text-center py-3 rounded-xl font-semibold text-sm transition-colors ${plan.recommended ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                Começar teste grátis
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="quem-somos" className="py-24 bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">Quem somos</span>
          <h2 className="mt-6 text-3xl sm:text-4xl font-bold text-gray-900">
            Plataforma criada para simplificar a gestão automotiva
          </h2>
          <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            O Lava Meu Carro nasceu da necessidade de profissionalizar o setor de estética automotiva. 
            Nossa plataforma conecta centros automotivos a clientes, facilitando agendamentos, 
            gestão de serviços e comunicação automática.
          </p>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    { q: 'Como começo a usar o Lava Meu Carro?', a: 'Entre em contato pelo WhatsApp, fazemos seu cadastro e configuração inicial. Em minutos você está operando com agenda, serviços e clientes.' },
    { q: 'O cliente precisa ter o app?', a: 'Não. O cliente pode agendar pelo site sem precisar baixar nada. O app é opcional para uma experiência mais completa.' },
    { q: 'Funciona para lava-jato, estética e detalhamento?', a: 'Sim! O sistema atende todos os tipos de serviços automotivos: lavagem, polimento, cristalização, higienização, insulfilm e mais.' },
    { q: 'Posso cadastrar múltiplas unidades?', a: 'Sim, dependendo do plano você pode gerenciar várias unidades com a mesma conta, cada uma com seus serviços e equipe.' },
    { q: 'Como funciona o leva e traz?', a: 'O sistema calcula a distância entre o endereço do cliente e sua unidade, gerando um valor adicional para o serviço de busca e entrega.' },
    { q: 'Meus dados estão seguros?', a: 'Sim. Usamos criptografia HTTPS, autenticação JWT e seguimos as diretrizes da LGPD para proteção de dados.' },
  ];
  return (
    <section id="faq" className="py-24 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Perguntas Frequentes</h2>
        </div>
        <div className="space-y-4">
          {items.map(({ q, a }) => (
            <details key={q} className="group bg-white rounded-2xl border border-gray-200 px-6 py-4 shadow-sm open:shadow-md transition-shadow">
              <summary className="list-none cursor-pointer flex items-center justify-between gap-4">
                <span className="font-semibold text-gray-900">{q}</span>
                <ChevronRight className="w-5 h-5 text-blue-600 flex-shrink-0 transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function DownloadCta() {
  return (
    <section className="py-24 bg-blue-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Pronto para profissionalizar seu centro automotivo?</h2>
        <p className="text-blue-100 text-lg mb-10">Comece hoje com 30 dias grátis. Sem cartão de crédito, sem burocracia.</p>
        <a href="https://wa.me/5554999374583?text=Oi!%20Quero%20começar%20a%20usar%20o%20Lava%20Meu%20Carro" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors shadow-lg text-lg">
          <MessageCircle className="w-6 h-6" />
          Falar no WhatsApp
        </a>
      </div>
    </section>
  );
}

function WhatsAppFloat() {
  return (
    <a href="https://wa.me/5554999374583?text=Oi!%20Quero%20conhecer%20o%20Lava%20Meu%20Carro" target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors" aria-label="WhatsApp">
      <MessageCircle className="w-7 h-7 text-white" />
    </a>
  );
}

function Footer() {
  return (
    <footer id="contato" className="bg-gray-900 text-gray-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white">Lava Meu Carro</span>
            </div>
            <p className="text-sm leading-relaxed">A plataforma completa para gestão de estéticas automotivas.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Navegação</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a></li>
              <li><a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a></li>
              <li><a href="#planos" className="hover:text-white transition-colors">Planos</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contato</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-400" />
                <a href="https://wa.me/5554999374583" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400" />
                <span>(54) 99937-4583</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm">© {new Date().getFullYear()} Lava Meu Carro. Todos os direitos reservados.</p>
          <a href="/admin/login" className="text-sm hover:text-white transition-colors">Área do Cliente</a>
        </div>
      </div>
    </footer>
  );
}
