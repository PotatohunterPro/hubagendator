# Plano de desenvolvimento — Sistema de gestão operacional mobile-first

## 1. Objetivo do projeto

Construir uma aplicação web responsiva, simples e rápida para o gestor criar tarefas, atribuir responsáveis, acompanhar prazos, cobrar pendências e visualizar a execução da equipe.

O sistema será utilizado principalmente em celulares iPhone e Samsung, mas também deverá funcionar bem em computador. A primeira entrega será uma **PWA**, ou seja, uma aplicação web instalável na tela inicial do celular, sem a necessidade de criar imediatamente dois aplicativos nativos separados.

O produto não deve tentar copiar todos os recursos do Trello. O foco será a operação diária:

1. O gestor cria uma tarefa.

1. O gestor atribui um responsável.

1. O responsável executa a atividade.

1. O responsável atualiza o status.

1. O gestor identifica atrasos e cobra pendências.

1. O sistema registra o histórico de tudo.

### Exemplos obrigatórios

- “Mandar cobrança para o Cliente X” — responsável: Gisele.

- “Fazer venda porta a porta no Bairro Y” — responsável: Wellington.

- Gisele abre a tarefa, executa, adiciona observação ou comprovante e marca como concluída.

- O gestor abre o painel e vê tarefas atrasadas, tarefas de hoje e tarefas concluídas.

## 2. Decisões técnicas fechadas

| Área | Decisão |
| --- | --- |
| Linguagem principal | TypeScript em frontend e backend |
| Frontend | React 19 + Vite + TypeScript |
| Estilo | Tailwind CSS + componentes acessíveis no padrão shadcn/ui |
| Backend | Node.js + Express + tRPC |
| Comunicação frontend/backend | tRPC com tipos compartilhados |
| Banco de dados | PostgreSQL |
| ORM | Drizzle ORM |
| Migrações | Drizzle Kit, versionadas no repositório |
| Autenticação | Sessão segura integrada ao mecanismo de autenticação do projeto |
| PWA | Web App Manifest + Service Worker + cache controlado |
| Uploads | Armazenamento de objetos; PostgreSQL guarda somente metadados |
| Testes unitários e integração | Vitest |
| Validação de entrada | Zod |
| Ícones | Lucide React |
| Deploy inicial | Ambiente web com HTTPS, PostgreSQL gerenciado e backup automático |
| Aplicativo nativo | Não faz parte do MVP; avaliar React Native/Expo posteriormente |

### Observação sobre o banco

PostgreSQL é obrigatório neste projeto. Não substituir por MySQL, SQLite ou banco em memória. SQLite pode ser usado apenas em testes isolados, se necessário, mas os testes de integração devem validar comportamento compatível com PostgreSQL.

## 3. Princípios de produto

### 3.1 Simplicidade operacional

O usuário deve preencher o mínimo de informações possível. A criação de uma tarefa comum deve levar menos de um minuto.

### 3.2 Mobile-first real

A interface deve ser planejada primeiro para uma tela de celular estreita. O desktop será uma ampliação da experiência mobile, não o contrário.

### 3.3 Ação rápida

As ações mais importantes devem estar sempre acessíveis:

- criar tarefa;

- iniciar tarefa;

- concluir tarefa;

- alterar responsável;

- definir prazo;

- cobrar atualização;

- filtrar tarefas.

### 3.4 Dados confiáveis

Toda mudança relevante deve ser registrada com usuário e data. Tarefa concluída não deve ser apagada automaticamente.

### 3.5 Segurança no backend

A interface pode esconder ações, mas a proteção real deverá existir nas procedures do backend. Todo acesso deve validar organização, usuário e permissão.

## 4. Escopo do MVP

### 4.1 Funcionalidades obrigatórias

1. Autenticação e sessão.

1. Organização da empresa.

1. Usuários e membros da organização.

1. Perfis: administrador, gestor, líder e colaborador.

1. Equipes.

1. Cadastro simples de clientes.

1. Criação de tarefas.

1. Atribuição de responsável.

1. Prazo com data e horário opcional.

1. Prioridade: baixa, normal, alta e urgente.

1. Status: a fazer, em andamento, concluída e arquivada.

1. Detecção automática de tarefas atrasadas.

1. Comentários.

1. Anexos básicos.

1. Histórico de alterações.

1. Filtros e busca.

1. Painel do gestor.

1. Tela “Minhas tarefas” para o colaborador.

1. Notificações dentro do sistema.

1. PWA instalável.

### 4.2 Fora do MVP

Não implementar na primeira versão:

- chat completo entre usuários;

- integração obrigatória com WhatsApp;

- GPS obrigatório;

- rotas de vendas;

- controle financeiro;

- emissão de notas fiscais;

- CRM completo;

- metas e comissão;

- automações condicionais complexas;

- aplicativo nativo separado para iOS e Android;

- sincronização offline completa;

- múltiplas organizações com faturamento;

- inteligência artificial para criar tarefas automaticamente.

Esses itens poderão ser avaliados depois que a equipe usar o núcleo do sistema na prática.

## 5. Estrutura visual e navegação

### 5.1 Navegação mobile

Usar uma barra inferior com quatro áreas:

1. **Início:** resumo e alertas.

1. **Tarefas:** todas as tarefas autorizadas e filtros.

1. **Equipe:** visão da equipe para gestor e líder.

1. **Mais:** clientes, notificações, configurações e sair.

Adicionar um botão de ação primária para **Nova tarefa**.

### 5.2 Navegação desktop

Usar uma barra lateral persistente com:

- Início;

- Minhas tarefas;

- Todas as tarefas;

- Equipe;

- Clientes;

- Notificações;

- Configurações.

### 5.3 Telas do MVP

| Rota | Finalidade |
| --- | --- |
| `/` | Redireciona para painel ou login |
| `/login` | Entrada no sistema |
| `/app` | Painel inicial |
| `/app/tasks` | Lista de tarefas |
| `/app/tasks/new` | Criação de tarefa |
| `/app/tasks/:id` | Detalhe e histórico da tarefa |
| `/app/my-tasks` | Tarefas do usuário atual |
| `/app/team` | Visão da equipe |
| `/app/clients` | Lista de clientes |
| `/app/clients/:id` | Detalhe do cliente e tarefas vinculadas |
| `/app/notifications` | Notificações do usuário |
| `/app/settings` | Preferências e configurações |

## 6. Painel inicial do gestor

A tela inicial deve priorizar situações que exigem ação.

### Cards de resumo

- tarefas atrasadas;

- tarefas vencendo hoje;

- tarefas em andamento;

- concluídas hoje;

- tarefas sem prazo.

### Listas principais

1. **Atrasadas:** ordenar pela maior quantidade de dias em atraso.

1. **Vencendo hoje:** ordenar pelo horário do prazo.

1. **Sem atualização:** tarefas em andamento sem evento recente.

1. **Concluídas recentemente:** ordenar pela conclusão mais recente.

### Ações rápidas

Cada item deve permitir, no mínimo:

- abrir tarefa;

- alterar responsável;

- alterar prazo;

- enviar cobrança interna;

- marcar como concluída, se o perfil tiver permissão.

## 7. Modelo de status e regras

### Status permitidos

- `todo`: a fazer;

- `in_progress`: em andamento;

- `completed`: concluída;

- `archived`: arquivada.

Não criar um status separado chamado `overdue`. Uma tarefa é atrasada quando:

```
status não é completed nem archived
E due_at existe
E due_at é anterior ao horário atual no fuso da organização
```

### Regras de transição

| Origem | Destino | Permitido para |
| --- | --- | --- |
| A fazer | Em andamento | Responsável, gestor ou líder autorizado |
| A fazer | Concluída | Responsável, gestor ou líder autorizado |
| Em andamento | Concluída | Responsável, gestor ou líder autorizado |
| Concluída | Em andamento | Gestor ou líder autorizado |
| Qualquer status aberto | Arquivada | Gestor ou administrador |
| Arquivada | Em andamento | Gestor ou administrador |

Ao concluir uma tarefa:

- preencher `completed_at`;

- preencher `completed_by`;

- criar evento no histórico;

- gerar notificação para o criador e gestores relevantes;

- manter comentários e anexos.

Ao reabrir uma tarefa:

- exigir motivo para gestor e líder;

- limpar `completed_at` e `completed_by`;

- criar evento no histórico;

- notificar o responsável.

## 8. Modelo de dados PostgreSQL

Criar as tabelas abaixo em `drizzle/schema.ts`.

### `organizations`

- `id` UUID, chave primária;

- `name` varchar, obrigatório;

- `timezone` varchar, padrão `America/Sao_Paulo`;

- `createdAt` timestamp;

- `updatedAt` timestamp.

### `users`

- `id` UUID ou identificador compatível com o sistema de autenticação;

- `name` varchar, obrigatório;

- `email` varchar, único quando disponível;

- `phone` varchar, opcional;

- `avatarUrl` varchar, opcional;

- `active` boolean, padrão true;

- `createdAt` timestamp;

- `updatedAt` timestamp.

### `organizationMembers`

- `organizationId` UUID, chave estrangeira;

- `userId`, chave estrangeira;

- `role` enum: `admin`, `manager`, `leader`, `member`;

- `active` boolean;

- `joinedAt` timestamp;

- chave primária composta por organização e usuário.

### `teams`

- `id` UUID;

- `organizationId` UUID;

- `name` varchar;

- `active` boolean;

- `createdAt` timestamp;

- `updatedAt` timestamp.

### `teamMembers`

- `teamId` UUID;

- `userId`;

- `createdAt` timestamp;

- chave primária composta por equipe e usuário.

### `clients`

- `id` UUID;

- `organizationId` UUID;

- `name` varchar;

- `company` varchar, opcional;

- `phone` varchar, opcional;

- `email` varchar, opcional;

- `notes` text, opcional;

- `active` boolean;

- `createdAt` timestamp;

- `updatedAt` timestamp.

### `tasks`

- `id` UUID;

- `organizationId` UUID;

- `title` varchar, obrigatório;

- `description` text, opcional;

- `status` enum;

- `priority` enum: `low`, `normal`, `high`, `urgent`;

- `assigneeId`, obrigatório;

- `creatorId`, obrigatório;

- `teamId`, opcional;

- `clientId`, opcional;

- `dueAt`, opcional;

- `completedAt`, opcional;

- `completedBy`, opcional;

- `archivedAt`, opcional;

- `createdAt` timestamp;

- `updatedAt` timestamp.

### `taskComments`

- `id` UUID;

- `taskId` UUID;

- `authorId`;

- `body` text;

- `createdAt` timestamp;

- `updatedAt` timestamp, opcional.

### `taskAttachments`

- `id` UUID;

- `taskId` UUID;

- `uploadedBy`;

- `fileUrl` varchar;

- `fileName` varchar;

- `mimeType` varchar;

- `fileSize` integer;

- `createdAt` timestamp.

### `taskEvents`

- `id` UUID;

- `taskId` UUID;

- `actorId`;

- `eventType` varchar ou enum;

- `oldValue` jsonb, opcional;

- `newValue` jsonb, opcional;

- `metadata` jsonb, opcional;

- `createdAt` timestamp.

### `notifications`

- `id` UUID;

- `organizationId` UUID;

- `userId`;

- `type` varchar;

- `taskId`, opcional;

- `title` varchar;

- `body` text;

- `readAt`, opcional;

- `createdAt` timestamp.

### Índices obrigatórios

Criar índices para:

- tarefas por organização, status e prazo;

- tarefas por organização e responsável;

- tarefas por organização e cliente;

- notificações por usuário, leitura e data;

- eventos por tarefa e data;

- membros por organização e usuário.

## 9. API tRPC

Organizar as procedures por domínio. Não criar um arquivo monolítico impossível de manter.

### `auth`

- `auth.me`;

- `auth.logout`;

- `auth.getSession` se necessário pelo template.

### `organization`

- `organization.getCurrent`;

- `organization.update`;

- `organization.getMembers`;

- `organization.updateMemberRole`;

- `organization.deactivateMember`.

### `teams`

- `teams.list`;

- `teams.getById`;

- `teams.create`;

- `teams.update`;

- `teams.addMember`;

- `teams.removeMember`.

### `clients`

- `clients.list`;

- `clients.getById`;

- `clients.create`;

- `clients.update`;

- `clients.archive`.

### `tasks`

- `tasks.list` com paginação e filtros;

- `tasks.getById`;

- `tasks.create`;

- `tasks.update`;

- `tasks.assign`;

- `tasks.setStatus`;

- `tasks.setDueDate`;

- `tasks.archive`;

- `tasks.reopen`;

- `tasks.addComment`;

- `tasks.updateComment`;

- `tasks.deleteComment` quando autorizado;

- `tasks.getEvents`;

- `tasks.getSummary`;

- `tasks.sendReminder`.

### `notifications`

- `notifications.list`;

- `notifications.markAsRead`;

- `notifications.markAllAsRead`.

### Validação

Toda entrada deve ser validada com Zod. Não confiar em campos enviados pelo frontend. O backend deve verificar:

- usuário autenticado;

- organização atual;

- existência dos registros relacionados;

- permissão para a operação;

- pertencimento de usuário e equipe à organização;

- tamanho máximo de título, descrição, comentário e anexos.

## 10. Controle de permissões

### Administrador

Pode configurar a organização, gerenciar membros, equipes e todas as tarefas.

### Gestor

Pode visualizar todas as tarefas da organização, criar tarefas para qualquer membro autorizado, alterar responsáveis, prazos, prioridades, status e reabrir tarefas.

### Líder

Pode visualizar e gerenciar tarefas das equipes às quais está vinculado, conforme regra definida pela organização.

### Colaborador

Pode visualizar tarefas atribuídas a si, tarefas da equipe quando autorizado, atualizar suas tarefas, comentar, anexar evidências e concluir atividades próprias.

A regra inicial deve ser simples e documentada. Não criar dezenas de permissões configuráveis no MVP.

## 11. Componentes frontend

Criar componentes reutilizáveis para:

- `AppShell`;

- `MobileBottomNav`;

- `DesktopSidebar`;

- `PageHeader`;

- `QuickCreateTask`;

- `TaskCard`;

- `TaskStatusBadge`;

- `PriorityBadge`;

- `AssigneeAvatar`;

- `TaskFilters`;

- `TaskList`;

- `TaskDetailSheet` ou página de detalhe;

- `DashboardMetricCard`;

- `AttentionSection`;

- `CommentTimeline`;

- `NotificationBell`;

- `EmptyState`;

- `LoadingState`;

- `ErrorState`.

Utilizar componentes de formulário acessíveis. Dar preferência a drawer ou bottom sheet no celular para criação e edição rápida.

## 12. Requisitos de UX mobile

- Layout inicial para largura aproximada de 360px.

- Botões e alvos de toque confortáveis.

- Não depender apenas de arrastar e soltar.

- Não usar tabela como visualização principal no celular.

- Mostrar tarefa, responsável, prazo e status no primeiro nível.

- Usar bottom sheet para ações rápidas.

- Preservar o formulário preenchido quando ocorrer erro de rede.

- Mostrar feedback imediato depois de salvar.

- Evitar modais longos.

- Implementar estados de vazio úteis, como “Você não tem tarefas pendentes”.

- Respeitar `prefers-reduced-motion`.

- Garantir contraste e foco visível.

- Não bloquear a conclusão da tarefa com campos desnecessários.

## 13. PWA

Implementar:

- `manifest.json` com nome, ícones, cores e modo standalone;

- service worker simples para cache de shell da aplicação;

- tela de fallback quando estiver sem conexão;

- estratégia conservadora de cache para não exibir dados desatualizados como se fossem atuais;

- botão ou instrução de instalação quando compatível;

- teste no Safari iOS e Chrome Android.

O MVP não deve fingir que possui sincronização offline completa. Se não houver conexão, informar o usuário claramente e preservar o formulário localmente quando for seguro.

## 14. Notificações do MVP

Implementar primeiro notificações internas no sistema. Criar notificações para:

- tarefa atribuída;

- tarefa reatribuída;

- comentário adicionado;

- tarefa concluída;

- tarefa reaberta;

- tarefa vencendo hoje;

- tarefa atrasada.

Agrupar notificações semelhantes para evitar excesso. O envio externo por push, e-mail ou WhatsApp deve ser implementado somente depois de validar o fluxo interno.

## 15. Ordem de implementação para o agente de IA

### Etapa 1 — Inspeção do projeto

Antes de editar qualquer arquivo:

1. Ler `README.md`.

1. Listar estrutura do projeto.

1. Identificar o sistema de autenticação existente.

1. Identificar o adaptador de banco existente.

1. Conferir se o ambiente suporta PostgreSQL e qual variável de conexão está disponível.

1. Não alterar arquivos de infraestrutura sem necessidade.

1. Criar ou atualizar um arquivo de decisões técnicas se houver conflito com este plano.

### Etapa 2 — Fundação do domínio

1. Criar schema Drizzle para organizações, membros, equipes, clientes e tarefas.

1. Criar enums e índices.

1. Gerar migração.

1. Aplicar migração no PostgreSQL.

1. Criar helpers de banco.

1. Criar seed de desenvolvimento com usuários fictícios, Gisele, Wellington, clientes e tarefas de exemplo.

### Etapa 3 — Backend de tarefas

1. Implementar procedimentos de listagem, criação e detalhe.

1. Implementar atribuição e alteração de status.

1. Implementar prazos e prioridades.

1. Implementar comentários.

1. Implementar eventos de auditoria.

1. Implementar resumo do painel.

1. Adicionar testes de autorização e regras de transição.

### Etapa 4 — Interface do colaborador

1. Criar shell mobile-first.

1. Criar tela “Minhas tarefas”.

1. Criar detalhe da tarefa.

1. Implementar iniciar, concluir e comentar.

1. Implementar anexos se o armazenamento estiver pronto.

1. Tratar loading, erro, vazio e sucesso.

### Etapa 5 — Interface do gestor

1. Criar painel de atenção.

1. Criar criação rápida.

1. Criar filtros.

1. Criar visão da equipe.

1. Criar alteração de responsável e prazo.

1. Criar envio de cobrança interna.

1. Criar clientes e associação de tarefa.

### Etapa 6 — PWA e qualidade

1. Configurar manifest e service worker.

1. Testar responsividade.

1. Testar navegadores mobile.

1. Testar permissões.

1. Testar migração e restauração.

1. Executar lint, typecheck, testes e build.

1. Corrigir erros antes de considerar a entrega pronta.

## 16. Dados de demonstração

Criar dados de seed somente para desenvolvimento:

### Usuários

- Carlos — gestor;

- Gisele — colaboradora;

- Wellington — colaborador.

### Clientes

- Cliente X;

- Cliente Y;

- Cliente Z.

### Tarefas

- “Mandar cobrança para o Cliente X” — Gisele — alta — hoje — em andamento.

- “Fazer venda porta a porta no Bairro Y” — Wellington — normal — amanhã — a fazer.

- “Confirmar visita com o Cliente Z” — Wellington — urgente — atrasada.

- “Enviar comprovante da cobrança” — Gisele — concluída.

Não usar dados reais no seed ou nos testes.

## 17. Testes obrigatórios

### Backend

Testar:

- criação de tarefa válida;

- rejeição de título vazio;

- tarefa sem responsável;

- usuário fora da organização;

- colaborador acessando tarefa de outra pessoa sem permissão;

- gestor alterando responsável;

- colaborador concluindo própria tarefa;

- colaborador tentando arquivar tarefa sem permissão;

- reabertura com motivo;

- cálculo de atraso;

- registro de eventos;

- criação de notificação;

- idempotência ao concluir duas vezes.

### Frontend

Testar manualmente ou com testes de componente:

- criação de tarefa pelo celular;

- filtro de tarefas atrasadas;

- conclusão de tarefa;

- erro de rede;

- lista vazia;

- carregamento;

- navegação por teclado no desktop;

- contraste e foco;

- visualização em largura de 360px.

### Aceite end-to-end

O seguinte cenário deve funcionar do início ao fim:

1. Carlos cria a tarefa “Mandar cobrança para o Cliente X”.

1. Carlos define Gisele como responsável.

1. Gisele abre “Minhas tarefas”.

1. Gisele inicia a tarefa.

1. Gisele adiciona a observação “Cliente pediu retorno às 14h”.

1. Gisele conclui a tarefa.

1. Carlos vê a tarefa como concluída e o histórico com usuário e horário.

Repetir o cenário para Wellington e a tarefa de venda porta a porta.

## 18. Critérios de aceite do MVP

A entrega somente será considerada pronta quando:

- o projeto compilar sem erros;

- o typecheck passar;

- os testes passarem;

- as migrações forem aplicadas no PostgreSQL;

- todas as rotas principais funcionarem;

- o gestor conseguir criar e atribuir uma tarefa;

- o colaborador conseguir iniciar e concluir uma tarefa;

- atrasos aparecerem automaticamente;

- o histórico for persistido;

- os filtros funcionarem;

- permissões impedirem acesso indevido;

- a interface funcionar em iPhone e Samsung;

- a PWA puder ser instalada;

- erros de rede forem tratados;

- houver backup configurado antes do uso real.

## 19. Definition of Done

Uma funcionalidade só está concluída quando:

1. O schema e a migração estão atualizados.

1. O backend possui validação e autorização.

1. A interface usa a API tipada.

1. Existem estados de carregamento, vazio e erro.

1. A interface funciona em mobile.

1. O histórico é criado quando a ação for relevante.

1. Existem testes para o comportamento principal.

1. O lint, typecheck, testes e build passam.

1. A funcionalidade foi verificada com dados de demonstração.

1. Não existem dados reais ou segredos versionados.

## 20. Instruções diretas para o agente de IA programador

Você deve agir como engenheiro de software sênior. Antes de codificar, inspecione o repositório e confirme como o template implementa autenticação, banco, rotas e componentes existentes. Preserve as convenções já presentes.

Implemente em pequenos incrementos verificáveis. Após cada incremento, execute os testes relacionados. Não crie endpoints ou componentes duplicados. Não use chamadas `fetch` ou Axios se o projeto utilizar tRPC. Não manipule cookies diretamente. Não coloque imagens grandes em `client/public` ou `client/src/assets`.

Priorize a funcionalidade sobre a decoração. Não adicione recursos fora do MVP sem justificativa. Quando houver ambiguidade de baixo risco, escolha a opção mais simples e registre a decisão. Quando uma escolha alterar permissões, dados, segurança ou comportamento principal, pare e registre a decisão antes de continuar.

Ao terminar cada fase, reporte:

- arquivos criados ou alterados;

- migrações executadas;

- funcionalidades concluídas;

- testes executados;

- problemas conhecidos;

- próximo passo recomendado.

## 21. Próximo passo imediato

O agente deve começar pela **Etapa 1 — Inspeção do projeto**. Depois, deve apresentar um diagnóstico curto do repositório e iniciar a fundação do banco PostgreSQL, sem construir ainda telas secundárias ou funcionalidades fora do MVP.

## Referências

[1]: https://www.postgresql.org/docs/current/ "PostgreSQL Documentation"

[2]: https://orm.drizzle.team/docs/overview "Drizzle ORM Documentation"

[3]: https://trpc.io/docs/ "tRPC Documentation"

[4]: https://web.dev/learn/pwa/ "Learn Progressive Web Apps"

[5]: https://www.gov.br/esporte/pt-br/acesso-a-informacao/lgpd "Lei Geral de Proteção de Dados Pessoais — Governo Federal"