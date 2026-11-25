# Alinhamento do app com o artigo

Base: *ASTRA – Ambiente de Suporte à Trajetória e Rotina Acadêmica* (arquivo `Artigo - ASTRA.pdf`).

## O que o artigo promete e como o app responde

| Promessa do artigo | Onde está no app | Situação |
| --- | --- | --- |
| Centralizar informações de disciplinas, prazos, avaliações e comunicados em um só lugar | Abas **Início**, **Agenda** e **Avisos** | Feito |
| Reunir fontes dispersas: SIGAA, Classroom, WhatsApp, Telegram, Discord | Aba **Fontes** | SIGAA direto no celular (ou pela ponte no navegador); WhatsApp, Telegram, Classroom, Discord e e-mail por mensagens coladas |
| Converter mensagens soltas em prazos, comunicados e materiais | `src/lib/parse.ts` classifica cada mensagem e extrai data e hora | Feito (regras) |
| Reduzir ruído e repetição entre canais | `agruparRepetidos` em `src/lib/ml.ts`: mensagens parecidas viram um aviso só ("Também enviado em…") | Feito |
| **PP1:** agrupar mensagens por assunto sem rótulo prévio (peso de relevância TF-IDF + K-Means) | Aba **Assuntos**; `src/lib/ml.ts` | Feito, roda no aparelho |
| Escolher k pelo Coeficiente de Silhueta | `agruparAvisos` testa k de 2 a 6 (o artigo avalia k de 2 a 8 na base de hábitos, em outra etapa) e fica com a maior silhueta; o valor aparece na tela | Feito |
| Aprendizado ativo, com o estudante corrigindo os grupos (*human-in-the-loop*) | Botão "Assunto errado?" em cada mensagem; a correção é guardada e reaplicada | Feito: a correção move a mensagem e puxa as muito parecidas junto; o modelo em si não é retreinado |
| **PP2:** usar dados acadêmicos para apontar necessidades de aprendizagem | Tela **Desempenho**: IRA/MC, histórico, pontos de atenção, média de sono/estudo/estresse | Parcial |
| Registro da rotina (sono, estudo, estresse) que alimenta os modelos | Tela **Diário** | Feito |
| Autorregulação: planejar, monitorar e controlar atividades | Agenda com conclusão de tarefas, tarefas manuais e diário | Feito |

## O que ainda falta

1. **Modelos preditivos de desempenho (Seção 2.2.3).** A previsão de GPA roda em `server/predictor` (Python) e é chamada pela tela Desempenho por `src/lib/predicao.ts`. Ela depende da ponte estar no ar; sem ela, a tela mostra o motivo e o app segue com as regras simples.
2. **Retreino com o feedback.** As correções do estudante reorganizam os grupos no aparelho, mas não são enviadas para treinar um modelo central.
3. **Classroom, WhatsApp, Telegram e Discord automáticos.** Essas plataformas não oferecem acesso simples para um app de terceiros. Por isso a entrada é manual (colar mensagens ou a exportação de conversa do WhatsApp).
4. **SIGAA real validado ponta a ponta.** A leitura direta no celular e a ponte foram testadas só contra um SIGAA falso e em modo demonstração. O login real depende de usuário e senha e ainda não foi exercitado.
5. **Lembretes em aparelho real.** A lógica está testada e o app compila para Android e iOS, mas as notificações ainda não foram vistas em um celular.
6. **Persistência dos dados de rotina na nuvem.** Avisos, diário e correções ficam salvos só no aparelho. O Firestore guarda apenas o perfil.

## Pontos para alinhar no texto do artigo

- A Seção 6 do artigo deve dizer **React Native com Expo** (o app não é Flutter).
- O artigo cita Telegram e e-mail como fontes. Os dois entram no app por mensagens coladas.
- O artigo só descreve as seções 1 a 3 e a 2.2. As seções de método, análise exploratória e resultados vêm do repositório de análise (pisi3) e precisam estar preenchidas no texto final.

## Decisões de arquitetura

- **SIGAA dentro do app.** A `sigaa-api-UFRPE` foi feita para Node. No celular, a camada HTTP dela é trocada por uma versão com `expo/fetch` (`vendor/sigaa-api/dist/session/sigaa-http.native.js`), que trata redirecionamentos à mão e mantém o cookie jar da própria biblioteca. O restante da biblioteca roda sem mudanças. A senha vai direto do celular ao SIGAA.
- **Ponte (`server/`).** No navegador o SIGAA bloqueia chamadas diretas (CORS). Um pequeno servidor faz o login e devolve JSON ao app. A senha é usada só durante a requisição e não é gravada.
- **IA no aparelho.** TF-IDF, K-Means e Silhueta foram escritos em TypeScript (`src/lib/ml.ts`). As mensagens dos estudantes não saem do celular.

## Qualidade

- `npm test`: 105 testes automáticos da lógica (datas, mensagens, prazos, agrupamento, correções, desempenho, lembretes, resumo diário, atualização automática, exportação e contraste de cores WCAG AA).
- `cd server && npm test`: 4 testes da camada HTTP do celular contra um SIGAA falso (redirecionamento manual, cookies, ISO-8859-1, login certo e errado).
- `npx expo export` para Android, iOS e web: os três pacotes compilam.
- `npx tsc --noEmit` e `npx eslint src`: sem erros nem avisos (conferido em 15/11/2026).
- Fluxos testados no navegador em modo demonstração: login e cadastro (validações), agenda (criar, concluir, filtrar), avisos, assuntos (corrigir grupo), fontes (importar mensagens), diário e desempenho.
- **Não testado:** login real no SIGAA, login com Google e gravação do perfil no Firebase (exigem contas reais), e execução em celular físico (SIGAA direto, `expo/fetch` com redirecionamento manual e notificações).

## Melhorias feitas depois (lista de sugestões)

| Sugestão | Situação |
| --- | --- |
| Atualização automática do SIGAA | Feita, opt-in, senha no cofre seguro do celular, a cada 6 h. Só nativo. |
| Importar mensagens do WhatsApp por compartilhamento | **Não feita.** Receber conteúdo compartilhado exige código nativo e um build próprio, e não dá para testar aqui. Entrou o botão "Colar da área de transferência". |
| Hospedar a ponte com HTTPS | **Preparada, não publicada.** `Dockerfile.ponte` e `render.yaml` prontos; publicar exige uma conta sua. Os passos do Dockerfile foram simulados localmente, mas o Docker em si não rodou. |
| Retreinar com as correções | **Parcial.** Há exportação local das correções (o estudante escolhe se compartilha). Enviar para um servidor exige backend e consentimento, e não foi feito. |
| Widget ou resumo diário | **Resumo diário feito** (notificação às 7h30). Widget de tela inicial exige código nativo e não foi feito. |
| Acessibilidade e idiomas | **Acessibilidade feita:** contraste AA testado nos dois temas (corrigi o cinza claro), alvos de toque de 44 px, nomes para leitores de tela. **Inglês não feito:** o público e o artigo são em português. |
| Testes ponta a ponta | **Fluxos Maestro escritos** (`.maestro/`), **não executados**: exigem o app instalado em um aparelho. |
