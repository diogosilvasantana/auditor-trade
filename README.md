# Trade Auditor Pro

Plataforma fullstack para auditoria de trades — MVP V1.

## 🚀 Novidades da Versão Atual
- **Multi-Contas:** Suporte para contas do tipo `PESSOAL`, `MESA PROPRIETÁRIA` e `SIMULADO`.
- **Configuração de Taxas:** Definição de taxas por contrato e *Profit Split* diretamente no cadastro da conta.
- **Importação Direcionada:** Escolha para qual conta os trades do CSV serão vinculados durante o upload.
- **Monitoramento de Mesas:** Progresso detalhado de desafios (Target, Drawdown, Resultado Líquido com Taxas).

## 🛠 Stack
- **Frontend:** Next.js 15 (App Router) · Vanilla CSS (Premium Design) · TypeScript
- **Backend:** NestJS · TypeScript
- **Database:** PostgreSQL 16 · Prisma ORM
- **Container:** Docker Compose (com Hot-Reload no Backend)

## ⚡ Quick Start (Docker)

```bash
# 1. Clone o repositório
git clone https://github.com/diogosilvasantana/auditor-trade.git
cd auditor-trade

# 2. Configure o ambiente
cp .env.example .env

# 3. Build e Início
docker-compose up -d --build

# 4. Acesse
http://localhost:3000
```

## 🛰 Serviços
| Serviço | Porta | URL |
|---------|------|-----|
| Frontend (Next.js) | 3000 | http://localhost:3000 |
| API (NestJS) | 3001 | http://localhost:3001/api |
| Database (Postgres) | 5432 | localhost:5432 |

## 📖 Primeiro Uso
1. Acesse http://localhost:3000 → redireciona para `/login`.
2. Clique em **"Criar conta"** para se registrar.
3. Vá em **Contas** e crie sua primeira conta (ex: Mesa Proprietária com taxa de R$ 1,00 por contrato).
4. Navegue até **Importações** → faça upload de um CSV (ex: `docs/sample-trades.csv`) selecionando a conta criada.
5. Após o status **"Concluído"**, veja os resultados no **Dashboard** e **Mesas Proprietárias**.

## 💻 Desenvolvimento Local (Sem Docker)

```bash
# Instalar dependências
pnpm install

# Subir apenas o banco via Docker
docker-compose up postgres -d

# API
cd apps/api
pnpm dev

# Frontend
cd apps/web
pnpm dev
```

## 📂 Estrutura do Projeto
```
auditor-trade/
├── apps/
│   ├── api/           # Backend NestJS
│   │   ├── src/
│   │   │   ├── accounts/  # Gestão de Contas (Nova!)
│   │   │   ├── imports/   # Importação lógica
│   │   │   ├── prop/      # Desafios de Mesa
│   │   │   └── ...
│   │   └── prisma/
│   └── web/           # Frontend Next.js
│       └── src/app/
│           ├── accounts/  # CRUD de Contas
│           ├── dashboard/ # Visão Geral
│           ├── prop/      # Gestão de Desafios
│           └── ...
├── docs/              # PRDs, Design System e amostras de CSV
└── docker-compose.yml
```

## 🛡 API Endpoints
Endpoints principais (autenticação via JWT Cookie):

| Método | Endpoint | Descrição |
|--------|----------|-------------|
| POST | `/api/accounts` | Criar nova conta (Pessoal/Mesa/Sim) |
| GET | `/api/accounts` | Listar contas do utilizador |
| POST | `/api/imports` | Upload de CSV vinculado a uma `accountId` |
| GET | `/api/analytics/overview` | Resumo de P&L diário |
| GET | `/api/prop-challenges/progress` | Progresso do desafio selecionado |
| POST | `/api/journal` | Registro de diário de trade |

---
*Trade Auditor Pro - Elevando o nível do seu trading.*
