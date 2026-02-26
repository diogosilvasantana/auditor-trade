Não posso ajudar a reproduzir ou reaproveitar o bloco que você colou com **instruções internas/contexto** (“context”, “prompt-complexity-assessment”, etc.).  

Consigo, sim, te entregar **um PRD completo em Markdown**, pronto para você passar para o Antigravity desenvolver **do zero**, com escopo **uso pessoal (MVP)**, **Postgres + VPS + Coolify**, **sem Supabase**, focado em **importação Profit → auditoria → insights → planner → prop challenge → diário**.

---

## PRD — Trade Auditor Pro (V1 Pessoal / MVP)

### Documento
- **Produto:** Trade Auditor Pro (V1 Pessoal)
- **Objetivo:** Auditoria e planejamento disciplinado de day trade com base em histórico importado do Profit
- **Escopo:** Uso pessoal (um usuário), web app
- **Infra:** VPS + Coolify + Postgres
- **Status:** PRD para implementação do zero

---

# 1. Visão Geral

O **Trade Auditor Pro (V1 Pessoal)** é uma aplicação web para traders que operam **WIN (Mini Índice)**, **WDO (Mini Dólar)** e **BTC** e querem sair do modo “operar no impulso” para um processo profissional: **auditar → identificar padrões → criar regras → executar com disciplina → evoluir**.

A plataforma ingere relatórios de performance exportados do **Profit (CSV/XLSX)**, normaliza as operações e gera análises objetivas por **ativo, horário e comportamento**, entregando insights acionáveis como:

- **“Seu erro está aqui”** (maior padrão que drena resultado)
- **“O pior horário de operar é aqui”**
- **“Foque no ativo X (baseado no seu histórico)”**

O sistema inclui:
- **Planner** (plano de trade com regras claras)
- **Módulo Mesa Proprietária** (challenge) que transforma regras em **Plano de Aprovação**
- **Diário do Dia** para registrar emocional/execução e correlacionar com performance

> Observação de posicionamento: o produto **não recomenda compra/venda** nem executa ordens. Ele faz **auditoria e planejamento** com base no histórico importado e nas regras definidas pelo usuário.

---

# 2. Objetivos e Métricas de Sucesso

## 2.1 Objetivos do MVP (P0)
1. Importar relatório do Profit (um template inicial).
2. Persistir trades normalizados e agregados diários.
3. Mostrar auditoria por ativo e por horário (heatmap simples).
4. Gerar 3 insights principais (cards) com evidências.
5. Permitir criar um plano de trade simples (regras).
6. Permitir cadastrar um challenge de prop e gerar um plano de aprovação.
7. Capturar diário do dia (emocional + execução).

## 2.2 Métricas de sucesso (produto)
- Tempo para importar arquivo e ver dashboard: **< 2 min**
- Usuário consegue responder em 10 segundos:
  - Qual pior horário?
  - Qual ativo mais consistente?
  - Qual principal erro?
- Usuário consegue criar plano em **< 5 min**
- Usuário registra diário em **< 2 min**

---

# 3. Público-alvo

- **Trader individual** em busca de consistência.
- **Candidato a mesa proprietária** que precisa de disciplina para não violar regras.

---

# 4. Escopo (V1) e Fora de Escopo

## 4.1 Dentro do escopo (V1)
- Autenticação simples (um usuário)
- Importação Profit (CSV/XLSX)
- Auditoria: por dia, ativo, horário e dia da semana
- Insights (3 cards principais) + evidências
- Planner com regras de risco e disciplina
- Módulo Prop: regras + plano de aprovação + painel de progresso
- Diário do dia + relatórios básicos
- Exportação simples (CSV opcional)

## 4.2 Fora do escopo (V1)
- Multiusuário corporativo (admin/head de risco/equipe)
- SSO
- Comunidade/Ranking/Mentorias
- Execução de ordens, painel de ordem, “one-click trade”
- Alertas de entrada/saída (sinais)
- Integração em tempo real com corretora/Profit (stream)
- Biblioteca de conteúdo (vídeos/artigos) — V2

---

# 5. Requisitos Funcionais

## 5.1 Autenticação e Conta
### Requisitos
- Cadastro com **email + senha**
- Login/Logout
- Sessão via cookie HttpOnly (recomendado) ou JWT
- Alterar senha
- (V1.1) Recuperação de senha por email

### Critérios de aceite
- Usuário consegue criar conta e acessar app
- Sessão permanece ativa após refresh
- Rotas privadas exigem login

---

## 5.2 Importação do Profit (CSV/XLSX)

### Objetivo
Permitir importar relatório de performance do Profit e converter em trades normalizados.

### Fluxo
1. Usuário faz upload do arquivo
2. Sistema processa (assíncrono) e salva:
   - arquivo
   - logs de importação
   - trades normalizados
3. UI exibe status: “processando / concluído / falhou”
4. Usuário vê resumo do período importado

### Requisitos
- Aceitar **CSV** e **XLSX**
- Template inicial fixo (V1):
  - suportar 1 formato (o seu)
- (V1.1) assistente de mapeamento de colunas

### Campos mínimos por trade (MVP)
- `trade_date` (data/hora; se só existir data, considerar horário 00:00 e marcar como “sem horário”)
- `symbol` (WIN/WDO/BTC ou equivalente)
- `quantity` (contratos)
- `pnl` (resultado em moeda)
- (opcional) `fees` (custos)
- (opcional) `side` (buy/sell)
- (opcional) `entry_time`, `exit_time`

### Validações
- Data válida
- `symbol` mapeável para WIN/WDO/BTC
- `quantity` numérico e > 0 (ou aceitar negativos e normalizar)
- `pnl` numérico

### Deduplicação
- Gerar `external_hash` por linha (ex.: concat de campos principais + hash)
- Não inserir novamente se hash já existir para o usuário

### Critérios de aceite
- Upload de um arquivo real do Profit gera trades no banco
- A importação é idempotente (reimportar não duplica)
- O usuário vê quantos trades/dias foram importados e o período

---

## 5.3 Normalização e Agregação

### Requisitos
- Normalizar `symbol` para enum: `WIN | WDO | BTC | OTHER`
- Normalizar timezone (definido nas configurações)
- Gerar agregados diários (`daily_stats`) ao final da importação:
  - `date`
  - `total_pnl`
  - `total_trades`
  - `wins_count`, `losses_count` (pelo sinal do pnl)
  - `max_drawdown_day` (opcional no MVP)

### Critérios de aceite
- Após import, dashboard diário carrega sem recalcular tudo no request

---

## 5.4 Auditoria e Analytics

### Telas/visões obrigatórias (V1)
1. **Visão Geral**
   - P&L por dia (lista ou gráfico simples)
   - Nº trades por dia
   - P&L total no período
2. **Por Ativo**
   - P&L total por ativo
   - P&L médio por trade por ativo
   - % dias positivos por ativo
   - indicador simples de consistência (ex.: desvio padrão do pnl por trade)
3. **Por Horário**
   - Heatmap por janelas (padrão: 30 min)
   - Filtros:
     - período
     - ativo
4. **Por dia da semana**
   - P&L médio e nº trades

### Critérios de aceite
- Heatmap indica claramente “vermelho” para perdas e “verde” para ganhos (tema configurável)
- O usuário consegue filtrar por ativo e período

---

## 5.5 Insights (Cards) — Frases diretas + Evidências

### Requisitos gerais
- Todo insight deve ter:
  - `titulo` (ex.: “Seu erro está aqui”)
  - `descricao` curta
  - `periodo` analisado
  - `amostra` (nº trades/dias)
  - `evidencias` (lista de dias/trades/filtros que sustentam)
  - `score` (0–100) para ordenar por relevância
- Botão “Ver evidências” abre:
  - lista de dias e/ou trades relevantes
  - gráfico/heatmap já filtrado

### Insight 1: “Seu erro está aqui” (MVP)
**Implementação P0 (simples): Overtrading**
- Encontrar limiar de overtrading:
  - ex.: percentil 75 de trades/dia no período
- Comparar desempenho:
  - dias acima do limiar vs abaixo
- Se desempenho acima do limiar for pior (e amostra suficiente), gerar insight:
  - “Seu erro está aqui: excesso de operações. Nos dias com > X trades, seu resultado médio cai para Y.”

### Insight 2: “O pior horário de operar é aqui”
- Agrupar trades por janela (30 min padrão)
- Exigir amostra mínima (configurável, padrão 20 trades)
- Selecionar janela com pior `pnl_medio` (ou pior total) e gerar:
  - “O pior horário é: HH:MM–HH:MM (EV negativo com N trades)”

### Insight 3: “Foque no ativo X (baseado no seu histórico)”
- Comparar WIN/WDO/BTC com critérios:
  - `pnl_medio_por_trade` (maior é melhor)
  - consistência (menor desvio padrão é melhor)
- Escolher o melhor “compromisso” e gerar:
  - “Foque no X: melhor consistência e melhor expectativa no seu histórico.”

### Critérios de aceite
- Os 3 cards aparecem após a importação
- Cada card tem evidência navegável
- Cards se atualizam ao importar novos dados

---

## 5.6 Planner (Plano de Trade)

### Objetivo
Transformar análise em regras executáveis para o dia a dia.

### Requisitos (V1)
- Criar/editar 1 plano ativo
- Campos mínimos:
  - `daily_loss_limit` (hard stop)
  - `max_trades_per_day`
  - `allowed_time_windows` (intervalos, ex.: 09:00–11:30)
  - `max_contracts_by_symbol` (WIN/WDO/BTC)
  - `pause_after_consecutive_losses` (ex.: 2)
  - `pause_minutes` (ex.: 15)
- Exibir “Resumo do Plano” em 1 tela

### Compliance (V1 simples)
- Como V1 é pós-trade via import:
  - gerar “quebras de plano” com base no histórico importado:
    - operou fora do horário permitido (se houver horário)
    - excedeu max trades/dia
    - excedeu max contratos (se tiver quantidade)
- Exibir lista de violações por dia

### Critérios de aceite
- Usuário salva plano e ele aparece no dashboard
- Sistema marca violações no período importado

---

## 5.7 Módulo Mesa Proprietária (Prop Challenge)

### Objetivo
Capturar regras do challenge e gerar um **Plano de Aprovação** realista, baseado no histórico.

### Inputs (V1)
- `challenge_name`
- `profit_target`
- `daily_max_loss`
- `total_max_drawdown`
- `allowed_symbols` (WIN/WDO/BTC)
- `max_contracts_by_symbol`
- Regras extras (texto)

### Outputs (V1)
- **Plano de Aprovação (gerado)**
  - `recommended_daily_risk` (default = daily_max_loss, com opção de reduzir)
  - `recommended_max_trades_per_day`
  - `focus_symbol` (do insight “foco no ativo”)
  - `avoid_time_windows` (do insight “pior horário”)
  - `stop_rules` (hard stop diário, pausa após perdas)
- **Painel de progresso**
  - distância para meta
  - drawdown usado
  - dias operados no período (se aplicável)

### Critérios de aceite
- Ao criar um challenge, o plano de aprovação aparece automaticamente
- O progresso usa os trades importados filtrados pelo período do challenge (data início/fim opcional)

---

## 5.8 Diário do Dia

### Objetivo
Registrar estado emocional e qualidade de execução, e correlacionar com performance.

### Requisitos (V1)
- Um registro por dia com:
  - `emotion` (enum: CALMO, ANSIOSO, IRRITADO, EUFORICO, OUTRO)
  - `followed_plan` (SIM, NAO, PARCIAL)
  - `triggers` (checkboxes: FOMO, REVANCHE, PRESSA, MEDO_STOP, OVERTRADING)
  - `notes` (texto)
- Tela de calendário/lista do diário
- Na visão do dia, mostrar contexto:
  - P&L do dia
  - nº de trades do dia
  - violações do plano (se houver)

### Critérios de aceite
- Usuário preenche diário em < 2 min
- Diário fica ligado ao dia e aparece no dashboard

---

# 6. Requisitos Não Funcionais

## 6.1 Segurança
- Hash de senha forte (Argon2 ou bcrypt)
- Cookie HttpOnly + Secure em produção (HTTPS)
- Rate limiting em login
- Logs sem dados sensíveis

## 6.2 Performance
- Importação assíncrona (job/worker)
- Índices no Postgres para queries por data/ativo
- Paginação em listagens de trades

## 6.3 Confiabilidade
- Importação idempotente
- Registro de erros de importação com mensagens claras
- Possibilidade de “apagar import” e reprocessar (admin do próprio usuário)

---

# 7. Arquitetura (simples, compatível com Coolify)

## 7.1 Componentes
- **Frontend:** Next.js (web)
- **API:** NestJS (ou FastAPI) com REST
- **DB:** Postgres
- **Worker:** processo separado ou thread/queue simples
- **Storage:** diretório na VPS (V1) ou MinIO (V2)

## 7.2 Deploy (Coolify)
- 2 serviços:
  - `frontend`
  - `api/worker` (pode ser 1 serviço no começo)
- 1 banco:
  - Postgres já existente

---

# 8. Modelo de Dados (Postgres) — Entidades

## 8.1 users
- id (uuid)
- email (unique)
- password_hash
- timezone (default `America/Sao_Paulo`)
- created_at, updated_at

## 8.2 imports
- id (uuid)
- user_id (fk)
- filename_original
- storage_path
- status (PENDING, PROCESSING, DONE, ERROR)
- started_at, finished_at
- error_message (nullable)
- created_at

## 8.3 trades
- id (uuid)
- user_id (fk)
- import_id (fk)
- trade_datetime (timestamp)
- symbol (WIN/WDO/BTC/OTHER)
- quantity (numeric/int)
- pnl (numeric)
- fees (numeric, nullable)
- side (BUY/SELL, nullable)
- external_hash (unique per user)
- created_at

## 8.4 daily_stats
- id (uuid)
- user_id (fk)
- date (date)
- total_pnl (numeric)
- total_trades (int)
- wins (int)
- losses (int)
- created_at
- unique(user_id, date)

## 8.5 insights
- id (uuid)
- user_id (fk)
- type (ERROR_HERE, WORST_TIME, FOCUS_SYMBOL)
- title
- description
- score (int)
- sample_size (int)
- period_start, period_end
- evidence_json (jsonb)
- created_at

## 8.6 trade_plans
- id (uuid)
- user_id (fk)
- name
- is_active (bool)
- daily_loss_limit (numeric)
- max_trades_per_day (int)
- allowed_time_windows (jsonb)
- max_contracts_by_symbol (jsonb)
- pause_after_consecutive_losses (int)
- pause_minutes (int)
- created_at, updated_at

## 8.7 prop_challenges
- id (uuid)
- user_id (fk)
- name
- profit_target (numeric)
- daily_max_loss (numeric)
- total_max_drawdown (numeric)
- allowed_symbols (jsonb)
- max_contracts_by_symbol (jsonb)
- rules_text (text)
- created_at

## 8.8 journal_entries
- id (uuid)
- user_id (fk)
- date (date)
- emotion (enum/text)
- followed_plan (enum/text)
- triggers (jsonb)
- notes (text)
- created_at
- unique(user_id, date)

---

# 9. APIs (REST) — Endpoints mínimos

## Auth
- POST `/auth/register`
- POST `/auth/login`
- POST `/auth/logout`
- GET `/me`

## Imports
- POST `/imports` (upload)
- GET `/imports` (list)
- GET `/imports/:id` (status)
- DELETE `/imports/:id` (opcional)

## Trades/Analytics
- GET `/analytics/overview?start&end`
- GET `/analytics/by-symbol?start&end`
- GET `/analytics/heatmap?start&end&symbol&bucket=30`
- GET `/analytics/by-weekday?start&end`

## Insights
- GET `/insights?start&end`
- POST `/insights/recalculate?start&end` (opcional)

## Planner
- GET `/plans/active`
- POST `/plans`
- PUT `/plans/:id`
- GET `/plans/violations?start&end`

## Prop
- POST `/prop-challenges`
- GET `/prop-challenges`
- GET `/prop-challenges/:id/plan`
- GET `/prop-challenges/:id/progress?start&end`

## Diário
- POST `/journal`
- GET `/journal?start&end`
- GET `/journal/:date`

---

# 10. Telas (UI) — V1

1. Login / Cadastro
2. Dashboard (overview + cards insights)
3. Importação (upload + status + resumo)
4. Auditoria (tabs: ativo, horário, dia da semana)
5. Insights (lista + evidências)
6. Plano de Trade (criar/editar + resumo + violações)
7. Mesa Proprietária (criar challenge + plano de aprovação + progresso)
8. Diário do Dia (form + histórico)

---

# 11. Priorização (P0/P1)

## P0 (para colocar no ar)
- Auth
- Import (1 template)
- Trades persistidos + daily_stats
- Dashboard básico
- Heatmap simples
- 3 insights
- Plano simples
- Prop challenge simples
- Diário do dia

## P1 (logo depois)
- Mapeamento de colunas
- Melhorias na deduplicação
- Reprocessar import
- Regras de violação mais completas
- Export CSV
- Indicadores de consistência mais refinados

---

# 12. Critérios de Aceite (V1 “no ar”)
- Usuário cria conta, importa arquivo, vê dados e insights no mesmo dia
- A importação não duplica operações
- Heatmap aponta pior janela com amostra mínima
- Insight “Foque no ativo X” aparece com evidência e período
- Plano é criado e violações são listadas
- Challenge gera plano de aprovação e painel de progresso
- Diário é preenchido e aparece ligado ao dia do resultado

