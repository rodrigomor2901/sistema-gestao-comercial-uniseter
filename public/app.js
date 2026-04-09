function toneClass(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("venc")) return "danger";
  if (normalized.includes("risco") || normalized.includes("hoje")) return "warn";
  if (normalized.includes("prazo") || normalized.includes("assinado")) return "ok";
  return "info";
}

const VIEW_CONFIG = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Painel operacional do funil de propostas com workflow, SLA e anexos.",
    showExport: true,
    showNewRequest: true
  },
  funil_vendas: {
    title: "Funil de vendas",
    subtitle: "VisÃ£o executiva do pipeline comercial, probabilidade, entrada e fechamento.",
    showExport: true,
    showNewRequest: false
  },
  proposta_todas: {
    title: "Todas as propostas",
    subtitle: "Consulta do histÃ³rico, resumo geral, upload de arquivo e exportaÃ§Ã£o.",
    showExport: false,
    showNewRequest: false
  },
  proposta_crm: {
    title: "Requisições pendentes de proposta",
    subtitle: "Requisições sem proposta gerada, prontas para seguir para o cadastro.",
    showExport: false,
    showNewRequest: false
  },
  solicitacoes: {
    title: "SolicitaÃ§Ãµes",
    subtitle: "Abertura da requisiÃ§Ã£o e acompanhamento das etapas iniciais.",
    showExport: false,
    showNewRequest: true
  },
  propostas: {
    title: "Fila de propostas",
    subtitle: "Triagem, preparacao e finalizacao interna das propostas.",
    showExport: false,
    showNewRequest: false
  },
  negociacoes: {
    title: "NegociaÃ§Ãµes",
    subtitle: "Envio ao vendedor, andamento comercial e aceite da proposta.",
    showExport: false,
    showNewRequest: false
  },
  contratos: {
    title: "Contratos",
    subtitle: "FormalizaÃ§Ã£o contratual, clÃ¡usulas e assinatura.",
    showExport: false,
    showNewRequest: false
  },
  relatorios: {
    title: "RelatÃ³rios",
    subtitle: "Filtros operacionais e exportaÃ§Ã£o compatÃ­vel com Excel.",
    showExport: true,
    showNewRequest: false
  },
  alterar_senha: {
    title: "Alterar senha",
    subtitle: "Atualize sua senha de acesso ao sistema.",
    showExport: false,
    showNewRequest: false
  },
  admin_users: {
    title: "Administrar usuÃ¡rios",
    subtitle: "Cadastro, alteraÃ§Ã£o de acesso e controle de perfis.",
    showExport: false,
    showNewRequest: false
  }
};

const MODULE_STAGE_CONFIG = {
  solicitacoes: [
    { code: "solicitacao_criada", label: "Solicitacao criada" }
  ],
  propostas: [
    { code: "em_triagem", label: "Em triagem" },
    { code: "aguardando_informacoes", label: "Aguardando informacoes" },
    { code: "em_preparacao_da_proposta", label: "Em preparacao da proposta" },
    { code: "proposta_finalizada", label: "Proposta finalizada" }
  ],
  negociacoes: [
    { code: "enviada_ao_vendedor", label: "Enviada ao vendedor" },
    { code: "em_negociacao", label: "Em negociacao" },
    { code: "proposta_aceita", label: "Proposta aceita" },
    { code: "perdida", label: "Perdida" },
    { code: "cancelada", label: "Cancelada" }
  ],
  contratos: [
    { code: "elaboracao_de_contrato", label: "Elaboracao de contrato" },
    { code: "negociacao_de_clausulas", label: "Negociacao de clausulas" },
    { code: "contrato_assinado", label: "Contrato assinado" }
  ]
};

const ROLE_CONFIG = {
  vendedor: {
    label: "Vendedor",
    note: "Acesso a solicitacoes e negociacoes. Sem acesso a filas internas de propostas e contratos.",
    views: ["dashboard", "funil_vendas", "proposta_todas", "proposta_crm", "solicitacoes", "negociacoes", "relatorios", "alterar_senha"],
    permissions: {
      createRequest: true,
      deleteRequest: true,
      createProposalNumber: true,
      saveProposal: false,
      saveCommercial: true,
      saveContract: false,
      manageUsers: false
    }
  },
  comercial_interno: {
    label: "Comercial interno",
    note: "Acesso operacional amplo entre triagem, negociacao e apoio contratual.",
    views: ["dashboard", "funil_vendas", "proposta_todas", "proposta_crm", "solicitacoes", "propostas", "negociacoes", "contratos", "relatorios", "alterar_senha"],
    permissions: {
      createRequest: true,
      deleteRequest: true,
      createProposalNumber: true,
      saveProposal: true,
      saveCommercial: true,
      saveContract: true,
      manageUsers: false
    }
  },
  propostas: {
    label: "Propostas",
    note: "Foco nas etapas de triagem, preparacao e apoio operacional de proposta.",
    views: ["dashboard", "funil_vendas", "proposta_todas", "proposta_crm", "propostas", "relatorios", "alterar_senha"],
    permissions: {
      createRequest: false,
      deleteRequest: false,
      createProposalNumber: true,
      saveProposal: true,
      saveCommercial: false,
      saveContract: false,
      manageUsers: false
    }
  },
  juridico: {
    label: "Juridico",
    note: "Acesso concentrado no modulo contratual e acompanhamento geral.",
    views: ["dashboard", "funil_vendas", "contratos", "relatorios", "alterar_senha"],
    permissions: {
      createRequest: false,
      deleteRequest: false,
      createProposalNumber: false,
      saveProposal: false,
      saveCommercial: false,
      saveContract: true,
      manageUsers: false
    }
  },
  gestor: {
    label: "Gestor",
    note: "Acompanhamento gerencial com leitura ampla e foco em indicadores.",
    views: ["dashboard", "funil_vendas", "proposta_todas", "proposta_crm", "solicitacoes", "propostas", "negociacoes", "contratos", "relatorios", "alterar_senha"],
    permissions: {
      createRequest: false,
      deleteRequest: false,
      createProposalNumber: false,
      saveProposal: false,
      saveCommercial: false,
      saveContract: false,
      manageUsers: false
    }
  },
  diretoria: {
    label: "Diretoria",
    note: "Acesso a todos os modulos operacionais e gerenciais, exceto criacao e administracao de usuarios.",
    views: ["dashboard", "funil_vendas", "proposta_todas", "proposta_crm", "solicitacoes", "propostas", "negociacoes", "contratos", "relatorios", "alterar_senha"],
    permissions: {
      createRequest: false,
      deleteRequest: false,
      createProposalNumber: false,
      saveProposal: false,
      saveCommercial: false,
      saveContract: false,
      manageUsers: false
    }
  },
  administrador: {
    label: "Administrador",
    note: "Acesso total ao sistema, incluindo futuras rotinas administrativas e gestao de usuarios.",
    views: ["dashboard", "funil_vendas", "proposta_todas", "proposta_crm", "solicitacoes", "propostas", "negociacoes", "contratos", "relatorios", "alterar_senha", "admin_users"],
    permissions: {
      createRequest: true,
      deleteRequest: true,
      createProposalNumber: true,
      saveProposal: true,
      saveCommercial: true,
      saveContract: true,
      manageUsers: true
    }
  }
};

const VIEW_MODULE_MAP = {
  proposta_todas: "proposta",
  proposta_crm: "proposta",
  dashboard: "vendas",
  funil_vendas: "vendas",
  solicitacoes: "vendas",
  propostas: "vendas",
  negociacoes: "vendas",
  contratos: "contratos",
  relatorios: "relatorios",
  admin_users: "admin"
};

let currentView = "dashboard";
let selectedRequestId = null;
let reportRowsCache = [];
let currentRole = "";
let currentUser = {
  name: "",
  email: "",
  roles: [],
  moduleAccess: ["vendas"],
  mustChangePassword: false
};
let forcePasswordChange = false;
let adminUsersCache = [];
let auditLogsCache = [];
let availableRoles = [];
let negotiationFiltersState = {
  dateStart: "",
  dateEnd: "",
  client: "",
  seller: ""
};
let proposalNumberRowsCache = [];
let proposalNumberAllRowsCache = [];
let crmProposalRequestsCache = [];
let lookupsCache = {
  branches: [],
  responsibles: [],
  leadSources: [],
  proposalStatuses: [],
  documentTypes: [],
  industries: [],
  serviceTypes: [],
  lossReasons: [],
  cancelReasons: []
};
const PROPOSAL_SERVICE_TYPES = [
  "Vigilancia",
  "Portaria",
  "Limpeza",
  "Jardinagem",
  "Monitoramento",
  "Bombeiro",
  "Manutencao"
];
let authToken = localStorage.getItem("crmAuthToken") || "";
let listenersInitialized = false;
const activeModuleStage = Object.fromEntries(
  Object.entries(MODULE_STAGE_CONFIG).map(([key, stages]) => [key, stages[0].code])
);

function sessionHeaders() {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

function sessionQueryString() {
  const params = new URLSearchParams({
    sessionToken: authToken
  });
  return params.toString();
}

async function fetchWithSession(url, options = {}) {
  const headers = new Headers(options.headers || {});
  Object.entries(sessionHeaders()).forEach(([key, value]) => headers.set(key, value));
  return fetch(url, { ...options, headers });
}

function renderMetrics(metrics) {
  const container = document.getElementById("metrics");
  container.innerHTML = metrics.map((metric) => `
    <div class="card metric">
      <div class="label">${metric.label}</div>
      <div class="value">${metric.value}</div>
      <span class="tag ${metric.tone}">${metric.note}</span>
    </div>
  `).join("");
}

function renderFunnel(items) {
  const container = document.getElementById("funnel");
  container.innerHTML = items.map((item) => `
    <div class="funnel-row">
      <strong>${item.stage}</strong>
      <div class="bar"><div style="width:${item.percent}%"></div></div>
      <span>${item.value}</span>
    </div>
  `).join("");
}

function renderUrgent(items) {
  const container = document.getElementById("urgent");
  container.innerHTML = items.map((item) => `
    <div class="list-item">
      <div class="list-top">
        <strong>${item.requestNumber}</strong>
        <span class="pill ${toneClass(item.sla)}">${item.sla}</span>
      </div>
      <div>${item.company}</div>
      <div class="muted">${item.stage} | ${item.owner}</div>
    </div>
  `).join("");
}

function renderExecutiveMetrics(metrics) {
  const container = document.getElementById("sales-funnel-metrics");
  container.innerHTML = metrics.map((metric) => `
    <div class="card metric executive-metric">
      <div class="label">${metric.label}</div>
      <div class="value">${metric.value}</div>
      <span class="tag ${metric.tone}">${metric.note}</span>
    </div>
  `).join("");
}

function renderExecutiveBars(containerId, items, quantityLabel, totalLabel) {
  const container = document.getElementById(containerId);
  if (!items?.length) {
    container.innerHTML = `<div class="muted">Sem dados para exibir.</div>`;
    return;
  }

  const totalValue = items.reduce((sum, item) => sum + Number(item.totalValue || 0), 0);
  container.innerHTML = items.map((item) => `
    <div class="executive-row">
      <div class="executive-label">${item.label}</div>
      <div class="executive-track"><div class="executive-fill" style="width:${item.percent}%"></div></div>
      <div class="executive-values">
        <div><strong>Qtd:</strong> ${item.value} ${quantityLabel}</div>
        <div><strong>Valor:</strong> ${Number(item.totalValue || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
      </div>
    </div>
  `).join("") + `<div class="executive-total muted">${totalLabel}: ${Number(totalValue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>`;
}

function renderSalesClosingList(items) {
  const container = document.getElementById("sales-closing-list");
  if (!items?.length) {
    container.innerHTML = `<div class="muted">Nenhuma oportunidade com previsÃ£o prÃ³xima.</div>`;
    return;
  }

  container.innerHTML = items.map((item) => `
    <div class="list-item sales-closing-item" data-request-id="${item.requestId || ""}" data-proposal-id="${item.proposalRegistryId || ""}">
      <div class="list-top">
        <strong>${item.company}</strong>
        <span class="pill ${toneClass(item.probability)}">${item.probability}</span>
      </div>
      <div>${item.requestNumber}${item.proposalNumber ? ` | ${item.proposalNumber}` : ""}</div>
      <div class="muted">${item.seller} | Fecha em ${item.expectedCloseDate || "-"}</div>
      <div class="muted">${item.value || "-"}</div>
    </div>
  `).join("");
}

function renderSalesClosingListDetailed(items) {
  const container = document.getElementById("sales-closing-list");
  if (!items?.length) {
    container.innerHTML = `<div class="muted">Nenhuma oportunidade com alta probabilidade no filtro atual.</div>`;
    return;
  }

  container.innerHTML = items.map((item) => `
    <div class="list-item sales-closing-item" data-request-id="${item.requestId || ""}" data-proposal-id="${item.proposalRegistryId || ""}">
      <div class="list-top">
        <strong>${item.company}</strong>
        <span class="pill ${toneClass(item.probability)}">${item.probability}</span>
      </div>
      <div>${item.requestNumber}${item.proposalNumber ? ` | ${item.proposalNumber}` : ""}</div>
      <div class="muted"><strong>Vendedor:</strong> ${item.seller || "-"}</div>
      <div class="muted"><strong>Tipo de serviÃ§o:</strong> ${item.serviceScope || "-"}</div>
      <div class="muted"><strong>Valor:</strong> ${item.value || "-"}</div>
      <div class="muted"><strong>Margem:</strong> ${item.margin || "-"}</div>
      <div class="muted"><strong>PrevisÃ£o:</strong> ${item.expectedCloseDate || "-"}</div>
    </div>
  `).join("");
}

function renderConversionGrid(items) {
  const container = document.getElementById("sales-conversion-chart");
  if (!items?.length) {
    container.innerHTML = `<div class="muted">Sem dados para exibir.</div>`;
    return;
  }

  container.innerHTML = items.map((item) => `
    <div class="conversion-card">
      <strong>${item.label}</strong>
      <div class="conversion-line"><span>Entradas</span><strong>${item.entries}</strong></div>
      <div class="conversion-line"><span>Aceitas</span><strong>${item.accepted}</strong></div>
      <div class="conversion-line"><span>Fechadas</span><strong>${item.signed}</strong></div>
      <div class="conversion-line"><span>Conversao final</span><strong>${item.conversionRate}</strong></div>
    </div>
  `).join("");
}

function renderSalesFunnelPanel(data) {
  renderExecutiveMetrics(data.metrics || []);
  renderExecutiveBars("sales-probability-chart", data.byProbability || [], "proposta(s)", "Valor total por probabilidade");
  renderExecutiveBars("sales-seller-chart", data.bySeller || [], "em carteira", "Valor em carteira");
  renderExecutiveBars("sales-entry-chart", data.byMonthEntries || [], "entrada(s)", "Valor total de entrada");
  renderExecutiveBars("sales-win-chart", data.byMonthWins || [], "fechamento(s)", "Valor total fechado");
  renderExecutiveBars("sales-stage-chart", data.byStage || [], "oportunidade(s)", "Valor total por etapa");
  renderExecutiveBars("sales-loss-chart", data.lossByReason || [], "perda(s)", "Valor total perdido");
  renderExecutiveBars("sales-cancel-chart", data.cancelByReason || [], "cancelamento(s)", "Valor total cancelado");
  renderExecutiveBars("sales-ticket-chart", data.ticketBySeller || [], "oportunidade(s)", "Valor total da carteira");
  renderSalesClosingListDetailed(data.closingSoon || []);
  renderConversionGrid(data.conversionBySeller || []);
}

function renderRequests(items) {
  const container = document.getElementById("requests-table");
  if (!items.length) {
    container.innerHTML = `
      <tr>
        <td colspan="8" class="muted">Nenhuma solicitacao cadastrada ainda.</td>
      </tr>
    `;
    return;
  }

  container.innerHTML = items.map((item) => `
    <tr data-request-id="${item.id}" class="request-row">
      <td>${item.requestNumber}</td>
      <td>${proposalNumberLink(item)}</td>
      <td>${item.company}</td>
      <td>${item.seller}</td>
      <td>${item.currentStage}</td>
      <td><span class="pill ${toneClass(item.slaStatus)}">${item.slaStatus}</span></td>
      <td>${item.currentOwner}</td>
      <td>${item.updatedAt}</td>
    </tr>
  `).join("");
}

function proposalNumberLink(item) {
  if (!item?.proposalNumber) return "-";
  const proposalId = item.proposalRegistryId ? ` data-proposal-id="${item.proposalRegistryId}"` : "";
  const clickableClass = item.proposalRegistryId ? " proposal-inline-link" : "";
  return `<button type="button" class="inline-link${clickableClass}"${proposalId}>${item.proposalNumber}</button>`;
}

function renderProposalSummary(item) {
  const card = document.getElementById("proposal-summary-card");
  const container = document.getElementById("proposal-summary");

  if (!item?.proposalNumber) {
    card.style.display = "none";
    container.innerHTML = "";
    return;
  }

  const fields = [
    ["Numero", proposalNumberLink(item)],
    ["Data", item.proposalIssueDate || "-"],
    ["Status", item.proposalStatus || "-"],
    ["Valor", item.proposalValue || "-"],
    ["ResponsÃ¡vel pelo negÃ³cio", item.proposalManager || "-"]
  ];

  card.style.display = "";
  container.innerHTML = fields.map(([key, value]) => `
    <div class="field">
      <div class="k">${key}</div>
      <div class="v">${value}</div>
    </div>
  `).join("");
}

function renderReports(items) {
  const container = document.getElementById("report-table");
  const summary = document.getElementById("reports-summary");
  summary.textContent = `${items.length} registro(s) encontrado(s)`;

  if (!items.length) {
    container.innerHTML = `
      <tr>
        <td colspan="11" class="muted">Nenhum registro encontrado com os filtros informados.</td>
      </tr>
    `;
    return;
  }

  container.innerHTML = items.map((item) => `
    <tr>
      <td>${item.requestNumber}</td>
      <td>${proposalNumberLink(item)}</td>
      <td>${item.company}</td>
      <td>${item.seller}</td>
      <td>${item.currentStage}</td>
      <td><span class="pill ${toneClass(item.slaStatus)}">${item.slaStatus}</span></td>
      <td>${item.currentOwner}</td>
      <td>${item.requestDate}</td>
      <td>${item.deadlineDate}</td>
      <td>${item.finalStatus}</td>
      <td>${item.updatedAt}</td>
    </tr>
  `).join("");
}

function renderProposalNumbers(items) {
  const container = document.getElementById("proposal-number-table");
  const summary = document.getElementById("proposal-numbers-summary");
  const importedCount = items.filter((item) => item.importedFromLegacy).length;
  const latest = items[0]?.proposalNumberDisplay || "-";
  summary.textContent = `${items.length} nÃºmero(s) | Ãºltimo: ${latest} | histÃ³rico: ${importedCount}`;

  if (!items.length) {
    container.innerHTML = `
      <tr>
        <td colspan="11" class="muted">Nenhuma proposta encontrada.</td>
      </tr>
    `;
    return;
  }

  container.innerHTML = items.map((item) => `
    <tr class="proposal-history-row" data-proposal-id="${item.id}">
      <td>${item.proposalNumberDisplay}</td>
      <td>${item.issueDate || "-"}</td>
      <td>${item.manager || "-"}</td>
      <td>${item.clientName || "-"}</td>
      <td>${item.requestNumber || "-"}</td>
      <td>${item.stageLabel || "Em negociacao"}</td>
      <td>${item.documentType || "-"}</td>
      <td>${item.branchName || "-"}</td>
      <td>${item.status || "-"}</td>
      <td>${item.proposalValue || "-"}</td>
      <td>
        <div class="table-action-group">
          ${item.uploadedFileName ? `<a class="attachment-link" href="/api/proposal-numbers/${item.id}/download?${sessionQueryString()}" target="_blank" rel="noopener noreferrer">Baixar</a>` : `<span class="muted">-</span>`}
          <button type="button" class="table-action proposal-edit-button" data-proposal-id="${item.id}">Editar</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function buildNegotiationRows(baseRows = []) {
  const proposalIdsInCrm = new Set(
    baseRows
      .map((item) => item.proposalRegistryId)
      .filter(Boolean)
      .map((item) => String(item))
  );

  const proposalOnlyRows = proposalNumberAllRowsCache
    .filter((item) => item.id && !proposalIdsInCrm.has(String(item.id)))
    .map((item) => ({
      id: "",
      requestNumber: item.requestNumber || "-",
      proposalNumber: item.proposalNumberDisplay,
      proposalRegistryId: item.id,
      company: item.clientName || "-",
      seller: item.manager || "-",
      currentStage: item.stageLabel || "Em negociacao",
      stageCode: item.stageCode || "em_negociacao",
      slaStatus: "Sem SLA",
      currentOwner: item.manager || "-",
      updatedAt: item.issueDate || "-",
      isProposalOnly: true
    }));

  return [...baseRows, ...proposalOnlyRows];
}

function parseBrDate(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  const [, day, month, year] = match;
  return new Date(`${year}-${month}-${day}T00:00:00`);
}

function buildNegotiationFilterState() {
  const form = document.getElementById("negotiations-filters");
  if (!form) return { ...negotiationFiltersState };
  const data = new FormData(form);
  return {
    dateStart: String(data.get("dateStart") || "").trim(),
    dateEnd: String(data.get("dateEnd") || "").trim(),
    client: String(data.get("client") || "").trim().toLowerCase(),
    seller: String(data.get("seller") || "").trim().toLowerCase()
  };
}

function applyNegotiationFilters(rows = []) {
  return rows.filter((item) => {
    if (negotiationFiltersState.client && !String(item.company || "").toLowerCase().includes(negotiationFiltersState.client)) {
      return false;
    }
    if (negotiationFiltersState.seller && !String(item.seller || "").toLowerCase().includes(negotiationFiltersState.seller)) {
      return false;
    }

    if (negotiationFiltersState.dateStart || negotiationFiltersState.dateEnd) {
      const rowDate = parseBrDate(item.updatedAt);
      if (!rowDate) return false;
      if (negotiationFiltersState.dateStart) {
        const startDate = new Date(`${negotiationFiltersState.dateStart}T00:00:00`);
        if (rowDate < startDate) return false;
      }
      if (negotiationFiltersState.dateEnd) {
        const endDate = new Date(`${negotiationFiltersState.dateEnd}T23:59:59`);
        if (rowDate > endDate) return false;
      }
    }

    return true;
  });
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function renderProposalNumberMetrics(allItems, filteredItems) {
  const container = document.getElementById("proposal-number-metrics");
  const currentMonth = new Date().toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" });
  const currentMonthCount = allItems.filter((item) => String(item.issueDate || "").slice(3) === currentMonth).length;
  const totalValue = allItems.reduce((sum, item) => sum + Number(item.proposalValueRaw || 0), 0);
  const filteredValue = filteredItems.reduce((sum, item) => sum + Number(item.proposalValueRaw || 0), 0);
  const bdiItems = allItems.filter((item) => item.bdiRaw !== null && item.bdiRaw !== undefined && item.bdiRaw !== "");
  const avgBdi = bdiItems.length
    ? (bdiItems.reduce((sum, item) => sum + Number(item.bdiRaw || 0), 0) / bdiItems.length) * 100
    : 0;

  const cards = [
    { label: "Total de propostas", value: String(allItems.length), note: `${currentMonthCount} neste mes`, tone: "info" },
    { label: "Volume total", value: formatCurrency(totalValue), note: "histÃ³rico completo", tone: "ok" },
    { label: "Margem media", value: `${avgBdi.toFixed(1).replace(".", ",")}%`, note: "BDI medio geral", tone: "warn" },
    { label: "Filtro atual", value: String(filteredItems.length), note: filteredItems.length ? formatCurrency(filteredValue) : "sem filtros aplicados", tone: "info" }
  ];

  container.innerHTML = cards.map((metric) => `
    <div class="card metric proposal-metric">
      <div class="label">${metric.label}</div>
      <div class="value">${metric.value}</div>
      <span class="tag ${metric.tone}">${metric.note}</span>
    </div>
  `).join("");
}

function renderProposalNumbers(items) {
  const container = document.getElementById("proposal-number-table");
  const summary = document.getElementById("proposal-numbers-summary");
  const proposalItems = items.filter((item) => item.sourceType !== "request");
  const importedCount = proposalItems.filter((item) => item.importedFromLegacy).length;
  const latest = proposalItems[0]?.proposalNumberDisplay || "-";
  summary.textContent = `${items.length} registro(s) | ultimo numero: ${latest} | historico: ${importedCount}`;

  if (!items.length) {
    container.innerHTML = `
      <tr>
        <td colspan="11" class="muted">Nenhuma proposta encontrada.</td>
      </tr>
    `;
    return;
  }

  container.innerHTML = items.map((item) => `
    <tr class="proposal-history-row${item.sourceType === "request" ? " proposal-request-row" : ""}" ${item.id ? `data-proposal-id="${item.id}"` : ""} ${item.requestId ? `data-request-id="${item.requestId}"` : ""}>
      <td>${item.proposalNumberDisplay}</td>
      <td>${item.issueDate || "-"}</td>
      <td>${item.manager || "-"}</td>
      <td>${item.clientName || "-"}</td>
      <td>${item.requestNumber || "-"}</td>
      <td>${item.stageLabel || "Em negociacao"}</td>
      <td>${item.documentType || "-"}</td>
      <td>${item.branchName || "-"}</td>
      <td>${item.status || "-"}</td>
      <td>${item.proposalValue || "-"}</td>
      <td>
        <div class="table-action-group">
          ${item.id && item.uploadedFileName ? `<a class="attachment-link" href="/api/proposal-numbers/${item.id}/download?${sessionQueryString()}" target="_blank" rel="noopener noreferrer">Baixar</a>` : `<span class="muted">-</span>`}
          ${item.sourceType === "request"
            ? `<button type="button" class="table-action proposal-generate-button" data-request-id="${item.requestId}">Gerar numero</button>`
            : `<button type="button" class="table-action proposal-edit-button" data-proposal-id="${item.id}">Editar</button>`}
        </div>
      </td>
    </tr>
  `).join("");
}

function renderProposalNumberMetrics(allItems, filteredItems) {
  const container = document.getElementById("proposal-number-metrics");
  const proposalAllItems = allItems.filter((item) => item.sourceType !== "request");
  const proposalFilteredItems = filteredItems.filter((item) => item.sourceType !== "request");
  const currentMonth = new Date().toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" });
  const currentMonthCount = proposalAllItems.filter((item) => String(item.issueDate || "").slice(3) === currentMonth).length;
  const totalValue = proposalAllItems.reduce((sum, item) => sum + Number(item.proposalValueRaw || 0), 0);
  const filteredValue = proposalFilteredItems.reduce((sum, item) => sum + Number(item.proposalValueRaw || 0), 0);
  const bdiItems = proposalAllItems.filter((item) => item.bdiRaw !== null && item.bdiRaw !== undefined && item.bdiRaw !== "");
  const avgBdi = bdiItems.length
    ? (bdiItems.reduce((sum, item) => sum + Number(item.bdiRaw || 0), 0) / bdiItems.length) * 100
    : 0;

  const cards = [
    { label: "Total de propostas", value: String(proposalAllItems.length), note: `${currentMonthCount} neste mes`, tone: "info" },
    { label: "Volume total", value: formatCurrency(totalValue), note: "historico completo", tone: "ok" },
    { label: "Margem media", value: `${avgBdi.toFixed(1).replace(".", ",")}%`, note: "BDI medio geral", tone: "warn" },
    { label: "Filtro atual", value: String(filteredItems.length), note: proposalFilteredItems.length ? formatCurrency(filteredValue) : "sem filtros aplicados", tone: "info" }
  ];

  container.innerHTML = cards.map((metric) => `
    <div class="card metric proposal-metric">
      <div class="label">${metric.label}</div>
      <div class="value">${metric.value}</div>
      <span class="tag ${metric.tone}">${metric.note}</span>
    </div>
  `).join("");
}

function renderCrmProposalRequests(items) {
  const container = document.getElementById("proposal-crm-request-table");
  const summary = document.getElementById("proposal-crm-summary");
  summary.textContent = `${items.length} requisição(ões) pendentes de proposta`;

  if (!items.length) {
    container.innerHTML = `
      <tr>
        <td colspan="8" class="muted">Nenhuma requisição pendente de proposta.</td>
      </tr>
    `;
    return;
  }

  container.innerHTML = items.map((item) => `
    <tr class="stage-table-row proposal-crm-row" data-request-id="${item.id}">
      <td>${item.requestNumber}</td>
      <td>${item.company}</td>
      <td>${item.seller}</td>
      <td>${item.serviceScope || "-"}</td>
      <td>${item.contactName || "-"}</td>
      <td>${item.branchName || "-"}</td>
      <td>${item.currentStage || "-"}</td>
      <td>${item.deadlineDate || "-"}</td>
    </tr>
  `).join("");
}

function renderProposalServiceLines(items = []) {
  const container = document.getElementById("proposal-service-lines");
  if (!container) return;

  const byType = new Map(
    (items || []).map((item) => [String(item.serviceType || ""), item])
  );

  container.innerHTML = PROPOSAL_SERVICE_TYPES.map((serviceType) => {
    const current = byType.get(serviceType) || {};
    return `
      <tr>
        <td>${serviceType}</td>
        <td><input type="number" step="0.01" min="0" data-service-value="${serviceType}" value="${current.proposalValueRaw ?? ""}" /></td>
        <td><input type="number" step="0.0001" min="0" data-service-margin="${serviceType}" value="${current.bdiRaw ?? ""}" /></td>
      </tr>
    `;
  }).join("");
}

function collectProposalServiceLines() {
  return PROPOSAL_SERVICE_TYPES.map((serviceType) => {
    const valueInput = document.querySelector(`[data-service-value="${serviceType}"]`);
    const marginInput = document.querySelector(`[data-service-margin="${serviceType}"]`);
    const proposalValue = String(valueInput?.value || "").trim();
    const bdi = String(marginInput?.value || "").trim();
    if (!proposalValue && !bdi) return null;
    return {
      serviceType,
      proposalValue,
      bdi
    };
  }).filter(Boolean);
}

function syncProposalTotalsFromServices() {
  const lines = collectProposalServiceLines();
  const totalValue = lines.reduce((sum, item) => sum + Number(item.proposalValue || 0), 0);
  const weightedBase = lines.reduce((sum, item) => {
    if (!item.proposalValue || !item.bdi) return sum;
    return sum + (Number(item.proposalValue) * Number(item.bdi));
  }, 0);
  const weightedValue = lines.reduce((sum, item) => {
    if (!item.proposalValue || !item.bdi) return sum;
    return sum + Number(item.proposalValue);
  }, 0);

  if (lines.length) {
    document.getElementById("proposal-number-value").value = totalValue ? totalValue.toFixed(2) : "";
    document.getElementById("proposal-number-bdi").value = weightedValue ? (weightedBase / weightedValue).toFixed(4) : "";
  }
}

function renderStageBoard(moduleKey, rows) {
  const stages = MODULE_STAGE_CONFIG[moduleKey] || [];
  const activeStageCode = activeModuleStage[moduleKey];
  const tabsContainer = document.getElementById(`${moduleKey}-stage-tabs`);
  const tableContainer = document.getElementById(`${moduleKey}-stage-table`);

  tabsContainer.innerHTML = stages.map((stage) => {
    const count = rows.filter((item) => item.stageCode === stage.code).length;
    const activeClass = stage.code === activeStageCode ? "active" : "";
    return `<button type="button" class="stage-tab ${activeClass}" data-module="${moduleKey}" data-stage-code="${stage.code}">${stage.label} (${count})</button>`;
  }).join("");

  const filteredRows = rows.filter((item) => item.stageCode === activeStageCode);
  if (!filteredRows.length) {
    tableContainer.innerHTML = `
      <tr>
        <td colspan="8" class="muted">Nenhum item nesta etapa.</td>
      </tr>
    `;
    return;
  }

  tableContainer.innerHTML = filteredRows.map((item) => `
    <tr class="stage-table-row" data-module-key="${moduleKey}" data-request-id="${item.id || ""}" data-proposal-id="${item.proposalRegistryId || ""}">
      <td>${item.requestNumber}</td>
      <td>${proposalNumberLink(item)}</td>
      <td>${item.company}</td>
      <td>${item.seller}</td>
      <td>${item.currentStage}</td>
      <td><span class="pill ${toneClass(item.slaStatus)}">${item.slaStatus}</span></td>
      <td>${item.currentOwner}</td>
      <td>${item.updatedAt}</td>
    </tr>
  `).join("");
}

function roleLabel(roleName) {
  return ROLE_CONFIG[roleName]?.label || roleName;
}

function rolePermissions(roleName) {
  return ROLE_CONFIG[roleName]?.permissions || {};
}

function defaultModulesForRole(roleName) {
  const defaults = {
    vendedor: ["proposta", "vendas", "relatorios"],
    comercial_interno: ["proposta", "vendas", "contratos", "relatorios"],
    propostas: ["proposta", "vendas", "relatorios"],
    juridico: ["vendas", "contratos", "relatorios"],
    gestor: ["proposta", "vendas", "contratos", "relatorios"],
    diretoria: ["proposta", "vendas", "contratos", "relatorios"],
    administrador: ["proposta", "vendas", "contratos", "relatorios", "admin"]
  };
  return defaults[roleName] || ["vendas"];
}

function expandLegacyModules(modules = []) {
  const expanded = [];
  modules.forEach((moduleName) => {
    if (moduleName === "crm") {
      expanded.push("vendas", "contratos", "relatorios");
      return;
    }
    expanded.push(moduleName);
  });
  return [...new Set(expanded)];
}

function applyAdminModuleSelection(modules = []) {
  document.querySelectorAll('input[name="moduleAccess"]').forEach((input) => {
    input.checked = modules.includes(input.value);
  });
}

function isViewAllowedByModule(view, moduleAccess = currentUser.moduleAccess || []) {
  const requiredModule = VIEW_MODULE_MAP[view];
  if (!requiredModule) return true;
  return expandLegacyModules(moduleAccess).includes(requiredModule);
}

function renderAdminUsers(users) {
  const container = document.getElementById("admin-users-table");
  const summary = document.getElementById("admin-users-summary");
  summary.textContent = `${users.length} usuÃ¡rio(s)`;

  if (!users.length) {
    container.innerHTML = `
      <tr>
        <td colspan="5" class="muted">Nenhum usuÃ¡rio cadastrado.</td>
      </tr>
    `;
    return;
  }

  container.innerHTML = users.map((user) => `
    <tr>
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>${roleLabel(user.primaryRole)}</td>
      <td>${user.isActive ? "Ativo" : "Inativo"}</td>
      <td><button type="button" class="table-action admin-user-edit" data-user-id="${user.id}">Editar</button></td>
    </tr>
  `).join("");
}

function renderAuditLogs(items) {
  const container = document.getElementById("admin-audit-table");
  const summary = document.getElementById("admin-audit-summary");
  summary.textContent = `${items.length} evento(s)`;

  if (!items.length) {
    container.innerHTML = `
      <tr>
        <td colspan="5" class="muted">Nenhum evento de auditoria registrado ainda.</td>
      </tr>
    `;
    return;
  }

  container.innerHTML = items.map((item) => `
    <tr>
      <td>${new Date(item.createdAt).toLocaleString("pt-BR")}</td>
      <td>${item.actorName}${item.actorRole ? `<div class="muted">${roleLabel(item.actorRole)}</div>` : ""}</td>
      <td>${item.actionType}</td>
      <td>${item.entityType}${item.entityId ? ` #${item.entityId}` : ""}</td>
      <td>${item.description}</td>
    </tr>
  `).join("");
}

function populateRoleSelect(roles) {
  const roleSelect = document.getElementById("admin-user-role");
  roleSelect.innerHTML = roles.map((role) => `
    <option value="${role.name}">${roleLabel(role.name)}</option>
  `).join("");
}

function populateSimpleSelect(selectId, items, valueKey = null, labelKey = null) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const options = [`<option value=""></option>`];
  items.forEach((item) => {
    const value = valueKey ? item[valueKey] : item;
    const label = labelKey ? item[labelKey] : item;
    options.push(`<option value="${value}">${label}</option>`);
  });
  select.innerHTML = options.join("");
}

function applyLookups(lookups) {
  lookupsCache = lookups;
  populateSimpleSelect("branch-name", lookups.branches || []);
  populateSimpleSelect("lead-source", lookups.leadSources || []);
  populateSimpleSelect("industry-segment", lookups.industries || []);
  populateSimpleSelect("proposal-number-manager-name", lookups.responsibles || []);
  populateSimpleSelect("proposal-number-document-type", lookups.documentTypes || []);
  populateSimpleSelect("proposal-number-status", lookups.proposalStatuses || []);
  populateSimpleSelect("proposal-number-stage-filter", lookups.workflowStages || [], "code", "name");
  populateSimpleSelect("proposal-number-industry-segment", lookups.industries || []);
  populateSimpleSelect("loss-reason", lookups.lossReasons || [], "name", "name");
  populateSimpleSelect("cancel-reason", lookups.cancelReasons || [], "name", "name");
  populateSimpleSelect("sales-seller-filter", lookups.sellers || [], "name", "name");
  populateSimpleSelect("proposal-crm-seller-filter", lookups.sellers || [], "name", "name");
  populateSimpleSelect("sales-branch-filter", lookups.branches || []);
  populateSimpleSelect("proposal-number-branch-filter", lookups.branches || []);
  populateSimpleSelect("proposal-number-branch-name", lookups.branches || []);
  populateSimpleSelect("proposal-number-lead-source", lookups.leadSources || []);
}

function resetAdminUserForm() {
  document.getElementById("admin-user-form").reset();
  document.getElementById("admin-user-id").value = "";
  document.getElementById("admin-user-active").value = "true";
  document.getElementById("admin-user-password").value = "";
  document.getElementById("admin-user-name").focus();
  const defaultRole = availableRoles[0]?.name || "vendedor";
  document.getElementById("admin-user-role").value = defaultRole;
  applyAdminModuleSelection(defaultModulesForRole(defaultRole));
}

function updateRequestDeleteButton(requestId) {
  const button = document.getElementById("delete-request-button");
  if (!button) return;
  const allowed = Boolean(requestId && rolePermissions(currentRole).deleteRequest);
  button.style.display = allowed ? "inline-flex" : "none";
}

function populateAdminUserForm(user) {
  document.getElementById("admin-user-id").value = user.id || "";
  document.getElementById("admin-user-name").value = user.name || "";
  document.getElementById("admin-user-email").value = user.email || "";
  document.getElementById("admin-user-department").value = user.department || "";
  document.getElementById("admin-user-role").value = user.primaryRole || "";
  document.getElementById("admin-user-active").value = String(Boolean(user.isActive));
  document.getElementById("admin-user-password").value = "";
  applyAdminModuleSelection(user.moduleAccess || []);
}

function renderAllStageBoards(rows) {
  Object.keys(MODULE_STAGE_CONFIG).forEach((moduleKey) => {
    let moduleRows = rows;
    if (moduleKey === "negociacoes") {
      moduleRows = applyNegotiationFilters(buildNegotiationRows(rows));
    } else if (moduleKey === "contratos") {
      moduleRows = buildNegotiationRows(rows);
    }
    renderStageBoard(moduleKey, moduleRows);
  });
}

function updateTopbar(view) {
  const config = VIEW_CONFIG[view] || VIEW_CONFIG.dashboard;
  const role = ROLE_CONFIG[currentRole] || ROLE_CONFIG.diretoria;
  const canAccessView = role.views.includes(view);
  const permissions = role.permissions || {};
  document.getElementById("page-title").textContent = config.title;
  document.getElementById("page-subtitle").textContent = config.subtitle;
  document.getElementById("top-export-report").style.display = config.showExport && canAccessView ? "inline-flex" : "none";
  document.getElementById("go-to-request-form").style.display = config.showNewRequest && canAccessView && permissions.createRequest ? "inline-flex" : "none";
}

function proposalPanelForView(view) {
  return view === "proposta_crm" ? "crm" : "historico";
}

function applyProposalModulePanel(view) {
  const targetPanel = proposalPanelForView(view);
  document.querySelectorAll("[data-proposal-module-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.proposalModulePanel === targetPanel);
  });
}

function organizeProposalModuleLayout() {
  const crmPanel = document.querySelector('[data-proposal-module-panel="crm"]');
  const formCard = document.getElementById("proposal-number-form-section");
  if (crmPanel && formCard && formCard.parentElement !== crmPanel) {
    crmPanel.appendChild(formCard);
  }
}

function setActiveView(view) {
  const role = ROLE_CONFIG[currentRole] || ROLE_CONFIG.diretoria;
  const allowedViews = role.views.filter((item) => isViewAllowedByModule(item));
  if (forcePasswordChange && !allowedViews.includes("alterar_senha")) {
    allowedViews.push("alterar_senha");
  }
  if (forcePasswordChange && view !== "alterar_senha") {
    view = "alterar_senha";
  }
  if (!allowedViews.includes(view)) {
    view = allowedViews[0] || "dashboard";
  }

  currentView = view;
  updateTopbar(view);
  applyProposalModulePanel(view);

  document.querySelectorAll("[data-view-link]").forEach((link) => {
    link.classList.toggle("active", link.dataset.viewLink === view);
  });

  document.querySelectorAll(".page-view").forEach((section) => {
    const views = String(section.dataset.view || "").split(" ").filter(Boolean);
    section.classList.toggle("active", views.includes(view));
  });
}

function applyRoleAccess(roleKey) {
  currentRole = roleKey;
  const role = ROLE_CONFIG[roleKey] || ROLE_CONFIG.diretoria;
  const permissions = role.permissions || {};

  document.getElementById("profile-note").textContent = `${role.label}: ${role.note}`;
  document.getElementById("session-user-name").textContent = currentUser.name || "-";
  document.getElementById("session-user-email").textContent = currentUser.email || "-";
  document.getElementById("session-user-role").textContent = role.label;
  document.querySelectorAll("[data-view-link]").forEach((link) => {
    const allowedByRole = role.views.includes(link.dataset.viewLink) && isViewAllowedByModule(link.dataset.viewLink);
    const allowed = forcePasswordChange
      ? link.dataset.viewLink === "alterar_senha"
      : allowedByRole;
    link.style.display = allowed ? "block" : "none";
  });

  document.querySelectorAll("[data-module-nav]").forEach((group) => {
    const visibleLinks = [...group.querySelectorAll("[data-view-link]")].filter(
      (link) => link.style.display !== "none"
    );
    group.classList.toggle("is-hidden", visibleLinks.length === 0);
  });

  document.getElementById("request-form-section").style.display = permissions.createRequest ? "" : "none";
  document.getElementById("proposal-number-form-section").style.display = permissions.createProposalNumber ? "" : "none";
  document.getElementById("proposal-form-section").style.display = permissions.saveProposal ? "" : "none";
  document.getElementById("commercial-form-section").style.display = permissions.saveCommercial ? "" : "none";
  document.getElementById("contract-form-section").style.display = permissions.saveContract ? "" : "none";

  setActiveView(currentView);
  if (permissions.manageUsers) {
    loadAdminModule().catch((error) => {
      alert(`NÃ£o foi possÃ­vel carregar a administraÃ§Ã£o de usuÃ¡rios: ${error.message}`);
    });
  }
}

function syncProposalNumberForm() {
  document.getElementById("proposal-number-issue-date").value = new Date().toISOString().slice(0, 10);
  document.getElementById("proposal-number-manager-name").value = currentUser.name || "";
  if (!document.getElementById("proposal-number-branch-name").value && lookupsCache.branches?.length) {
    document.getElementById("proposal-number-branch-name").value = lookupsCache.branches[0];
  }
  if (!document.getElementById("proposal-number-lead-source").value && lookupsCache.leadSources?.length) {
    document.getElementById("proposal-number-lead-source").value = lookupsCache.leadSources[0];
  }
  populateProposalNumberLinkedRequest(null);
}

function populateProposalNumberLinkedRequest(detail) {
  document.getElementById("proposal-number-request-id").value = detail?.id || "";
  document.getElementById("proposal-number-linked-request").value = detail?.id
    ? `${detail.requestNumber} | ${detail.company}`
    : "Nenhuma solicitacao vinculada";

  if (detail?.company && !document.getElementById("proposal-number-client-name").value) {
    document.getElementById("proposal-number-client-name").value = detail.company;
  }
}

function prefillProposalNumberFromCrmRequest(item) {
  document.getElementById("proposal-number-registry-id").value = "";
  document.getElementById("proposal-number-request-id").value = item.id || "";
  document.getElementById("proposal-number-client-name").value = item.company || "";
  document.getElementById("proposal-number-manager-name").value = item.seller || currentUser.name || "";
  document.getElementById("proposal-number-service-scope").value = item.serviceScope || "";
  document.getElementById("proposal-number-contact-name").value = item.contactName || "";
  document.getElementById("proposal-number-phone").value = item.phone || "";
  document.getElementById("proposal-number-industry-segment").value = item.industrySegment || "";
  document.getElementById("proposal-number-branch-name").value = item.branchName || "";
  document.getElementById("proposal-number-lead-source").value = item.leadSource || "";
  document.getElementById("proposal-number-status").value = "Vinculado ao CRM";
  document.getElementById("proposal-number-linked-request").value = `${item.requestNumber} | ${item.company}`;
  document.getElementById("proposal-number-submit-button").textContent = "Gerar numero";
  document.getElementById("proposal-number-delete-button").style.display = "none";
  renderProposalServiceLines();
  syncProposalTotalsFromServices();
}

function populateProposalNumberForEdit(item) {
  document.getElementById("proposal-number-registry-id").value = item.id || "";
  document.getElementById("proposal-number-request-id").value = item.requestId || "";
  document.getElementById("proposal-number-issue-date").value = item.issueDateIso || "";
  document.getElementById("proposal-number-manager-name").value = item.manager || "";
  document.getElementById("proposal-number-client-name").value = item.clientName || "";
  document.getElementById("proposal-number-document-type").value = item.documentType || "PROPOSTA";
  document.getElementById("proposal-number-branch-name").value = item.branchName === "-" ? "" : (item.branchName || "");
  document.getElementById("proposal-number-lead-source").value = item.leadSource || "";
  document.getElementById("proposal-number-status").value = item.status || "Gerado";
  document.getElementById("proposal-number-service-scope").value = item.serviceScope || "";
  document.getElementById("proposal-number-contact-name").value = item.contactName || "";
  document.getElementById("proposal-number-phone").value = item.phone || "";
  document.getElementById("proposal-number-industry-segment").value = item.industrySegment || "";
  document.getElementById("proposal-number-value").value = item.proposalValueRaw || "";
  document.getElementById("proposal-number-bdi").value = item.bdiRaw || "";
  document.getElementById("proposal-number-notes").value = item.notes || "";
  document.getElementById("proposal-number-linked-request").value = item.requestNumber && item.requestNumber !== "-"
    ? `${item.requestNumber} | ${item.clientName || ""}`
    : "Nenhuma solicitacao vinculada";
  document.getElementById("proposal-number-submit-button").textContent = "Salvar alteracoes";
  document.getElementById("proposal-number-delete-button").style.display = "";
  renderProposalServiceLines(item.serviceLines || []);
  syncProposalTotalsFromServices();
}

function resetProposalNumberForm() {
  document.getElementById("proposal-number-form").reset();
  document.getElementById("proposal-number-registry-id").value = "";
  document.getElementById("proposal-number-feedback").textContent = "";
  document.getElementById("proposal-number-submit-button").textContent = "Gerar numero";
  document.getElementById("proposal-number-delete-button").style.display = "none";
  syncProposalNumberForm();
  renderProposalServiceLines();
  syncProposalTotalsFromServices();
}

function renderDetail(item) {
  const container = document.getElementById("detail");
  const fields = [
    ["Numero", item.requestNumber],
    ["Empresa", item.company],
    ["Etapa atual", item.stage],
    ["SLA", item.slaStatus],
    ["ResponsÃ¡vel atual", item.currentOwner],
    ["Vendedor", item.seller],
    ["Data da solicitacao", item.requestDate],
    ["Prazo", item.deadlineDate],
    ["Numero da proposta", item.proposalNumber && item.proposalRegistryId ? proposalNumberLink(item) : (item.proposalNumber || "Nao gerado")],
    ["Proxima acao", item.nextAction]
  ];

  container.innerHTML = fields.map(([key, value]) => `
    <div class="field">
      <div class="k">${key}</div>
      <div class="v">${value}</div>
    </div>
  `).join("");
  renderProposalSummary(item);
}

function renderHistory(items) {
  const container = document.getElementById("history");
  container.innerHTML = items.map((item) => `
    <div class="event">
      <strong>${item.title}</strong>
      <div class="muted">${item.meta}</div>
      <div class="muted">${item.note}</div>
    </div>
  `).join("");
}

function formatIsoDateToBr(value) {
  const text = String(value || "").trim();
  if (!text) return "-";
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return text;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function renderProposalOnlyContext(detail) {
  selectedRequestId = null;
  updateRequestDeleteButton(null);
  document.getElementById("commercial-request-id").value = "";
  document.getElementById("contract-request-id").value = "";

  const proposalValue = detail.proposalValueRaw === null || detail.proposalValueRaw === undefined
    ? "-"
    : Number(detail.proposalValueRaw).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  renderDetail({
    requestNumber: detail.requestNumber || "-",
    company: detail.clientName || detail.company || "-",
    stage: detail.stage || "-",
    slaStatus: "Sem SLA",
    currentOwner: detail.manager || detail.seller || "-",
    seller: detail.seller || detail.manager || "-",
    requestDate: detail.issueDate || "-",
    deadlineDate: formatIsoDateToBr(detail.expectedCloseDate),
    proposalNumber: detail.proposalNumber || "-",
    proposalRegistryId: detail.proposalRegistryId || "",
    proposalIssueDate: detail.issueDate || "-",
    proposalStatus: detail.status || "-",
    proposalManager: detail.manager || detail.seller || "-",
    proposalValue,
    nextAction: detail.commercialNextAction || detail.nextAction || detail.commercialAcceptedNote || detail.notes || "NegÃ³cio histÃ³rico em andamento"
  });

  const history = [
    {
      title: detail.stage || "NegÃ³cio histÃ³rico",
      meta: `${detail.issueDate || "-"} - ${detail.manager || detail.seller || "Sistema"}`,
      note: detail.notes || "Registro importado para acompanhamento comercial."
    }
  ];

  if (detail.commercialAcceptedAt) {
    history.unshift({
      title: "Proposta aceita",
      meta: `${formatIsoDateToBr(detail.commercialAcceptedAt)} - ${detail.manager || detail.seller || "Sistema"}`,
      note: detail.commercialAcceptedNote || detail.commercialAcceptedScope || "Aceite comercial registrado."
    });
  }

  if (detail.contractStartedAt || detail.draftVersion) {
    history.unshift({
      title: "Andamento contratual",
      meta: `${formatIsoDateToBr(detail.contractStartedAt)} - ${detail.manager || detail.seller || "Sistema"}`,
      note: detail.draftVersion || detail.documentPendingNotes || "Contrato em andamento."
    });
  }

  renderHistory(history);
}

function renderAttachmentList(containerId, items, allowedTypes = []) {
  const container = document.getElementById(containerId);
  const filtered = allowedTypes.length
    ? items.filter((item) => allowedTypes.includes(item.attachmentType))
    : items;

  if (!filtered.length) {
    container.innerHTML = "Nenhum arquivo disponivel.";
    container.classList.add("empty-state");
    return;
  }

  container.classList.remove("empty-state");
  container.innerHTML = filtered.map((item) => `
    <div class="attachment-item">
      <div class="attachment-meta">
        <strong>${item.fileName}</strong>
        <span>${item.attachmentLabel} | ${item.createdAt}</span>
      </div>
      <a class="attachment-link" href="/api/attachments/${item.id}/download?${sessionQueryString()}" target="_blank" rel="noopener noreferrer">Baixar</a>
    </div>
  `).join("");
}

function formatSummaryValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (value === true) return "Sim";
  if (value === false) return "Nao";
  return String(value);
}

function humanizeWorkflowText(value) {
  return formatSummaryValue(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function renderSummaryCard(title, items) {
  if (!items.length) {
    return `
      <div class="request-summary-card">
        <h4>${title}</h4>
        <div class="muted">Nenhum item informado.</div>
      </div>
    `;
  }

  return `
    <div class="request-summary-card">
      <h4>${title}</h4>
      <ul class="request-summary-list">
        ${items.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    </div>
  `;
}

function renderProposalRequestSummary(detail) {
  const container = document.getElementById("proposal-request-summary");
  if (!container) return;

  const normalizedServices = (detail.services || []).map((item) => humanizeWorkflowText(item.serviceType));
  const benefits = (detail.benefits || []).map((item) => {
    const parts = [humanizeWorkflowText(item.benefitType)];
    if (item.optionLabel) parts.push(item.optionLabel);
    if (item.regionValue !== null && item.regionValue !== undefined) parts.push(`Regiao/dia: ${item.regionValue}`);
    if (item.notes) parts.push(item.notes);
    return parts.join(" | ");
  });
  const posts = (detail.posts || []).map((item) => [
    `Tipo: ${humanizeWorkflowText(item.postType)}`,
    `Postos: ${formatSummaryValue(item.qtyPosts)}`,
    `Funcionarios: ${formatSummaryValue(item.qtyWorkers)}`,
    `Funcao: ${formatSummaryValue(item.functionName)}`,
    `Escala: ${formatSummaryValue(item.workScale)}`,
    `Horario: ${formatSummaryValue(item.startTime)} as ${formatSummaryValue(item.endTime)}`,
    `Sabado: ${formatSummaryValue(item.saturdayTime)}`,
    `Feriado: ${formatSummaryValue(item.holidayFlag)}`,
    `Indenizado: ${formatSummaryValue(item.indemnifiedFlag)}`,
    `Uniforme: ${formatSummaryValue(item.uniformText)}`,
    `Ajuda de custo: ${formatSummaryValue(item.costAllowanceValue)}`
  ].join(" | "));
  const equipments = (detail.equipments || []).map((item) => [
    `Categoria: ${humanizeWorkflowText(item.category)}`,
    `Equipamento: ${formatSummaryValue(item.equipmentName)}`,
    `Quantidade: ${formatSummaryValue(item.quantity)}`,
    `Observacao: ${formatSummaryValue(item.notes)}`
  ].join(" | "));

  container.innerHTML = [
    renderSummaryCard("Tipos de servico", normalizedServices),
    renderSummaryCard("Beneficios", benefits),
    renderSummaryCard("Postos / funcao / escala / horario", posts),
    renderSummaryCard("Equipamentos", equipments)
  ].join("");
}

function workflowViewFromStage(stageCode, fallbackView = "solicitacoes") {
  if ((MODULE_STAGE_CONFIG.propostas || []).some((stage) => stage.code === stageCode)) return "propostas";
  if ((MODULE_STAGE_CONFIG.negociacoes || []).some((stage) => stage.code === stageCode)) return "negociacoes";
  if ((MODULE_STAGE_CONFIG.contratos || []).some((stage) => stage.code === stageCode)) return "contratos";
  if ((MODULE_STAGE_CONFIG.solicitacoes || []).some((stage) => stage.code === stageCode)) return "solicitacoes";
  return fallbackView;
}

function populateProposalForm(detail) {
  document.getElementById("selected-request-id").value = detail.id || "";
  document.getElementById("selected-request-number").value = detail.requestNumber || "";
  document.getElementById("selected-request-company").value = detail.company || "";
  document.getElementById("selected-request-stage").value = detail.stage || "";
  document.getElementById("next-stage-code").value = "";
  document.getElementById("triage-owner-name").value = detail.triageOwnerName || currentUser.name || "";
  document.getElementById("triage-owner-email").value = detail.triageOwnerEmail || currentUser.email || "";
  document.getElementById("triage-status").value = detail.proposalTriageStatus || "";
  document.getElementById("triage-note").value = detail.proposalTriageNote || "";
  document.getElementById("proposal-owner-name").value = detail.proposalOwnerName || "";
  document.getElementById("proposal-owner-email").value = detail.proposalOwnerEmail || "";
  document.getElementById("expected-completion-date").value = detail.proposalExpectedCompletionDate || "";
  document.getElementById("proposal-version").value = detail.proposalVersion || "";
  document.getElementById("internal-notes").value = detail.proposalInternalNotes || "";
  document.getElementById("commercial-assumptions").value = detail.proposalCommercialAssumptions || "";
  document.getElementById("operational-assumptions").value = detail.proposalOperationalAssumptions || "";
  renderProposalRequestSummary(detail);
}

function populateCommercialForm(detail) {
  document.getElementById("commercial-request-id").value = detail.requestId || "";
  document.getElementById("commercial-proposal-registry-id").value = detail.proposalRegistryId || "";
  document.getElementById("commercial-request-number").value = detail.requestNumber || "-";
  document.getElementById("commercial-proposal-number").value = detail.proposalNumber || "-";
  document.getElementById("commercial-request-company").value = detail.company || detail.clientName || "";
  document.getElementById("commercial-request-stage").value = detail.stage || detail.stageLabel || "";
  document.getElementById("commercial-seller-name").value = detail.commercialSellerName || detail.seller || detail.manager || currentUser.name || "";
  document.getElementById("commercial-seller-email").value = detail.commercialSellerEmail || detail.sellerEmail || currentUser.email || "";
  document.getElementById("sent-to-seller-at").value = detail.commercialSentToSellerAt || detail.sentToSellerAt || "";
  document.getElementById("seller-receipt-confirmed").value = detail.commercialSellerReceiptConfirmed ? "true" : "false";
  document.getElementById("negotiation-status").value = detail.commercialNegotiationStatus || detail.status || "";
  document.getElementById("last-contact-at").value = detail.commercialLastContactAt || detail.lastContactAt || "";
  document.getElementById("expected-close-date").value = detail.commercialExpectedCloseDate || detail.expectedCloseDate || "";
  document.getElementById("commercial-next-action").value = detail.commercialNextAction || detail.nextAction || "";
  document.getElementById("commercial-notes").value = detail.commercialNotes || detail.notes || "";
  document.getElementById("requested-adjustments").value = detail.commercialRequestedAdjustments || detail.requestedAdjustments || "";
  document.getElementById("probability-level").value = detail.commercialProbabilityLevel || detail.probabilityLevel || "";
  document.getElementById("probability-reason").value = detail.commercialProbabilityReason || detail.probabilityReason || "";
  document.getElementById("loss-reason").value = detail.commercialLossReason || "";
  document.getElementById("cancel-reason").value = detail.commercialCancelReason || "";
  document.getElementById("accepted-at").value = detail.commercialAcceptedAt || "";
  document.getElementById("accepted-scope").value = detail.commercialAcceptedScope || "";
  document.getElementById("accepted-conditions").value = detail.commercialAcceptedConditions || "";
  document.getElementById("accepted-note").value = detail.commercialAcceptedNote || "";
  document.getElementById("commercial-next-stage-code").value = "";
}

function populateContractForm(detail) {
  document.getElementById("contract-request-id").value = detail.requestId || "";
  document.getElementById("contract-proposal-registry-id").value = detail.proposalRegistryId || "";
  document.getElementById("contract-request-number").value = detail.requestNumber || "-";
  document.getElementById("contract-request-company").value = detail.company || detail.clientName || "";
  document.getElementById("contract-request-stage").value = detail.stage || detail.stageLabel || "";
  document.getElementById("contract-started-at").value = detail.contractStartedAt || "";
  document.getElementById("draft-version").value = detail.draftVersion || "";
  document.getElementById("clause-round-date").value = detail.clauseRoundDate || "";
  document.getElementById("contract-notes").value = detail.contractNotes || detail.notes || "";
  document.getElementById("document-pending-notes").value = detail.documentPendingNotes || "";
  document.getElementById("operation-start-date").value = detail.operationStartDate || "";

  if (!document.getElementById("contract-owner-name").value) {
    document.getElementById("contract-owner-name").value = currentUser.name;
  }

  if (!document.getElementById("contract-owner-email").value) {
    document.getElementById("contract-owner-email").value = currentUser.email;
  }
}

function buildProposalPayload() {
  const form = new FormData(document.getElementById("proposal-form"));
  return {
    requestId: form.get("requestId"),
    proposalRegistryId: form.get("proposalRegistryId"),
    triageOwnerName: form.get("triageOwnerName"),
    triageOwnerEmail: form.get("triageOwnerEmail"),
    triageStatus: form.get("triageStatus"),
    nextStageCode: form.get("nextStageCode"),
    triageNote: form.get("triageNote"),
    proposalOwnerName: form.get("proposalOwnerName"),
    proposalOwnerEmail: form.get("proposalOwnerEmail"),
    expectedCompletionDate: form.get("expectedCompletionDate"),
    proposalVersion: form.get("proposalVersion"),
    internalNotes: form.get("internalNotes"),
    commercialAssumptions: form.get("commercialAssumptions"),
    operationalAssumptions: form.get("operationalAssumptions"),
    pendingReason: form.get("pendingReason"),
    pendingOwnerName: form.get("pendingOwnerName"),
    pendingOwnerEmail: form.get("pendingOwnerEmail"),
    pendingDueDate: form.get("pendingDueDate"),
    pendingDescription: form.get("pendingDescription")
  };
}

function validateProposalPayload(payload) {
  const missing = [];
  if (!payload.requestId && !payload.proposalRegistryId) missing.push("Selecione uma solicitacao ou proposta");
  if (!payload.triageOwnerName) missing.push("ResponsÃ¡vel pela triagem");
  if (!payload.triageOwnerEmail) missing.push("Email do responsÃ¡vel");
  if (!payload.triageStatus) missing.push("Status da triagem");
  if (!payload.nextStageCode) missing.push("Mover para etapa");
  return missing;
}

function buildCommercialPayload() {
  const form = new FormData(document.getElementById("commercial-form"));
  return {
    requestId: form.get("requestId"),
    proposalRegistryId: form.get("proposalRegistryId"),
    sellerName: form.get("sellerName"),
    sellerEmail: form.get("sellerEmail"),
    sentToSellerAt: form.get("sentToSellerAt"),
    sellerReceiptConfirmed: form.get("sellerReceiptConfirmed"),
    negotiationStatus: form.get("negotiationStatus"),
    lastContactAt: form.get("lastContactAt"),
    nextAction: form.get("nextAction"),
    expectedCloseDate: form.get("expectedCloseDate"),
    commercialNotes: form.get("commercialNotes"),
    requestedAdjustments: form.get("requestedAdjustments"),
    probabilityLevel: form.get("probabilityLevel"),
    probabilityReason: form.get("probabilityReason"),
    acceptedAt: form.get("acceptedAt"),
    acceptedScope: form.get("acceptedScope"),
    acceptedConditions: form.get("acceptedConditions"),
    acceptedNote: form.get("acceptedNote"),
    lossReason: form.get("lossReason"),
    cancelReason: form.get("cancelReason"),
    nextStageCode: form.get("nextStageCode")
  };
}

function validateCommercialPayload(payload) {
  const missing = [];
  if (!payload.requestId && !payload.proposalRegistryId) missing.push("Selecione uma solicitacao ou proposta");
  if (!payload.sellerName) missing.push("Vendedor responsÃ¡vel");
  if (!payload.sellerEmail) missing.push("Email do vendedor");
  if (!payload.negotiationStatus) missing.push("Status da negociacao");
  if (!payload.nextStageCode) missing.push("Mover para etapa");
  if (payload.nextStageCode === "perdida" && !payload.lossReason) missing.push("Motivo padronizado da perda");
  if (payload.nextStageCode === "cancelada" && !payload.cancelReason) missing.push("Motivo padronizado do cancelamento");
  return missing;
}

function buildContractPayload() {
  const form = new FormData(document.getElementById("contract-form"));
  return {
    requestId: form.get("requestId"),
    contractOwnerName: form.get("contractOwnerName"),
    contractOwnerEmail: form.get("contractOwnerEmail"),
    contractStartedAt: form.get("contractStartedAt"),
    draftVersion: form.get("draftVersion"),
    clauseRoundDate: form.get("clauseRoundDate"),
    contractNotes: form.get("contractNotes"),
    documentPendingNotes: form.get("documentPendingNotes"),
    clausesUnderDiscussion: form.get("clausesUnderDiscussion"),
    legalNotes: form.get("legalNotes"),
    nextAction: form.get("nextAction"),
    signedAt: form.get("signedAt"),
    operationStartDate: form.get("operationStartDate"),
    nextStageCode: form.get("nextStageCode")
  };
}

function validateContractPayload(payload) {
  const missing = [];
  if (!payload.requestId) missing.push("Selecione uma solicitacao");
  if (!payload.contractOwnerName) missing.push("ResponsÃ¡vel pelo contrato");
  if (!payload.contractOwnerEmail) missing.push("Email do responsÃ¡vel");
  if (!payload.nextStageCode) missing.push("Mover para etapa");
  return missing;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Falha ao ler o arquivo ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

async function collectFiles(inputId, multiple = true) {
  const input = document.getElementById(inputId);
  const files = [...(input?.files || [])];
  const items = await Promise.all(files.map(async (file) => {
    const dataUrl = await readFileAsDataUrl(file);
    return {
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
      contentBase64: String(dataUrl).split(",")[1]
    };
  }));

  return multiple ? items : (items[0] || null);
}

function createPostRow() {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>
      <select name="postType[]">
        <option>Seguranca</option>
        <option>Portaria</option>
        <option>Limpeza</option>
        <option>Jardinagem</option>
        <option>Monitoramento</option>
        <option>Manutencao</option>
      </select>
    </td>
    <td><input name="postQty[]" type="number" min="0" /></td>
    <td><input name="workerQty[]" type="number" min="0" /></td>
    <td><input name="functionName[]" /></td>
    <td><input name="workScale[]" /></td>
    <td><input name="startTime[]" type="time" /></td>
    <td><input name="endTime[]" type="time" /></td>
    <td><input name="saturdayTime[]" type="time" /></td>
    <td><select name="holidayFlag[]"><option value=""></option><option>Sim</option><option>Nao</option></select></td>
    <td><select name="indemnifiedFlag[]"><option value=""></option><option>Sim</option><option>Nao</option></select></td>
    <td><select name="uniformText[]"><option value=""></option><option>Padrao</option><option>Social</option></select></td>
    <td><input name="costAllowance[]" type="number" min="0" step="0.01" /></td>
    <td><button type="button" class="table-action delete-post-row">Excluir</button></td>
  `;
  document.getElementById("post-rows").appendChild(row);
}

function createEquipmentRow() {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>
      <select name="equipmentCategory[]">
        <option>Limpeza</option>
        <option>Jardinagem</option>
        <option>Seguranca</option>
        <option>Portaria</option>
        <option>Manutencao</option>
        <option>Outros</option>
      </select>
    </td>
    <td><input name="equipmentName[]" /></td>
    <td><input name="equipmentQty[]" type="number" min="0" /></td>
    <td><input name="equipmentNotes[]" /></td>
    <td><button type="button" class="table-action delete-equipment-row">Excluir</button></td>
  `;
  document.getElementById("equipment-rows").appendChild(row);
}

async function buildRequestPayload() {
  const form = document.getElementById("request-form");
  const data = new FormData(form);
  const serviceTypes = [...document.querySelectorAll('input[name="serviceType"]:checked')].map((item) => item.value);
  const posts = [...document.querySelectorAll("#post-rows tr")].map((row) => {
    const fields = row.querySelectorAll("input, select");
    return {
      postType: fields[0].value,
      postQty: fields[1].value,
      workerQty: fields[2].value,
      functionName: fields[3].value,
      workScale: fields[4].value,
      startTime: fields[5].value,
      endTime: fields[6].value,
      saturdayTime: fields[7].value,
      holidayFlag: fields[8].value,
      indemnifiedFlag: fields[9].value,
      uniformText: fields[10].value,
      costAllowance: fields[11].value
    };
  }).filter((item) => Object.values(item).some(Boolean));

  const equipments = [...document.querySelectorAll("#equipment-rows tr")].map((row) => {
    const fields = row.querySelectorAll("input, select");
    return {
      category: fields[0].value,
      equipmentName: fields[1].value,
      equipmentQty: fields[2].value,
      equipmentNotes: fields[3].value
    };
  }).filter((item) => Object.values(item).some(Boolean));

  return {
    requestDate: data.get("requestDate"),
    deadlineDate: data.get("deadlineDate"),
    sellerName: data.get("sellerName"),
    sellerEmail: data.get("sellerEmail"),
    branchName: data.get("branchName"),
    leadSource: data.get("leadSource"),
    initialNote: data.get("initialNote"),
    legalName: data.get("legalName"),
    tradeName: data.get("tradeName"),
    cnpj: data.get("cnpj"),
    industrySegment: data.get("industrySegment"),
    mainEmail: data.get("mainEmail"),
    address: data.get("address"),
    addressNumber: data.get("addressNumber"),
    addressComplement: data.get("addressComplement"),
    district: data.get("district"),
    city: data.get("city"),
    state: data.get("state"),
    zipCode: data.get("zipCode"),
    primaryContactName: data.get("primaryContactName"),
    primaryContactRole: data.get("primaryContactRole"),
    primaryContactEmail: data.get("primaryContactEmail"),
    primaryContactPhone: data.get("primaryContactPhone"),
    secondaryContactName: data.get("secondaryContactName"),
    secondaryContactRole: data.get("secondaryContactRole"),
    secondaryContactEmail: data.get("secondaryContactEmail"),
    secondaryContactPhone: data.get("secondaryContactPhone"),
    serviceTypes,
    transportRegion: data.get("transportRegion"),
    transportOptions: [...document.querySelectorAll('input[name="transportOption"]:checked')].map((item) => item.value),
    transportNotes: data.get("transportNotes"),
    medicalNotes: data.get("medicalNotes"),
    mealNotes: data.get("mealNotes"),
    foodNotes: data.get("foodNotes"),
    posts,
    equipments,
    generalNotes: data.get("generalNotes"),
    technicalDocNotes: data.get("technicalDocNotes"),
    initialAttachments: await collectFiles("initial-attachments"),
    technicalDocs: await collectFiles("technical-docs")
  };
}

function validateRequestPayload(payload) {
  const missing = [];

  if (!payload.requestDate) missing.push("Data da solicitacao");
  if (!payload.deadlineDate) missing.push("Prazo de entrega");
  if (!payload.sellerName) missing.push("Vendedor responsÃ¡vel");
  if (!payload.sellerEmail) missing.push("Email do vendedor");
  if (!payload.legalName) missing.push("Razao social");
  if (!payload.city) missing.push("Cidade");
  if (!payload.state) missing.push("Estado");
  if (!payload.primaryContactName) missing.push("Contato principal");
  if (!payload.serviceTypes.length) missing.push("Pelo menos um tipo de servico");

  return missing;
}

async function renderRequestFormPreview() {
  const payload = await buildRequestPayload();

  const preview = `Razao social: ${payload.legalName || "-"}
Nome fantasia: ${payload.tradeName || "-"}
CNPJ: ${payload.cnpj || "-"}
Contato principal: ${payload.primaryContactName || "-"}
Empresa / cliente: ${payload.legalName || "-"}
Vendedor: ${payload.sellerName || "-"}
Prazo de entrega: ${payload.deadlineDate || "-"}
Tipos de servico: ${payload.serviceTypes.join(", ") || "-"}

Beneficios:
Refeicao / VR: ${payload.mealNotes || "-"}
VA: ${payload.foodNotes || "-"}

Postos:
${payload.posts.map((item) => Object.values(item).join(" | ")).join("\n") || "-"}

Equipamentos:
${payload.equipments.map((item) => Object.values(item).join(" | ")).join("\n") || "-"}

Observacoes gerais:
${payload.generalNotes || "-"}`;

  document.getElementById("request-form-preview").textContent = preview;
}

async function refreshRequestsTable() {
  const items = await loadJson("/api/requests");
  renderRequests(items);
  return items;
}

function buildReportQuery() {
  const form = new FormData(document.getElementById("report-filters"));
  const params = new URLSearchParams();
  ["dateStart", "dateEnd", "seller", "stageCode", "slaStatus", "search"].forEach((key) => {
    const value = String(form.get(key) || "").trim();
    if (value) params.set(key, value);
  });
  return params.toString();
}

async function refreshReports() {
  const query = buildReportQuery();
  const url = query ? `/api/reports?${query}` : "/api/reports";
  const items = await loadJson(url);
  renderReports(items);
  return items;
}

function buildProposalNumberQuery() {
  const form = new FormData(document.getElementById("proposal-number-filters"));
  const params = new URLSearchParams();
  ["search", "manager", "status", "stage", "branch"].forEach((key) => {
    const value = String(form.get(key) || "").trim();
    if (value) params.set(key, value);
  });
  return params.toString();
}

function buildProposalCrmQuery() {
  const form = new FormData(document.getElementById("proposal-crm-filters"));
  const params = new URLSearchParams();
  ["dateStart", "dateEnd", "client", "seller"].forEach((key) => {
    const value = String(form.get(key) || "").trim();
    if (value) params.set(key, value);
  });
  return params.toString();
}

async function refreshProposalNumbers() {
  const query = buildProposalNumberQuery();
  const url = query ? `/api/proposal-numbers?${query}` : "/api/proposal-numbers";
  const [items, allItems] = await Promise.all([
    loadJson(url),
    query ? loadJson("/api/proposal-numbers") : Promise.resolve(null)
  ]);
  proposalNumberRowsCache = items;
  proposalNumberAllRowsCache = allItems || items;
  renderProposalNumbers(items);
  renderProposalNumberMetrics(proposalNumberAllRowsCache, items);
  return items;
}

async function refreshCrmProposalRequests() {
  const query = buildProposalCrmQuery();
  const url = query ? `/api/proposal-numbers/crm-requests?${query}` : "/api/proposal-numbers/crm-requests";
  const items = await loadJson(url);
  crmProposalRequestsCache = items;
  renderCrmProposalRequests(items);
  return items;
}

async function loadProposalNumberDetail(proposalId) {
  return loadJson(`/api/proposal-numbers/${proposalId}`);
}

function resetReportFilters() {
  document.getElementById("report-filters").reset();
}

function resetProposalNumberFilters() {
  document.getElementById("proposal-number-filters").reset();
}

function resetProposalCrmFilters() {
  document.getElementById("proposal-crm-filters").reset();
}

function resetNegotiationFilters() {
  const form = document.getElementById("negotiations-filters");
  if (form) form.reset();
  negotiationFiltersState = {
    dateStart: "",
    dateEnd: "",
    client: "",
    seller: ""
  };
}

function scrollToWorkflowForm(moduleKey) {
  const targets = {
    solicitacoes: "request-form-section",
    propostas: "proposal-form-section",
    negociacoes: "commercial-form-section",
    contratos: "contract-form-section"
  };
  const targetId = targets[moduleKey];
  if (!targetId) return;
  document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function buildProposalNumberPayload() {
  const form = new FormData(document.getElementById("proposal-number-form"));
  return {
    registryId: form.get("registryId"),
    requestId: form.get("requestId"),
    issueDate: form.get("issueDate"),
    managerName: form.get("managerName"),
    clientName: form.get("clientName"),
    documentType: form.get("documentType"),
    branchName: form.get("branchName"),
    leadSource: form.get("leadSource"),
    status: form.get("status"),
    serviceScope: form.get("serviceScope"),
    contactName: form.get("contactName"),
    phone: form.get("phone"),
    industrySegment: form.get("industrySegment"),
    proposalValue: form.get("proposalValue"),
    bdi: form.get("bdi"),
    serviceLines: collectProposalServiceLines(),
    notes: form.get("notes"),
    uploadedFile: await collectFiles("proposal-number-uploaded-file", false)
  };
}

function validateProposalNumberPayload(payload) {
  const missing = [];
  if (!payload.issueDate) missing.push("Data");
  if (!payload.managerName) missing.push("ResponsÃ¡vel pelo negÃ³cio");
  if (!payload.clientName && !payload.requestId) missing.push("Cliente ou solicitacao vinculada");
  return missing;
}

function syncLoggedUserIntoForms() {
  document.getElementById("request-date").value = new Date().toISOString().slice(0, 10);
  document.getElementById("seller-name").value = currentUser.name;
  document.getElementById("seller-email").value = currentUser.email;
  document.getElementById("proposal-number-manager-name").value = currentUser.name;
  document.getElementById("proposal-number-issue-date").value = new Date().toISOString().slice(0, 10);
  document.getElementById("commercial-seller-name").value = currentUser.name;
  document.getElementById("commercial-seller-email").value = currentUser.email;
  document.getElementById("triage-owner-name").value = currentUser.name;
  document.getElementById("triage-owner-email").value = currentUser.email;
  document.getElementById("contract-owner-name").value = currentUser.name;
  document.getElementById("contract-owner-email").value = currentUser.email;
}

function resetChangePasswordForm() {
  document.getElementById("change-password-form").reset();
  document.getElementById("change-password-feedback").textContent = "";
}

function applyAuthenticatedUser(user) {
  currentUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles || [],
    moduleAccess: user.moduleAccess || ["vendas"],
    mustChangePassword: Boolean(user.mustChangePassword)
  };
  forcePasswordChange = Boolean(user.mustChangePassword);
  currentRole = user.primaryRole || user.roles?.[0] || "vendedor";
  syncLoggedUserIntoForms();
  resetChangePasswordForm();
  applyRoleAccess(currentRole);
  if (forcePasswordChange) {
    const feedback = document.getElementById("change-password-feedback");
    feedback.textContent = "Senha provisÃ³ria detectada. Troque sua senha para continuar.";
    setActiveView("alterar_senha");
  }
}

function setupRequestForm() {
  syncLoggedUserIntoForms();
  createPostRow();
  createEquipmentRow();
  document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const feedback = document.getElementById("login-feedback");
    feedback.textContent = "";

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Falha ao autenticar.");
      }

      authToken = result.token;
      localStorage.setItem("crmAuthToken", authToken);
      document.getElementById("login-form").reset();
      await loadAuthenticatedAppData();
    } catch (error) {
      feedback.textContent = error.message;
    }
  });

  document.getElementById("add-post-row").addEventListener("click", createPostRow);
  document.getElementById("add-equipment-row").addEventListener("click", createEquipmentRow);
  document.getElementById("preview-request-form").addEventListener("click", async () => {
    await renderRequestFormPreview();
  });
  document.getElementById("go-to-request-form").addEventListener("click", () => {
    setActiveView("solicitacoes");
    document.getElementById("request-form-section").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.getElementById("delete-request-button").addEventListener("click", async () => {
    if (!selectedRequestId) {
      alert("Selecione uma solicitacao para excluir.");
      return;
    }

    const confirmed = window.confirm("Deseja excluir esta solicitacao? Esta acao nao pode ser desfeita.");
    if (!confirmed) return;

    try {
      const response = await fetchWithSession(`/api/requests/${selectedRequestId}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Falha ao excluir solicitacao.");
      }

      const [requests, reportItems] = await Promise.all([
        refreshRequestsTable(),
        refreshReports()
      ]);

      reportRowsCache = reportItems;
      renderAllStageBoards(reportRowsCache);
      await refreshDashboard();

      if (requests.length) {
        await selectRequest(requests[0].id);
      } else {
        selectedRequestId = null;
        updateRequestDeleteButton(null);
        renderDetail(requestDetailFallback());
        renderHistory([]);
        renderAttachmentList("proposal-attachments", [], ["anexo_inicial", "documento_tecnico_cliente"]);
        renderAttachmentList("commercial-attachments", [], ["proposta_final_pdf", "anexo_aceite"]);
        populateProposalForm(requestDetailFallback());
        populateCommercialForm(requestDetailFallback());
        populateContractForm(requestDetailFallback());
        populateProposalNumberLinkedRequest(null);
      }

      alert(result.message || "Solicitacao excluida com sucesso.");
    } catch (error) {
      alert(`Nao foi possivel excluir a solicitacao: ${error.message}`);
    }
  });
  document.getElementById("clear-report-filters").addEventListener("click", async () => {
    resetReportFilters();
    reportRowsCache = await refreshReports();
    renderAllStageBoards(reportRowsCache);
  });
  document.getElementById("export-report").addEventListener("click", () => {
    const query = buildReportQuery();
    const sessionQuery = sessionQueryString();
    const finalQuery = [query, sessionQuery].filter(Boolean).join("&");
    window.open(finalQuery ? `/api/reports/export.csv?${finalQuery}` : "/api/reports/export.csv", "_blank", "noopener,noreferrer");
  });
  document.getElementById("top-export-report").addEventListener("click", () => {
    if (currentView === "funil_vendas") {
      exportSalesFunnel();
      return;
    }
    const query = buildReportQuery();
    const sessionQuery = sessionQueryString();
    const finalQuery = [query, sessionQuery].filter(Boolean).join("&");
    window.open(finalQuery ? `/api/reports/export.csv?${finalQuery}` : "/api/reports/export.csv", "_blank", "noopener,noreferrer");
  });
  document.getElementById("proposal-number-filters").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await refreshProposalNumbers();
    } catch (error) {
      alert(`NÃ£o foi possÃ­vel carregar o histÃ³rico de nÃºmeros: ${error.message}`);
    }
  });
  document.getElementById("clear-proposal-number-filters").addEventListener("click", async () => {
    resetProposalNumberFilters();
    try {
      await refreshProposalNumbers();
    } catch (error) {
      alert(`NÃ£o foi possÃ­vel limpar os filtros do mÃ³dulo: ${error.message}`);
    }
  });
  document.getElementById("proposal-crm-filters").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await refreshCrmProposalRequests();
    } catch (error) {
      alert(`Não foi possível carregar as requisições: ${error.message}`);
    }
  });
  document.getElementById("clear-proposal-crm-filters").addEventListener("click", async () => {
    resetProposalCrmFilters();
    try {
      await refreshCrmProposalRequests();
    } catch (error) {
      alert(`Não foi possível limpar os filtros das requisições: ${error.message}`);
    }
  });
  document.getElementById("negotiations-filters").addEventListener("submit", (event) => {
    event.preventDefault();
    negotiationFiltersState = buildNegotiationFilterState();
    renderAllStageBoards(reportRowsCache);
  });
  document.getElementById("clear-negotiations-filters").addEventListener("click", () => {
    resetNegotiationFilters();
    renderAllStageBoards(reportRowsCache);
  });
  document.getElementById("sales-funnel-filters").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await refreshDashboard();
    } catch (error) {
      alert(`Nao foi possivel atualizar o funil de vendas: ${error.message}`);
    }
  });
  document.getElementById("clear-sales-funnel-filters").addEventListener("click", async () => {
    resetSalesFunnelFilters();
    try {
      await refreshDashboard();
    } catch (error) {
      alert(`Nao foi possivel limpar os filtros do funil de vendas: ${error.message}`);
    }
  });
  document.getElementById("export-proposal-numbers").addEventListener("click", () => {
    const query = buildProposalNumberQuery();
    const sessionQuery = sessionQueryString();
    const finalQuery = [query, sessionQuery].filter(Boolean).join("&");
    window.open(finalQuery ? `/api/proposal-numbers/export.csv?${finalQuery}` : "/api/proposal-numbers/export.csv", "_blank", "noopener,noreferrer");
  });

  document.addEventListener("click", (event) => {
    if (event.target.classList.contains("delete-post-row")) {
      const rows = document.querySelectorAll("#post-rows tr");
      if (rows.length > 1) {
        event.target.closest("tr").remove();
      }
    }

    if (event.target.classList.contains("delete-equipment-row")) {
      const rows = document.querySelectorAll("#equipment-rows tr");
      if (rows.length > 1) {
        event.target.closest("tr").remove();
      }
    }
  });

}

async function loadJson(url) {
  const response = await fetchWithSession(url);
  if (!response.ok) {
    let message = `Falha ao carregar ${url}`;
    try {
      const payload = await response.json();
      if (payload?.error) {
        message = payload.error;
      }
    } catch (error) {
      // Keep the fallback message when the response is not JSON.
    }
    throw new Error(message);
  }
  return response.json();
}

async function loadRequestAttachments(requestId) {
  return loadJson(`/api/requests/${requestId}/attachments`);
}

function showLoginScreen() {
  forcePasswordChange = false;
  document.getElementById("login-screen").hidden = false;
  document.getElementById("login-screen").style.display = "grid";
  document.getElementById("app-shell").hidden = true;
  document.getElementById("app-shell").classList.add("app-hidden");
  document.getElementById("login-feedback").textContent = "";
}

function showAppShell() {
  document.getElementById("login-screen").hidden = true;
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("app-shell").hidden = false;
  document.getElementById("app-shell").classList.remove("app-hidden");
}

async function refreshDashboard() {
  const query = buildSalesFunnelQuery();
  const url = query ? `/api/dashboard?${query}` : "/api/dashboard";
  const dashboard = await loadJson(url);
  renderMetrics(dashboard.metrics);
  renderFunnel(dashboard.funnel);
  renderUrgent(dashboard.urgent);
  renderSalesFunnelPanel(dashboard.salesFunnel || {});
  return dashboard;
}

function buildSalesFunnelQuery() {
  const form = document.getElementById("sales-funnel-filters");
  if (!form) return "";
  const data = new FormData(form);
  const params = new URLSearchParams();
  ["dateStart", "dateEnd", "seller", "branch", "probability"].forEach((key) => {
    const value = String(data.get(key) || "").trim();
    if (value) params.set(key, value);
  });
  return params.toString();
}

function resetSalesFunnelFilters() {
  const form = document.getElementById("sales-funnel-filters");
  if (form) form.reset();
}

function exportSalesFunnel() {
  const query = buildSalesFunnelQuery();
  const sessionQuery = sessionQueryString();
  const finalQuery = [query, sessionQuery].filter(Boolean).join("&");
  window.open(finalQuery ? `/api/dashboard/export.csv?${finalQuery}` : "/api/dashboard/export.csv", "_blank", "noopener,noreferrer");
}

async function loadAdminModule() {
  if (!rolePermissions(currentRole).manageUsers) return;
  const [users, roles, auditLogs] = await Promise.all([
    loadJson("/api/admin/users"),
    loadJson("/api/admin/roles"),
    loadJson("/api/admin/audit-logs")
  ]);
  adminUsersCache = users;
  auditLogsCache = auditLogs;
  availableRoles = roles;
  populateRoleSelect(roles);
  renderAdminUsers(users);
  renderAuditLogs(auditLogs);
}

async function loadAuthenticatedAppData() {
  const [authMe, dashboard, requests, reportItems, proposalNumbers, crmProposalRequests, lookups] = await Promise.all([
    loadJson("/api/auth/me"),
    loadJson("/api/dashboard"),
    loadJson("/api/requests"),
    loadJson("/api/reports"),
    loadJson("/api/proposal-numbers"),
    loadJson("/api/proposal-numbers/crm-requests"),
    loadJson("/api/lookups")
  ]);

  applyLookups(lookups);
  applyAuthenticatedUser(authMe.user);

  const initialDetail = requests.length
    ? await loadJson(`/api/requests/${requests[0].id}`)
    : requestDetailFallback();
  const initialAttachments = requests.length
    ? await loadRequestAttachments(requests[0].id)
    : [];

  reportRowsCache = reportItems;
  proposalNumberRowsCache = proposalNumbers;
  proposalNumberAllRowsCache = proposalNumbers;
  crmProposalRequestsCache = crmProposalRequests;
  selectedRequestId = requests[0]?.id || null;
  updateRequestDeleteButton(selectedRequestId);

  renderMetrics(dashboard.metrics);
  renderFunnel(dashboard.funnel);
  renderUrgent(dashboard.urgent);
  renderSalesFunnelPanel(dashboard.salesFunnel || {});
  renderRequests(requests);
  renderReports(reportItems);
  renderProposalNumbers(proposalNumbers);
  renderProposalNumberMetrics(proposalNumbers, proposalNumbers);
  renderCrmProposalRequests(crmProposalRequests);
  renderAllStageBoards(reportItems);
  renderDetail(initialDetail);
  renderHistory(initialDetail.history || []);
  renderAttachmentList("proposal-attachments", initialAttachments, ["anexo_inicial", "documento_tecnico_cliente"]);
  renderAttachmentList("commercial-attachments", initialAttachments, ["proposta_final_pdf", "anexo_aceite"]);
  await renderRequestFormPreview();
  resetProposalNumberForm();
  populateProposalForm(initialDetail);
  populateCommercialForm(initialDetail);
  populateContractForm(initialDetail);
  populateProposalNumberLinkedRequest(requests.length ? initialDetail : null);
  await loadAdminModule();
  setActiveView("dashboard");
  showAppShell();
}

async function selectRequest(requestId) {
  selectedRequestId = Number(requestId);
  updateRequestDeleteButton(selectedRequestId);
  const detail = await loadJson(`/api/requests/${requestId}`);
  const attachments = await loadRequestAttachments(requestId);
  renderDetail(detail);
  renderHistory(detail.history || []);
  renderAttachmentList("proposal-attachments", attachments, ["anexo_inicial", "documento_tecnico_cliente"]);
  renderAttachmentList("commercial-attachments", attachments, ["proposta_final_pdf", "anexo_aceite"]);
  populateProposalForm(detail);
  populateCommercialForm(detail);
  populateContractForm(detail);
  populateProposalNumberLinkedRequest(detail);
  return detail;
}

async function bootstrap() {
  setupRequestForm();
  organizeProposalModuleLayout();
  showLoginScreen();

  if (authToken) {
    try {
      await loadAuthenticatedAppData();
    } catch (error) {
      authToken = "";
      localStorage.removeItem("crmAuthToken");
      showLoginScreen();
    }
  }

    document.getElementById("requests-table").addEventListener("click", async (event) => {
      const row = event.target.closest(".request-row");
      if (!row) return;

      try {
        const detail = await selectRequest(row.dataset.requestId);
        setActiveView(workflowViewFromStage(detail.stageCode, "solicitacoes"));
      } catch (error) {
        alert(`Nao foi possivel carregar a ficha da solicitacao: ${error.message}`);
      }
  });

  document.querySelector(".sidebar").addEventListener("click", (event) => {
    const link = event.target.closest("[data-view-link]");
    if (!link) return;
    event.preventDefault();
    setActiveView(link.dataset.viewLink);
  });

  document.addEventListener("click", async (event) => {
    const proposalLink = event.target.closest(".proposal-inline-link");
    if (!proposalLink) return;
    event.preventDefault();
    event.stopPropagation();

    try {
      const detail = await loadProposalNumberDetail(proposalLink.dataset.proposalId);
      populateProposalNumberForEdit(detail);
      setActiveView("proposta_crm");
      document.getElementById("proposal-number-form-section").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      alert(`Nao foi possivel carregar o numero da proposta: ${error.message}`);
    }
  });

  document.addEventListener("click", async (event) => {
    const stageTab = event.target.closest(".stage-tab");
    if (stageTab) {
      activeModuleStage[stageTab.dataset.module] = stageTab.dataset.stageCode;
      const stageRows = stageTab.dataset.module === "negociacoes"
        ? applyNegotiationFilters(buildNegotiationRows(reportRowsCache))
        : reportRowsCache;
      renderStageBoard(stageTab.dataset.module, stageRows);
      return;
    }

    const stageRow = event.target.closest(".stage-table-row");
    if (!stageRow) return;

    if (stageRow.dataset.proposalId && !stageRow.dataset.requestId) {
      try {
        const detail = await loadProposalNumberDetail(stageRow.dataset.proposalId);
        renderProposalOnlyContext(detail);
        if ((stageRow.dataset.moduleKey || currentView) === "contratos") {
          populateContractForm(detail);
          setActiveView("contratos");
          scrollToWorkflowForm("contratos");
        } else {
          populateCommercialForm(detail);
          setActiveView("negociacoes");
          scrollToWorkflowForm("negociacoes");
        }
      } catch (error) {
        alert(`Nao foi possivel carregar o negocio: ${error.message}`);
      }
      return;
      }

      try {
        const moduleKey = stageRow.dataset.moduleKey || currentView;
        const detail = await selectRequest(stageRow.dataset.requestId);
        const targetView = workflowViewFromStage(detail.stageCode, moduleKey);
        setActiveView(targetView);
        scrollToWorkflowForm(targetView);
      } catch (error) {
        alert(`Nao foi possivel carregar a ficha da solicitacao: ${error.message}`);
      }
  });

  document.getElementById("proposal-crm-request-table").addEventListener("click", async (event) => {
    const row = event.target.closest(".proposal-crm-row");
    if (!row) return;

    const selected = crmProposalRequestsCache.find((item) => String(item.id) === String(row.dataset.requestId));
    if (!selected) return;

    try {
      await selectRequest(selected.id);
    } catch (error) {
      // Keep the prefill flow available even if the request detail fails.
    }
    prefillProposalNumberFromCrmRequest(selected);
    setActiveView("proposta_crm");
    document.getElementById("proposal-number-form-section").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("proposal-number-table").addEventListener("click", async (event) => {
    const editButton = event.target.closest(".proposal-edit-button");
    if (!editButton) return;

    try {
      const detail = await loadProposalNumberDetail(editButton.dataset.proposalId);
      populateProposalNumberForEdit(detail);
      setActiveView("proposta_crm");
      document.getElementById("proposal-number-form-section").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      alert(`Nao foi possivel carregar o numero da proposta: ${error.message}`);
    }
  });

  document.getElementById("proposal-number-table").addEventListener("click", async (event) => {
    const generateButton = event.target.closest(".proposal-generate-button");
    if (!generateButton) return;

    const selected = crmProposalRequestsCache.find((item) => String(item.id) === String(generateButton.dataset.requestId));
    if (!selected) {
      alert("Nao foi possivel localizar a solicitacao para gerar o numero da proposta.");
      return;
    }

    try {
      await selectRequest(selected.id);
    } catch (error) {
      // Keep prefill flow available even if request detail partially fails.
    }
    prefillProposalNumberFromCrmRequest(selected);
    setActiveView("proposta_crm");
    document.getElementById("proposal-number-form-section").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("sales-closing-list").addEventListener("click", async (event) => {
    const item = event.target.closest(".sales-closing-item");
    if (!item) return;

    try {
      if (item.dataset.requestId) {
        await selectRequest(item.dataset.requestId);
        setActiveView("negociacoes");
        scrollToWorkflowForm("negociacoes");
        return;
      }

      if (item.dataset.proposalId) {
        const detail = await loadProposalNumberDetail(item.dataset.proposalId);
        renderProposalOnlyContext(detail);
        populateCommercialForm(detail);
        setActiveView("negociacoes");
        scrollToWorkflowForm("negociacoes");
      }
    } catch (error) {
      alert(`Nao foi possivel abrir a negociaÃ§Ã£o: ${error.message}`);
    }
  });

  document.getElementById("request-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = await buildRequestPayload();
    await renderRequestFormPreview();
    const missing = validateRequestPayload(payload);

    if (missing.length) {
      alert(`Preencha os campos obrigatorios antes de salvar:\n- ${missing.join("\n- ")}`);
      return;
    }

    try {
      const response = await fetchWithSession("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Falha ao salvar solicitacao.");
      }

      const savedNumber = result.request?.requestNumber || result.requestNumber || "numero nao retornado";
      const refreshed = await refreshRequestsTable();
      await refreshDashboard();
      reportRowsCache = await refreshReports();
      await refreshCrmProposalRequests();
      renderAllStageBoards(reportRowsCache);
      const detailId = result.request?.id || refreshed[0]?.id;

      if (detailId) {
        await selectRequest(detailId);
      }

      alert(`Solicitacao salva com sucesso: ${savedNumber}`);
    } catch (error) {
      alert(`Nao foi possivel salvar a solicitacao: ${error.message}`);
    }
  });

  document.getElementById("proposal-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      ...buildProposalPayload(),
      proposalFinalPdf: await collectFiles("proposal-final-pdf", false)
    };
    const missing = validateProposalPayload(payload);

    if (missing.length) {
      alert(`Preencha os campos obrigatorios da triagem:\n- ${missing.join("\n- ")}`);
      return;
    }

    try {
      const response = await fetchWithSession(`/api/requests/${payload.requestId}/proposal-record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Falha ao salvar triagem.");
      }

      const detail = await loadJson(`/api/requests/${payload.requestId}`);
      if (payload.requestId) {
        await selectRequest(payload.requestId);
      } else if (payload.proposalRegistryId) {
        const detail = await loadProposalNumberDetail(payload.proposalRegistryId);
        populateCommercialForm(detail);
      }
      await refreshRequestsTable();
      await refreshDashboard();
      reportRowsCache = await refreshReports();
      renderAllStageBoards(reportRowsCache);
      alert(result.message || "Triagem salva com sucesso.");
    } catch (error) {
      alert(`Nao foi possivel salvar a triagem: ${error.message}`);
    }
  });

  document.getElementById("commercial-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      ...buildCommercialPayload(),
      acceptanceAttachment: await collectFiles("acceptance-attachment", false)
    };
    const missing = validateCommercialPayload(payload);

    if (missing.length) {
      alert(`Preencha os campos obrigatorios da negociacao:\n- ${missing.join("\n- ")}`);
      return;
    }

    try {
      const isProposalOnlyRecord =
        payload.proposalRegistryId
        && (!payload.requestId || document.getElementById("commercial-request-number").value === "-");
      const targetUrl = isProposalOnlyRecord
        ? `/api/proposal-numbers/${payload.proposalRegistryId}/commercial-record`
        : `/api/requests/${payload.requestId}/commercial-record`;
      const response = await fetchWithSession(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Falha ao salvar negociacao.");
      }

      if (!isProposalOnlyRecord && payload.requestId) {
        await selectRequest(payload.requestId);
      } else if (payload.proposalRegistryId) {
        const detail = await loadProposalNumberDetail(payload.proposalRegistryId);
        renderProposalOnlyContext(detail);
        populateCommercialForm(detail);
      }
      await refreshRequestsTable();
      await refreshDashboard();
      reportRowsCache = await refreshReports();
      renderAllStageBoards(reportRowsCache);
      alert(result.message || "Negociacao salva com sucesso.");
    } catch (error) {
      alert(`Nao foi possivel salvar a negociacao: ${error.message}`);
    }
  });

  document.getElementById("contract-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      ...buildContractPayload(),
      initialDraftFile: await collectFiles("initial-draft-file", false),
      signedContractFile: await collectFiles("signed-contract-file", false)
    };
    const missing = validateContractPayload(payload);

    if (missing.length) {
      alert(`Preencha os campos obrigatorios do contratual:\n- ${missing.join("\n- ")}`);
      return;
    }

    try {
      const targetUrl = payload.requestId
        ? `/api/requests/${payload.requestId}/contract-record`
        : `/api/proposal-numbers/${payload.proposalRegistryId}/contract-record`;
      const response = await fetchWithSession(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Falha ao salvar contratual.");
      }

      if (payload.requestId) {
        await selectRequest(payload.requestId);
      } else if (payload.proposalRegistryId) {
        const detail = await loadProposalNumberDetail(payload.proposalRegistryId);
        renderProposalOnlyContext(detail);
        populateContractForm(detail);
      }
      await refreshRequestsTable();
      await refreshDashboard();
      reportRowsCache = await refreshReports();
      renderAllStageBoards(reportRowsCache);
      alert(result.message || "Contratual salvo com sucesso.");
    } catch (error) {
      alert(`Nao foi possivel salvar o contratual: ${error.message}`);
    }
  });

  document.getElementById("report-filters").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      reportRowsCache = await refreshReports();
      renderAllStageBoards(reportRowsCache);
    } catch (error) {
      alert(`Nao foi possivel carregar o relatorio: ${error.message}`);
    }
  });

  document.getElementById("proposal-number-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const feedback = document.getElementById("proposal-number-feedback");
    feedback.textContent = "";
    const payload = await buildProposalNumberPayload();
    const missing = validateProposalNumberPayload(payload);

    if (missing.length) {
      feedback.textContent = `Preencha os campos obrigatorios: ${missing.join(", ")}.`;
      return;
    }

    try {
      const isEditing = Boolean(payload.registryId);
      const url = isEditing ? `/api/proposal-numbers/${payload.registryId}` : "/api/proposal-numbers/generate";
      const method = isEditing ? "PUT" : "POST";
      const response = await fetchWithSession(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Falha ao gerar numero de proposta.");
      }

      feedback.textContent = `${result.message || "Numero atualizado"} ${result.proposalNumber?.proposalNumberDisplay || ""}`.trim();
      resetProposalNumberForm();
      if (selectedRequestId) {
        const detail = await loadJson(`/api/requests/${selectedRequestId}`);
        populateProposalNumberLinkedRequest(detail);
      }
      await refreshProposalNumbers();
      await refreshCrmProposalRequests();
    } catch (error) {
      feedback.textContent = error.message;
    }
  });

  document.getElementById("proposal-number-reset-button").addEventListener("click", () => {
    resetProposalNumberForm();
  });

  document.getElementById("proposal-number-delete-button").addEventListener("click", async () => {
    const registryId = document.getElementById("proposal-number-registry-id").value;
    if (!registryId) return;

    const confirmed = window.confirm("Deseja excluir esta proposta? A requisição vinculada voltará para a aba Requisições pendentes de proposta.");
    if (!confirmed) return;

    try {
      const response = await fetchWithSession(`/api/proposal-numbers/${registryId}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Falha ao excluir numero da proposta.");
      }

      resetProposalNumberForm();
      await refreshProposalNumbers();
      await refreshCrmProposalRequests();
      document.getElementById("proposal-number-feedback").textContent = result.message || "Numero excluido com sucesso.";
    } catch (error) {
      alert(`Nao foi possivel excluir o numero da proposta: ${error.message}`);
    }
  });

  document.getElementById("proposal-service-lines").addEventListener("input", (event) => {
    if (event.target.matches("input")) {
      syncProposalTotalsFromServices();
    }
  });

  document.getElementById("admin-user-reset").addEventListener("click", () => {
    resetAdminUserForm();
  });

  document.getElementById("admin-user-role").addEventListener("change", () => {
    if (!document.getElementById("admin-user-id").value) {
      applyAdminModuleSelection(defaultModulesForRole(document.getElementById("admin-user-role").value));
    }
  });

  document.getElementById("logout-button").addEventListener("click", async () => {
    try {
      await fetchWithSession("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error(error);
    }
    authToken = "";
    localStorage.removeItem("crmAuthToken");
    resetChangePasswordForm();
    showLoginScreen();
  });

  document.getElementById("change-password-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const feedback = document.getElementById("change-password-feedback");
    const payload = {
      currentPassword: document.getElementById("current-password").value,
      newPassword: document.getElementById("new-password").value,
      confirmPassword: document.getElementById("confirm-password").value
    };

    feedback.textContent = "";

    if (!payload.currentPassword || !payload.newPassword || !payload.confirmPassword) {
      feedback.textContent = "Preencha os tres campos para alterar a senha.";
      return;
    }

    try {
      const response = await fetchWithSession("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Falha ao alterar a senha.");
      }

      document.getElementById("change-password-form").reset();
      forcePasswordChange = false;
      currentUser.mustChangePassword = false;
      applyRoleAccess(currentRole);
      feedback.textContent = result.message || "Senha alterada com sucesso.";
      setActiveView("dashboard");
    } catch (error) {
      feedback.textContent = error.message;
    }
  });

  document.getElementById("admin-user-deactivate").addEventListener("click", async () => {
    const userId = document.getElementById("admin-user-id").value;
    if (!userId) {
      alert("Selecione um usuÃ¡rio para desativar.");
      return;
    }

    try {
      const response = await fetchWithSession(`/api/admin/users/${userId}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Falha ao desativar usuÃ¡rio.");
      }

      await loadAdminModule();
      resetAdminUserForm();
      alert(result.message || "UsuÃ¡rio desativado com sucesso.");
    } catch (error) {
      alert(`NÃ£o foi possÃ­vel desativar o usuÃ¡rio: ${error.message}`);
    }
  });

  document.getElementById("admin-users-table").addEventListener("click", (event) => {
    const button = event.target.closest(".admin-user-edit");
    if (!button) return;
    const user = adminUsersCache.find((item) => String(item.id) === String(button.dataset.userId));
    if (user) {
      populateAdminUserForm(user);
    }
  });

  document.getElementById("admin-user-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const userId = document.getElementById("admin-user-id").value;
    const passwordValue = document.getElementById("admin-user-password").value.trim();
    const payload = {
      name: document.getElementById("admin-user-name").value.trim(),
      email: document.getElementById("admin-user-email").value.trim(),
      department: document.getElementById("admin-user-department").value.trim(),
      role: document.getElementById("admin-user-role").value.trim(),
      isActive: document.getElementById("admin-user-active").value === "true",
      moduleAccess: [...document.querySelectorAll('input[name="moduleAccess"]:checked')].map((input) => input.value),
      password: passwordValue || undefined
    };

    if (!payload.name || !payload.email || !payload.role) {
      alert("Preencha nome, e-mail e perfil do usuÃ¡rio.");
      return;
    }

    if (!userId && !passwordValue) {
      alert("Informe uma senha provisÃ³ria para criar o novo usuÃ¡rio.");
      return;
    }

    try {
      const response = await fetchWithSession(userId ? `/api/admin/users/${userId}` : "/api/admin/users", {
        method: userId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Falha ao salvar usuÃ¡rio.");
      }

      await loadAdminModule();
      await loadAuthenticatedAppData();
      resetAdminUserForm();
      const successMessage = result.temporaryPassword
        ? `${result.message || "UsuÃ¡rio salvo com sucesso."}\nSenha provisÃ³ria: ${result.temporaryPassword}`
        : (result.message || "UsuÃ¡rio salvo com sucesso.");
      alert(successMessage);
    } catch (error) {
      alert(`NÃ£o foi possÃ­vel salvar o usuÃ¡rio: ${error.message}`);
    }
  });
}

bootstrap().catch((error) => {
  console.error(error);
  document.body.innerHTML = `<pre style="padding:24px">Erro ao carregar a aplicaÃ§Ã£o: ${error.message}</pre>`;
});

function requestDetailFallback() {
  return {
    requestNumber: "-",
    company: "Nenhuma solicitacao carregada",
    stage: "-",
    slaStatus: "-",
    currentOwner: "-",
    seller: "-",
    requestDate: "-",
    deadlineDate: "-",
    nextAction: "Cadastre a primeira solicitacao para visualizar a ficha.",
    history: []
  };
}



