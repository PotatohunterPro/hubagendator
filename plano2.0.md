# PROMPT MESTRE — SISTEMA INTERNO DE GESTÃO OPERACIONAL

Você deve desenvolver um sistema web **interno, privado e de uso exclusivo da equipe da empresa**.

O objetivo NÃO é criar um novo Trello, CRM, ERP ou SaaS comercial.

O objetivo é criar uma ferramenta simples para:

* o gestor criar e distribuir tarefas;
* cada colaborador saber exatamente o que precisa fazer;
* acompanhar prazos;
* identificar atrasos;
* cobrar atualizações;
* registrar execução;
* anexar evidências;
* manter histórico das atividades;
* permitir ao gestor enxergar rapidamente onde existem problemas na operação.

O sistema deve priorizar **execução operacional**, e não quantidade de funcionalidades.

---

# 1. PRINCÍPIO CENTRAL DO PRODUTO

A pergunta principal do sistema deve ser:

> **"O que precisa da minha atenção agora?"**

Para o gestor.

E:

> **"O que eu preciso fazer agora?"**

Para o colaborador.

Não construir um sistema baseado apenas em listas de cards.

O Kanban será uma visualização adicional.

A experiência principal será:

### Gestor

```text
PAINEL DE ATENÇÃO
        ↓
O que está atrasado?
O que vence hoje?
Quem está com pendências?
O que está sem atualização?
O que foi concluído?
        ↓
AÇÃO
        ↓
Cobrar / alterar prazo / alterar responsável / abrir tarefa
```

### Colaborador

```text
MINHAS TAREFAS
        ↓
O que está atrasado?
O que preciso fazer hoje?
O que está em andamento?
O que vem depois?
        ↓
EXECUTAR
        ↓
Atualizar / comentar / anexar evidência / concluir
```

---

# 2. USO INTERNO

Este sistema será utilizado somente pela equipe interna.

Não criar funcionalidades de:

* cadastro público;
* marketplace;
* usuários externos;
* clientes acessando o sistema;
* portal do cliente;
* planos;
* cobrança;
* assinatura;
* multi-tenant comercial;
* página pública;
* onboarding comercial;
* recuperação de leads;
* CRM completo.

O cadastro de clientes existe apenas para **vincular tarefas internas a clientes**.

Exemplo:

```text
Cliente: Cliente X

Tarefa:
Mandar cobrança para Cliente X

Responsável:
Gisele
```

O cliente não terá acesso ao sistema.

---

# 3. PRINCÍPIO DE SIMPLICIDADE

A criação de uma tarefa comum deve levar menos de um minuto.

O gestor deve conseguir criar:

```text
Nova tarefa

O que precisa ser feito?
[ Mandar cobrança para Cliente X ]

Responsável
[ Gisele ]

Prazo
[ Hoje 15:00 ]

Prioridade
[ Alta ]

[ Criar tarefa ]
```

Campos adicionais devem aparecer somente quando necessário.

Não transformar a criação de tarefas em formulário burocrático.

---

# 4. TECNOLOGIA

Preservar as decisões técnicas existentes no projeto.

Stack:

* TypeScript;
* React 19;
* Vite;
* Tailwind CSS;
* shadcn/ui;
* Node.js;
* Express;
* tRPC;
* PostgreSQL;
* Drizzle ORM;
* Drizzle Kit;
* Zod;
* Vitest;
* Lucide React;
* PWA.

Não trocar a stack sem justificativa técnica.

Antes de implementar, inspecionar o repositório existente e preservar as convenções já utilizadas.

---

# 5. EXPERIÊNCIA PRINCIPAL

O sistema terá três formas principais de visualizar as tarefas.

## 5.1 Painel de Atenção

Principal tela do gestor.

Exemplo:

```text
Olá, Carlos

┌──────────────┐
│ 🔴 3         │
│ Atrasadas    │
└──────────────┘

┌──────────────┐
│ 🟠 5         │
│ Hoje         │
└──────────────┘

┌──────────────┐
│ 🔵 8         │
│ Em andamento │
└──────────────┘

┌──────────────┐
│ 🟢 12        │
│ Concluídas   │
└──────────────┘
```

Depois:

### ATRASADAS

Mostrar primeiro as tarefas com maior atraso.

### VENCENDO HOJE

Ordenar pelo horário.

### SEM ATUALIZAÇÃO

Mostrar tarefas em andamento que não tiveram atividade recente.

### CONCLUÍDAS RECENTEMENTE

Mostrar o que a equipe acabou de entregar.

---

# 6. ALERTAS OPERACIONAIS

Não criar status separado para "atrasada".

Uma tarefa continua tendo status:

```text
A fazer
Em andamento
Concluída
Arquivada
```

Atraso é uma condição calculada.

Uma tarefa está atrasada quando:

```text
status != completed
AND
status != archived
AND
dueAt existe
AND
dueAt < horário atual
```

Visualmente:

```text
🔴 ATRASADA
🟠 VENCE HOJE
🔵 EM ANDAMENTO
⚪ SEM PRAZO
🟢 CONCLUÍDA
```

---

# 7. MINHAS TAREFAS

Para o colaborador, a principal tela deve ser:

```text
Minhas tarefas

[Atrasadas]
[Hoje]
[Em andamento]
[Próximas]
[Concluídas]
```

Cada tarefa deve mostrar imediatamente:

```text
Mandar cobrança para Cliente X

Cliente X
Hoje às 15:00

🔴 Alta
🔵 Em andamento
```

O colaborador não deve precisar abrir a tarefa para descobrir o básico.

---

# 8. QUADRO KANBAN

Criar uma visão:

```text
A FAZER
EM ANDAMENTO
CONCLUÍDAS
```

Cards podem ser arrastados no desktop.

Ao mover:

1. alterar status;
2. validar permissão;
3. registrar evento;
4. atualizar interface;
5. atualizar painel;
6. gerar notificação quando necessário;
7. mostrar feedback visual.

Não depender de drag-and-drop no celular.

No celular, utilizar lista e ações rápidas.

---

# 9. CARD DA TAREFA

O card deve ser simples.

Mostrar:

```text
Mandar cobrança para Cliente X

Gisele
Cliente X

Hoje às 15:00

[Alta] [Em andamento]
```

Não colocar excesso de informações no card.

No desktop, permitir ações rápidas:

* abrir;
* alterar responsável;
* alterar prazo;
* alterar prioridade;
* iniciar;
* concluir;
* cobrar atualização.

No celular, tocar no card abre o detalhe.

---

# 10. DETALHE DA TAREFA

Ao abrir:

```text
Mandar cobrança para Cliente X

Responsável
Gisele

Cliente
Cliente X

Prazo
Hoje às 15:00

Prioridade
Alta

Status
Em andamento
```

Ações:

```text
[Concluir]

[Alterar prazo]

[Alterar responsável]

[Cobrar atualização]
```

Depois:

### Observações

```text
Gisele
Cliente pediu retorno às 14h.
```

### Anexos

Permitir comprovantes, imagens e documentos básicos.

### Histórico

Exemplo:

```text
09:42
Carlos criou a tarefa.

09:43
Carlos atribuiu para Gisele.

10:15
Gisele iniciou a tarefa.

13:28
Gisele adicionou uma observação.

14:02
Carlos solicitou atualização.

14:17
Gisele concluiu a tarefa.
```

---

# 11. COBRAR ATUALIZAÇÃO

Esta é uma funcionalidade importante do sistema.

O gestor deve conseguir clicar:

```text
[Cobrar atualização]
```

O sistema registra:

```text
Carlos solicitou atualização da tarefa.
```

E cria uma notificação para o responsável:

```text
🔔 Carlos solicitou uma atualização

Tarefa:
Mandar cobrança para Cliente X

[Atualizar tarefa]
```

Registrar isso no histórico.

Não implementar inicialmente integração com WhatsApp.

A cobrança será interna ao sistema.

---

# 12. ORIGEM DA TAREFA

Adicionar ao modelo de tarefa um campo simples:

```text
Origem
```

Valores iniciais:

```text
Gestor
Rotina
Cliente
Comercial
Interna
```

Objetivo futuro:

Permitir entender de onde vem o trabalho da equipe.

Não transformar isso em relatório complexo no MVP.

---

# 13. TAREFAS RECORRENTES

Não é obrigatório implementar completamente no MVP.

Porém, a arquitetura deve ser pensada sem impedir essa evolução.

Exemplos futuros:

```text
Todos os dias
→ Abrir caixa

Toda segunda
→ Conferir estoque

Todo mês
→ Enviar relatório
```

Não construir um mecanismo complexo de recorrência agora.

Apenas evitar decisões de banco que impeçam essa funcionalidade posteriormente.

---

# 14. EQUIPE

A tela de equipe deve ser simples.

Exemplo:

```text
EQUIPE

Carlos
Gestor

Gisele
6 tarefas
🔴 2 atrasadas
🟠 1 hoje
🔵 3 andamento

Wellington
11 tarefas
🔴 1 atrasada
🟠 4 hoje
🔵 6 andamento
```

O objetivo é permitir ao gestor identificar rapidamente:

* quem está sobrecarregado;
* quem possui atrasos;
* quem precisa de atenção.

Não criar um sistema complexo de avaliação de funcionários.

---

# 15. MÉTRICAS

Adicionar somente indicadores operacionais úteis.

Exemplo:

```text
CONCLUSÃO

82%

41 concluídas
50 tarefas
```

Não transformar o sistema em BI.

Evitar dashboards cheios de gráficos.

A pergunta é:

> A equipe está executando?

---

# 16. CLIENTES

Clientes são somente contexto das tarefas.

Cadastro mínimo:

```text
Nome
Empresa
Telefone
E-mail
Observações
```

Permitir:

```text
Cliente X
    ↓
Tarefas relacionadas
```

Não criar CRM completo.

---

# 17. USUÁRIOS

Perfis:

```text
Administrador
Gestor
Líder
Colaborador
```

## Administrador

Pode:

* configurar organização;
* gerenciar usuários;
* gerenciar equipes;
* acessar todas as tarefas.

## Gestor

Pode:

* visualizar tarefas;
* criar tarefas;
* atribuir tarefas;
* alterar responsáveis;
* alterar prazos;
* alterar prioridades;
* alterar status;
* reabrir tarefas;
* cobrar atualizações.

## Líder

Pode gerenciar tarefas das equipes autorizadas.

## Colaborador

Pode:

* visualizar tarefas próprias;
* iniciar tarefas;
* atualizar tarefas;
* comentar;
* anexar evidências;
* concluir suas tarefas.

A autorização deve existir no backend.

Nunca confiar somente no frontend.

---

# 18. HISTÓRICO / AUDITORIA

Toda alteração relevante deve gerar evento.

Registrar:

* criação;
* alteração de responsável;
* alteração de prazo;
* alteração de prioridade;
* alteração de status;
* comentário;
* conclusão;
* reabertura;
* arquivamento;
* cobrança de atualização;
* anexos.

Cada evento deve possuir:

```text
usuário
data/hora
tipo
valor anterior
novo valor
metadados quando necessário
```

---

# 19. REABERTURA

Quando uma tarefa concluída for reaberta:

O gestor ou líder deverá informar:

```text
Motivo da reabertura
[ __________________ ]
```

Registrar:

```text
Carlos reabriu a tarefa.

Motivo:
Cliente solicitou nova ação.
```

Notificar o responsável.

---

# 20. CONCLUSÃO

Ao concluir:

* preencher completedAt;
* preencher completedBy;
* registrar evento;
* gerar notificação;
* preservar comentários;
* preservar anexos.

Evitar pedir informações desnecessárias antes de concluir.

Concluir tarefa deve ser extremamente rápido.

---

# 21. NOTIFICAÇÕES

MVP:

Somente notificações internas.

Criar notificações para:

* tarefa atribuída;
* tarefa reatribuída;
* comentário;
* tarefa concluída;
* tarefa reaberta;
* tarefa vencendo hoje;
* tarefa atrasada;
* cobrança de atualização.

Agrupar notificações semelhantes para não gerar excesso.

Não implementar inicialmente:

* WhatsApp;
* e-mail;
* push externo.

Essas integrações podem vir posteriormente.

---

# 22. MOBILE-FIRST

O sistema será utilizado principalmente em:

* iPhone;
* celulares Samsung/Android.

Projetar primeiro para aproximadamente:

```text
360px
```

Requisitos:

* botões grandes;
* alvos de toque confortáveis;
* fonte legível;
* contraste adequado;
* foco visível;
* ações rápidas;
* bottom sheet para operações;
* poucos modais;
* formulários curtos;
* nenhuma dependência de drag-and-drop.

No celular:

```text
┌──────────────────────────────┐
│ Minhas tarefas               │
│                              │
│ [Atrasadas] [Hoje]           │
│                              │
│ ┌──────────────────────────┐ │
│ │ Mandar cobrança          │ │
│ │ Gisele                   │ │
│ │ 🔴 Alta                  │ │
│ │ Hoje 15:00               │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ Venda porta a porta      │ │
│ │ Wellington               │ │
│ │ Amanhã                   │ │
│ └──────────────────────────┘ │
│                              │
├──────────────────────────────┤
│ Início | Tarefas | Equipe | +│
└──────────────────────────────┘
```

---

# 23. DESKTOP

No desktop:

Sidebar:

```text
Início
Minhas tarefas
Todas as tarefas
Quadro
Equipe
Clientes
Notificações
Configurações
```

O Kanban deve aproveitar a largura da tela.

---

# 24. PWA

Implementar:

* manifest;
* ícones;
* modo standalone;
* service worker;
* cache controlado;
* instalação no celular;
* fallback quando estiver sem conexão.

Não fingir que existe funcionamento offline completo.

Se não houver conexão:

```text
Sem conexão

Suas informações não foram enviadas ainda.

Tente novamente quando a conexão voltar.
```

Preservar formulários localmente quando for seguro.

---

# 25. BANCO DE DADOS

Usar PostgreSQL.

Entidades principais:

```text
organizations
users
organizationMembers
teams
teamMembers
clients
tasks
taskComments
taskAttachments
taskEvents
notifications
```

Tabela tasks deve possuir pelo menos:

```text
id
organizationId
title
description
status
priority
origin
assigneeId
creatorId
teamId
clientId
dueAt
completedAt
completedBy
archivedAt
createdAt
updatedAt
```

Criar índices adequados para:

* organização + status + prazo;
* organização + responsável;
* organização + cliente;
* notificações por usuário;
* eventos por tarefa;
* membros por organização.

---

# 26. API

Organizar tRPC por domínio.

Principais áreas:

```text
auth
organization
teams
clients
tasks
notifications
```

Tasks:

```text
tasks.list
tasks.getById
tasks.create
tasks.update
tasks.assign
tasks.setStatus
tasks.setDueDate
tasks.archive
tasks.reopen
tasks.addComment
tasks.updateComment
tasks.deleteComment
tasks.getEvents
tasks.getSummary
tasks.sendReminder
```

Toda entrada deve ser validada com Zod.

---

# 27. SEGURANÇA

O backend deve validar:

* autenticação;
* organização atual;
* existência dos registros;
* autorização;
* pertencimento à organização;
* pertencimento à equipe;
* permissões;
* limites dos campos.

Nunca confiar em:

```text
organizationId
userId
role
assigneeId
```

enviados diretamente pelo cliente.

Validar tudo no backend.

---

# 28. COMPONENTES

Criar componentes reutilizáveis:

```text
AppShell
MobileBottomNav
DesktopSidebar
PageHeader
QuickCreateTask
TaskCard
TaskStatusBadge
PriorityBadge
AssigneeAvatar
TaskFilters
TaskList
TaskDetailSheet
DashboardMetricCard
AttentionSection
CommentTimeline
NotificationBell
TeamMemberCard
EmptyState
LoadingState
ErrorState
```

Não duplicar componentes.

---

# 29. NAVEGAÇÃO

Mobile:

```text
Início
Tarefas
Equipe
Mais
```

Desktop:

```text
Início
Minhas tarefas
Todas as tarefas
Quadro
Equipe
Clientes
Notificações
Configurações
```

Botão:

```text
+ Nova tarefa
```

deve estar sempre facilmente acessível.

---

# 30. ROTAS

```text
/
 /login

/app
/app/tasks
/app/tasks/new
/app/tasks/:id
/app/my-tasks
/app/team
/app/clients
/app/clients/:id
/app/notifications
/app/settings
```

---

# 31. FORA DO MVP

Não implementar agora:

* chat completo;
* WhatsApp;
* GPS;
* rotas;
* financeiro;
* NF-e;
* CRM completo;
* metas;
* comissão;
* automações complexas;
* aplicativo nativo;
* sincronização offline completa;
* IA;
* cobrança;
* planos;
* assinatura;
* portal do cliente.

Não adicionar funcionalidades somente porque são tecnicamente interessantes.

---

# 32. IA

Não implementar IA no MVP.

A arquitetura deve, porém, permitir posteriormente uma camada de inteligência operacional.

Futuro exemplo:

```text
Bom dia, Carlos.

Hoje existem 3 pontos que merecem atenção:

🔴 Gisele possui 2 tarefas atrasadas.

🟠 Wellington possui 4 tarefas vencendo hoje.

⚠️ "Confirmar visita Cliente Z"
está sem atualização há 2 dias.
```

Isso será uma fase futura.

---

# 33. FLUXO PRINCIPAL OBRIGATÓRIO

O sistema só deve ser considerado bem implementado quando este fluxo funcionar perfeitamente:

```text
Carlos entra no sistema
        ↓
Cria tarefa
"Mandar cobrança para Cliente X"
        ↓
Seleciona Gisele
        ↓
Define prazo
        ↓
Gisele recebe notificação
        ↓
Gisele abre Minhas tarefas
        ↓
Gisele inicia
        ↓
Adiciona observação
"Cliente pediu retorno às 14h"
        ↓
Carlos visualiza a tarefa
        ↓
Carlos pode solicitar atualização
        ↓
Gisele atualiza
        ↓
Gisele conclui
        ↓
Carlos vê como concluída
        ↓
Histórico registra tudo
```

Esse é o fluxo mais importante do produto.

---

# 34. SEGUNDO FLUXO

```text
Carlos cria:

"Fazer venda porta a porta
no Bairro Y"

Responsável:
Wellington

Prazo:
Amanhã

Prioridade:
Normal
```

Wellington:

```text
abre tarefa
↓
inicia
↓
executa
↓
adiciona observação/evidência
↓
conclui
```

Carlos acompanha pelo painel.

---

# 35. TERCEIRO FLUXO — ATRASO

Criar tarefa:

```text
Confirmar visita com Cliente Z
```

Prazo:

```text
Ontem
```

Se continuar aberta:

```text
🔴 ATRASADA
```

O painel deve mostrar:

```text
ATENÇÃO

Confirmar visita com Cliente Z

Wellington

Atrasada há 1 dia

[ Abrir ]
[ Cobrar ]
```

O gestor não precisa alterar manualmente o status para "atrasada".

---

# 36. DESIGN

O design deve ser:

* profissional;
* limpo;
* moderno;
* rápido;
* discreto;
* orientado a informação;
* com excelente hierarquia visual.

Não exagerar em:

* gradientes;
* animações;
* sombras;
* glassmorphism;
* efeitos decorativos;
* gráficos.

A prioridade é:

```text
CLAREZA
↓
VELOCIDADE
↓
AÇÃO
↓
ESTÉTICA
```

O sistema deve parecer uma ferramenta profissional de trabalho, não um aplicativo cheio de efeitos.

---

# 37. PRINCÍPIO DE UX

Sempre perguntar:

> Isso ajuda o usuário a executar uma tarefa?

Se não:

Não adicionar.

Outra pergunta:

> Isso ajuda o gestor a identificar um problema?

Se não:

Provavelmente não precisa estar no painel inicial.

---

# 38. ORDEM DE DESENVOLVIMENTO

## Etapa 1 — Inspeção

Antes de alterar código:

1. ler README;
2. listar estrutura;
3. identificar autenticação;
4. identificar banco;
5. identificar rotas;
6. identificar componentes;
7. verificar PostgreSQL;
8. verificar variáveis de ambiente;
9. verificar padrão atual do projeto.

Não destruir infraestrutura existente.

---

## Etapa 2 — Banco

Implementar:

* organizations;
* users;
* members;
* teams;
* clients;
* tasks;
* comments;
* attachments;
* events;
* notifications.

Criar migrations.

Executar no PostgreSQL.

Criar seed somente para desenvolvimento.

---

## Etapa 3 — Backend

Implementar:

* criação;
* consulta;
* atualização;
* atribuição;
* status;
* prazo;
* prioridade;
* comentários;
* histórico;
* notificações;
* resumo.

Criar testes de autorização.

---

## Etapa 4 — Colaborador

Implementar:

```text
Minhas tarefas
↓
Detalhe
↓
Iniciar
↓
Comentar
↓
Anexar
↓
Concluir
```

---

## Etapa 5 — Gestor

Implementar:

```text
Painel de atenção
↓
Nova tarefa
↓
Filtros
↓
Equipe
↓
Cobrança
↓
Clientes
```

---

## Etapa 6 — Kanban

Implementar:

```text
A fazer
Em andamento
Concluídas
```

Drag-and-drop somente no desktop.

---

## Etapa 7 — PWA

Implementar:

* manifest;
* service worker;
* instalação;
* cache;
* fallback;
* testes em iPhone;
* testes em Android.

---

# 39. TESTES

Testar obrigatoriamente:

### Backend

* criação;
* título vazio;
* ausência de responsável;
* usuário fora da organização;
* acesso indevido;
* alteração de responsável;
* conclusão;
* arquivamento;
* reabertura;
* cálculo de atraso;
* histórico;
* notificações;
* cobrança;
* idempotência da conclusão.

### Frontend

* criação pelo celular;
* filtro atrasado;
* conclusão;
* erro de rede;
* loading;
* empty state;
* navegação;
* contraste;
* largura 360px.

---

# 40. DEFINITION OF DONE

Uma funcionalidade só está pronta quando:

* backend implementado;
* autorização implementada;
* validação implementada;
* interface funcionando;
* mobile funcionando;
* loading funcionando;
* erro funcionando;
* empty state funcionando;
* histórico funcionando quando aplicável;
* testes funcionando;
* lint funcionando;
* typecheck funcionando;
* build funcionando.

---

# 41. REGRA PARA O AGENTE

Você deve agir como engenheiro de software sênior.

Não sair codificando imediatamente.

Primeiro:

1. inspecione o projeto;
2. identifique o que já existe;
3. identifique conflitos;
4. preserve o que funciona;
5. apresente diagnóstico;
6. só então implemente.

Trabalhe em pequenos incrementos.

Depois de cada incremento:

```text
- executar testes;
- executar typecheck;
- verificar build quando aplicável;
- corrigir erros;
- verificar regressões.
```

Não criar arquivos ou componentes duplicados.

Não criar APIs paralelas.

Não usar `fetch` ou Axios se o projeto utilizar tRPC.

Não manipular autenticação diretamente sem respeitar o mecanismo já existente.

Não alterar infraestrutura sem necessidade.

---

# 42. RELATÓRIO DE CADA ETAPA

Ao finalizar cada fase, informe:

```text
FASE:
[Nome]

ARQUIVOS CRIADOS:
[...]

ARQUIVOS ALTERADOS:
[...]

BANCO:
[...]

MIGRAÇÕES:
[...]

FUNCIONALIDADES:
[...]

TESTES:
[...]

TYPECHECK:
[...]

BUILD:
[...]

PROBLEMAS:
[...]

PRÓXIMO PASSO:
[...]
```

---

# 43. PRIMEIRA AÇÃO

**Não construa ainda as telas.**

Comece pela:

> **ETAPA 1 — INSPEÇÃO DO PROJETO**

Leia o repositório e apresente um diagnóstico curto contendo:

1. stack atual;
2. estrutura;
3. autenticação;
4. banco;
5. rotas;
6. componentes existentes;
7. infraestrutura;
8. possíveis conflitos com este plano;
9. o que precisa ser criado;
10. recomendação para iniciar a implementação.

Depois disso, aguarde a decisão quando houver alguma alteração que envolva:

* segurança;
* banco;
* permissões;
* arquitetura;
* infraestrutura;
* comportamento principal.

Para decisões pequenas e reversíveis, escolha a solução mais simples e continue.

**Objetivo final: construir uma ferramenta interna extremamente simples para controlar a execução da equipe, não um sistema gigantesco.**
