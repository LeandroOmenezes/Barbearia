# Documentação Completa - Sistema de Gestão para Salão de Beleza

## Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Arquitetura Técnica](#arquitetura-técnica)
3. [Funcionalidades Principais](#funcionalidades-principais)
4. [Público-alvo e Perfis de Acesso](#público-alvo-e-perfis-de-acesso)
5. [Manual do Usuário](#manual-do-usuário)
6. [Manual do Administrador](#manual-do-administrador)
7. [API e Rotas Principais](#api-e-rotas-principais)
8. [Configuração e Deployment](#configuração-e-deployment)
9. [Troubleshooting](#troubleshooting)
10. [Histórico de Atualizações](#histórico-de-atualizações)

---

## Visão Geral do Sistema

### Objetivo
O **Ateliê de Beleza** é um sistema completo de gestão para salões de beleza, oferecendo controle de agendamentos, vendas, clientes, profissionais e personalização do site.

### Benefícios
- Gestão completa de serviços e agenda
- Interface moderna e responsiva
- Controle de usuários administrativos
- Relatórios financeiros integrados
- Personalização visual do site

---

## Arquitetura Técnica

### Stack Tecnológico

#### Frontend
- React 18 com TypeScript
- Vite como bundler
- Tailwind CSS para estilo
- Radix UI para componentes
- Wouter para roteamento
- React Query para cache e requisições
- React Hook Form + Zod para formulários e validação

#### Backend
- Node.js com TypeScript
- Express.js para API
- Passport.js para autenticação
- PostgreSQL para persistência
- Drizzle ORM para queries
- Nodemailer para envio de email

#### Infraestrutura
- Replit para deployment
- Neon Database para PostgreSQL serverless
- Armazenamento de imagens em Base64 no banco

### Estrutura de Pastas
```
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── lib/
├── server/
│   ├── auth.ts
│   ├── routes.ts
│   ├── db.ts
│   └── storage.ts
├── shared/
│   └── schema.ts
└── uploads/
```

---

## Funcionalidades Principais

### Autenticação
- Login local com email/senha
- Login com Google OAuth
- Recuperação de senha por email
- Edição de telefone e foto de perfil
- Sessões seguras com cookies

### Agendamentos
- Horários de 40 minutos
- Agendamento por data e profissional
- Prevenção de conflitos de horário
- Alteração de status de agendamento
- Bloqueio de horários para férias ou manutenções

### Clientes
- Cadastro e edição de clientes no painel
- Telefone formatado automaticamente
- Histórico de agendamentos por cliente
- Exclusão de clientes

### Profissionais
- Cadastro por categoria
- Vinculação de login profissional
- Ativar/desativar profissionais
- Upload de foto de profissional
- Configuração de horário de almoço

### Serviços e Categorias
- Cadastro de serviços com imagem
- Marcação de serviço em destaque
- Gestão de categorias separada
- Exclusão de serviços e categorias

### Preços
- Cadastro de itens de preço
- Faixa mínima e máxima
- Edição e remoção de preços

### Usuários Administrativos
- Criação de usuários Admin
- Exclusão de usuários
- Permissões Master/Admin
- Acesso ao painel administrativo

### Avaliações e Interações
- Publicação de reviews por clientes
- Curtidas em reviews e comentários
- Tipos de like: heart e thumbs
- Exibição pública de avaliações

### Personalização do Site
- Configuração de nome, slogan e cor principal
- Upload de logo e imagem de agendamento
- Configuração de rodapé com contato e redes sociais
- Personalização de banner e CTA

### Vendas e Relatórios
- Registro manual de vendas
- Relatórios financeiros por período
- Histórico de vendas no dashboard

---

## Público-alvo e Perfis de Acesso

### Cliente
- Acesso à página pública e perfil
- Agenda serviços
- Visualiza histórico
- Avalia serviços

### Profissional
- Visualiza agendamentos próprios
- Marca atendimentos como vistos
- Recebe agenda vinculada ao seu perfil

### Admin
- Acessa painel administrativo
- Gerencia clientes, serviços, categorias, preços e profissionais
- Controla agendamentos e vendas

### Master
- Todas as permissões de Admin
- Cria e exclui outros usuários
- Controla permissões de Master

---

## Manual do Usuário

### Criar Conta
1. Acesse a página de login
2. Clique em cadastrar
3. Preencha nome, email, telefone e senha
4. Envie o formulário

### Login
- Com email e senha
- Ou com Google OAuth

### Agendar Serviço
1. Escolha serviço na home
2. Selecione data e horário
3. Preencha dados do cliente
4. Confirme o agendamento

### Ver Agendamentos
1. Faça login
2. Vá ao perfil
3. Veja agendamentos e status

### Avaliar Serviço
1. Acesse avaliações
2. Preencha nome, nota e comentário
3. Envie avaliação
4. Curta reviews

---

## Manual do Administrador

### Acesso ao Dashboard
- Login com conta Admin ou Master
- Navegação por abas
- Painel com agendamentos, clientes, vendas, profissionais e usuários

### Agendamentos
- Ver todos os agendamentos
- Filtrar por status ou profissional
- Atualizar status
- Cancelar agendamentos

### Clientes
- Adicionar, editar e excluir clientes
- Telefone com máscara automática
- Search e listagem completa

### Profissionais
- Criar e editar profissionais
- Vincular usuário ao profissional
- Ativar ou desativar
- Upload de foto

### Serviços
- Adicionar serviço com imagem
- Marcar serviço como destaque
- Editar e excluir serviços

### Categorias
- Criar, editar e deletar categorias
- Organizar serviços por categoria

### Preços
- Adicionar itens de preço
- Definir valores mínimo e máximo
- Excluir itens

### Usuários do Sistema
- Criar usuários Admin
- Excluir usuários
- Promover e demitir Master
- Salvar permissões de acesso

### Configuração do Site
- Alterar nome, slogan e cor principal
- Upload de logo
- Configurar links de redes sociais
- Atualizar informações de contato no rodapé

### Banner
- Personalizar título, descrição e botão
- Upload de imagem de fundo
- Link de CTA configurável

### Vendas e Relatórios
- Registrar vendas no painel
- Consultar relatórios por período
- Visualizar receita e desempenho

---

## API e Rotas Principais

### Autenticação
- `POST /api/forgot-password`
- `GET /api/reset-password/:token`
- `POST /api/reset-password/:token`

### Clientes
- `GET /api/clients`
- `POST /api/clients`
- `PATCH /api/clients/:id`
- `DELETE /api/clients/:id`

### Serviços e Categorias
- `GET /api/categories`
- `GET /api/services/all`
- `GET /api/services/featured`
- `GET /api/services/:categoryId`
- `POST /api/admin/services`
- `PUT /api/admin/services/:id`
- `PATCH /api/admin/services/:id/featured`
- `DELETE /api/admin/services/:id`
- `POST /api/admin/categories`
- `PUT /api/admin/categories/:id`
- `DELETE /api/admin/categories/:id`

### Preços
- `GET /api/prices`
- `GET /api/prices/:categoryId`
- `POST /api/admin/prices`
- `PUT /api/admin/prices/:id`
- `DELETE /api/admin/prices/:id`

### Agendamentos
- `GET /api/appointments/available-times/:date`
- `POST /api/appointments`
- `GET /api/appointments`
- `GET /api/my-appointments`
- `PATCH /api/appointments/:id/status`

### Profissionais
- `GET /api/professionals`
- `GET /api/professionals/category/:categoryId`
- `POST /api/admin/professionals`
- `PUT /api/admin/professionals/:id`
- `PATCH /api/admin/professionals/:id/active`
- `DELETE /api/admin/professionals/:id`
- `POST /api/professionals/:id/upload-photo`

### Reviews e Comentários
- `GET /api/reviews`
- `POST /api/reviews`
- `POST /api/reviews/:id/like/:likeType`
- `GET /api/reviews/:reviewId/comments`
- `POST /api/reviews/:reviewId/comments`
- `POST /api/comments/:commentId/like/:likeType`
- `GET /api/user/likes`
- `GET /api/user/comment-likes`

### Admin / Configurações
- `GET /api/admin/users`
- `POST /api/admin/users`
- `DELETE /api/admin/users/:id`
- `PATCH /api/admin/users/:id/master`
- `GET /api/banner`
- `PUT /api/banner`
- `POST /api/banner/upload-image`
- `GET /api/footer`
- `PUT /api/footer`
- `GET /api/site-config`
- `PUT /api/site-config`
- `POST /api/site-config/upload-logo`
- `POST /api/site-config/upload-appointment-background`
- `GET /api/schedule-blocks`
- `POST /api/schedule-blocks`
- `DELETE /api/schedule-blocks/:id`
- `POST /api/admin/regenerate-images`
- `PATCH /api/user/phone`
- `POST /api/user/upload-profile-image`

---

## Configuração e Deployment

### Variáveis de Ambiente

```env
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=sua_chave_secreta_aqui
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_aplicativo
SENDGRID_API_KEY=sua_chave_sendgrid
```

### Deploy no Replit

1. Clone o repositório
2. Configure variáveis de ambiente
3. Provisione o banco PostgreSQL
4. Execute `npm install`
5. Execute `npm run db:push`
6. Execute `npm run dev`

### Configuração de Google OAuth

1. Acesse Google Cloud Console
2. Crie credenciais OAuth 2.0
3. Adicione origem JavaScript
4. Adicione redirect URI `/api/auth/google/callback`

### Configuração de Email

**Gmail:**
- Ative verificação em 2 etapas
- Gere senha de aplicativo
- Utilize no `EMAIL_PASS`

**SendGrid:**
- Gere API Key
- Configure `SENDGRID_API_KEY`

---

## Troubleshooting

### Problemas Comuns

#### Erro de autenticação Google
- Verifique redirect URI no Google Cloud
- Confirme URL da aplicação
- Aguarde propagação

#### Emails não enviados
- Confira credenciais SMTP
- Use senha de aplicativo do Gmail
- Teste com SendGrid

#### Imagens não carregam
- Execute `/api/admin/regenerate-images`
- Refaça upload se necessário

#### Agendamentos duplicados
- Verifique bloqueios de agenda
- Confirme horários válidos

#### Banco de dados não conecta
- Verifique `DATABASE_URL`
- Confirme que DB está disponível
- Rode migrações

---

## Histórico de Atualizações

### Versão 2.1 (Junho 2026)
- Permitido `Admin` criar e excluir usuários do sistema
- Máscara de telefone nos formulários de clientes e rodapé
- Suporte a likes `heart` e `thumbs` em comentários
- Atualização da documentação e correções de TS

### Versão 2.0 (Julho 2025)
- Migração para PostgreSQL
- Armazenamento de imagens em Base64
- Interface de usuário aprimorada
- Recuperação de senha por email
- Google OAuth funcional

---

## Contato

**Desenvolvedor**: Leandro Menezes
**Sistema**: Salão de Beleza - Gestão Completa
**Tecnologia**: React + TypeScript + PostgreSQL

*Documentação atualizada em: Junho 2026*
*Versão do Sistema: 2.1*
