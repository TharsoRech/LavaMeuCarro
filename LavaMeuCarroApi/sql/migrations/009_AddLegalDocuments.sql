-- =====================================================
-- LavaMeuCarro - Legal Documents Migration
-- =====================================================

-- 1. TERMS OF USE
INSERT INTO LegalDocuments (Code, Title, Version, Context, Content, IsRequired, Active, CreatedAt)
VALUES (
    'TERMS_OF_USE',
    'Termos de Uso - Lava Meu Carro',
    '1.0',
    'registration',
    N'ULTIMA ATUALIZACAO: 11 de Junho de 2026

TERMOS DE USO DA PLATAFORMA LAVA MEU CARRO

ATENCAO: LEIA ESTES TERMOS CUIDADOSAMENTE ANTES DE UTILIZAR NOSSOS SERVICOS.

1. DEFINICOES E ESCOPO DO SERVICO

1.1. A PLATAFORMA LAVA MEU CARRO e um servico digital que funciona como intermediario tecnologico entre clientes (proprietarios de veiculos) e prestadores de servicos automotivos.

1.2. O LAVA MEU CARRO atua exclusivamente como PLATAFORMA DE INTERMEDIACAO TECNOLOGICA, facilitando agendamento, comunicacao e gerenciamento de servicos.

1.3. O LAVA MEU CARRO NAO E prestador direto de servicos automotivos, empregador dos profissionais, ou garante de qualidade ou resultado.

2. NATUREZA DA RESPONSABILIDADE - ISENCAO E LIMITACAO

2.1. RESPONSABILIDADE DO PRESTADOR DE SERVICO:
   - Todo servico automotivo e contratado e executado EXCLUSIVAMENTE pelo prestador de servico;
   - O prestador e o UNICO responsavel pela qualidade, seguranca e resultado;
   - Qualquer dano ao veiculo ou propriedade e de responsabilidade EXCLUSIVA do prestador.

2.2. ISENCAO DE RESPONSABILIDADE DO LAVA MEU CARRO:
   O LAVA MEU CARRO NAO SE RESPONSABILIZA POR:
   - Danos materiais, esteticos ou mecanicos ao veiculo;
   - Furto, roubo ou perda de objetos pessoais;
   - Atrasos, cancelamentos ou falhas na execucao;
   - Conduta ou competencia do prestador;
   - Acidentes durante transporte do veiculo;
   - Incidentes quando o veiculo estiver sob guarda do prestador ou garagem;
   - Disputas entre cliente e prestador.

2.3. TRANSPORTE E GUARDA DO VEICULO:
   - Quando o prestador realiza transporte (busca/entrega) ou guarda, toda responsabilidade e EXCLUSIVA do prestador/garagem;
   - A partir do momento em que entrega o veiculo ao prestador, toda responsabilidade e transferida ao prestador ate a devolucao.

3. OBRIGACOES DO USUARIO

3.1. Fornecer informacoes verdadeiras;
3.2. Pagar pelos servicos contratados;
3.3. Retirar objetos de valor do veiculo antes da entrega;
3.4. Informar condicoes especiais do veiculo.

4. PRECOS E PAGAMENTOS

4.1. Precos sao definidos pelos prestadores, nao pelo LAVA MEU CARRO.
4.2. O LAVA MEU CARRO pode cobrar taxa de intermediacao.
4.3. Nao armazenamos dados de cartao de credito.

5. PROTECAO DE DADOS (LGPD)

5.1. Tratamos dados em conformidade com a LGPD (Lei 13.709/2018).
5.2. Consulte nossa Politica de Privacidade para detalhes.

6. LIMITACAO DE GARANTIAS

6.1. A PLATAFORMA E FORNECIDA NO ESTADO EM QUE SE ENCONTRA, sem garantias.

7. CONTATO

Para duvidas: suporte@lavameucarro.com

AO UTILIZAR A PLATAFORMA, VOCE DECLARA QUE LEU, COMPREENDEU E CONCORDOU INTEGRALMENTE COM ESTES TERMOS.',
    1,
    1,
    GETUTCDATE()
);

-- 2. PRIVACY POLICY
INSERT INTO LegalDocuments (Code, Title, Version, Context, Content, IsRequired, Active, CreatedAt)
VALUES (
    'PRIVACY_POLICY',
    'Politica de Privacidade - Lava Meu Carro',
    '1.0',
    'registration',
    N'ULTIMA ATUALIZACAO: 11 de Junho de 2026

POLITICA DE PRIVACIDADE - LAVA MEU CARRO

Estamos comprometidos com a protecao de seus dados pessoais em conformidade com a LGPD.

1. DADOS COLETADOS

1.1. Dados fornecidos por voce:
   - Nome, e-mail, telefone, CPF/CNPJ, data de nascimento;
   - Foto de perfil (opcional);
   - Endereco e localizacao (quando autorizado);
   - Informacoes do veiculo.

1.2. Dados coletados automaticamente:
   - Endereco IP, tipo de dispositivo;
   - Informacoes de navegacao;
   - Localizacao (quando autorizado).

2. FINALIDADES

Utilizamos seus dados para:
   - Criar e gerenciar sua conta;
   - Facilitar agendamentos;
   - Processar pagamentos;
   - Enviar comunicacoes;
   - Melhorar a plataforma;
   - Prevenir fraudes.

3. COMPARTILHAMENTO

Compartilhamos dados apenas com:
   - Prestadores de servico (dados necessarios para execucao);
   - Processadores de pagamento;
   - Provedores de infraestrutura;
   - Autoridades legais (quando exigido).

NAO vendemos ou alugamos seus dados.

4. SEGURANCA

   - Criptografia HTTPS/TLS;
   - Hash de senhas com BCrypt;
   - Acesso restrito;
   - Backups criptografados.

5. SEUS DIREITOS (LGPD)

Voce pode:
   - Acessar seus dados;
   - Solicitar correcao;
   - Solicitar eliminacao;
   - Revogar consentimento;
   - Solicitar portabilidade.

Contato: privacidade@lavameucarro.com

6. COOKIES

Utilizamos cookies para sessao, preferencias e analytics.

7. ALTERACOES

Podemos atualizar esta politica. Alteracoes serao comunicadas.',
    1,
    1,
    GETUTCDATE()
);

-- 3. LGPD CONSENT
INSERT INTO LegalDocuments (Code, Title, Version, Context, Content, IsRequired, Active, CreatedAt)
VALUES (
    'LGPD_CONSENT',
    'Consentimento para Tratamento de Dados Pessoais (LGPD)',
    '1.0',
    'registration',
    N'CONSENTIMENTO PARA TRATAMENTO DE DADOS PESSOAIS
Em conformidade com a Lei Geral de Protecao de Dados (LGPD)

EU, na qualidade de usuario da plataforma LAVA MEU CARRO, DECLARO E AUTORIZO:

1. COLETA E USO DE DADOS

Autorizo a coleta, armazenamento e uso dos meus dados pessoais para:
   - Criacao e gerenciamento da conta;
   - Facilitacao de agendamentos;
   - Processamento de pagamentos;
   - Comunicacao sobre servicos e promocoes;
   - Melhoria da experiencia;
   - Prevencao de fraudes.

2. COMPARTILHAMENTO DE DADOS

Autorizo o compartilhamento com:
   - Prestadores de servico (nome, telefone, endereco, veiculo);
   - Processadores de pagamento;
   - Provedores de infraestrutura.

3. LOCALIZACAO

Autorizo o uso da minha localizacao para:
   - Exibir unidades e prestadores proximos;
   - Calcular rotas;
   - Personalizar ofertas.

Posso desativar a qualquer momento nas configuracoes.

4. COMUNICACOES DE MARKETING

Autorizo recebimento de:
   - Notificacoes push;
   - E-mails marketing;
   - Mensagens WhatsApp.

Posso cancelar a qualquer momento.

5. DIREITOS DO TITULAR

Posso, a qualquer momento:
   - Acessar meus dados;
   - Solicitar correcao;
   - Solicitar eliminacao;
   - Revogar consentimento.

Contato: privacidade@lavameucarro.com

ESTE CONSENTIMENTO E FORNECIDO DE FORMA LIVRE, INFORMADA E INEQUIVOCA.',
    1,
    1,
    GETUTCDATE()
);

PRINT 'Legal documents inserted successfully!';
SELECT Id, Code, Title, Version, Context FROM LegalDocuments WHERE Active = 1 ORDER BY Code;
