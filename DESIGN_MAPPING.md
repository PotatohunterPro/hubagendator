# HubAgendator — Design Mapping

## Status deste documento

Este documento foi extraído de todos os arquivos existentes em `ux-teste/` (não `ux-text/`) e deve ser tratado como especificação obrigatória para a implementação das telas.

Arquivos analisados:

- `stitch_hubagendator_internal_operations_system/hub_precision_operations/DESIGN.md`
- `stitch_hubagendator_internal_operations_system/hubagendator_login/code.html`
- `stitch_hubagendator_internal_operations_system/hubagendator_login/screen.png`
- `stitch_hubagendator_internal_operations_system/painel_de_aten_o_gestor/code.html`
- `stitch_hubagendator_internal_operations_system/painel_de_aten_o_gestor/screen.png`
- `stitch_hubagendator_internal_operations_system/minhas_tarefas_colaborador/code.html`
- `stitch_hubagendator_internal_operations_system/minhas_tarefas_colaborador/screen.png`
- `stitch_hubagendator_internal_operations_system/carga_da_equipe/code.html`
- `stitch_hubagendator_internal_operations_system/carga_da_equipe/screen.png`
- `stitch_hubagendator_internal_operations_system/criar_nova_tarefa/code.html`
- `stitch_hubagendator_internal_operations_system/criar_nova_tarefa/screen.png`
- `stitch_hubagendator_internal_operations_system/detalhe_da_tarefa_operacional/code.html`
- `stitch_hubagendator_internal_operations_system/detalhe_da_tarefa_operacional/screen.png`
- `stitch_hubagendator_internal_operations_system/central_de_notifica_es/code.html`
- `stitch_hubagendator_internal_operations_system/central_de_notifica_es/screen.png`
- `stitch_hubagendator_internal_operations_system/logo.png/screen.png`

Não foram encontrados `AGENTS.md` ou `MASTER_PLAN.md` no projeto.

> Os textos entre aspas neste documento são cópias literais dos protótipos. Não alterar a redação durante a implementação sem aprovação.

## 1. Design tokens

### 1.1 Cores do tema definido em `DESIGN.md`

| Token | Valor |
| --- | --- |
| `surface` / `background` / `surface-bright` | `#faf8ff` |
| `surface-dim` | `#d2d9f4` |
| `surface-container-lowest` | `#ffffff` |
| `surface-container-low` | `#f2f3ff` |
| `surface-container` | `#eaedff` |
| `surface-container-high` | `#e2e7ff` |
| `surface-container-highest` / `surface-variant` | `#dae2fd` |
| `on-surface` / `on-background` | `#131b2e` |
| `on-surface-variant` | `#424752` |
| `outline` | `#727784` |
| `outline-variant` | `#c2c6d4` |
| `inverse-surface` | `#283044` |
| `inverse-on-surface` | `#eef0ff` |
| `primary` | `#003f87` |
| `primary-container` | `#0056b3` |
| `on-primary` | `#ffffff` |
| `on-primary-container` | `#bbd0ff` |
| `primary-fixed` | `#d7e2ff` |
| `primary-fixed-dim` | `#acc7ff` |
| `on-primary-fixed` | `#001a40` |
| `on-primary-fixed-variant` | `#004491` |
| `surface-tint` | `#115cb9` |
| `inverse-primary` | `#acc7ff` |
| `secondary` | `#00658d` |
| `secondary-container` | `#41befd` |
| `on-secondary` | `#ffffff` |
| `on-secondary-container` | `#004b69` |
| `secondary-fixed` | `#c6e7ff` |
| `secondary-fixed-dim` | `#81cfff` |
| `on-secondary-fixed` | `#001e2d` |
| `on-secondary-fixed-variant` | `#004c6b` |
| `tertiary` | `#00399d` |
| `tertiary-container` | `#004ecf` |
| `on-tertiary` | `#ffffff` |
| `on-tertiary-container` | `#c1cfff` |
| `tertiary-fixed` | `#dbe1ff` |
| `tertiary-fixed-dim` | `#b4c5ff` |
| `on-tertiary-fixed` | `#00174b` |
| `on-tertiary-fixed-variant` | `#003ea8` |
| `error` | `#ba1a1a` |
| `error-container` | `#ffdad6` |
| `on-error` | `#ffffff` |
| `on-error-container` | `#93000a` |

### 1.2 Sistema de cor semântica confirmado nos protótipos

A reconferência dos 7 arquivos `code.html` não encontrou uso de âmbar
(`#F59E0B`) ou verde (`#10B981`). Para a v1, os estados operacionais devem usar
somente estes três papéis, todos derivados dos tokens Material da seção 1.1:

| Papel v1 | Tokens permitidos | Aplicação |
| --- | --- | --- |
| Crítico / atrasado | `error`, `error-container`, `on-error-container` | Tarefas críticas, atrasadas e ações críticas |
| Estado ativo | `primary`, `primary-container`, `on-primary`, `on-primary-container` | A fazer, hoje, em andamento, próxima e demais estados ativos |
| Concluída | `secondary-fixed` com `opacity: 0.85` e `text-decoration: line-through` | Tarefas concluídas/resolvidas |

Âmbar, verde e os demais hexadecimais da seção narrativa “Operational
Semantics” de `DESIGN.md` não fazem parte da especificação de cor da v1.
Não introduzir esses papéis por conta própria. Um sistema semântico de quatro
cores será um novo pedido de design.

### 1.3 Tipografia

Família principal: `Geist`; fallback: `Inter` e `sans-serif`.

| Token | Tamanho | Peso | Linha | Tracking |
| --- | ---: | ---: | ---: | ---: |
| `headline-xl` | `28px` | `600` | `36px` | `-0.02em` |
| `headline-lg` | `22px` | `600` | `28px` | `-0.015em` |
| `headline-md` | `18px` | `600` | `24px` | `-0.01em` |
| `body-lg` | `15px` | `400` | `22px` | `-0.005em` |
| `body-md` | `13px` | `400` | `18px` | `0em` |
| `body-sm` | `12px` | `400` | `16px` | `0em` |
| `label-lg` | `13px` | `500` | `18px` | `-0.005em` |
| `label-md` | `11px` | `600` | `14px` | `0.03em` |
| `label-sm` | `10px` | `600` | `12px` | `0.05em` |

Timestamps, durações, medidores de capacidade e IDs de cliente devem usar figuras tabulares (`tnum`).

### 1.4 Espaçamento

Base modular: ritmo de `4px/8px`.

| Token | Valor |
| --- | ---: |
| `space-3xs` | `0.125rem` |
| `space-2xs` | `0.25rem` |
| `space-xs` | `0.375rem` |
| `space-sm` | `0.5rem` |
| `space-md` | `0.75rem` |
| `space-base` | `1rem` |
| `space-lg` | `1.25rem` |
| `space-xl` | `1.5rem` |
| `space-2xl` | `2rem` |
| `gutter-compact` | `0.75rem` |
| `gutter-default` | `1rem` |
| `margin-screen` | `1.5rem` |

Row height: `36px` em visões densas e `44px` em visões confortáveis. Padding de coluna: `space-md` (`12px`).

### 1.5 Raios

| Token | Valor |
| --- | ---: |
| `sm` | `0.125rem` |
| `DEFAULT` | `0.25rem` |
| `md` | `0.375rem` |
| `lg` | `0.5rem` |
| `xl` | `0.75rem` |
| `full` | `9999px` |

Uso prescrito:

- Controles base: `rounded-md`, aproximadamente `4px–6px`.
- Containers estruturais: `rounded-lg`, aproximadamente `8px`.
- Avatares, pontos de status e badges pequenos: `rounded-full`.
- Protótipos usam também `rounded-xl` para cards e ações móveis; manter o aspecto arredondado contido, sem formas orgânicas exageradas.

### 1.6 Sombras e elevação

| Tier | Uso | Sombra |
| --- | --- | --- |
| Tier 0 | canvas | sem sombra |
| Tier 1 | cards, worksheets, tabelas | `0 1px 2px 0 rgba(15, 23, 42, 0.04)` |
| Tier 2 | popovers, dropdowns, cards em hover | `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)` |
| Tier 3 | modais, command palette, drawers | `0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06)` |

Tier 3 usa backdrop `rgba(15, 23, 42, 0.35)` com `backdrop-filter: blur(4px)`.

### 1.7 Componentes visuais básicos

- Botão primário: `primary-container`, hover `primary`, texto `on-primary`, altura compacta `32px` ou padrão `36px`, focus ring de `2px` com offset e `secondary-container`.
- Botão secundário: fundo `surface-container-lowest`, borda `1px outline-variant`, texto `on-surface`; hover `surface-container-low` e borda `outline`.
- Botão ghost/action: transparente, texto `on-surface-variant`; hover `surface-container-low` e texto `on-surface`.
- Badge de status: altura fixa `20px`, fonte `11px`, semibold, uppercase, tracking `0.03em`, raio `4px`, ponto opcional pulsante de `6px`.
- Schedule card: fundo `surface-container-lowest`, borda `1px outline-variant`, raio `6px`, barra vertical esquerda de `3px` com um dos três papéis semânticos v1.
- Command palette: `Ctrl/Cmd + K`, modal flutuante no topo-centro, busca instantânea e grupos “Agendar”, “Delegar”, “Filtrar por Técnico”, “Reatribuir”.
- Time-grid: linhas horizontais tracejadas de `1px outline-variant`; indicador de hora atual em `error`, hairline sólido com cabeça pulsante de `8px`.

## 2. Componentes reutilizáveis identificados

As props abaixo são o contrato visual/funcional observado nos protótipos. Estados listados devem ser contemplados na implementação.

| Componente | Props/entradas observadas | Estados obrigatórios |
| --- | --- | --- |
| `AppHeader` | `user`, `role`, `notificationsCount`, `onNotifications`, `onProfile` | normal, notificação pendente, perfil aberto |
| `BottomNavigation` | `activePath`, itens `Início`, `Tarefas`, `Equipe`, `Mais`, `badge` | ativo, inativo, badge de pendências |
| `BackHeader` | `title`, `onBack`, `user` | normal, retorno |
| `FloatingNewTaskButton` | `onClick`, label `Nova Tarefa` | normal, pressed |
| `StatusBadge` | `status`, `label`, `tone`, `showDot` | `Atrasada`, `Hoje`, `Em Andamento`, `Concluída`, `A Fazer`, `Próxima` |
| `PriorityBadge` | `priority` | `Baixa Prioridade`, `Normal`, `Alta Prioridade`, `Urgente` |
| `MetricCard` | `label`, `value`, `supportText`, `icon`, `tone`, `onClick` | normal, hover/pressed |
| `FilterPill` | `label`, `count`, `active`, `icon`, `onClick` | ativo, inativo, scroll horizontal |
| `TaskCard` | `title`, `client`, `assignee`, `priority`, `status`, `dueAt`, `lastUpdate`, `description`, `actions`, `category` | crítica/atrasada, sem atualização, hoje, sem responsável/prazo, concluída |
| `TaskMetadataStrip` | `assignee`, `dueAt`, `lastUpdate`, `client` | normal, vencida, sem prazo |
| `TaskQuickActions` | `onComplete`, `onUpdate`, `onRemind`, `onDetails` | normal, carregando, concluído |
| `ContextActionSheet` | `task`, ações de responsável, prazo, cobrança e conclusão | fechado, aberto, ação executando |
| `ToastFeedback` | `message`, `tone`, `icon`, `duration` | oculto, visível, dismiss |
| `TeamCapacityBar` | `activeCount`, `operatorCount`, `overdue`, `today`, `inProgress` | ao vivo, segmentos sem dados |
| `TeamMemberCard` | `name`, `role`, `team`, `active`, `inProgress`, `overdue`, `today`, `completedToday`, `currentTask`, `onViewTasks` | carga alta, equilibrada, atenção |
| `OperationalFormSection` | `title`, `helper`, `children` | normal, erro de campo |
| `AssigneeSelector` | opções de pessoa/fila, `value`, `onChange` | selecionado, não selecionado, `Fila Geral` |
| `PrioritySelector` | `value`, `onChange` | baixa, normal selecionada, alta, urgente |
| `OriginSelector` | `value`, `onChange` | gestor, rotina interna, cliente, comercial |
| `ClientSelect` | `value`, opções, `optional` | selecionado, opcional |
| `DeadlineSelector` | `value`, `preview`, atalhos `+2 horas`, `Fim do dia`, `Amanhã` | normal, hoje, alterado |
| `StickyActionBar` | `primaryAction`, `secondaryAction` | normal, submit/loading |
| `NotificationCard` | `type`, `title`, `body`, `time`, `unread`, `actions` | não lida, lida, crítica, cobrança, atribuição, conclusão, comentário |
| `NotificationFilters` | categorias e contagens | `Todas`, `Não lidas`, `Cobranças`, `Atribuições` |
| `OperationalQueueBanner` | `criticalCount`, `status` | ativo, sem item crítico |
| `TaskDetailHeader` | `status`, `priority`, `client`, `due`, `title`, `orderId` | em andamento, atraso, prioridade alta |
| `TaskMetadataBento` | responsável, prazo fatal, criador | normal, prazo crítico |
| `TaskActionBar` | concluir, notificar, menu | normal, concluída, menu aberto |
| `OperationalTimeline` | eventos, autor, hora, badge de papel | normal, tempo real, mensagem do gestor |
| `CommentComposer` | `value`, `onChange`, `onSubmit`, anexar arquivo/foto | vazio, preenchido, enviando |
| `AttachmentList` | anexos, `onView`, `onOpen`, `onDownload` | vazio, imagem, documento |
| `AuditHistory` | eventos de auditoria, expand/collapse | recolhido, expandido |
| `LoginForm` | email, senha, `onSubmit`, recuperação | normal, senha visível, autenticando, conectado, erro |
| `PersonaShortcut` | email, nome, papel, avatar/initials | selecionado, feedback “Perfil selecionado” |

## 2. Schema de dados

Os shapes abaixo consolidam os campos implícitos nas props de `TaskCard`, `TaskDetailHeader`, `TaskMetadataBento`, `TeamMemberCard` e `NotificationCard`. Cada entidade possui um único shape; componentes devem referenciar esses shapes em vez de criar nomes alternativos para o mesmo dado.

```ts
type TaskStatus =
  | "todo"
  | "in_progress"
  | "completed"
  | "archived";

type TaskPriority = "low" | "normal" | "high" | "urgent";

type TaskCategory =
  | "critical"
  | "no_update"
  | "today"
  | "unassigned"
  | "completed";

interface Technician {
  id: string;
  name: string;
  role: string;
  team: string | null;
  avatarUrl: string | null;
  activeTaskCount: number;
  inProgressCount: number;
  overdueCount: number;
  dueTodayCount: number;
  completedTodayCount: number;
  currentTask: TaskSummary | null;
  workloadStatus: "high" | "balanced" | "attention" | null;
}

interface Client {
  id: string;
  name: string;
  location: string | null;
}

interface TaskSummary {
  id: string;
  title: string;
  client: Client | null;
  assignee: Technician | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueAt: string | null;
  lastUpdatedAt: string | null;
  lastUpdatedBy: Technician | null;
  lastUpdateText: string | null;
  description: string | null;
  category: TaskCategory;
  orderId: string | null;
}

interface Task extends TaskSummary {
  creator: Technician | null;
  team: string | null;
  origin: "gestor" | "rotina" | "cliente" | "comercial" | "interna" | null;
  completedAt: string | null;
  completedBy: Technician | null;
  comments: TaskComment[];
  attachments: TaskAttachment[];
  events: TaskEvent[];
}

interface TaskComment {
  id: string;
  author: Technician;
  body: string;
  createdAt: string;
}

interface TaskAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileUrl: string;
  uploadedBy: Technician;
  createdAt: string;
}

interface TaskEvent {
  id: string;
  actor: Technician | null;
  eventType: string;
  createdAt: string;
  oldValue: unknown;
  newValue: unknown;
}

type NotificationType =
  | "overdue"
  | "update_requested"
  | "task_assigned"
  | "task_completed"
  | "comment_added"
  | "support_assigned";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  task: TaskSummary | null;
  createdAt: string;
  readAt: string | null;
  unread: boolean;
  actions: NotificationAction[];
}

interface NotificationAction {
  label: string;
  action:
    | "remind"
    | "view_task"
    | "reply"
    | "start_task"
    | "examine"
    | "reply_comment"
    | "view_route";
}
```

### 2.1 Regras de consolidação

- `Technician` é o shape usado para responsável, criador, autor, executor e membro da equipe.
- `Client` concentra o contexto do cliente; `location` cobre o local exibido nos protótipos, sem duplicar `clientName` ou `clientLocation`.
- `TaskSummary` contém apenas os dados necessários para cards, cabeçalhos e snapshots; `Task` adiciona o conteúdo completo do detalhe.
- `dueAt` representa o prazo; não criar campos alternativos como `due`, `deadline` ou `dueDate`.
- `lastUpdatedAt` e `lastUpdatedBy` representam a última atualização; `lastUpdateText` representa o texto exibido quando existir.
- `Notification` usa `task` para o vínculo contextual; não duplicar `taskId` como prop visual. A persistência pode manter um identificador interno, desde que a camada de apresentação adapte para este shape.
- `unread` é derivado de `readAt`; não deve haver duas fontes independentes de verdade.

## 3. Textos de UX literais

### 3.1 Login

- Título da página: `HubAgendator`
- `Gestão Operacional Interna`
- `Ambiente restrito • Somente equipe autorizada`
- `E-mail corporativo`
- Placeholder: `seu.nome@hubsolucao.com.br`
- `Senha`
- `Esqueci minha senha`
- Placeholder de senha: `••••••••`
- CTA: `Entrar na Operação`
- Estado durante autenticação: `Autenticando sessão...`
- Estado após autenticação: `Conectado!`
- `Atalhos de Homologação`
- `Carlos (Gestor)`
- `carlos@hubsolucao.com.br`
- `Gisele (Colaboradora)`
- `gisele@hubsolucao.com.br`
- Feedback: `Perfil selecionado: ` seguido do nome
- `HubAgendator v2.4 • Criptografia ponta a ponta`
- `© Hub Soluções Integradas • Suporte Técnico: ramal 4022`
- Alerta de recuperação: `Instruções de recuperação enviadas ao e-mail institucional cadastrado.`

### 3.2 Navegação e identidade

- `HubAgendator`
- `Gestor (Carlos)`
- `Notificações`
- `Início`
- `Tarefas`
- `Equipe`
- `Mais`
- `Nova Tarefa`
- `Voltar`
- `Ação Imediata`
- `Plantão Ativo`
- `Ao Vivo`
- `Coordenação`

### 3.3 Painel de atenção do gestor

- `Bom dia, Carlos`
- `Veja o que precisa da sua atenção agora.`
- `Atrasadas`
- `Para Hoje`
- `Em Rota`
- `Feitas`
- `Sem Prazo`
- `Prioridade máx.`
- `2 no limite`
- `3 técnicos`
- `Meta 85%`
- `Pendente`
- `Precisa da sua atenção`
- `5 itens listados`
- `Todos`
- `Críticas/Atrasadas`
- `Sem atualização`
- `Vencendo Hoje`
- `CRÍTICA • ATRASADA 2H`
- `Em andamento`
- `Configurar computador e checkout — Mercado X`
- `Gisele (Técnica)`
- `Venceu às 11:00`
- `Última atualização há 20 min por Gisele: "Aguardando cabo de rede local."`
- `Cobrar Atualização`
- `Detalhes`
- `HOJE • 15:30`
- `Troca de switch de rede e roteador — Restaurante União`
- `Sem atualização do técnico há mais de 24 horas`
- `João Silva`
- `Prioridade Alta`
- `Cobrar Atualização Imediata`
- `HOJE • 18:00`
- `A Fazer`
- `Instalação de PDV secundário — Loja Central`
- `Maria Soares`
- `Check-in há 40 min`
- `ALTA PRIORIDADE`
- `Sem Prazo`
- `Backup manual de servidores de arquivo — Interno Hub`
- `Nenhum responsável alocado`
- `Atribuir`
- `Concluída`
- `Finalizado há 15 min`
- `Finalizado com sucesso por Gisele`
- `Revisão de nobreaks — Mercado X`
- `Equipe em Trânsito`
- `Ver mapa ao vivo`
- `GISELE`
- `1 Atrasada`
- `JOÃO`
- `2 em rota`
- `MARIA`
- `1 no local`
- `Ações operacionais`
- `Gerenciar Tarefa`
- `Alterar responsável`
- `Alterar prazo de entrega`
- `Cobrar atualização do técnico`
- `Marcar como concluída`
- `Notificação enviada para Gisele!`
- `Alerta enviado para João via WhatsApp!`
- `Abrindo lista de técnicos disponíveis...`
- `Ação executada com sucesso`
- `Tarefa concluída com sucesso!`

### 3.4 Minhas tarefas do colaborador

- `Ação Imediata`
- `Terça, 15:00`
- `Minhas Tarefas`
- `O que você precisa fazer agora, Gisele.`
- Placeholder: `Buscar nas minhas tarefas...`
- `Atrasadas`
- `Para Hoje`
- `Em Andamento`
- `Próximas`
- `Concluídas`
- `Alta Prioridade`
- `Atrasada 1h`
- `Mercado X`
- `Balcão 02 / Central`
- `Configurar computador e impressora do Mercado X`
- `Instalar Windows 11 Pro, configurar sistema PDV e impressora térmica de cupons.`
- `Prazo limite: Hoje, 14:00`
- `Etapa 2 de 3`
- `Concluir`
- `Atualizar / Log`
- `Normal`
- `A Fazer`
- `Hoje, 16:30`
- `Restaurante União`
- `Configuração de certificado digital A1 — Restaurante União`
- `Instalação de token e exportação no navegador da gerência.`
- `Presencial`
- `Iniciar Tarefa`
- `Baixa Prioridade`
- `⚪ Próxima`
- `Amanhã, 10:00`
- `Loja Central`
- `Manutenção preventiva de terminal balcão — Loja Central`
- `Limpeza física, teste de estabilidade de nobreak e checklist trimestral.`
- `Previsto: 45 min`
- `Tudo sob controle`
- `Você está em dia com as tarefas críticas. Próximas demandas começam às 16:30. Aproveite para fazer o log de peças.`
- `Ver resumo da rota do dia`
- `Surgiu uma demanda urgente no local?`
- `+ Nova Demanda`
- Estados de microinteração: `Iniciando...`, `Em Andamento`, `Finalizado`

### 3.5 Equipe operacional

- `Equipe Operacional`
- `Capacidade atual e distribuição de demandas em tempo real.`
- `Ao Vivo`
- `Pressão de Carga da Frota`
- `25 demandas ativas / 4 operadores`
- `11 em rota`
- `9 p/ hoje`
- `3 atrasos operacionais`
- `Todas as equipes (3)`
- `Suporte Técnico`
- `Infraestrutura`
- `Gisele`
- `Suporte`
- `Técnica de Suporte`
- `Carga Alta`
- `9 ativas`
- `Em andamento`
- `Atrasadas`
- `Vencem hoje`
- `Concluídas hoje`
- `Configurar computador — Mercado X`
- `há 15 min`
- `Em execução externa`
- `Ver 9 tarefas de Gisele`
- `João`
- `Redes`
- `Especialista de Redes`
- `Equilibrada`
- `6 ativas`
- `Troca de switch — Restaurante União`
- `há 40 min`
- `Em trânsito com equipamento`
- `Ver 6 tarefas de João`
- `Maria`
- `Sistemas`
- `Analista de Sistemas`
- `Atenção`
- `8 ativas`
- `Instalação de PDV — Loja Central`
- `há 25 min`
- `Finalizando parametrização fiscal`
- `Ver 8 tarefas de Maria`
- `Carlos`
- `Líder`
- `Gestor Operacional`
- `Para revisão`
- `Atribuídas hoje`
- `Sugestão: Deslocar 1 chamado de Gisele para João`
- `Rebalancear`

### 3.6 Criar nova tarefa

- `Despacho Ágil`
- `Nova Tarefa`
- `Registre uma demanda operacional direta da equipe.`
- `Título da Demanda`
- `Objetivo e claro`
- Placeholder: `Ex.: Configurar computador do cliente`
- `Instruções Técnicas`
- `Checklist ou contexto`
- Placeholder: `Detalhes operacionais do que precisa ser feito...`
- `Responsável pela Execução`
- `Gisele`
- `Técnica N2`
- `João`
- `Redes`
- `Maria`
- `Suporte`
- `Fila Geral`
- `Sem atribuição`
- `Equipe Responsável`
- `Suporte Técnico`
- `Infraestrutura`
- `Sistemas & PDV`
- `Prioridade`
- `Baixa`
- `Normal`
- `Alta`
- `Urgente`
- `Origem do Pedido`
- `Gestor`
- `Rotina interna`
- `Cliente`
- `Comercial`
- `Cliente Vinculado`
- `Opcional`
- `Mercado X (Matriz Centro)`
- `Restaurante União (Av. Principal)`
- `Loja Central Distribuição`
- `Operação Interna / Sede`
- `Prazo de Conclusão`
- `Hoje às 17:00`
- `Hoje, 17:00`
- `+2 horas`
- `Fim do dia`
- `Amanhã`
- CTA: `Criar e Atribuir Tarefa`
- `Cancelar`
- Toast de sucesso: `Demanda Encaminhada!`
- `Notificação despachada ao técnico.`

### 3.7 Detalhe da tarefa operacional

- `Detalhes Da Tarefa`
- `Em Andamento`
- `Alta Prioridade`
- `Mercado X`
- `Restam 45m`
- `Minhas Tarefas`
- `Configurar computador do Mercado X`
- `Ordem de Serviço #OS-8492 · Estação PDV 01`
- `Responsável`
- `Gisele Silva`
- `Técnica Nível II`
- `Prazo Fatal`
- `Hoje, 16:00`
- `Criado por Carlos`
- `Concluir Tarefa`
- `Cobrar /`
- `Notificar`
- `Alterar responsável`
- `Alterar prazo / SLA`
- `Reabrir tarefa`
- `Descrição Operacional`
- `SOP #04`
- `Instalação limpa do Windows 11, configuração do client de banco de dados, conexão com a impressora térmica não fiscal Elgin e teste de impressão na porta COM3.`
- `Timeline Operacional`
- `Tempo Real`
- `Gisele`
- `Windows instalado com sucesso. Agora iniciando instalação dos drivers e da impressora.`
- `Carlos`
- `Gestor`
- `Gisele, por favor certifique-se de configurar o acesso remoto AnyDesk e colar a etiqueta com o ID na CPU.`
- `AnyDesk configurado: 982 112 404. Teste de cupom ok.`
- `Validado via COM3`
- Placeholder: `Adicionar uma atualização operacional...`
- Title/tooltip: `Anexar arquivo ou foto`
- Title/tooltip: `Tirar foto com a câmera`
- `Enviar Atualização`
- `Evidências e Anexos (2)`
- `Baixar todos`
- `foto-teste-impressao.jpg`
- `1.8 MB · por Gisele · há 20 min`
- `Visualizar`
- `relatorio-checklist.pdf`
- `420 KB · por Gisele · há 35 min`
- `Abrir`
- `Histórico de Auditoria`
- `Carlos criou a tarefa · Hoje às 08:00`
- `Carlos atribuiu para Gisele · Hoje às 08:02`
- `Gisele alterou status para Em Andamento · Hoje às 09:15`
- `Gisele adicionou 2 anexos · Hoje às 11:20`
- Toast de sucesso: `Tarefa concluída e validada com sucesso!`
- Estado do botão: `Concluída!`

### 3.8 Central de notificações

- `Notificações`
- `Atualizações operacionais em tempo real.`
- `Marcar lidas`
- `Todas`
- `Não lidas`
- `Cobranças`
- `Atribuições`
- `Fila Operacional`
- `1 item crítico requer despacho imediato`
- `Ativo`
- `Atraso Crítico`
- `Tarefa “Configurar computador — Mercado X” ultrapassou o prazo limite há 1 hora.`
- `Cobrar Atualização`
- `Ver Tarefa`
- `Atualização Solicitada`
- `Carlos (Gestor) solicitou status urgente na tarefa “Troca de switch de rede — Restaurante União”.`
- `Responder / Atualizar`
- `Nova Tarefa Atribuída`
- `Você foi designada responsável por “Instalação de PDV secundário — Loja Central” por Carlos.`
- `Iniciar Tarefa`
- `Tarefa Concluída`
- `Gisele concluiu com sucesso “Revisão de nobreaks — Mercado X” com 2 evidências anexadas.`
- `2 fotos adicionadas`
- `Examinar`
- `Comentário Adicionado`
- `Carlos comentou: “Verificar também o acesso remoto AnyDesk” na tarefa Mercado X.`
- `Responder comentário`
- `Suporte Designado`
- `Você foi vinculada como apoio técnico em “Migração de Servidor Local — Farmácia Viva”.`
- `Ver roteiro`
- Estado após marcar tudo: `Atualizado`

## 4. Fluxo de telas e navegação

### 4.1 Fluxo principal

```text
HubAgendator login
  -> autenticar sessão
  -> Painel de Atenção (gestor)
       -> Minhas Tarefas (colaborador)
       -> Equipe Operacional
       -> Nova Tarefa
       -> Detalhes Da Tarefa
       -> Notificações
```

### 4.2 Rotas e transições observadas

| Tela | Entrada | Saídas/navegação |
| --- | --- | --- |
| Login | Entrada do sistema | `Entrar na Operação` leva à área autenticada; `Esqueci minha senha` mostra instruções; atalhos preenchem persona |
| Painel de Atenção | Área inicial do gestor após login | Cards métricos filtram tarefas; pills filtram a lista; `Detalhes` abre tarefa; `Cobrar Atualização` dispara feedback; menu abre sheet; `Equipe em Trânsito` oferece `Ver mapa ao vivo`; `Nova Tarefa`; navegação inferior |
| Minhas Tarefas | Navegação `Tarefas` ou atribuição | Busca; tabs `Atrasadas`, `Para Hoje`, `Em Andamento`, `Próximas`, `Concluídas`; `Iniciar Tarefa`; `Concluir`; `Atualizar / Log`; `+ Nova Demanda`; abrir detalhe |
| Equipe Operacional | Navegação `Equipe` | Filtros de equipe; `Ver N tarefas de pessoa`; `Rebalancear`; `Nova Tarefa`; navegação inferior |
| Nova Tarefa | `Nova Tarefa`/`+ Nova Demanda` | Preenche campos; atalhos de prazo; `Criar e Atribuir Tarefa`; toast; `Cancelar`/voltar |
| Detalhes Da Tarefa | Card, `Detalhes`, `Ver Tarefa` ou item de notificação | voltar para `Minhas Tarefas`; concluir; notificar/cobrar; menu de responsável/prazo/reabertura; comentar; anexar arquivo/foto; visualizar/abrir evidência; expandir histórico |
| Notificações | Ícone de sino, `Mais` ou notificação | filtros; `Marcar lidas`; cobrar; ver tarefa; responder/atualizar; iniciar; examinar; responder comentário; ver roteiro |

### 4.3 Navegação inferior

No mobile, a barra fixa contém, nesta ordem:

1. `Início`
2. `Tarefas`
3. `Equipe`
4. `Mais` com badge de pendências

O botão flutuante `Nova Tarefa` permanece acima da barra inferior nas telas operacionais do gestor/colaborador.

### 4.4 Regras de interação

- Filtros horizontais são pills com estado ativo preenchido.
- Cards operacionais usam barra vertical esquerda para comunicar status/criticidade.
- Ações rápidas devem permanecer próximas da tarefa, sem exigir navegação adicional.
- Ações destrutivas/críticas usam o tom de erro.
- Feedback de sucesso aparece como toast/pill temporário.
- Menus de contexto em mobile abrem action sheet inferior ou popover; fechar ao tocar fora.
- Anexos devem permitir arquivo e foto; o nome do arquivo selecionado aparece antes do envio.
- O histórico de auditoria inicia recolhido no detalhe e pode ser expandido.

## 5. Decisões bloqueantes para aprovação

### 5.1 Layout responsivo desktop/tablet — pendente de aprovação

Não existem mockups de desktop ou tablet nos protótipos analisados. O `DESIGN.md` contém apenas a descrição em prosa abaixo; portanto, ela não é considerada uma especificação visual aprovada:

- Desktop (`>1280px`): navegação, board/lista e inspector drawer em três panes.
- Tablet (`768px–1279px`): inspector como flyout ancorado com backdrop; navegação colapsada em ícones.

A adaptação mobile (`<768px`) está representada pelos protótipos e inclui coluna única, sheets em tela cheia, barra de ações sticky inferior e tabs de dia deslizáveis. A navegação inferior dos protótipos usa `h-16`, superfície translúcida com blur e sombra superior; os alvos de toque usam botões de `h-8`, `h-9`, `h-10`, `h-11` e `w-11`.

**Decisão necessária:** aprovar ou revisar a estratégia desktop/tablet antes da implementação dessas variantes.

### 5.2 Fonte única de cores da v1

Os tokens Material da seção 1.1 são a fonte única para `tailwind.config.ts` e
para a implementação visual. Não misturar os hexadecimais semânticos narrativos
de `DESIGN.md` com os tokens Material.

O sistema semântico da v1 fica limitado aos três papéis confirmados na seção
1.2: erro para crítico/atrasado, primary/primary-container para estados ativos
e secondary-fixed com opacity-85 e line-through para concluída.

Antes de iniciar a implementação, é necessária a aprovação deste
`DESIGN_MAPPING.md`, incluindo a decisão pendente de desktop/tablet registrada
na seção 5.1.