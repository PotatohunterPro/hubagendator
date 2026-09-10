# UX.md — Sistema de Gestão Operacional

## 1. Objetivo deste documento

Este documento define a experiência do usuário do sistema de gestão operacional descrito em `plano.md`. Ele deve ser usado como referência pelo agente de IA responsável por implementar ou revisar a interface.

O produto é uma aplicação web mobile-first para que um gestor distribua tarefas, acompanhe a execução da equipe e intervenha rapidamente em atrasos. O sistema deve funcionar muito bem em iPhone e aparelhos Samsung, além de oferecer uma experiência completa em desktop.

O produto não deve ser tratado como um quadro Trello genérico. O quadro de tarefas pode existir como visualização, mas a experiência principal deve responder à pergunta:

> **O que está acontecendo agora e onde o gestor precisa agir?**

## 2. Princípios de experiência

### 2.1 Ação antes de organização

A interface deve priorizar tarefas que precisam de atenção. O usuário não deve precisar navegar por vários quadros para descobrir atrasos.

### 2.2 Uma ação principal por tela

Cada tela deve ter uma ação primária clara. Na tela inicial, a ação primária é criar uma tarefa ou tratar uma pendência. Em uma tarefa aberta pelo colaborador, a ação principal é iniciar ou concluir.

### 2.3 Criação rápida

O gestor deve conseguir criar uma tarefa comum em menos de um minuto. O formulário inicial deve solicitar título, responsável e prazo. Descrição, cliente, equipe, prioridade e anexos devem ser opcionais ou aparecer em uma etapa complementar.

### 2.4 Estado sempre visível

Toda tarefa deve exibir claramente título, responsável, status, prazo e prioridade. Não usar apenas cor para comunicar estado.

### 2.5 Mobile-first real

A interface deve ser desenhada primeiro para telas estreitas. O desktop deve ampliar o conteúdo, sem obrigar o usuário mobile a lidar com tabelas, menus ou modais inadequados.

### 2.6 Feedback imediato

Toda ação deve produzir feedback visual e textual. O usuário precisa saber se a tarefa foi salva, concluída, atribuída ou se ocorreu um erro.

### 2.7 Nenhum beco sem saída

Telas vazias devem explicar o que está acontecendo e oferecer o próximo passo. Depois de uma ação, o sistema deve permitir voltar ao painel, abrir o item criado ou criar outro item.

### 2.8 Histórico confiável

Alterações relevantes devem aparecer em uma linha do tempo. O usuário deve conseguir entender quem criou, alterou, iniciou, comentou, concluiu ou reabriu uma tarefa.

## 3. Usuários e necessidades

| Usuário | Objetivo principal | Experiência prioritária |
|---|---|---|
| Gestor | Entender a operação e cobrar execução | Painel de atenção, criação rápida, filtros e ações de cobrança |
| Líder | Coordenar uma equipe autorizada | Visão da equipe, tarefas atrasadas e redistribuição controlada |
| Colaborador | Saber o que fazer e informar progresso | Minhas tarefas, prazo, instruções, comentário e conclusão |
| Administrador | Configurar a organização | Membros, equipes, permissões e configurações |

## 4. Arquitetura de navegação

### 4.1 Rotas existentes do projeto

A experiência deve respeitar as rotas já previstas no esqueleto:

| Rota | Função | Usuário principal |
|---|---|---|
| `/` | Redirecionamento inicial | Todos |
| `/login` | Entrada no sistema | Todos |
| `/app` | Painel inicial | Gestor, líder e colaborador |
| `/app/tasks` | Todas as tarefas autorizadas | Gestor e líder |
| `/app/tasks/new` | Criação de tarefa | Gestor e líder |
| `/app/tasks/:id` | Detalhe de uma tarefa | Todos conforme permissão |
| `/app/my-tasks` | Tarefas atribuídas ao usuário | Todos |
| `/app/team` | Visão da equipe | Gestor e líder |
| `/app/clients` | Clientes cadastrados | Gestor e líder |
| `/app/clients/:id` | Cliente e tarefas relacionadas | Gestor e líder |
| `/app/notifications` | Notificações | Todos |
| `/app/settings` | Configurações | Administrador e usuário |

### 4.2 Navegação no celular

Usar navegação inferior com quatro entradas principais:

1. **Início** — visão de atenção e resumo.
2. **Tarefas** — lista, busca e filtros.
3. **Equipe** — visão por responsável, quando permitido.
4. **Mais** — clientes, notificações e configurações.

O botão **Nova tarefa** deve ser acessível a partir do Início e de Tarefas. Ele pode ser um botão destacado no cabeçalho ou uma ação flutuante, desde que não cubra conteúdo importante.

### 4.3 Navegação no desktop

Usar `DesktopSidebar` persistente com as mesmas áreas. O item atual deve ficar visualmente destacado. A barra lateral não deve ocultar ações importantes em telas intermediárias.

## 5. Jornada principal do gestor

### 5.1 Início do dia

1. O gestor abre `/app`.
2. O sistema exibe o resumo de tarefas atrasadas, vencendo hoje, em andamento, concluídas hoje e sem prazo.
3. A primeira seção deve ser **Precisa de atenção**.
4. Cada item permite abrir a tarefa, alterar o prazo ou enviar cobrança.
5. O gestor pode tocar em **Nova tarefa** sem procurar a ação em um menu.

### 5.2 Criar tarefa para Gisele

1. O gestor toca em **Nova tarefa**.
2. O sistema abre um bottom sheet no celular ou uma página/painel adequado no desktop.
3. O gestor informa: `Mandar cobrança para o Cliente X`.
4. Seleciona Gisele como responsável.
5. Define o prazo e, se necessário, prioridade alta.
6. Seleciona Cliente X, caso o cliente já exista.
7. Salva.
8. O sistema confirma a criação e mostra opções `Abrir tarefa`, `Criar outra` e `Voltar ao painel`.
9. Gisele recebe uma notificação interna.

### 5.3 Criar tarefa para Wellington

O fluxo deve ser igual ao anterior. O exemplo de validação é:

- título: `Fazer venda porta a porta no Bairro Y`;
- responsável: Wellington;
- prazo: amanhã;
- prioridade: normal;
- descrição opcional: instruções do bairro ou rota.

### 5.4 Cobrar tarefa atrasada

1. O gestor abre a seção **Atrasadas**.
2. Toca na tarefa.
3. Toca em **Cobrar atualização**.
4. Escolhe uma mensagem rápida ou escreve uma mensagem.
5. Confirma o envio.
6. O sistema registra o evento no histórico e cria uma notificação para o responsável.

A cobrança não deve excluir, duplicar ou alterar o status automaticamente.

## 6. Jornada principal do colaborador

### 6.1 Visualizar tarefas

1. O colaborador abre `/app/my-tasks`.
2. A lista é ordenada por urgência operacional:
   - atrasadas;
   - vencendo hoje;
   - em andamento;
   - próximas;
   - sem prazo.
3. Cada cartão exibe título, cliente, prazo, prioridade e status.
4. O colaborador pode filtrar por status e prazo.

### 6.2 Iniciar uma tarefa

Na tela de detalhe, mostrar o botão **Iniciar tarefa** quando o status for `todo`. Ao tocar:

- alterar para `in_progress`;
- registrar evento;
- atualizar a interface sem recarregar toda a página;
- mostrar confirmação curta, por exemplo: `Tarefa iniciada`.

### 6.3 Comentar e anexar evidência

O campo de comentário deve ficar próximo ao histórico. O usuário deve poder escrever uma observação como:

> Cliente pediu retorno às 14h.

O anexo deve ser opcional no MVP e aceitar arquivos dentro dos limites definidos pelo backend. O sistema deve informar nome, tipo e tamanho do arquivo antes do envio.

### 6.4 Concluir uma tarefa

O botão **Marcar como concluída** deve ser grande e fácil de encontrar. Antes de concluir, não exigir descrição ou anexo em todas as tarefas.

Ao concluir:

- mudar o status para `completed`;
- registrar `completedAt` e `completedBy`;
- criar evento na linha do tempo;
- mostrar confirmação;
- permitir voltar para Minhas tarefas;
- atualizar os indicadores do gestor.

O usuário pode adicionar uma observação antes ou depois da conclusão, sem bloquear o fluxo principal.

## 7. Painel inicial `/app`

### 7.1 Hierarquia de conteúdo

A ordem recomendada é:

1. Cabeçalho com saudação, data e notificações.
2. Métricas resumidas.
3. Seção **Precisa de atenção**.
4. Seção **Vencendo hoje**.
5. Seção **Em andamento**.
6. Seção **Concluídas recentemente**.

### 7.2 Métricas

Usar `DashboardMetricCard` para mostrar:

- atrasadas;
- vencendo hoje;
- em andamento;
- concluídas hoje;
- sem prazo.

Cada métrica deve ser clicável e abrir a lista filtrada correspondente. Não apresentar métricas sem drill-down.

### 7.3 Cartão de tarefa

O `TaskCard` deve conter:

- título com no máximo duas linhas no resumo;
- avatar ou iniciais do responsável;
- nome do responsável;
- cliente, quando houver;
- status textual;
- prazo relativo e data objetiva;
- prioridade textual e visual;
- indicação de atraso;
- ação contextual para abrir.

A tarefa atrasada deve ter destaque, mas não depender apenas de uma borda vermelha. Usar texto como `Atrasada há 2 dias`.

## 8. Tela de tarefas `/app/tasks`

### 8.1 Visualização padrão

A visualização padrão deve ser uma lista agrupada, não um kanban obrigatório. Agrupar por:

- atraso;
- hoje;
- próximos dias;
- sem prazo;
- concluídas.

O kanban pode ser incluído posteriormente ou como alternativa no desktop.

### 8.2 Filtros

O componente `TaskFilters` deve oferecer:

- minhas tarefas;
- responsável;
- status;
- prioridade;
- cliente;
- equipe;
- prazo;
- atrasadas;
- sem prazo.

No celular, os filtros devem abrir em bottom sheet e mostrar a quantidade de filtros ativos. Deve existir ação **Limpar filtros**.

### 8.3 Busca

A busca deve localizar título, descrição e nome do cliente, respeitando a organização e as permissões do usuário. Enquanto o usuário digita, mostrar estado de carregamento discreto ou debounce adequado.

## 9. Tela de detalhe `/app/tasks/:id`

### 9.1 Cabeçalho

Exibir:

- título;
- status;
- prioridade;
- responsável;
- prazo;
- cliente;
- menu de ações conforme permissão.

### 9.2 Ação primária por status

| Status | Ação primária |
|---|---|
| `todo` | Iniciar tarefa |
| `in_progress` | Marcar como concluída |
| `completed` | Reabrir tarefa, para gestor/líder |
| `archived` | Restaurar tarefa, para gestor/admin |

### 9.3 Ações secundárias

- editar tarefa;
- alterar responsável;
- alterar prazo;
- alterar prioridade;
- adicionar comentário;
- anexar arquivo;
- cobrar atualização;
- arquivar;
- reabrir.

Ações destrutivas ou com impacto operacional devem pedir confirmação. A confirmação deve explicar o efeito, não apenas mostrar `Tem certeza?`.

### 9.4 Linha do tempo

O `CommentTimeline` deve diferenciar comentários de eventos de sistema. Exemplos de eventos:

- Carlos criou a tarefa;
- Carlos atribuiu a tarefa a Gisele;
- Gisele iniciou a tarefa;
- Gisele adicionou um comentário;
- Gisele concluiu a tarefa;
- Carlos reabriu a tarefa.

Mostrar data e horário respeitando o fuso da organização. Para eventos recentes, usar formato relativo acompanhado de data objetiva quando necessário.

## 10. Tela da equipe `/app/team`

A visão da equipe deve ajudar o gestor a identificar distribuição e risco, sem transformar o produto em ferramenta de vigilância invasiva.

Cada membro pode aparecer com:

- nome;
- quantidade em aberto;
- quantidade atrasada;
- quantidade vencendo hoje;
- quantidade concluída no período;
- indicador de sobrecarga, quando houver regra definida.

Ao tocar em um membro, abrir as tarefas filtradas daquela pessoa. A visão deve respeitar permissões e não expor informações de organizações diferentes.

## 11. Clientes

### 11.1 Lista de clientes

A tela `/app/clients` deve mostrar nome, empresa, telefone e quantidade de tarefas abertas. O botão primário é **Novo cliente**.

Quando não houver clientes, mostrar:

> Ainda não há clientes cadastrados. Cadastre o primeiro cliente para associar contexto às tarefas.

CTA: **Cadastrar primeiro cliente**.

### 11.2 Cliente relacionado à tarefa

Na criação ou edição da tarefa, a escolha do cliente deve permitir buscar e selecionar um registro existente. Se não houver resultado, oferecer `Cadastrar novo cliente` sem perder os dados já preenchidos da tarefa.

## 12. Notificações

As notificações internas devem ser úteis e agrupáveis. Tipos iniciais:

- nova tarefa atribuída;
- tarefa reatribuída;
- comentário novo;
- tarefa concluída;
- tarefa reaberta;
- tarefa vencendo hoje;
- tarefa atrasada;
- cobrança recebida.

Cada notificação deve levar ao contexto correto, normalmente `/app/tasks/:id`. Notificação lida não deve desaparecer sem opção de consulta.

## 13. Estados de interface

### 13.1 Carregamento

Usar skeletons em listas, cartões e métricas. Evitar substituir toda a tela por um spinner quando somente uma ação está sendo processada.

### 13.2 Estado vazio

Todo estado vazio deve conter explicação e próximo passo. Exemplos:

| Contexto | Mensagem | CTA |
|---|---|---|
| Sem tarefas | Você ainda não tem tarefas pendentes. | Criar tarefa |
| Sem tarefas atrasadas | Nenhuma tarefa está atrasada. | Ver todas as tarefas |
| Sem clientes | Cadastre clientes para contextualizar suas atividades. | Novo cliente |
| Sem equipe | Adicione membros para distribuir tarefas. | Adicionar membro |
| Busca sem resultado | Não encontramos tarefas com esses filtros. | Limpar filtros |
| Sem notificações | Você está em dia. | Ir para início |

### 13.3 Erro

Mensagens de erro devem ser específicas e acionáveis. Exemplos:

- `Não foi possível salvar. Verifique sua conexão e tente novamente.`
- `Você não tem permissão para alterar esta tarefa.`
- `O responsável selecionado não pertence à organização.`

Preservar os dados digitados quando for seguro. Não apagar um formulário após falha de rede.

### 13.4 Sucesso

Usar toast ou confirmação inline curta:

- `Tarefa criada para Gisele.`
- `Tarefa concluída.`
- `Responsável atualizado.`
- `Cobrança enviada.`

Não usar sucesso apenas por cor. Sempre incluir texto.

## 14. Sistema visual

### 14.1 Direção

Adotar uma linguagem limpa, profissional e leve, inspirada em clareza de produtos Apple, mas adequada a uma ferramenta operacional. A estética não deve copiar literalmente o iOS.

### 14.2 Tokens

Centralizar cores, espaçamentos, tipografia, raios e elevações em tokens globais. Não usar hexadecimais hardcoded em componentes quando existir token equivalente.

Paleta semântica recomendada:

| Função | Uso |
|---|---|
| Acento | Ação primária e foco |
| Neutro | Texto, superfícies e divisores |
| Sucesso | Tarefa concluída |
| Atenção | Prazo próximo ou atenção moderada |
| Perigo | Atraso crítico, erro ou exclusão |
| Informação | Estado informativo |

Usar vermelho apenas para atraso, erro, cancelamento e ações destrutivas. Campos obrigatórios não devem ser apresentados automaticamente como erro.

### 14.3 Tipografia

Usar escala tipográfica definida pelos tokens. Evitar `text-[10px]` e `text-[11px]` arbitrários. O texto principal de tarefa deve continuar legível em 360px.

Não usar peso 900 se a fonte carregada não oferecer esse peso. Preferir pesos disponíveis e consistentes.

### 14.4 Espaçamento e raios

Usar escala de espaçamento consistente. Cartões podem ter raios moderados, sem transformar toda a interface em grandes cápsulas. Elevações devem ser sutis e definidas por tokens.

### 14.5 Dark mode

Se o projeto oferecer tema escuro, usar tokens específicos para o modo escuro. Não implementar o dark mode com simples inversão de cores. Garantir contraste de texto, badges, campos e estados de foco.

## 15. Componentes existentes do esqueleto

O agente deve reutilizar e evoluir os componentes já planejados:

- `AppShell`;
- `MobileBottomNav`;
- `DesktopSidebar`;
- `TaskCard`;
- `TaskStatusBadge`;
- `PriorityBadge`;
- `TaskList`;
- `TaskFilters`;
- `DashboardMetricCard`;
- `CommentTimeline`;
- `NotificationBell`;
- `EmptyState`;
- `LoadingState`;
- `ErrorState`.

Não criar versões duplicadas desses componentes sem justificar. Componentes devem receber dados por props tipadas e manter a lógica de autorização no backend.

## 16. Acessibilidade

- Garantir foco visível para teclado.
- Usar elementos semânticos e labels associados.
- Não comunicar status apenas por cor.
- Permitir navegação por teclado no desktop.
- Usar `aria-label` em ícones sem texto.
- Garantir contraste adequado.
- Respeitar `prefers-reduced-motion`.
- Manter alvos de toque confortáveis.
- Usar mensagens de erro associadas ao campo correspondente.
- Anunciar mudanças importantes de status para tecnologias assistivas quando adequado.

## 17. Responsividade

Validar no mínimo:

| Classe | Exemplo de teste |
|---|---|
| Celular estreito | 360px de largura |
| iPhone comum | Safari iOS em orientação retrato |
| iPhone grande | Safari iOS em tela grande |
| Android | Chrome em Samsung |
| Tablet | Layout intermediário |
| Desktop | Sidebar e listas amplas |

No celular, evitar tabelas horizontais. No desktop, permitir mais informações por linha, mas preservar a mesma hierarquia.

## 18. PWA e conexão

A aplicação deve se comportar bem quando a conexão oscilar:

- exibir indicador de estado da conexão quando necessário;
- não apresentar dados antigos como se fossem recém-atualizados sem indicação;
- preservar texto de formulário durante falha;
- mostrar `offline.html` quando a aplicação não puder carregar;
- não colocar chamadas `/trpc` em cache estático;
- atualizar o shell da aplicação com segurança.

O MVP não deve prometer sincronização offline completa. Se uma ação não puder ser salva, informar claramente que ela ainda não foi registrada no servidor.

## 19. Regras de conteúdo

Usar português do Brasil em toda a interface. Preferir frases curtas e verbos de ação:

- `Criar tarefa` em vez de `Adicionar novo item operacional`;
- `Marcar como concluída` em vez de `Finalizar operação`;
- `Cobrar atualização` em vez de `Enviar lembrete de acompanhamento`.

Evitar jargões técnicos. Usar `responsável`, não `assignee`, na interface. Usar `prazo`, não `due date`.

## 20. Segurança percebida

A interface deve refletir permissões reais. Não exibir botões que o usuário não pode usar. Quando uma ação estiver indisponível por permissão, explicar de forma simples quando isso for útil.

Não exibir dados de outras organizações. O frontend não deve assumir que esconder uma tarefa significa protegê-la; a validação deve ocorrer no backend.

## 21. Critérios de aceite de UX

A UX será considerada adequada quando:

1. Carlos conseguir criar uma tarefa para Gisele sem sair do painel.
2. Carlos conseguir criar uma tarefa para Wellington em fluxo equivalente.
3. Gisele encontrar a tarefa em Minhas tarefas.
4. Wellington encontrar sua tarefa de venda porta a porta.
5. O colaborador conseguir iniciar e concluir com poucos toques.
6. O gestor identificar atrasos imediatamente na tela inicial.
7. O gestor conseguir enviar uma cobrança a partir da tarefa.
8. A tarefa mostrar responsável, status, prioridade e prazo sem abrir menus.
9. O histórico exibir autor e horário das mudanças.
10. Estados vazios oferecerem próximo passo.
11. Erros preservarem os dados digitados quando possível.
12. A interface funcionar em 360px sem rolagem horizontal indevida.
13. A interface funcionar no Safari do iPhone e no Chrome de Samsung.
14. Ações principais possuírem feedback de sucesso e erro.
15. A interface não depender exclusivamente de cor.

## 22. Cenários de teste de UX

### Cenário A — Gestor cria cobrança

Carlos abre o painel, toca em `Nova tarefa`, digita `Mandar cobrança para o Cliente X`, escolhe Gisele, define prazo e salva. A aplicação confirma a criação, mostra a tarefa e gera notificação para Gisele.

### Cenário B — Colaboradora conclui tarefa

Gisele abre Minhas tarefas, encontra a cobrança, inicia, adiciona a observação `Cliente pediu retorno às 14h` e toca em `Marcar como concluída`. A tarefa muda para concluída e o histórico registra a ação.

### Cenário C — Venda porta a porta

Wellington abre a tarefa de venda, vê as instruções, inicia a atividade, adiciona comentário e conclui pelo celular. O fluxo não depende de drag-and-drop.

### Cenário D — Tarefa atrasada

Uma tarefa aberta com prazo passado aparece em `Precisa de atenção`, mostra texto de atraso e oferece `Cobrar atualização`. O gestor não precisa descobrir o atraso por tentativa e erro.

### Cenário E — Falha de rede

O usuário tenta concluir uma tarefa sem conexão. O sistema não informa sucesso falso. Mostra erro claro, mantém o contexto e permite tentar novamente.

## 23. Checklist para o agente de IA

Antes de considerar uma tela pronta:

- A tela possui uma ação principal clara?
- O fluxo pode ser concluído no celular?
- O estado vazio possui CTA?
- O loading usa skeleton ou feedback adequado?
- O erro é compreensível e acionável?
- O sucesso é confirmado por texto?
- Os status podem ser alterados por ações reais?
- A tarefa mostra responsável, prazo, status e prioridade?
- As permissões estão sendo respeitadas no backend?
- Não há cor hardcoded fora dos tokens?
- Não há textos excessivamente pequenos?
- Não existe rolagem horizontal acidental em 360px?
- O teclado e leitores de tela conseguem alcançar os controles?
- A ação foi validada com os dados de Gisele e Wellington?

## 24. Prioridades de implementação UX

### P0 — Bloqueadores

- Painel com tarefas atrasadas e vencendo hoje.
- Criação rápida de tarefa.
- Seleção de responsável.
- Detalhe da tarefa.
- Iniciar e concluir.
- Histórico.
- Minhas tarefas.
- Estados de loading, vazio, erro e sucesso.
- Layout mobile funcional.

### P1 — Operação diária

- Filtros completos.
- Cobrança interna.
- Clientes.
- Equipe por responsável.
- Notificações.
- Comentários.
- Anexos.
- PWA instalável.

### P2 — Refinamento

- Skeletons mais completos.
- Bottom sheets avançados.
- Busca global.
- Atalhos de teclado no desktop.
- Kanban opcional.
- Resumo diário.
- Preferências de notificação.

## 25. Decisões que não devem ser alteradas sem justificativa

1. PostgreSQL continua sendo o banco de produção.
2. TypeScript continua sendo a linguagem de frontend e backend.
3. A interface continua mobile-first.
4. O painel de atenção continua sendo a visão principal do gestor.
5. O colaborador não precisa usar drag-and-drop para executar tarefas.
6. A conclusão de uma tarefa deve ser simples.
7. O histórico não deve ser apagado quando a tarefa for concluída.
8. O status atrasado deve ser calculado pelo prazo, não salvo como estado independente.
9. A autorização deve ser validada no backend.
10. O MVP não deve incorporar funcionalidades fora do escopo sem validação com usuários reais.

## Referências

[1]: https://developer.apple.com/design/human-interface-guidelines/ "Apple Human Interface Guidelines"
[2]: https://www.w3.org/WAI/standards-guidelines/wcag/ "Web Content Accessibility Guidelines — W3C"
[3]: https://web.dev/learn/pwa/ "Learn Progressive Web Apps"
[4]: https://www.postgresql.org/docs/current/ "PostgreSQL Documentation"
