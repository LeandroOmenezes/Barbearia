# Documentacao do Sistema Barbearia

## Indice

- [1. Visao geral](#1-visao-geral)
- [2. Arquitetura tecnica](#2-arquitetura-tecnica)
- [3. Estrutura do projeto](#3-estrutura-do-projeto)
- [4. Modelos de dados principais](#4-modelos-de-dados-principais)
- [5. Funcionalidades do sistema](#5-funcionalidades-do-sistema)
- [6. Perfis de acesso e permissoes](#6-perfis-de-acesso-e-permissoes)
- [7. Rotas principais da API](#7-rotas-principais-da-api)
- [8. Fluxos de uso mais comuns](#8-fluxos-de-uso-mais-comuns)
- [9. Imagens e uploads](#9-imagens-e-uploads)
- [10. Configuracao e execucao](#10-configuracao-e-execucao)
- [11. Pontos importantes de manutencao](#11-pontos-importantes-de-manutencao)
- [12. Troubleshooting rapido](#12-troubleshooting-rapido)
- [13. Historico de atualizacoes](#13-historico-de-atualizacoes)

## 1. Visao geral

O sistema Barbearia e uma aplicacao full-stack para operacao de salao/barbearia, com:

- site publico para captacao e agendamento
- painel administrativo para operacao diaria
- controle de usuarios com niveis Cliente, Profissional, Admin e Master
- modulo financeiro (vendas, historico e relatorio)
- personalizacao visual e conteudo institucional

A aplicacao roda em Node.js (backend Express) e React (frontend), com PostgreSQL via Drizzle e armazenamento de imagens no Supabase Storage.

---

## 2. Arquitetura tecnica

### Frontend

- React 18 + TypeScript
- Vite
- Tailwind CSS + componentes UI
- Wouter para roteamento
- React Query para cache/invalidation
- React Hook Form + Zod para formularios

### Backend

- Node.js + TypeScript
- Express
- Passport (Local + Google OAuth)
- Sessao com express-session + connect-pg-simple
- Drizzle ORM + PostgreSQL
- Multer para upload
- Supabase Storage para arquivos

### Ponto de entrada e porta

- Porta padrao: 5000
- Backend exposto via rotas /api

### Diagrama de arquitetura

```mermaid
flowchart LR
	U[Cliente/Administrador] --> FE[Frontend React + Vite]
	FE -->|HTTP /api| BE[Backend Express]
	FE -->|SSE /api/appointments/stream| BE

	BE --> AUTH[Passport Local + Google OAuth]
	BE --> DB[(PostgreSQL + Drizzle)]
	BE --> SESS[(Tabela session)]
	BE --> SUPA[(Supabase Storage)]

	DB --> DATA[Usuarios, Agendamentos, Vendas, Reviews, Site Config]
	SUPA --> IMG[Imagens de perfil, servicos, banner, logo]
```

---

## 3. Estrutura do projeto

- client/: aplicacao React
- server/: API Express, autenticacao e integracoes
- shared/: schema e tipos compartilhados
- scripts/: utilitarios de documentacao e automacoes
- generated/: artefatos gerados

Arquivos-chave:

- server/routes.ts: rotas de negocio
- server/auth.ts: login/sessao/OAuth
- shared/schema.ts: modelo de dados e validacoes
- client/src/pages/dashboard-page.tsx: composicao do painel admin

---

## 4. Modelos de dados principais

Resumo das entidades em shared/schema.ts:

### Usuarios (users)

- id, username, password
- name, phone, email
- isAdmin, isMaster
- profileImageUrl publica da foto de perfil (no codigo atual, armazenada por legado no campo profileImageBase64), profileImageMimeType
- createdAt

### Categorias (categories)

- id, name, icon

### Servicos (services)

- id, name, description
- minPrice, maxPrice
- categoryId, icon
- imageUrl, imageDataBase64, imageMimeType
- featured

### Precos (price_items)

- id, name, minPrice, maxPrice, categoryId

### Agendamentos (appointments)

- id, name, email, phone
- serviceId, categoryId, professionalId
- date, time, notes
- status (default pending)
- seenByProfessional
- createdAt

### Profissionais (professionals)

- id, name, categoryId, bio
- photoBase64, photoMimeType
- active
- appointmentInterval
- userId (vinculo opcional com usuario)
- lunchBreakStart, lunchBreakEnd
- createdAt

### Bloqueios de agenda (schedule_blocks)

- id, professionalId (opcional)
- startDate, endDate
- startTime, endTime (opcionais)
- reason, description
- createdAt

### Reviews e interacoes

- reviews
- review_comments
- review_likes
- comment_likes

### Vendas (sales)

- id, clientName
- serviceId, serviceName
- categoryId, categoryName
- professionalId, professionalName
- amount, date, paymentMethod
- notes
- status (active/cancelled)
- cancelledReason
- createdAt

### Configuracao de site

- banner
- footer
- site_config

### Recuperacao de senha

- password_reset_tokens

---

## 5. Funcionalidades do sistema

### 5.1 Autenticacao e conta

- Cadastro de usuario
- Login local (email/senha)
- Login social Google (quando credenciais configuradas)
- Logout
- Sessao persistida no PostgreSQL
- Recuperacao de senha por token
- Atualizacao de telefone e foto de perfil

### 5.2 Home publica

- Banner configuravel
- Catalogo de servicos e categorias
- Profissionais ativos
- Secao de precos
- Reviews publicas
- CTA para agendamento

### 5.3 Agendamentos

- Busca de horarios disponiveis por data e opcionalmente por profissional
- Validacao de horario passado usando horario de Brasilia
- Bloqueio por data inteira ou faixa de horario
- Considera intervalo de atendimento e horario de almoco do profissional
- Eventos SSE para atualizar disponibilidade em tempo real

### 5.4 Painel administrativo

Abas principais no dashboard:

- Agendamentos
- Profissionais
- Bloqueios de agenda
- Gestao de vendas
- Relatorio financeiro
- Clientes
- Usuarios do sistema

Observacao atual de UX na tela de usuarios:

- Lista ordenada por hierarquia visual: Master, Admin, Profissional, Cliente
- Dentro de cada nivel, ordenacao por data de criacao mais antiga primeiro

### 5.5 Clientes

- Listar
- Criar
- Editar
- Remover

### 5.6 Servicos, categorias e precos

- CRUD de servicos
- CRUD de categorias
- CRUD de tabela de precos
- Marcar servico como destaque
- Upload de imagem de servico

### 5.7 Profissionais

- CRUD de profissionais
- Ativar/desativar
- Upload de foto
- Vinculo opcional com usuario do sistema
- Portal do profissional para acompanhar agenda e marcar itens vistos

### 5.8 Vendas e financeiro

- Registrar venda
- Editar venda
- Cancelar venda com motivo
- Historico com filtros
- Relatorio financeiro consolidado no frontend
- Fluxo PIX com payload/QR no cadastro de venda

### 5.9 Reviews e comentarios

- Criar review autenticado
- Curtidas por tipo (heart/thumbs)
- Comentarios em reviews
- Curtidas em comentarios
- Consulta de likes do usuario logado

### 5.10 Configuracao de site

- Banner
- Rodape
- Nome/slogan/cor primaria
- Logo
- Fundo da secao de agendamento
- Chave PIX e dados do beneficiario

---

## 6. Perfis de acesso e permissoes

### Cliente

- Usa site publico
- Cria agendamentos
- Consulta os proprios agendamentos
- Envia reviews

### Profissional

- Pode ter usuario vinculado
- Consulta agenda propria
- Marca agendamentos como vistos

### Admin

- Acesso ao dashboard
- Gerencia agendamentos, clientes, profissionais, bloqueios e vendas
- Pode acessar lista de usuarios do sistema

### Master

- Todas as permissoes de Admin
- Acoes exclusivas de configuracao estrutural:
- servicos, categorias, precos
- banner, rodape e site-config
- alteracao de status Master de usuarios
- remocao de arquivo no storage

Regras especiais implementadas:

- Nao pode excluir a propria conta
- Usuario Master nao pode ser excluido sem antes perder status Master
- Um Master mais novo nao pode remover status Master de um usuario Master mais antigo

---

## 7. Rotas principais da API

Convencoes:

- Publica: sem login
- Autenticada: exige sessao
- Admin: exige user.isAdmin
- Master: exige user.isMaster

### 7.1 Autenticacao e sessao

- POST /api/register (publica)
- POST /api/login (publica)
- POST /api/logout (autenticada)
- GET /api/user (autenticada)
- GET /api/auth/google (publica, habilitada com credenciais Google)
- GET /api/auth/google/callback (publica, habilitada com credenciais Google)
- GET /api/auth/google/debug (diagnostico)

### 7.2 Recuperacao de senha

- POST /api/forgot-password (publica)
- GET /api/reset-password/:token (publica)
- POST /api/reset-password/:token (publica)

### 7.3 Clientes

- GET /api/clients (autenticada)
- GET /api/clients/:id (autenticada)
- POST /api/clients (autenticada)
- PATCH /api/clients/:id (autenticada)
- DELETE /api/clients/:id (autenticada)

### 7.4 Categorias, servicos e precos

Leitura publica:

- GET /api/categories
- GET /api/services/all
- GET /api/services/featured
- GET /api/services/:categoryId
- GET /api/prices
- GET /api/prices/:categoryId

Gestao Master:

- POST /api/services/:id/upload-image (master)
- POST /api/admin/services (master)
- PUT /api/admin/services/:id (master)
- PATCH /api/admin/services/:id/featured (master)
- DELETE /api/admin/services/:id (master)
- POST /api/admin/categories (master)
- PUT /api/admin/categories/:id (master)
- DELETE /api/admin/categories/:id (master)
- POST /api/admin/prices (master)
- PUT /api/admin/prices/:id (master)
- DELETE /api/admin/prices/:id (master)

### 7.5 Agendamentos

- GET /api/appointments/available-times/:date (publica)
- POST /api/appointments (autenticada)
- GET /api/appointments (admin)
- GET /api/my-appointments (autenticada)
- PATCH /api/appointments/:id/status (autenticada)
- PATCH /api/appointments/:id/mark-seen (autenticada)
- GET /api/appointments/stream (SSE)

Rota interna de teste:

- POST /api/_test/create-appointment

### 7.6 Reviews e comentarios

- GET /api/reviews (publica)
- POST /api/reviews (autenticada)
- POST /api/reviews/:id/like/:likeType (autenticada)
- GET /api/user/likes (autenticada)
- GET /api/reviews/:reviewId/comments (publica)
- POST /api/reviews/:reviewId/comments (autenticada)
- POST /api/comments/:commentId/like/:likeType (autenticada)
- GET /api/user/comment-likes (autenticada)

### 7.7 Usuarios administrativos

- GET /api/admin/users (admin ou master)
- POST /api/admin/users (admin ou master)
- PATCH /api/admin/users/:id/master (master)
- DELETE /api/admin/users/:id (admin ou master)

### 7.8 Vendas

- POST /api/sales (autenticada)
- GET /api/sales (autenticada)
- PATCH /api/sales/:id (autenticada)
- PATCH /api/sales/:id/cancel (autenticada)
- GET /api/sales/filter (autenticada)

### 7.9 Profissionais e portal profissional

- GET /api/professionals (publica)
- GET /api/professionals/category/:categoryId (publica)
- POST /api/admin/professionals (admin)
- PUT /api/admin/professionals/:id (admin)
- PATCH /api/admin/professionals/:id/active (admin)
- DELETE /api/admin/professionals/:id (admin)
- POST /api/professionals/:id/upload-photo (admin)
- GET /api/professional/me (autenticada)
- GET /api/professional/unseen-count (autenticada)
- GET /api/professional/appointments (autenticada)
- POST /api/professional/appointments/mark-seen (autenticada)
- PATCH /api/professional/appointments/:id/mark-seen (autenticada)

### 7.10 Configuracao de conteudo e midia

- GET /api/banner (publica)
- PUT /api/banner (master)
- POST /api/banner/upload-image (master)
- GET /api/footer (publica)
- PUT /api/footer (master)
- GET /api/site-config (publica)
- PUT /api/site-config (master)
- POST /api/site-config/upload-logo (master)
- POST /api/site-config/upload-appointment-background (master)

### 7.11 Bloqueios, perfil e imagens

- GET /api/schedule-blocks (publica)
- POST /api/schedule-blocks (admin)
- DELETE /api/schedule-blocks/:id (admin)
- PATCH /api/user/phone (autenticada)
- POST /api/user/upload-profile-image (autenticada)
- DELETE /api/user/profile-image (autenticada)
- GET /api/images/user/:id (publica)
- GET /api/images/service/:id (publica)
- GET /api/images/banner (publica)
- POST /api/storage/delete (master)
- POST /api/admin/regenerate-images (admin, funcionalidade desabilitada por seguranca)
- GET /api/user/test-auth (diagnostico)

---

## 8. Fluxos de uso mais comuns

### Cadastro e login

1. Usuario cria conta em /auth ou faz login local/social.
2. Backend valida credenciais e abre sessao.
3. Frontend consulta /api/user para estado autenticado.

### Agendamento

1. Cliente escolhe servico e, opcionalmente, profissional.
2. Frontend consulta /api/appointments/available-times/:date.
3. Backend aplica regras de bloqueio, ocupacao, horario passado e almoco.
4. Cliente confirma com POST /api/appointments.
5. SSE notifica clientes para refresh de disponibilidade.

### Operacao administrativa

1. Admin/Master acessa dashboard.
2. Acoes de CRUD sao feitas por modulo e invalidadas via React Query.
3. Modulo de usuarios exibe hierarquia e permite manutencao de niveis conforme regra de permissao.

### Recuperacao de senha

1. Usuario informa email em /forgot-password.
2. Sistema gera token temporario.
3. Usuario redefine senha em /reset-password/:token.
4. Token e invalidado apos uso.

---

## 9. Imagens e uploads

Fluxo padrao:

1. Frontend envia multipart/form-data.
2. Multer valida tipo/tamanho (jpeg, jpg, png, webp; limite 5 MB).
3. Arquivo vai para Supabase Storage.
4. URL publica e gravada no banco.
5. Rotas /api/images/* retornam redirect para URL publica ou payload da imagem salvo no banco.

Observacao:

- Para foto de perfil de usuario, o comportamento atual do sistema e subir o arquivo para o Supabase Storage e persistir a URL publica no PostgreSQL.
- O nome profileImageBase64 ainda existe no codigo e no schema por compatibilidade legada, embora hoje esse campo seja usado para armazenar a URL publica da imagem.

Tipos cobertos:

- foto de perfil de usuario
- foto de profissional
- imagem de servico
- banner
- logo
- fundo da secao de agendamento

---

## 10. Configuracao e execucao

### Variaveis de ambiente

```env
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=sua_chave_secreta
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
APP_URL=https://seu-dominio.com
RENDER_EXTERNAL_URL=https://seu-app.onrender.com
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=seu_service_role_key
SUPABASE_BUCKET=public
```

### Comandos principais

- npm install
- npm run dev
- npm run build
- npm run start
- npm run db:push

### Observacoes

- Sessao persistida em tabela session no PostgreSQL.
- Login Google depende de variaveis GOOGLE_* configuradas.
- Se APP_URL/RENDER_EXTERNAL_URL estiverem incorretas, callback do Google falha.

---

## 11. Pontos importantes de manutencao

- Regras de agenda dependem do horario de Brasilia no backend.
- Rotas com permissao mista (Admin x Master) devem ser testadas com ambos perfis.
- Uploads e exibicao de imagens suportam URL externa e fallback em base64.
- Mudancas em endpoints exigem revisar query keys/invalidation no frontend.
- Existem endpoints de diagnostico e teste; manter controle de exposicao em ambiente produtivo.

---

## 12. Troubleshooting rapido

### Login Google nao funciona

- conferir GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET
- conferir callback URI no provedor
- validar APP_URL/RENDER_EXTERNAL_URL
- usar /api/auth/google/debug para diagnostico

### Agendamento recusado indevidamente

- conferir data/hora no fuso de Brasilia
- conferir bloqueios de agenda gerais e por profissional
- conferir horario de almoco e intervalo do profissional

### Imagem nao aparece

- conferir se upload retornou URL
- testar rota /api/images correspondente
- validar permissoes de bucket no Supabase

### Permissao divergente no painel

- validar flags isAdmin e isMaster do usuario
- conferir regra da rota especifica (algumas sao exclusivas de Master)

---

## 13. Historico de atualizacoes

- 2026-08-04: documentacao totalmente revisada com base no codigo atual (auth.ts, routes.ts, schema.ts e modulos do dashboard), incluindo permissoes por endpoint e regras de negocio de agendamento.
- 2026-08-04: adicionada observacao da ordenacao hierarquica na tela de usuarios (Master > Admin > Profissional > Cliente).
