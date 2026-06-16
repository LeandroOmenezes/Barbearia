# Documentação Completa - Sistema de Gestão para Salão de Beleza

## Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Arquitetura Técnica](#arquitetura-técnica)
3. [Funcionalidades Principais](#funcionalidades-principais)
4. [Manual do Usuário](#manual-do-usuário)
5. [Manual do Administrador](#manual-do-administrador)
6. [Configuração e Deployment](#configuração-e-deployment)
7. [Troubleshooting](#troubleshooting)
8. [Histórico de Atualizações](#histórico-de-atualizações)

---

## Visão Geral do Sistema

### Objetivo
O **Ateliê de Beleza** é um sistema completo de gestão para salões de beleza que oferece uma experiência digital moderna tanto para clientes quanto para administradores. O sistema facilita o agendamento de serviços, gestão de clientes, controle de vendas e personalização completa da marca.

### Características Principais
- **Interface Responsiva**: Funciona perfeitamente em desktop, tablet e mobile
- **Autenticação Segura**: Login local e integração com Google OAuth
- **Gestão Completa**: Agendamentos, clientes, serviços, preços e vendas
- **Personalização Total**: Logo, cores, banner, rodapé e conteúdo personalizáveis
- **Recuperação de Senha**: Sistema de reset via email
- **Avaliações e Feedback**: Sistema de reviews com curtidas

---

## Arquitetura Técnica

### Stack Tecnológico

#### Frontend
- **React 18** com TypeScript
- **Tailwind CSS** para estilização
- **Radix UI** componentes acessíveis
- **Wouter** para roteamento
- **TanStack React Query** para gerenciamento de estado do servidor
- **React Hook Form + Zod** para formulários e validação
- **Vite** como build tool

#### Backend
- **Node.js** com TypeScript
- **Express.js** framework web
- **Passport.js** para autenticação
- **PostgreSQL** banco de dados
- **Drizzle ORM** para operações de banco
- **Nodemailer** para envio de emails

#### Infraestrutura
- **Replit** para hospedagem
- **Neon Database** PostgreSQL serverless
- **Base64** para armazenamento de imagens no banco

### Estrutura de Pastas
```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── hooks/         # Hooks customizados
│   │   └── lib/           # Utilitários e configurações
├── server/                # Backend Express
│   ├── auth.ts           # Sistema de autenticação
│   ├── routes.ts         # Rotas da API
│   ├── db.ts             # Configuração do banco
│   └── storage.ts        # Interface de armazenamento
├── shared/               # Código compartilhado
│   └── schema.ts         # Schemas e tipos TypeScript
└── uploads/              # Diretório para arquivos (legacy)
```

---

## Funcionalidades Principais

### 1. Sistema de Autenticação
- **Login Local**: Email/senha com hash seguro
- **Google OAuth**: Integração completa com Google
- **Recuperação de Senha**: Email com token temporário
- **Sessões Seguras**: Cookies com expiração automática

### 2. Gestão de Agendamentos
- **Calendário Inteligente**: Horários de 40 em 40 minutos
- **Status Dinâmico**: Pendente, Confirmado, Realizado, Cancelado
- **Prevenção de Conflitos**: Impossível agendar horários ocupados
- **Notificações Visuais**: Cores e ícones para cada status

### 3. Catálogo de Serviços
- **Categorização**: Serviços organizados por categorias
- **Imagens Personalizadas**: Upload e gerenciamento de fotos
- **Preços Flexíveis**: Faixas de preço min/max
- **Serviços em Destaque**: Sistema de promoção

### 4. Gestão de Clientes
- **Perfis Completos**: Dados pessoais e histórico
- **Histórico de Agendamentos**: Visualização completa
- **Estatísticas Pessoais**: Dashboards individuais

### 5. Sistema de Avaliações
- **Reviews Públicos**: Clientes podem avaliar serviços
- **Sistema de Curtidas**: Interação social
- **Moderação**: Controle administrativo

### 6. Personalização da Marca
- **Logo Personalizada**: Upload e exibição automática
- **Cores da Marca**: Seletor de cores dinâmico
- **Banner Principal**: Imagem e textos customizáveis
- **Rodapé Completo**: Contatos e redes sociais
- **Tabela de Preços**: Gestão completa de preços

---

## Manual do Usuário

### Criando uma Conta
1. Acesse a página inicial
2. Clique em "Entrar" no menu
3. Selecione "Criar Conta"
4. Preencha: nome, email e senha
5. Confirme o email se necessário

### Fazendo Login
**Opção 1 - Login Local:**
1. Clique em "Entrar"
2. Digite email e senha
3. Clique em "Entrar"

**Opção 2 - Google:**
1. Clique em "Continuar com Google"
2. Autorize a aplicação
3. Redirecionamento automático

### Agendando um Serviço
1. Navegue pelos serviços na página inicial
2. Clique em "Agendar" no serviço desejado
3. Preencha o formulário:
   - Nome completo
   - Email de contato
   - Selecione a data
   - Escolha um horário disponível (verde)
   - Adicione observações se necessário
4. Confirme o agendamento

### Visualizando Agendamentos
1. Faça login na sua conta
2. Clique no ícone de usuário no header
3. Acesse "Perfil"
4. Visualize seus agendamentos e estatísticas

### Avaliando Serviços
1. Acesse a seção "Avaliações" na página inicial
2. Clique em "Deixar Avaliação"
3. Preencha: nome, nota (1-5 estrelas) e comentário
4. Envie a avaliação
5. Curta avaliações de outros clientes

---

## Manual do Administrador

### Acessando o Painel Admin
**Credenciais Padrão:**
- Email: `lleandro.m32@gmail.com`
- Senha: `admin123`

### Menu Administrativo
O administrador tem acesso a um menu hambúrguer especial com:
- Dashboard
- Gestão de Agendamentos
- Clientes e Vendas
- Gestão de Imagens
- Configurações do Site

### Gerenciando Agendamentos
1. Acesse "Dashboard" no menu admin
2. Visualize todos os agendamentos
3. Filtre por status se necessário
4. Altere status: Pendente → Confirmado → Realizado
5. Cancele agendamentos se necessário

### Gestão de Serviços
**Criando Novo Serviço:**
1. Menu Admin → "Gestão de Imagens"
2. Clique em "Adicionar Novo Serviço"
3. Preencha: nome, descrição, preços, categoria, ícone
4. Faça upload de imagem personalizada
5. Defina se é serviço em destaque

**Editando Serviço:**
1. Localize o serviço na lista
2. Clique em "Editar"
3. Modifique os campos necessários
4. Salve as alterações

**Upload de Imagens:**
1. Clique em "Escolher Imagem"
2. Selecione arquivo (JPG, PNG, WebP até 5MB)
3. Visualize o preview
4. Confirme o upload

### Gestão de Categorias
1. Menu Admin → "Categorias"
2. **Criar**: Nome, ícone FontAwesome
3. **Editar**: Modificar informações
4. **Remover**: Remove categoria e todos serviços/preços relacionados

### Tabela de Preços
1. Menu Admin → "Preços"
2. **Adicionar**: Nome do item, preços min/max, categoria
3. **Editar**: Clique no item para edição inline
4. **Remover**: Exclui item da tabela

### Personalização do Site
**Configurações Gerais:**
1. Menu Admin → "Configurações do Site"
2. Modifique: nome do site, slogan, cor primária
3. Upload de logo personalizada
4. Visualize mudanças em tempo real

**Banner Principal:**
1. Menu Admin → "Banner"
2. Edite: título, subtítulo, texto do botão, link
3. Upload de imagem de fundo
4. Preview instantâneo

**Rodapé:**
1. Menu Admin → "Rodapé"
2. Configure: dados do negócio, contatos, redes sociais
3. URLs opcionais para redes sociais
4. Informações de funcionamento

### Gestão de Vendas
1. Menu Admin → "Clientes e Vendas"
2. **Registrar Venda**: Cliente, serviço, valor, forma de pagamento
3. **Filtrar Vendas**: Por período, cliente ou serviço
4. **Relatórios**: Visualização de faturamento

### Criando Usuários Admin
1. Menu Admin → "Usuários"
2. Preencha dados do novo administrador
3. Marque "É Administrador"
4. Defina senha temporária

---

## Configuração e Deployment

### Variáveis de Ambiente Necessárias

```env
# Banco de Dados (Obrigatório)
DATABASE_URL=postgresql://user:password@host:port/database

# Autenticação de Sessão (Obrigatório)
SESSION_SECRET=sua_chave_secreta_aqui

# Google OAuth (Opcional)
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret

# Email para Recuperação de Senha (Opcional)
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_aplicativo

# SendGrid (Produção - Opcional)
SENDGRID_API_KEY=sua_chave_sendgrid
```

### Processo de Deploy no Replit

1. **Fork do Projeto**: Clone o repositório
2. **Configurar Variáveis**: Adicione as variáveis de ambiente
3. **Banco de Dados**: Provisione PostgreSQL
4. **Executar Migração**: `npm run db:push`
5. **Iniciar Aplicação**: `npm run dev`

### Configuração do Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto ou selecione existente
3. Ative a API "Google+ API"
4. Crie credenciais OAuth 2.0
5. Configure URLs autorizadas:
   - **Origens JavaScript**: `https://seu-dominio.replit.app`
   - **URIs de redirecionamento**: `https://seu-dominio.replit.app/api/auth/google/callback`

### Configuração de Email

**Opção 1 - Gmail:**
1. Ative verificação em 2 etapas
2. Gere senha de aplicativo
3. Use como `EMAIL_PASS`

**Opção 2 - SendGrid:**
1. Crie conta no SendGrid
2. Gere API Key
3. Configure `SENDGRID_API_KEY`

---

## Troubleshooting

### Problemas Comuns

#### 1. Erro de Autenticação Google
**Sintoma**: "Error 400: redirect_uri_mismatch"
**Solução**: 
- Verifique URLs no Google Cloud Console
- Certifique-se que coincidem com o domínio atual
- Aguarde até 5 minutos para propagação

#### 2. Emails Não Enviados
**Sintoma**: "Erro ao enviar email de recuperação"
**Soluções**:
- Verifique credenciais de email
- Confirme senha de aplicativo (Gmail)
- Teste com SendGrid em produção

#### 3. Imagens Não Carregam
**Sintoma**: Imagens quebradas após deploy
**Solução**: 
- Execute `/api/admin/regenerate-images`
- Sistema regenera automaticamente SVGs padrão
- Faça novo upload se necessário

#### 4. Agendamentos com Data Errada
**Sintoma**: Discrepância de datas entre usuário e admin
**Solução**: 
- Problema de timezone já corrigido
- Função `formatDate` implementada
- Datas agora consistentes

#### 5. Banco de Dados Não Conecta
**Sintoma**: "Database connection failed"
**Soluções**:
- Verifique `DATABASE_URL`
- Confirme que banco está ativo
- Execute `npm run db:push` para criar tabelas

### Logs de Debug

**Backend (Terminal):**
```bash
# Logs de autenticação
[auth] User login attempt: email@example.com

# Logs de agendamentos
[appointments] Creating appointment with data: {...}

# Logs de imagens
[images] Serving image for service: 3
```

**Frontend (Console do Navegador):**
- Erros de formulário aparecem no console
- Network tab mostra requisições falhadas
- React DevTools para debug de componentes

---

## Histórico de Atualizações

### Versão 2.0 (Julho 2025)
**Principais Melhorias:**
- ✅ Migração completa para PostgreSQL
- ✅ Sistema de armazenamento de imagens em Base64
- ✅ Correção de problemas de timezone
- ✅ Interface de usuário aprimorada
- ✅ Sistema de recuperação de senha por email
- ✅ Google OAuth totalmente funcional

### Funcionalidades Implementadas:

#### Sistema de Upload de Imagens
- Upload seguro de imagens para serviços
- Validação de tipos e tamanho
- Armazenamento no banco de dados

#### Menu Administrativo
- Interface organizada para administradores
- Acesso rápido a todas as funcionalidades
- Design responsivo

#### Personalização Completa
- Configuração do site (nome, logo, cores)
- Banner personalizável
- Rodapé configurável
- Tabela de preços dinâmica

#### Gestão Avançada
- CRUD completo de serviços e categorias
- Sistema de agendamentos com horários de 40min
- Prevenção de conflitos de horário
- Gestão de vendas e relatórios

#### Melhorias de UX
- Status de agendamento com ícones e cores
- Formatação correta de datas
- Sistema de avaliações com curtidas
- Páginas de perfil personalizadas

---

## Contato e Suporte

**Desenvolvedor**: Leandro Menezes
**Sistema**: Salão de Beleza - Gestão Completa
**Tecnologia**: React + TypeScript + PostgreSQL

Este sistema foi desenvolvido para oferecer uma solução completa e moderna para salões de beleza, priorizando facilidade de uso, personalização e confiabilidade.

---

*Documentação atualizada em: Julho 2025*
*Versão do Sistema: 2.0*