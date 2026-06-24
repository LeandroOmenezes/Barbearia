# Documentação do Sistema Barbearia

## Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Arquitetura Técnica](#arquitetura-técnica)
3. [Funcionalidades Principais](#funcionalidades-principais)
4. [Perfis de Acesso](#perfis-de-acesso)
5. [Manual de Uso](#manual-de-uso)
6. [Manual do Administrador](#manual-do-administrador)
7. [API e Rotas Principais](#api-e-rotas-principais)
8. [Imagens e Upload](#imagens-e-upload)
9. [Configuração e Deployment](#configuração-e-deployment)
10. [Troubleshooting](#troubleshooting)
11. [Histórico de Atualizações](#histórico-de-atualizações)

---

## Visão Geral do Sistema

O **Barbearia** é um sistema de gestão para salões de beleza que integra:

- agendamentos
- cadastro de clientes
- cadastro de profissionais
- gestão de serviços e categorias
- controle de preços
- vendas e relatórios
- avaliações e comentários
- personalização do site
- painel administrativo com permissões Master/Admin

O objetivo é permitir que o salão controle operações internas e apresente uma homepage personalizada para clientes.

---

## Arquitetura Técnica

### Frontend

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Radix UI
- Wouter para roteamento
- React Query para gerenciamento de dados
- React Hook Form + Zod para validação de formulários

### Backend

- Node.js + TypeScript
- Express.js
- Passport.js para autenticação local e Google OAuth
- Drizzle ORM para PostgreSQL
- Supabase como banco de dados e storage
- Nodemailer para envio de emails

### Infraestrutura

- Aplicação em Render / ambiente Node
- Banco de dados PostgreSQL gerenciado
- Imagens armazenadas em bucket Supabase
- Rotas de upload e exclusão de imagens no servidor

### Estrutura principal de pastas

- `client/` — frontend React
- `server/` — backend Express
- `shared/` — schema e tipos compartilhados
- `uploads/` — antigo diretório de imagens estáticas (geralmente não usado em produção)

---

## Funcionalidades Principais

### Autenticação

- Cadastro de usuário
- Login com email/senha
- Login com Google OAuth
- Logout
- Recuperação de senha por email
- Dados do usuário autenticado

### Clientes

- Listagem de clientes
- Cadastro de novos clientes
- Edição de cliente
- Exclusão de cliente

### Serviços e Categorias

- Listagem de categorias
- Listagem de serviços por categoria
- Destaque de serviços
- Cadastro/edição/exclusão de serviços
- Upload de imagem para serviço
- Cadastro/edição/exclusão de categorias

### Preços

- Listagem de preços
- Listagem de preços por categoria
- Cadastro de itens de preço
- Edição de itens de preço
- Exclusão de itens de preço

### Agendamentos

- Consulta de horários disponíveis por data
- Criação de agendamento
- Listagem de agendamentos
- Listagem de agendamentos próprios do cliente
- Atualização de status de agendamento

### Profissionais

- Listagem de profissionais
- Listagem de profissionais por categoria
- Cadastro de profissionais (admin)
- Edição de profissionais
- Ativação/desativação de profissionais
- Upload de foto do profissional
- Painel profissional com agendamentos próprios
- Marcação de atendimentos como vistos

### Avaliações e Interações

- Listagem de avaliações públicas
- Cadastro de review
- Curtida em review por `heart` ou `thumbs`
- Comentários em reviews
- Curtida em comentário
- Consulta de curtidas do usuário

### Admin / Configurações do Site

- Listagem e criação de usuários admin
- Promoção/demissão de Master
- Configuração de banner
- Configuração de rodapé
- Configuração de site (nome, slogan, cor)
- Upload de logo
- Upload de imagem de fundo da seção de agendamento
- Regeneração de imagens

### Vendas e Relatórios

- Cadastro de vendas
- Listagem de vendas
- Filtro de vendas por período
- Cancelamento de venda

---

## Perfis de Acesso

### Cliente

- Acessa homepage pública
- Agenda serviços
- Visualiza seus agendamentos
- Realiza avaliações e curtidas

### Profissional

- Acessa agenda pessoal
- Marca atendimentos vistos
- Visualiza conta vinculada ao perfil

### Admin

- Acessa dashboard administrativo
- Gerencia clientes, serviços, categorias, preços, profissionais e vendas
- Gerencia avaliações e comentários
- Gerencia configurações de site

### Master

- Todas as permissões de Admin
- Cria e exclui usuários Admin
- Controla permissões Master

---

## Manual de Uso

### Cadastro de Conta

1. Acesse `/auth`
2. Selecione cadastro
3. Preencha nome, email, telefone e senha
4. Envie o formulário

### Login

- Via email/senha em `/auth`
- Via Google OAuth em `/api/auth/google`

### Agendamento

1. Escolha serviço na home
2. Selecione data e horário disponível
3. Preencha dados de cliente
4. Confirme o agendamento

### Visualizar Agendamentos

1. Faça login
2. Acesse o perfil
3. Consulte lista de agendamentos

### Enviar Avaliação

1. Abra seção de reviews
2. Preencha nome, nota e comentário
3. Envie
4. Curta outras avaliações

---

## Manual do Administrador

### Acesso ao Dashboard

- Faça login com usuário Admin ou Master
- Navegue com menu lateral pelos módulos
- Acesse dashboard, clientes, profissionais, serviços, categorias, preços, vendas e configurações

### Gerenciar Clientes

- Adicionar clientes
- Editar clientes
- Excluir clientes
- Pesquisar cliente

### Gerenciar Serviços

- Criar serviço com título, descrição, duração e valor
- Upload de imagem do serviço
- Marcar como destaque
- Editar serviço
- Excluir serviço

### Gerenciar Categorias

- Criar categoria
- Editar categoria
- Excluir categoria

### Gerenciar Preços

- Adicionar item de preço
- Editar valor mínimo e máximo
- Excluir item de preço

### Gerenciar Profissionais

- Criar profissional
- Editar informações
- Ativar ou desativar perfil
- Upload de foto

### Gerenciar Usuários

- Criar usuários Admin
- Promover/demitir Master
- Excluir usuários

### Configuração do Site

- Atualizar nome do site e slogan
- Ajustar cor principal
- Upload de logo
- Upload de imagem de fundo do agendamento
- Configurar links do rodapé e contato

### Banner e Footer

- Editar título e descrição do banner
- Atualizar botão de CTA
- Upload de imagem de banner
- Editar contato e redes sociais no footer

### Vendas e Relatórios

- Registrar vendas no painel
- Consultar histórico de vendas
- Filtrar por período
- Cancelar vendas quando necessário

---

## API e Rotas Principais

### Autenticação

- `POST /api/register`
- `POST /api/login`
- `POST /api/logout`
- `GET /api/user`
- `GET /api/auth/google`
- `GET /api/auth/google/callback`
- `GET /api/auth/google/debug`
- `POST /api/forgot-password`
- `GET /api/reset-password/:token`
- `POST /api/reset-password/:token`

### Clientes

- `GET /api/clients`
- `GET /api/clients/:id`
- `POST /api/clients`
- `PATCH /api/clients/:id`
- `DELETE /api/clients/:id`

### Categorias e Serviços

- `GET /api/categories`
- `GET /api/services/all`
- `GET /api/services/featured`
- `GET /api/services/:categoryId`
- `POST /api/services/:id/upload-image`
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
- `GET /api/user/likes`
- `GET /api/reviews/:reviewId/comments`
- `POST /api/reviews/:reviewId/comments`
- `POST /api/comments/:commentId/like/:likeType`
- `GET /api/user/comment-likes`

### Admin e Configurações

- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:id/master`
- `DELETE /api/admin/users/:id`
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
- `PATCH /api/user/phone`
- `POST /api/user/upload-profile-image`
- `GET /api/user/test-auth`
- `GET /api/images/user/:id`
- `GET /api/images/service/:id`
- `GET /api/images/banner`
- `POST /api/storage/delete`
- `POST /api/admin/regenerate-images`

---

## Imagens e Upload

- O sistema salva imagens no bucket Supabase usando `uploadFileToSupabase`
- As URLs públicas são armazenadas no banco e exibidas no frontend
- As imagens podem ser excluídas do bucket usando `deleteFileFromSupabase`
- Os scripts legados de `/uploads/...` foram removidos do código principal

---

## Configuração e Deployment

### Variáveis de ambiente principais

```env
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=sua_chave_secreta_aqui
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_aplicativo
SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_KEY=seu_service_role_key
SUPABASE_BUCKET=public
```

### Comandos úteis

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run db:push`

### Deploy

1. Configure variáveis de ambiente no servidor
2. Configure PostgreSQL e Supabase corretamente
3. Execute `npm install`
4. Execute `npm run db:push` quando necessário
5. Execute `npm run build` e `npm run start`

---

## Troubleshooting

### Erro de autenticação Google

- Verifique credenciais Google OAuth
- Confira callback URI no Google Cloud
- Garanta que a URL de aplicação esteja correta

### Problemas de email

- Confirme `EMAIL_USER` e `EMAIL_PASS`
- Use senha de aplicativo do Gmail
- Verifique o envio SMTP

### Imagens não carregam

- Verifique configuração do bucket Supabase
- Refaça uploads no painel
- Valide rotas de imagem do backend

### Agendamentos com conflito

- Confira horários disponíveis
- Ajuste bloqueios de agenda
- Verifique se o profissional está ativo

---

## Histórico de Atualizações

- `2026-06-24` — documentação atualizada com rotas reais e fluxo de upload no bucket Supabase
- `2026-06-24` — scripts legados de migração e limpeza removidos do código principal
- `2026-06-24` — documentados perfis Master, Admin, Profissional e Cliente
