# Manual Operacional

## Sistema de Gestão Comercial Uniseter

Este manual foi organizado para apoiar o uso do sistema no dia a dia, com foco no processo completo de ponta a ponta:

1. Abertura da solicitação
2. Triagem da solicitação
3. Elaboração da proposta
4. Geração do número da proposta
5. Finalização da proposta
6. Envio ao vendedor
7. Negociação comercial
8. Proposta ganha
9. Elaboração de contrato
10. Negociação de cláusulas
11. Contrato assinado

## Como usar este manual

- Cada módulo foi separado em uma seção própria.
- Em cada seção há:
  - objetivo do módulo
  - quem normalmente usa
  - passo a passo operacional
  - glossário dos campos
  - observações importantes
- Existem também espaços reservados para prints de tela.

## Padrão para os prints de tela

Sugestão para montar a versão final ilustrada:

- Print 1: visão geral da tela
- Print 2: destaque dos campos obrigatórios
- Print 3: botão de ação principal
- Print 4: exemplo de status após salvar

Use a anotação abaixo como marcador enquanto os prints são inseridos:

`[INSERIR PRINT DA TELA AQUI]`

---

## 1. Visão Geral do Processo

O sistema foi desenhado para controlar o ciclo comercial desde a solicitação inicial até a assinatura do contrato.

### Fluxo resumido

1. O vendedor abre a solicitação.
2. A solicitação entra em `Em triagem`.
3. A equipe interna analisa e pode:
   - seguir para `Em Elaboração da Proposta`
   - devolver para `Aguardando informações`
4. Durante a elaboração, é gerado o número da proposta.
5. A proposta é finalizada.
6. A proposta é enviada ao vendedor em `Recebimento de Proposta`.
7. O vendedor evolui a negociação.
8. Se aprovada, vai para `Proposta Ganha`.
9. Depois segue para `Elaboração de contrato`.
10. Pode passar por `Negociação de cláusulas`.
11. Finaliza em `Contrato assinado`.

### Perfis principais

- `Vendedor`: abre solicitações e conduz negociações dos próprios negócios.
- `Comercial interno`: faz triagem e movimenta a proposta nas etapas internas.
- `Propostas`: atua nas etapas internas de proposta.
- `Jurídico`: atua no módulo contratual.
- `Administrador`: possui visão completa e acesso às configurações.

---

## 2. Glossário Geral

### Termos do processo

| Termo | Significado |
|---|---|
| Solicitação | Pedido inicial aberto pelo vendedor para iniciar o processo comercial |
| Triagem | Etapa de análise interna da solicitação |
| Elaboração da proposta | Etapa em que a proposta é montada internamente |
| Número da proposta | Número oficial gerado no próprio sistema para vincular a proposta |
| Proposta finalizada | Etapa em que a proposta já está pronta para envio |
| Recebimento de Proposta | Momento em que a proposta já foi enviada ao vendedor |
| Negociação | Etapa comercial com tratativas junto ao cliente |
| Proposta Ganha | Etapa em que o cliente aceitou a proposta |
| Elaboração de contrato | Preparação da documentação contratual |
| Negociação de cláusulas | Ajustes contratuais antes da assinatura |
| Contrato assinado | Etapa final do fluxo |

### Regras importantes

- O número da proposta deve ser gerado depois da elaboração e antes da finalização.
- O vendedor deve visualizar apenas os próprios negócios.
- O dashboard e o funil de vendas seguem a mesma lógica de visibilidade por vendedor.
- O diário de negociação registra a evolução comercial com data.

---

## 3. Módulo de Solicitações

### Objetivo

Permitir que o vendedor abra uma nova solicitação comercial com dados do cliente, escopo do serviço, postos, equipamentos e observações.

### Quem usa

- Vendedor
- Administrador

### Quando usar

Sempre que um novo negócio precisar entrar no fluxo comercial.

### Passo a passo

1. Acesse o módulo `Solicitações`.
2. Clique em `Nova solicitação`.
3. Preencha os dados da solicitação.
4. Preencha os dados do cliente.
5. Selecione os tipos de serviço.
6. Preencha os postos por serviço.
7. Preencha os equipamentos por serviço.
8. Adicione observações gerais, se necessário.
9. Clique em `Gerar resumo` para revisar.
10. Clique em `Salvar solicitação`.

### Resultado esperado

- A solicitação será criada e enviada para `Em triagem`.
- Não deve duplicar mesmo se houver clique duplo no botão de salvar.

### Prints sugeridos

- `[INSERIR PRINT DA TELA DE SOLICITAÇÃO - VISÃO GERAL]`
- `[INSERIR PRINT DOS CAMPOS DO CLIENTE]`
- `[INSERIR PRINT DOS CAMPOS DE SERVIÇO, POSTOS E EQUIPAMENTOS]`
- `[INSERIR PRINT DO RESUMO ANTES DE SALVAR]`

### Glossário dos campos

#### Bloco: Dados da solicitação

| Campo | Para que serve | Quem preenche | Observação |
|---|---|---|---|
| Data da solicitação | Registra a data de abertura | Vendedor | Normalmente vem com a data atual |
| Prazo de entrega | Prazo esperado para conclusão interna | Vendedor | Importante para SLA |
| Vendedor responsável | Identifica quem abriu o negócio | Vendedor | Usado nas permissões e relatórios |
| E-mail do vendedor | Vincula a solicitação ao usuário | Vendedor | Base para a visibilidade dos negócios |
| Filial | Unidade relacionada ao negócio | Vendedor | Lista configurável |
| Origem do lead | Canal de entrada da oportunidade | Vendedor | Lista configurável |
| Observação inicial | Contexto inicial do pedido | Vendedor | Útil para triagem |

#### Bloco: Dados do cliente

| Campo | Para que serve | Quem preenche | Observação |
|---|---|---|---|
| Razão social | Nome jurídico do cliente | Vendedor | Campo principal do cliente |
| Nome fantasia | Nome comercial | Vendedor | Opcional |
| CNPJ | Documento da empresa | Vendedor | Opcional quando ainda não disponível |
| Segmento | Segmento de atuação | Vendedor | Lista configurável |
| E-mail de faturamento | E-mail de referência financeira do cliente | Vendedor | Substitui o antigo e-mail principal |
| Endereço | Logradouro do cliente | Vendedor | Pode ser complementado via CEP em evolução futura |
| Número | Número do endereço | Vendedor | Obrigatório conforme necessidade operacional |
| Complemento | Complemento do endereço | Vendedor | Opcional |
| Bairro | Bairro do cliente | Vendedor | Opcional |
| Cidade | Cidade do cliente | Vendedor | Importante para filtros e benefícios |
| Estado | Estado do cliente | Vendedor | Importante para filtros e benefícios |
| CEP | Código postal do endereço | Vendedor | Campo para futura automação de endereço |

#### Bloco: Contatos

| Campo | Para que serve | Quem preenche | Observação |
|---|---|---|---|
| Contato principal | Pessoa principal para tratativas | Vendedor | Recomendado preencher sempre |
| Cargo do contato principal | Função da pessoa no cliente | Vendedor | Opcional |
| E-mail do contato principal | Canal de contato | Vendedor | Opcional, mas recomendado |
| Telefone do contato principal | Telefone do contato | Vendedor | Recomendado |
| Contato secundário | Contato alternativo | Vendedor | Opcional |

#### Bloco: Tipos de serviço

| Campo | Para que serve | Quem preenche | Observação |
|---|---|---|---|
| Tipos de serviço | Define o escopo macro do negócio | Vendedor | Ex.: Vigilância, Portaria, Limpeza |

Observação:

- `Segurança` e `Vigilância` são tratadas como a mesma coisa no sistema.

#### Bloco: Benefícios

| Campo | Para que serve | Quem preenche | Observação |
|---|---|---|---|
| Vale transporte | Premissa de custo/região | Vendedor | Importante para orçamento |
| Assistência médica | Premissa comercial | Vendedor | Opcional |
| VR | Vale refeição | Vendedor | Opcional |
| VA | Vale alimentação | Vendedor | Opcional |

#### Bloco: Postos por serviço

| Campo | Para que serve | Quem preenche | Observação |
|---|---|---|---|
| Serviço | Identifica o grupo operacional | Vendedor | Vem do tipo de serviço |
| Qtd. postos | Quantidade de postos | Vendedor | Base do dimensionamento |
| Qtd. funcionários | Quantidade de pessoas | Vendedor | Base de cálculo |
| Função | Função do posto | Vendedor | Ex.: Vigia, Porteiro |
| Escala | Escala operacional | Vendedor | Lista configurável |
| Entrada | Horário inicial | Vendedor | Campo operacional |
| Saída | Horário final | Vendedor | Campo operacional |
| Sábado entrada | Horário de entrada no sábado | Vendedor | Não há saída separada no sábado |
| Feriado | Indica cobertura em feriado | Vendedor | Sim ou Não |
| Indenizado | Identifica posto indenizado | Vendedor | Sim ou Não |
| Uniforme | Tipo de uniforme | Vendedor | Ex.: Padrão ou Social |
| Ajuda de custo | Valor adicional operacional | Vendedor | Opcional |

#### Bloco: Equipamentos por serviço

| Campo | Para que serve | Quem preenche | Observação |
|---|---|---|---|
| Serviço | Agrupa o equipamento por serviço | Vendedor | Ex.: Vigilância, Portaria |
| Equipamento | Equipamento necessário para o serviço | Vendedor | Lista configurável por serviço |
| Quantidade | Quantidade necessária | Vendedor | Base do custo |
| Observação | Detalhes adicionais | Vendedor | Opcional |

#### Bloco: Observações

| Campo | Para que serve | Quem preenche | Observação |
|---|---|---|---|
| Observações gerais | Informações complementares do negócio | Vendedor | Importante para contexto |
| Documento técnico do cliente | Referência documental | Vendedor | Pode ser anexado |

---

## 4. Módulo de Propostas

### Objetivo

Controlar a triagem, a elaboração, a finalização e o envio da proposta para o vendedor.

### Quem usa

- Comercial interno
- Propostas
- Administrador

### Etapas cobertas

- Em triagem
- Aguardando informações
- Em Elaboração da Proposta
- Proposta finalizada
- Recebimento de Proposta

### Passo a passo operacional

#### 4.1 Em triagem

1. Abrir a solicitação recebida.
2. Validar dados do cliente, escopo, postos, equipamentos e observações.
3. Decidir se a solicitação:
   - vai para `Em Elaboração da Proposta`
   - volta para `Aguardando informações`

#### 4.2 Aguardando informações

1. Informar o motivo da devolução.
2. Definir responsável e prazo de resposta, se aplicável.
3. Salvar a triagem.
4. O vendedor fará a correção e devolverá para a triagem.

#### 4.3 Em Elaboração da Proposta

1. Conferir as premissas comerciais e operacionais.
2. Montar a proposta internamente.
3. Antes de finalizar, gerar o número da proposta no módulo próprio.

#### 4.4 Geração do número da proposta

1. Acesse o módulo de geração de número da proposta.
2. Vincule a solicitação.
3. Preencha os dados da proposta.
4. Gere o número.
5. Verifique se o número ficou vinculado à solicitação correta.

#### 4.5 Proposta finalizada

1. Retorne à fila de proposta.
2. Marque a proposta como finalizada.
3. Anexe o PDF final da proposta.
4. Salve para seguir ao vendedor.

#### 4.6 Recebimento de Proposta

1. A proposta já aparece para o vendedor.
2. A partir daqui o processo entra no módulo de negociações.

### Prints sugeridos

- `[INSERIR PRINT DA FILA DE TRIAGEM]`
- `[INSERIR PRINT DA TELA DE TRIAGEM]`
- `[INSERIR PRINT DA ETAPA EM ELABORAÇÃO DA PROPOSTA]`
- `[INSERIR PRINT DA GERAÇÃO DO NÚMERO DA PROPOSTA]`
- `[INSERIR PRINT DA FINALIZAÇÃO COM ANEXO DO PDF]`

### Glossário dos campos da triagem

| Campo | Para que serve | Quem preenche | Observação |
|---|---|---|---|
| Responsável pela triagem | Define quem está conduzindo a etapa | Comercial interno / Propostas | Normalmente já preenchido |
| Status da triagem | Situação interna da análise | Comercial interno / Propostas | Ex.: Triagem concluída |
| Mover para etapa | Define a próxima etapa do fluxo | Comercial interno / Propostas | Campo crítico |
| Nota da triagem | Resumo da análise realizada | Comercial interno / Propostas | Fica no histórico |
| Responsável pela proposta | Define quem conduzirá a elaboração | Comercial interno / Propostas | Opcional conforme operação |
| Previsão de conclusão | Previsão interna | Comercial interno / Propostas | Apoio de acompanhamento |
| Versão da proposta | Controle de versão | Comercial interno / Propostas | Ex.: v1, v2 |
| Notas internas | Uso interno da equipe | Comercial interno / Propostas | Não é campo comercial |
| Premissas comerciais | Base comercial considerada | Comercial interno / Propostas | Apoio ao orçamento |
| Premissas operacionais | Base operacional considerada | Comercial interno / Propostas | Apoio à proposta |
| Motivo de pendência | Usado quando a solicitação volta | Comercial interno / Propostas | Obrigatório ao devolver |
| Descrição da pendência | Explica o que deve ser corrigido | Comercial interno / Propostas | Recomendado detalhar |
| PDF final da proposta | Anexo final da proposta | Comercial interno / Propostas | Obrigatório para envio ao vendedor |

### Glossário do número da proposta

| Campo | Para que serve | Quem preenche | Observação |
|---|---|---|---|
| Data | Data da proposta | Comercial interno / Propostas | Base do número |
| Responsável pelo negócio | Responsável comercial | Comercial interno / Propostas | Normalmente o vendedor |
| Cliente | Identificação do cliente | Comercial interno / Propostas | Pode vir da solicitação |
| Tipo do documento | Tipo formal do documento | Comercial interno / Propostas | Ex.: PROPOSTA |
| Escopo do serviço | Resumo do escopo | Comercial interno / Propostas | Facilita leitura |
| Valor da proposta | Valor total | Comercial interno / Propostas | Pode ser por linhas de serviço |
| BDI | Margem/índice da proposta | Comercial interno / Propostas | Conforme regra interna |
| Linhas de serviço | Quebra por serviço | Comercial interno / Propostas | Recomendado quando aplicável |

---

## 5. Módulo de Negociações

### Objetivo

Permitir que o vendedor registre a evolução comercial após receber a proposta.

### Quem usa

- Vendedor
- Administrador

### Passo a passo

1. Abrir o negócio na etapa `Recebimento de Proposta`.
2. Confirmar recebimento pelo vendedor.
3. Registrar status da negociação.
4. Atualizar probabilidade.
5. Registrar observações da negociação.
6. Alimentar o diário/resumo da negociação.
7. Se aprovado, mover para `Proposta Ganha`.

### Prints sugeridos

- `[INSERIR PRINT DA TELA DE NEGOCIAÇÃO]`
- `[INSERIR PRINT DOS CAMPOS DE PROBABILIDADE]`
- `[INSERIR PRINT DO DIÁRIO DE NEGOCIAÇÃO]`

### Glossário dos campos

| Campo | Para que serve | Quem preenche | Observação |
|---|---|---|---|
| Data de envio ao vendedor | Registra quando a proposta chegou ao comercial | Vendedor / Interno | Apoio de rastreabilidade |
| Recebimento confirmado | Confirma que o vendedor recebeu | Vendedor | Sim ou Não |
| Status da negociação | Situação comercial atual | Vendedor | Ex.: Em negociação, Proposta Ganha |
| Último contato | Data do último contato com o cliente | Vendedor | Base do diário |
| Próxima ação | Próximo passo comercial | Vendedor | Importante para gestão |
| Fechamento previsto | Data esperada de fechamento | Vendedor | Ajuda o funil |
| Observações comerciais | Contexto geral da negociação | Vendedor | Campo livre |
| Resumo da negociação | Resumo objetivo do contato do dia | Vendedor | Recomendado sempre preencher |
| Ajustes solicitados | Alterações pedidas pelo cliente | Vendedor | Pode gerar retorno interno |
| Probabilidade | Chance de fechamento | Vendedor | Alta, Média ou Baixa |
| Motivo da probabilidade | Justifica a probabilidade | Vendedor | Apoio gerencial |
| Data do aceite | Data em que o cliente aprovou | Vendedor | Usado em Proposta Ganha |
| Escopo aceito | Registra o que foi aprovado | Vendedor | Importante para contrato |
| Condições aceitas | Resume as condições aprovadas | Vendedor | Importante para contrato |
| Anexo do aceite | Evidência da aprovação | Vendedor | Recomendado quando houver |

### Diário de negociação

O diário de negociação serve para registrar, por data, a evolução da tratativa comercial com o cliente.

Boas práticas:

- Registrar cada contato importante.
- Ser objetivo.
- Informar o que foi discutido.
- Informar o próximo passo.
- Atualizar probabilidade quando houver mudança.

---

## 6. Módulo de Contratos

### Objetivo

Controlar a fase pós-ganho, desde a preparação do contrato até a assinatura.

### Quem usa

- Jurídico
- Administrador

### Etapas cobertas

- Elaboração de contrato
- Negociação de cláusulas
- Contrato assinado

### Passo a passo

#### 6.1 Elaboração de contrato

1. Abrir a oportunidade na etapa `Proposta Ganha`.
2. Iniciar o registro contratual.
3. Informar responsável pelo contrato.
4. Registrar início da preparação.
5. Anexar minuta inicial, se aplicável.

#### 6.2 Negociação de cláusulas

1. Registrar a versão em revisão.
2. Informar data da rodada de cláusulas.
3. Detalhar cláusulas em discussão.
4. Registrar pendências documentais e observações jurídicas.

#### 6.3 Contrato assinado

1. Registrar a assinatura.
2. Anexar o contrato assinado.
3. Definir data de início operacional, se aplicável.
4. Salvar a etapa final.

### Prints sugeridos

- `[INSERIR PRINT DA TELA DE CONTRATOS]`
- `[INSERIR PRINT DA ELABORAÇÃO DE CONTRATO]`
- `[INSERIR PRINT DA NEGOCIAÇÃO DE CLÁUSULAS]`
- `[INSERIR PRINT DO CONTRATO ASSINADO]`

### Glossário dos campos

| Campo | Para que serve | Quem preenche | Observação |
|---|---|---|---|
| Responsável pelo contrato | Dono da etapa contratual | Jurídico / Administrador | Campo principal |
| Início do contrato | Data/hora de início da preparação | Jurídico / Administrador | Histórico operacional |
| Versão da minuta | Controle da versão contratual | Jurídico / Administrador | Ex.: v1, v2, v3 |
| Data da rodada de cláusulas | Marca a negociação jurídica | Jurídico / Administrador | Usado em cláusulas |
| Notas contratuais | Resumo geral do andamento | Jurídico / Administrador | Campo livre |
| Pendências documentais | Documentos faltantes ou observações | Jurídico / Administrador | Importante para acompanhamento |
| Cláusulas em discussão | Pontos contratuais em debate | Jurídico / Administrador | Recomendado detalhar |
| Observações jurídicas | Comentários do jurídico | Jurídico / Administrador | Campo interno |
| Próxima ação | Próximo passo do contratual | Jurídico / Administrador | Gestão de follow-up |
| Data de assinatura | Momento da assinatura | Jurídico / Administrador | Campo final |
| Início da operação | Data prevista/real da operação | Jurídico / Administrador | Conecta com implantação |
| Minuta inicial | Arquivo da minuta | Jurídico / Administrador | Anexo opcional |
| Contrato assinado | Arquivo final assinado | Jurídico / Administrador | Anexo final |

---

## 7. Dashboard e Funil de Vendas

### Objetivo

Dar visibilidade gerencial e operacional da carteira e do pipeline comercial.

### Quem usa

- Vendedor
- Gestão
- Diretoria
- Administrador

### Regras de visibilidade

- O vendedor vê apenas os próprios negócios.
- Gestão, diretoria e administrador têm visão ampliada conforme perfil.

### O que observar no dashboard

- solicitações abertas
- itens no prazo
- itens em risco
- itens vencidos
- propostas ganhas
- contratos assinados

### O que observar no funil

- pipeline ativo
- distribuição por probabilidade
- negócios por vendedor
- entradas por mês
- ganhos por mês
- volume de pipeline
- taxa de conversão

### Prints sugeridos

- `[INSERIR PRINT DO DASHBOARD]`
- `[INSERIR PRINT DO FUNIL DE VENDAS]`

### Glossário resumido

| Indicador | Significado |
|---|---|
| Solicitações abertas | Quantidade de negócios em carteira |
| No prazo | Itens dentro do SLA |
| Em risco | Itens próximos de vencer |
| Vencidas | Itens fora do SLA |
| Propostas ganhas | Quantidade de oportunidades aprovadas |
| Contratos assinados | Quantidade finalizada em contrato |
| Pipeline ativo | Total de oportunidades em andamento |
| Alta probabilidade | Oportunidades com maior chance de fechamento |
| Volume pipeline | Valor estimado da carteira |
| Volume ganho | Valor efetivamente fechado |

---

## 8. Módulo de Administração

### Objetivo

Permitir a gestão de usuários, acessos e listas configuráveis do sistema.

### Quem usa

- Administrador

### Submódulos principais

#### 8.1 Usuários

Permite:

- criar usuários
- alterar perfil
- ajustar módulos liberados
- ajustar etapas liberadas
- redefinir senha
- desativar usuário

#### 8.2 Configurações

Permite administrar listas do sistema, como:

- filiais
- responsáveis
- origem do lead
- status da proposta
- tipos de documento
- segmentos
- tipos de serviço
- escalas
- equipamentos por serviço
- motivos de perda
- motivos de cancelamento

### Prints sugeridos

- `[INSERIR PRINT DA TELA DE USUÁRIOS]`
- `[INSERIR PRINT DA TELA DE CONFIGURAÇÕES]`

### Boas práticas

- alterar listas somente com alinhamento prévio
- manter padronização de nomenclatura
- evitar duplicidade de itens
- revisar permissões antes de liberar usuários novos

---

## 9. Perfis e Permissões

### Regra principal do vendedor

O perfil de vendedor deve:

- abrir solicitações
- acompanhar negociações
- ver somente os próprios negócios
- enxergar dashboard e funil com base apenas na própria carteira

### Perfis internos

| Perfil | Foco principal |
|---|---|
| Comercial interno | Triagem e andamento interno |
| Propostas | Elaboração e finalização da proposta |
| Jurídico | Contratos e cláusulas |
| Administrador | Configuração geral e visão completa |

---

## 10. Fluxo Completo Resumido

### Caminho ideal

1. Vendedor abre a solicitação.
2. Sistema envia para `Em triagem`.
3. Equipe interna avalia.
4. Se necessário, devolve para correção.
5. Solicitação segue para `Em Elaboração da Proposta`.
6. Número da proposta é gerado.
7. Proposta é finalizada.
8. PDF é anexado.
9. Proposta segue para `Recebimento de Proposta`.
10. Vendedor assume a negociação.
11. Diário de negociação é alimentado.
12. Negócio vira `Proposta Ganha`.
13. Contrato é preparado.
14. Cláusulas são negociadas, se necessário.
15. Processo encerra em `Contrato assinado`.

---

## 11. Erros Comuns e Cuidados

| Situação | Causa comum | Como evitar |
|---|---|---|
| Solicitação incompleta | Falta de detalhamento inicial | Conferir resumo antes de salvar |
| Proposta finalizada sem número | Ordem incorreta do processo | Gerar número antes de finalizar |
| Negociação sem histórico | Falta de registro do vendedor | Alimentar resumo/diário por data |
| Informação divergente entre proposta e contrato | Falta de atualização no fluxo | Revisar escopo aceito e condições |
| Lista confusa para o usuário | Falta de manutenção administrativa | Revisar módulo Configurações |

---

## 12. Checklist de Treinamento

### Vendedor

- sabe abrir solicitação
- sabe preencher postos e equipamentos
- sabe revisar o resumo
- sabe registrar negociação
- sabe atualizar probabilidade
- sabe registrar proposta ganha

### Comercial interno / Propostas

- sabe triar solicitação
- sabe devolver para correção
- sabe levar para elaboração
- sabe gerar número da proposta
- sabe finalizar proposta
- sabe anexar PDF final

### Jurídico / Contratual

- sabe iniciar contrato
- sabe registrar negociação de cláusulas
- sabe anexar contrato assinado

### Administrador

- sabe criar usuários
- sabe ajustar módulos e etapas
- sabe manter listas configuráveis

---

## 13. Próxima Etapa Recomendada

Para transformar este material na versão final de treinamento:

1. Capturar os prints de cada módulo.
2. Inserir os prints nos marcadores deste manual.
3. Revisar nomes internos com a operação.
4. Gerar versão final em PDF.

