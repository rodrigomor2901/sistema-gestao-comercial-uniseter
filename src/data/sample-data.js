const dashboard = {
  metrics: [
    { label: "Solicitacoes abertas", value: 128, tone: "info", note: "+12 no mes" },
    { label: "No prazo", value: 94, tone: "ok", note: "73% da carteira" },
    { label: "Em risco", value: 21, tone: "warn", note: "Atencao imediata" },
    { label: "Vencidas", value: 13, tone: "danger", note: "Fora do SLA" },
    { label: "Propostas aceitas", value: 19, tone: "info", note: "Ultimos 30 dias" },
    { label: "Contratos assinados", value: 11, tone: "ok", note: "Fechamento real" }
  ],
  funnel: [
    { stage: "Em triagem", value: 18, percent: 72 },
    { stage: "Em preparacao", value: 25, percent: 100 },
    { stage: "Em negociacao", value: 21, percent: 84 },
    { stage: "Proposta aceita", value: 11, percent: 44 },
    { stage: "Clausulas", value: 7, percent: 28 },
    { stage: "Contrato assinado", value: 5, percent: 20 }
  ],
  urgent: [
    {
      requestNumber: "RP-2026-041",
      company: "Mobly Tok & Stok",
      stage: "Em preparacao da proposta",
      owner: "Time de propostas",
      sla: "Vencido"
    },
    {
      requestNumber: "RP-2026-038",
      company: "Condominio Green Park",
      stage: "Negociacao de clausulas",
      owner: "Juridico",
      sla: "Vence hoje"
    },
    {
      requestNumber: "RP-2026-037",
      company: "Hospital Sao Miguel",
      stage: "Em negociacao",
      owner: "Vendedor Andre",
      sla: "Em risco"
    }
  ]
};

const requests = [
  {
    id: 41,
    requestNumber: "RP-2026-041",
    company: "Mobly Tok & Stok",
    seller: "Andre",
    currentStage: "Em preparacao da proposta",
    slaStatus: "Vencido",
    currentOwner: "Time de propostas",
    updatedAt: "Hoje 09:14"
  },
  {
    id: 39,
    requestNumber: "RP-2026-039",
    company: "Shopping West Mall",
    seller: "Marcela",
    currentStage: "Em triagem",
    slaStatus: "No prazo",
    currentOwner: "Comercial interno",
    updatedAt: "Hoje 08:42"
  },
  {
    id: 38,
    requestNumber: "RP-2026-038",
    company: "Condominio Green Park",
    seller: "Joao",
    currentStage: "Negociacao de clausulas",
    slaStatus: "Em risco",
    currentOwner: "Juridico",
    updatedAt: "Ontem 17:05"
  }
];

const requestDetail = {
  id: 41,
  requestNumber: "RP-2026-041",
  company: "Mobly Tok & Stok",
  stage: "Em preparacao da proposta",
  slaStatus: "Vencido",
  currentOwner: "Time de propostas",
  seller: "Andre",
  requestDate: "05/04/2026",
  deadlineDate: "08/04/2026",
  nextAction: "Finalizar PDF e liberar ao vendedor",
  history: [
    {
      title: "Movida para Em preparacao da proposta",
      meta: "06/04/2026 09:14 - Rodrigo",
      note: "Triagem concluida e demanda distribuida para elaboracao."
    },
    {
      title: "Triagem concluida",
      meta: "05/04/2026 16:42 - Comercial interno",
      note: "Solicitacao validada sem pendencias criticas."
    },
    {
      title: "Solicitacao criada",
      meta: "05/04/2026 14:10 - Andre",
      note: "Cliente solicitou proposta para limpeza e portaria."
    }
  ]
};

module.exports = {
  dashboard,
  requests,
  requestDetail
};
