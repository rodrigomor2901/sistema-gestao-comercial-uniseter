function toneClass(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("venc")) return "danger";
  if (normalized.includes("risco") || normalized.includes("hoje")) return "warn";
  if (normalized.includes("prazo") || normalized.includes("assinado") || normalized.includes("ganh")) return "ok";
  return "info";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function slugifyKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

const CANONICAL_SERVICE_LABELS = {
  vigilancia: "Vigilancia",
  seguranca: "Vigilancia",
  portaria: "Portaria",
  limpeza: "Limpeza",
  jardinagem: "Jardinagem",
  monitoramento: "Monitoramento",
  bombeiro: "Bombeiro",
  manutencao: "Manutencao",
  zeladoria: "Zeladoria",
  zeladora: "Zeladoria",
  orientador_de_transito: "Orientador de Transito",
  motorista: "Motorista",
  logistica: "Logistica"
};

function normalizeServiceLabel(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const canonical = CANONICAL_SERVICE_LABELS[
    String(text)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
  ];
  if (canonical) return canonical;
  return text;
}

const APP_TIMEZONE = "America/Sao_Paulo";

function getSaoPauloNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: APP_TIMEZONE }));
}

function getSaoPauloIsoDate() {
  const now = getSaoPauloNow();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateTimeToBr(value) {
  if (!value) return "-";
  const ref = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(ref.getTime())) return String(value);
  return ref.toLocaleString("pt-BR", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function generateRequestSubmissionKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
    subtitle: "Visão executiva do pipeline comercial, probabilidade, entrada e fechamento.",
    showExport: true,
    showNewRequest: false
  },
  proposta_todas: {
    title: "Todas as propostas",
    subtitle: "Consulta do histórico, resumo geral, upload de arquivo e exportação.",
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
    title: "Solicitações",
    subtitle: "Abertura da requisição e acompanhamento das etapas iniciais.",
    showExport: false,
    showNewRequest: true
  },
  propostas: {
    title: "Fila de propostas",
    subtitle: "Triagem, elaboração e finalização interna das propostas.",
    showExport: false,
    showNewRequest: false
  },
  negociacoes: {
    title: "Negociações",
    subtitle: "Envio ao vendedor, andamento comercial e aceite da proposta.",
    showExport: false,
    showNewRequest: false
  },
  contratos: {
    title: "Contratos",
    subtitle: "Formalização contratual, cláusulas e assinatura.",
    showExport: false,
    showNewRequest: false
  },
  relatorios: {
    title: "Relatórios",
    subtitle: "Filtros operacionais e exportação compatível com Excel.",
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
    title: "Administrar usuários",
    subtitle: "Cadastro, alteração de acesso e controle de perfis.",
    showExport: false,
    showNewRequest: false
  },
  admin_config: {
    title: "Configurações",
    subtitle: "Gerencie listas e opções exibidas nos campos do sistema.",
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
    { code: "aguardando_informacoes", label: "Aguardando informações" },
    { code: "em_preparacao_da_proposta", label: "Em Elaboração da Proposta" },
    { code: "proposta_finalizada", label: "Proposta finalizada" }
  ],
  negociacoes: [
    { code: "enviada_ao_vendedor", label: "Recebimento de Proposta" },
    { code: "em_negociacao", label: "Em negociacao" },
    { code: "proposta_aceita", label: "Proposta Ganha" },
    { code: "perdida", label: "Perdida" },
    { code: "cancelada", label: "Cancelada" }
  ],
  contratos: [
    { code: "proposta_aceita", label: "Proposta Ganha" },
    { code: "elaboracao_de_contrato", label: "Elaboracao de contrato" },
    { code: "negociacao_de_clausulas", label: "Negociacao de clausulas" },
    { code: "contrato_assinado", label: "Contrato assinado" }
  ]
};

const ALL_STAGE_CODES = Object.values(MODULE_STAGE_CONFIG)
  .flat()
  .map((stage) => stage.code);

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
    note: "Foco nas etapas de triagem, preparação e apoio operacional da proposta.",
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
    views: ["dashboard", "funil_vendas", "proposta_todas", "proposta_crm", "solicitacoes", "propostas", "negociacoes", "contratos", "relatorios", "alterar_senha", "admin_users", "admin_config"],
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
  admin_users: "admin",
  admin_config: "admin"
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
  stageAccess: [],
  mustChangePassword: false
};
let forcePasswordChange = false;
let adminUsersCache = [];
let auditLogsCache = [];
let availableRoles = [];
let adminLookupConfigCache = {
  categories: [],
  itemsByCategory: {},
  groupOptions: {}
};
let adminWorkflowStagesCache = [];
let activeAdminLookupCategory = "";
let notificationsCache = [];
let notificationsUnreadCount = 0;
let notificationPollTimer = null;
let appDataPollTimer = null;
let appDataRefreshInFlight = false;
let notificationToastSeenIds = new Set();
let notificationsPanelOpen = false;
const tableFilterState = new Map();
const tableFilterObservers = new Map();
let negotiationFiltersState = {
  dateStart: "",
  dateEnd: "",
  client: "",
  seller: ""
};
let proposalNumberRowsCache = [];
let proposalNumberAllRowsCache = [];
let crmProposalRequestsCache = [];
let requestSaveInFlight = false;
let clientMatchSearchTimer = null;
let clientMatchRequestToken = 0;
let clientMatchResultsCache = [];
let selectedExistingClient = null;
let proposalNumberSaveInFlight = false;
let proposalSaveInFlight = false;
let commercialSaveInFlight = false;
let contractSaveInFlight = false;
let lookupsCache = {
  branches: [],
  responsibles: [],
  leadSources: [],
  proposalStatuses: [],
  documentTypes: [],
  industries: [],
  serviceTypes: [],
  workScales: [],
  equipmentOptionsByService: {},
  lossReasons: [],
  cancelReasons: [],
  sellers: [],
  workflowStages: []
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
const APP_AUTO_REFRESH_INTERVAL_MS = 20000;
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

function normalizeClientName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function getRequestClientLinkInput() {
  return document.getElementById("request-client-id");
}

function buildSelectedClientFromDetail(detail) {
  if (!detail?.clientId) return null;
  return {
    id: detail.clientId,
    legalName: detail.legalName || detail.company || "",
    tradeName: detail.tradeName || "",
    cnpj: detail.cnpj || "",
    mainEmail: detail.mainEmail || "",
    address: detail.address || "",
    addressNumber: detail.addressNumber || "",
    addressComplement: detail.addressComplement || "",
    district: detail.district || "",
    city: detail.city || "",
    state: detail.state || "",
    zipCode: detail.zipCode || "",
    primaryContactName: detail.primaryContactName || "",
    primaryContactRole: detail.primaryContactRole || "",
    primaryContactEmail: detail.primaryContactEmail || "",
    primaryContactPhone: detail.primaryContactPhone || "",
    warningMessage: "",
    requestCount: detail.requestCount || 0,
    ownRequestCount: detail.ownRequestCount || 0,
    sellerNames: detail.seller || ""
  };
}

function renderClientMatchPanel({ loading = false, matches = null } = {}) {
  const panel = document.getElementById("client-match-panel");
  if (!panel) return;

  if (loading) {
    panel.style.display = "";
    panel.innerHTML = `<div class="muted">Buscando clientes já cadastrados...</div>`;
    return;
  }

  if (selectedExistingClient) {
    panel.style.display = "";
    panel.innerHTML = `
      <div class="list-item">
        <div class="list-top">
          <strong>Cliente vinculado: ${escapeHtml(selectedExistingClient.legalName || "-")}</strong>
          <button type="button" class="secondary" data-client-action="unlink">Desvincular</button>
        </div>
        <div class="muted">
          Novo negócio será criado dentro deste cadastro.
          ${selectedExistingClient.city || selectedExistingClient.state ? ` ${escapeHtml([selectedExistingClient.city, selectedExistingClient.state].filter(Boolean).join(" / "))}` : ""}
        </div>
      </div>
    `;
    return;
  }

  const safeMatches = Array.isArray(matches) ? matches : clientMatchResultsCache;
  if (!safeMatches.length) {
    panel.style.display = "none";
    panel.innerHTML = "";
    return;
  }

  panel.style.display = "";
  panel.innerHTML = `
    <div class="muted" style="margin-bottom:8px;">Clientes parecidos encontrados. Você pode reaproveitar um cadastro existente ou seguir com um novo.</div>
    ${safeMatches.map((match, index) => `
      <div class="list-item">
        <div class="list-top">
          <strong>${escapeHtml(match.legalName || "-")}</strong>
          <button type="button" class="secondary" data-client-action="select" data-client-index="${index}">Usar este cliente</button>
        </div>
        <div class="muted">
          ${escapeHtml([
            match.tradeName ? `Fantasia: ${match.tradeName}` : "",
            match.city ? `${match.city}/${match.state || ""}` : "",
            match.cnpj ? `CNPJ: ${match.cnpj}` : ""
          ].filter(Boolean).join(" | ") || "Cadastro existente")}
        </div>
        <div class="muted">
          ${escapeHtml(match.warningMessage || `${match.requestCount || 0} negócios já cadastrados para este cliente.`)}
        </div>
      </div>
    `).join("")}
  `;
}

function fillRequestFormWithClient(match) {
  document.getElementById("legal-name").value = match.legalName || "";
  document.getElementById("trade-name").value = match.tradeName || "";
  document.getElementById("cnpj").value = match.cnpj || "";
  document.getElementById("main-email").value = match.mainEmail || "";
  document.getElementById("address").value = match.address || "";
  document.getElementById("address-number").value = match.addressNumber || "";
  document.getElementById("address-complement").value = match.addressComplement || "";
  document.getElementById("district").value = match.district || "";
  document.getElementById("city").value = match.city || "";
  document.getElementById("state").value = match.state || "";
  document.getElementById("zip-code").value = match.zipCode || "";
  document.getElementById("primary-contact-name").value = match.primaryContactName || "";
  document.getElementById("primary-contact-role").value = match.primaryContactRole || "";
  document.getElementById("primary-contact-email").value = match.primaryContactEmail || "";
  document.getElementById("primary-contact-phone").value = match.primaryContactPhone || "";
}

function selectExistingClient(match) {
  selectedExistingClient = match ? { ...match } : null;
  getRequestClientLinkInput().value = selectedExistingClient?.id || "";
  if (selectedExistingClient) {
    fillRequestFormWithClient(selectedExistingClient);
  }
  renderClientMatchPanel({ matches: [] });
}

function clearSelectedExistingClient({ preserveTypedName = false } = {}) {
  const currentLegalName = document.getElementById("legal-name").value;
  selectedExistingClient = null;
  getRequestClientLinkInput().value = "";
  clientMatchResultsCache = [];
  if (!preserveTypedName) {
    document.getElementById("legal-name").value = currentLegalName;
  }
  renderClientMatchPanel({ matches: [] });
}

async function searchExistingClients(term) {
  const normalizedTerm = String(term || "").trim();
  if (normalizedTerm.length < 3) {
    clientMatchResultsCache = [];
    renderClientMatchPanel({ matches: [] });
    return;
  }

  const requestToken = ++clientMatchRequestToken;
  renderClientMatchPanel({ loading: true });
  try {
    const response = await fetchWithSession(`/api/clients/search?term=${encodeURIComponent(normalizedTerm)}`);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Falha ao buscar clientes.");
    }
    if (requestToken !== clientMatchRequestToken) return;
    clientMatchResultsCache = result.matches || [];
    renderClientMatchPanel({ matches: clientMatchResultsCache });
  } catch (error) {
    if (requestToken !== clientMatchRequestToken) return;
    clientMatchResultsCache = [];
    renderClientMatchPanel({ matches: [] });
  }
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
    container.innerHTML = `<div class="muted">Nenhuma oportunidade com previsão próxima.</div>`;
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
      <div class="muted"><strong>Tipo de serviço:</strong> ${item.serviceScope || "-"}</div>
      <div class="muted"><strong>Valor:</strong> ${item.value || "-"}</div>
      <div class="muted"><strong>Margem:</strong> ${item.margin || "-"}</div>
      <div class="muted"><strong>Previsão:</strong> ${item.expectedCloseDate || "-"}</div>
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
      <div class="conversion-line"><span>Ganhas</span><strong>${item.accepted}</strong></div>
      <div class="conversion-line"><span>Fechadas</span><strong>${item.signed}</strong></div>
      <div class="conversion-line"><span>Conversão final</span><strong>${item.conversionRate}</strong></div>
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
  const historyContainer = document.getElementById("proposal-revision-history");

  if (!item?.proposalNumber) {
    card.style.display = "none";
    container.innerHTML = "";
    if (historyContainer) historyContainer.innerHTML = "";
    return;
  }

  const fields = [
    ["Numero", proposalNumberLink(item)],
    ["Data", item.proposalIssueDate || "-"],
    ["Status", item.proposalStatus || "-"],
    ["Valor", item.proposalValue || "-"],
    ["Responsável pelo negócio", item.proposalManager || "-"]
  ];

  card.style.display = "";
  container.innerHTML = fields.map(([key, value]) => `
    <div class="field">
      <div class="k">${key}</div>
      <div class="v">${value}</div>
    </div>
  `).join("");

  if (historyContainer) {
    const rows = item.revisionHistory || [];
    historyContainer.innerHTML = rows.length
      ? `
        <table class="proposal-history-table revision-history-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Origem</th>
              <th>Etapa</th>
              <th>Responsável</th>
              <th>Valor</th>
              <th>Margem</th>
              <th>Observações</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${row.createdAtLabel || "-"}</td>
                <td>${row.entryTypeLabel || "-"}</td>
                <td>${row.stageLabel || "-"}</td>
                <td>${row.actorLabel || "-"}</td>
                <td>${row.proposalValueLabel || "-"}</td>
                <td>${row.bdiLabel || "-"}</td>
                <td>${row.notes || "-"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `
      : `<div class="muted">Nenhum histórico de valor e margem registrado ainda.</div>`;
  }
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
  summary.textContent = `${items.length} número(s) | último: ${latest} | histórico: ${importedCount}`;

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
      currentStage: item.commercialStageLabel || item.stageLabel || "Em negociacao",
      stageCode: item.commercialStageCode || item.stageCode || "em_negociacao",
      slaStatus: "Sem SLA",
      currentOwner: item.manager || "-",
      updatedAt: item.issueDate || "-",
      isProposalOnly: true
    }));

  return [...baseRows, ...proposalOnlyRows];
}

function buildContractRows() {
  return proposalNumberAllRowsCache.map((item) => ({
    id: item.requestId || "",
    requestNumber: item.requestNumber || "-",
    proposalNumber: item.proposalNumberDisplay,
    proposalRegistryId: item.id,
    company: item.clientName || "-",
    seller: item.manager || "-",
    currentStage: item.stageLabel || "Proposta Ganha",
    stageCode: item.stageCode || "proposta_aceita",
    slaStatus: item.stageCode === "contrato_assinado" ? "Encerrado" : "Sem SLA",
    currentOwner: item.manager || "-",
    updatedAt: item.issueDate || "-"
  }));
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
  const currentMonth = getSaoPauloNow().toLocaleDateString("pt-BR", {
    timeZone: APP_TIMEZONE,
    month: "2-digit",
    year: "numeric"
  });
  const currentMonthCount = allItems.filter((item) => String(item.issueDate || "").slice(3) === currentMonth).length;
  const totalValue = allItems.reduce((sum, item) => sum + Number(item.proposalValueRaw || 0), 0);
  const filteredValue = filteredItems.reduce((sum, item) => sum + Number(item.proposalValueRaw || 0), 0);
  const bdiItems = allItems.filter((item) => item.bdiRaw !== null && item.bdiRaw !== undefined && item.bdiRaw !== "");
  const avgBdi = bdiItems.length
    ? (bdiItems.reduce((sum, item) => sum + Number(item.bdiRaw || 0), 0) / bdiItems.length) * 100
    : 0;

  const cards = [
    { label: "Total de propostas", value: String(allItems.length), note: `${currentMonthCount} neste mes`, tone: "info" },
    { label: "Volume total", value: formatCurrency(totalValue), note: "histórico completo", tone: "ok" },
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
            ? `
              <button type="button" class="table-action proposal-generate-button" data-request-id="${item.requestId}">Gerar numero</button>
              ${rolePermissions(currentRole).deleteRequest
                ? `<button type="button" class="table-action danger request-delete-button" data-request-id="${item.requestId}">Excluir</button>`
                : ""}
            `
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
  const currentMonth = getSaoPauloNow().toLocaleDateString("pt-BR", {
    timeZone: APP_TIMEZONE,
    month: "2-digit",
    year: "numeric"
  });
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
  const averageBdiItems = lines.filter((item) => item.bdi !== "" && item.bdi !== null && item.bdi !== undefined);
  const averageBdi = averageBdiItems.length
    ? averageBdiItems.reduce((sum, item) => sum + Number(item.bdi || 0), 0) / averageBdiItems.length
    : 0;

  if (lines.length) {
    document.getElementById("proposal-number-value").value = totalValue ? totalValue.toFixed(2) : "";
    document.getElementById("proposal-number-bdi").value = averageBdiItems.length ? averageBdi.toFixed(4) : "";
  }
}

function renderStageBoard(moduleKey, rows) {
  const stages = allowedStagesForModule(moduleKey);
  let activeStageCode = activeModuleStage[moduleKey];
  const tabsContainer = document.getElementById(`${moduleKey}-stage-tabs`);
  const tableContainer = document.getElementById(`${moduleKey}-stage-table`);

  if (!stages.length) {
    tabsContainer.innerHTML = "";
    tableContainer.innerHTML = `
      <tr>
        <td colspan="8" class="muted">Nenhuma etapa liberada para este usuário.</td>
      </tr>
    `;
    return;
  }

  if (!stages.some((stage) => stage.code === activeStageCode)) {
    activeModuleStage[moduleKey] = stages[0].code;
    activeStageCode = stages[0].code;
  }

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

function defaultStageAccessForRole(roleName) {
  const defaults = {
    vendedor: ["solicitacao_criada", "aguardando_informacoes", "enviada_ao_vendedor", "em_negociacao", "proposta_aceita", "perdida", "cancelada"],
    comercial_interno: [...ALL_STAGE_CODES],
    propostas: ["em_triagem", "aguardando_informacoes", "em_preparacao_da_proposta", "proposta_finalizada"],
    juridico: ["proposta_aceita", "elaboracao_de_contrato", "negociacao_de_clausulas", "contrato_assinado"],
    gestor: [...ALL_STAGE_CODES],
    diretoria: [...ALL_STAGE_CODES],
    administrador: [...ALL_STAGE_CODES]
  };
  return defaults[roleName] || [...ALL_STAGE_CODES];
}

function normalizeStageAccess(stageAccess, roleName = currentRole) {
  const base = Array.isArray(stageAccess)
    ? stageAccess
    : String(stageAccess || "").split(",").map((item) => item.trim()).filter(Boolean);
  const normalized = [...new Set(base.filter((item) => ALL_STAGE_CODES.includes(item)))];
  return normalized.length ? normalized : defaultStageAccessForRole(roleName);
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

function applyAdminStageSelection(stageAccess = []) {
  document.querySelectorAll('input[name="stageAccess"]').forEach((input) => {
    input.checked = stageAccess.includes(input.value);
  });
}

function allowedStagesForModule(moduleKey, stageAccess = currentUser.stageAccess || [], roleName = currentRole) {
  const allowed = normalizeStageAccess(stageAccess, roleName);
  return (MODULE_STAGE_CONFIG[moduleKey] || []).filter((stage) => allowed.includes(stage.code));
}

function isViewAllowedByModule(view, moduleAccess = currentUser.moduleAccess || []) {
  const requiredModule = VIEW_MODULE_MAP[view];
  if (!requiredModule) return true;
  return expandLegacyModules(moduleAccess).includes(requiredModule);
}

function isViewAllowedByStage(view, stageAccess = currentUser.stageAccess || [], roleName = currentRole) {
  const stageViews = ["solicitacoes", "propostas", "negociacoes", "contratos"];
  if (!stageViews.includes(view)) return true;
  return allowedStagesForModule(view, stageAccess, roleName).length > 0;
}

function renderAdminUsers(users) {
  const container = document.getElementById("admin-users-table");
  const summary = document.getElementById("admin-users-summary");
  summary.textContent = `${users.length} usuário(s)`;

  if (!users.length) {
    container.innerHTML = `
      <tr>
        <td colspan="5" class="muted">Nenhum usuário cadastrado.</td>
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
      <td>${formatDateTimeToBr(item.createdAt)}</td>
      <td>${item.actorName}${item.actorRole ? `<div class="muted">${roleLabel(item.actorRole)}</div>` : ""}</td>
      <td>${item.actionType}</td>
      <td>${item.entityType}${item.entityId ? ` #${item.entityId}` : ""}</td>
      <td>${item.description}</td>
    </tr>
  `).join("");
}

function getAdminLookupCategoryMeta(categoryKey = activeAdminLookupCategory) {
  return adminLookupConfigCache.categories.find((item) => item.key === categoryKey) || null;
}

function renderAdminLookupCategories() {
  const container = document.getElementById("admin-lookup-categories");
  const summary = document.getElementById("admin-lookup-category-summary");
  if (!container || !summary) return;

  const categories = adminLookupConfigCache.categories || [];
  summary.textContent = `${categories.length} categoria(s)`;

  if (!categories.length) {
    container.innerHTML = `<div class="empty-state">Nenhuma categoria configurada.</div>`;
    return;
  }

  container.innerHTML = categories.map((category) => {
    const items = adminLookupConfigCache.itemsByCategory?.[category.key] || [];
    const activeCount = items.filter((item) => item.isActive).length;
    return `
      <button
        type="button"
        class="admin-lookup-category-button ${category.key === activeAdminLookupCategory ? "active" : ""}"
        data-lookup-category="${category.key}"
      >
        <strong>${escapeHtml(category.label)}</strong>
        <span>${activeCount} item(ns) ativo(s)</span>
      </button>
    `;
  }).join("");
}

function renderAdminLookupItems(categoryKey = activeAdminLookupCategory) {
  const title = document.getElementById("admin-lookup-title");
  const description = document.getElementById("admin-lookup-description");
  const table = document.getElementById("admin-lookup-items-table");
  if (!title || !description || !table) return;

  const category = getAdminLookupCategoryMeta(categoryKey);
  if (!category) {
    title.textContent = "Itens da lista";
    description.textContent = "Selecione uma categoria para administrar os itens.";
    table.innerHTML = `<tr><td colspan="5" class="muted">Nenhuma categoria selecionada.</td></tr>`;
    return;
  }

  title.textContent = category.label;
  description.textContent = category.description || "Lista administrável pelo módulo de configurações.";

  const items = adminLookupConfigCache.itemsByCategory?.[category.key] || [];
  if (!items.length) {
    table.innerHTML = `<tr><td colspan="5" class="muted">Nenhum item cadastrado nesta categoria.</td></tr>`;
    return;
  }

  table.innerHTML = items.map((item) => `
    <tr>
      <td>${escapeHtml(item.value)}</td>
      <td>${escapeHtml(
        Array.isArray(item.groupKeys) && item.groupKeys.length
          ? item.groupKeys.join(", ")
          : (item.groupKey || "-")
      )}</td>
      <td>${item.sortOrder ?? "-"}</td>
      <td>${item.isActive ? "Ativo" : "Inativo"}</td>
      <td><button type="button" class="table-action admin-lookup-edit" data-lookup-id="${item.id}" data-lookup-category="${category.key}">Editar</button></td>
    </tr>
  `).join("");
}

function syncAdminLookupGroupOptions(categoryKey = activeAdminLookupCategory) {
  const datalist = document.getElementById("admin-lookup-group-options");
  if (!datalist) return;
  const options = adminLookupConfigCache.groupOptions?.[categoryKey] || [];
  datalist.innerHTML = options.map((item) => `<option value="${escapeHtml(item)}"></option>`).join("");
}

function syncAdminLookupGroupControl(categoryKey = activeAdminLookupCategory) {
  const category = getAdminLookupCategoryMeta(categoryKey);
  const wrapper = document.getElementById("admin-lookup-group-control");
  const input = document.getElementById("admin-lookup-group-key");
  const multi = document.getElementById("admin-lookup-group-multi");
  if (!wrapper || !input || !multi) return;

  const grouped = Boolean(category?.grouped);
  const isEquipmentCategory = categoryKey === "equipmentOptions";
  wrapper.hidden = !grouped;
  input.hidden = isEquipmentCategory;
  input.required = grouped && !isEquipmentCategory;
  multi.hidden = !(grouped && isEquipmentCategory);
  if (!grouped) {
    input.value = "";
  }
  syncAdminLookupGroupOptions(categoryKey);

  if (grouped && isEquipmentCategory) {
    const options = adminLookupConfigCache.groupOptions?.[categoryKey] || [];
    multi.innerHTML = options.map((item) => `
      <label class="admin-lookup-group-option">
        <input type="checkbox" name="adminLookupGroupKeys" value="${escapeHtml(item)}" />
        <span>${escapeHtml(item)}</span>
      </label>
    `).join("");
  } else {
    multi.innerHTML = "";
  }
}

function populateAdminLookupForm(item = null) {
  const category = getAdminLookupCategoryMeta();
  document.getElementById("admin-lookup-category-key").value = category?.key || "";
  document.getElementById("admin-lookup-item-id").value = item?.id || "";
  document.getElementById("admin-lookup-related-ids").value = (item?.relatedIds || []).join(",");
  document.getElementById("admin-lookup-value").value = item?.value || "";
  document.getElementById("admin-lookup-group-key").value = item?.groupKey || "";
  document.getElementById("admin-lookup-sort-order").value = item?.sortOrder ?? "";
  document.getElementById("admin-lookup-active").value = String(item?.isActive ?? true);
  syncAdminLookupGroupControl(category?.key || "");
  const selectedGroupKeys = new Set((item?.groupKeys || []).map((entry) => String(entry)));
  document.querySelectorAll('input[name="adminLookupGroupKeys"]').forEach((input) => {
    input.checked = selectedGroupKeys.has(input.value);
  });
}

function resetAdminLookupForm() {
  const form = document.getElementById("admin-lookup-form");
  if (!form) return;
  form.reset();
  document.getElementById("admin-lookup-item-id").value = "";
  document.getElementById("admin-lookup-category-key").value = activeAdminLookupCategory || "";
  document.getElementById("admin-lookup-related-ids").value = "";
  document.getElementById("admin-lookup-active").value = "true";
  syncAdminLookupGroupControl(activeAdminLookupCategory);
}

function renderAdminWorkflowStages(items = adminWorkflowStagesCache) {
  const table = document.getElementById("admin-sla-table");
  if (!table) return;
  if (!items.length) {
    table.innerHTML = `<tr><td colspan="6" class="muted">Nenhuma etapa encontrada.</td></tr>`;
    return;
  }

  table.innerHTML = items.map((item) => `
    <tr>
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.code)}</td>
      <td>${item.slaHours ?? "Sem SLA"}</td>
      <td>${item.slaPaused ? "Sim" : "Nao"}</td>
      <td>${item.isTerminal ? "Sim" : "Nao"}</td>
      <td><button type="button" class="table-action admin-sla-edit" data-stage-id="${item.id}">Editar</button></td>
    </tr>
  `).join("");
}

function populateAdminWorkflowStageForm(item = null) {
  document.getElementById("admin-sla-stage-id").value = item?.id || "";
  document.getElementById("admin-sla-stage-name").value = item ? `${item.name} (${item.code})` : "";
  document.getElementById("admin-sla-hours").value = item?.slaHours ?? "";
  document.getElementById("admin-sla-paused").value = String(item?.slaPaused ?? false);
}

function resetAdminWorkflowStageForm() {
  const form = document.getElementById("admin-sla-form");
  if (!form) return;
  form.reset();
  document.getElementById("admin-sla-stage-id").value = "";
  document.getElementById("admin-sla-stage-name").value = "";
  document.getElementById("admin-sla-paused").value = "false";
}

function setActiveAdminLookupCategory(categoryKey) {
  if (!categoryKey) return;
  activeAdminLookupCategory = categoryKey;
  renderAdminLookupCategories();
  renderAdminLookupItems(categoryKey);
  resetAdminLookupForm();
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

function populateDataList(listId, items = []) {
  const list = document.getElementById(listId);
  if (!list) return;
  list.innerHTML = (items || []).map((item) => `<option value="${escapeHtml(item)}"></option>`).join("");
}

function renderServiceTypeChips(items = []) {
  const container = document.getElementById("service-type-chips");
  if (!container) return;
  const selected = new Set(
    [...container.querySelectorAll('input[name="serviceType"]:checked')].map((input) => normalizeServiceLabel(input.value))
  );
  const normalizedItems = [...new Set((items || []).map((item) => normalizeServiceLabel(item)).filter(Boolean))];
  container.innerHTML = normalizedItems.map((item) => `
    <label class="chip">
      <input type="checkbox" name="serviceType" value="${escapeHtml(item)}" ${selected.has(item) ? "checked" : ""} />
      ${escapeHtml(item)}
    </label>
  `).join("");
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
  populateDataList("responsible-options", lookups.responsibles || []);
  renderServiceTypeChips(lookups.serviceTypes || []);
  syncAdminLookupGroupOptions("equipmentOptions");
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
  applyAdminStageSelection(defaultStageAccessForRole(defaultRole));
}

async function deleteRequestAndRefresh(requestId) {
  const response = await fetchWithSession(`/api/requests/${requestId}`, {
    method: "DELETE"
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Falha ao excluir solicitacao.");
  }

  const [requests, reportItems] = await Promise.all([
    refreshRequestsTable(),
    refreshReports(),
    refreshProposalNumbers(),
    refreshCrmProposalRequests(),
    refreshDashboard()
  ]);

  reportRowsCache = reportItems;
  renderAllStageBoards(reportRowsCache);

  if (selectedRequestId && String(selectedRequestId) === String(requestId)) {
    if (requests.length) {
      await selectRequest(requests[0].id);
    } else {
      selectedRequestId = null;
      updateRequestDeleteButton(null);
      renderDetail(requestDetailFallback());
      renderHistory([]);
      renderAttachmentList("proposal-attachments", [], ["anexo_inicial", "documento_tecnico_cliente", "documentacao_contratual"]);
      renderAttachmentList("commercial-attachments", [], ["proposta_final_pdf", "anexo_proposta_complementar", "planilha_aberta_proposta", "proposta_tecnica", "anexo_aceite"]);
      renderAttachmentList("contract-attachments", [], ["documentacao_contratual", "minuta_inicial", "contrato_assinado"]);
      populateProposalForm(requestDetailFallback());
      populateCommercialForm(requestDetailFallback());
      populateContractForm(requestDetailFallback());
      populateProposalNumberLinkedRequest(null);
    }
  }

  return result;
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
  applyAdminStageSelection(user.stageAccess || []);
}

function renderAllStageBoards(rows) {
  Object.keys(MODULE_STAGE_CONFIG).forEach((moduleKey) => {
    let moduleRows = rows;
    if (moduleKey === "negociacoes") {
      moduleRows = applyNegotiationFilters(buildNegotiationRows(rows));
    } else if (moduleKey === "contratos") {
      moduleRows = buildContractRows();
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
  const allowedViews = role.views.filter((item) => isViewAllowedByModule(item) && isViewAllowedByStage(item));
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
    const allowedByRole = role.views.includes(link.dataset.viewLink)
      && isViewAllowedByModule(link.dataset.viewLink)
      && isViewAllowedByStage(link.dataset.viewLink);
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
      alert(`Não foi possível carregar a administração de usuários: ${error.message}`);
    });
  }
}

function syncProposalNumberForm() {
  document.getElementById("proposal-number-issue-date").value = getSaoPauloIsoDate();
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
    ["Contato do cliente", item.primaryContactName || item.contactName || "-"],
    ["Cidade", item.city || "-"],
    ["Estado", item.state || "-"],
    ["Etapa atual", item.stage],
    ["SLA", item.slaStatus],
    ["Responsável atual", item.currentOwner],
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
  const negotiationContainer = document.getElementById("history-negotiations");
  const stageContainer = document.getElementById("history-stages");
  if (!negotiationContainer || !stageContainer) return;

  const negotiationItems = items.filter((item) => item.type === "negotiation");
  const stageItems = items.filter((item) => item.type !== "negotiation");
  const renderItems = (entries, emptyMessage) => entries.length
    ? entries.map((item) => `
    <div class="event">
      <strong>${item.title}</strong>
      <div class="muted">${item.meta}</div>
      <div class="muted">${item.note}</div>
    </div>
  `).join("")
    : `<div class="event empty-history">${emptyMessage}</div>`;

  negotiationContainer.innerHTML = renderItems(negotiationItems, "Nenhuma atualização de negociação registrada ainda.");
  stageContainer.innerHTML = renderItems(stageItems, "Nenhuma atualização de etapa registrada ainda.");
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
    contactName: detail.contactName || "-",
    city: detail.city || "-",
    state: detail.state || "-",
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
    nextAction: detail.commercialNextAction || detail.nextAction || detail.commercialAcceptedNote || detail.notes || "Negócio histórico em andamento"
  });

  const history = detail.history?.length
    ? [...detail.history]
    : [
        {
          title: detail.stage || "Negócio histórico",
          meta: `${detail.issueDate || "-"} - ${detail.manager || detail.seller || "Sistema"}`,
          note: detail.notes || "Registro importado para acompanhamento comercial.",
          type: "stage"
        }
      ];

  if (detail.commercialAcceptedAt) {
    history.unshift({
      title: "Proposta Ganha",
      meta: `${formatIsoDateToBr(detail.commercialAcceptedAt)} - ${detail.manager || detail.seller || "Sistema"}`,
      note: detail.commercialAcceptedNote || detail.commercialAcceptedScope || "Aceite comercial registrado.",
      type: "stage"
    });
  }

  if (detail.contractStartedAt || detail.draftVersion) {
    history.unshift({
      title: "Andamento contratual",
      meta: `${formatIsoDateToBr(detail.contractStartedAt)} - ${detail.manager || detail.seller || "Sistema"}`,
      note: detail.draftVersion || detail.documentPendingNotes || "Contrato em andamento.",
      type: "stage"
    });
  }

  renderHistory(history);
}

function renderAttachmentList(containerId, items, allowedTypes = []) {
  const container = document.getElementById(containerId);
  const filtered = allowedTypes.length
    ? items.filter((item) => allowedTypes.includes(item.attachmentType))
    : items;
  const permissions = rolePermissions(currentRole);
  const canDelete = Boolean(
    permissions.createRequest
    || permissions.saveProposal
    || permissions.saveCommercial
    || permissions.saveContract
    || permissions.manageUsers
  );

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
      <div class="attachment-actions">
        <a class="attachment-link" href="/api/attachments/${item.id}/download?${sessionQueryString()}" target="_blank" rel="noopener noreferrer">Baixar</a>
        ${canDelete ? `<button type="button" class="secondary danger attachment-delete-button" data-attachment-id="${item.id}" data-request-id="${item.requestId || selectedRequestId || ""}">Excluir</button>` : ""}
      </div>
    </div>
  `).join("");
}

function formatSummaryValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (value === true) return "Sim";
  if (value === false) return "Nao";
  return String(value);
}

function buildServiceOperationSummary(posts = [], equipments = []) {
  const services = [...new Set([
    ...posts.map((item) => normalizeServiceLabel(item.postType || item.category || "")),
    ...equipments.map((item) => normalizeServiceLabel(item.category || item.postType || ""))
  ].filter(Boolean))];
  if (!services.length) return ["Nenhum serviço informado."];

  return services.map((serviceName) => {
    const servicePosts = posts.filter((item) => normalizeServiceLabel(item.postType || item.category || "") === serviceName);
    const serviceEquipments = equipments.filter((item) => normalizeServiceLabel(item.category || item.postType || "") === serviceName);
    const showAdditional = serviceUsesAdditional(serviceName);
    const showIndemnified = serviceUsesIndemnified(serviceName);
    const postLines = servicePosts.length
      ? servicePosts.map((item) => [
        `Postos: ${formatSummaryValue(item.qtyPosts ?? item.postQty)}`,
        `Funcionarios: ${formatSummaryValue(item.qtyWorkers ?? item.workerQty)}`,
        `Funcao: ${formatSummaryValue(item.functionName)}`,
        `Escala: ${formatSummaryValue(item.workScale)}`,
        `Entrada: ${formatSummaryValue(item.startTime)}`,
        `Saida: ${formatSummaryValue(item.endTime)}`,
        `Sabado entrada: ${formatSummaryValue(item.saturdayStartTime ?? item.saturdayTime)}`,
        `Sabado saida: ${formatSummaryValue(item.saturdayEndTime)}`,
        `Feriado: ${formatSummaryValue(item.holidayFlag)}`,
        showAdditional ? `Adicional: ${formatSummaryValue(item.additionalType)}` : null,
        `Gratificacao %: ${formatSummaryValue(item.gratificationPercentage)}`,
        showIndemnified ? `Indenizado: ${formatSummaryValue(item.indemnifiedFlag)}` : null,
        `Uniforme: ${formatSummaryValue(item.uniformText)}`,
        `Ajuda de custo: ${formatSummaryValue(item.costAllowanceValue ?? item.costAllowance)}`
      ].filter(Boolean).join(" | "))
      : ["Nenhum posto informado."];
    const equipmentLines = serviceEquipments.length
      ? serviceEquipments.map((item) => [
        `Equipamento: ${formatSummaryValue(item.equipmentName)}`,
        `Quantidade: ${formatSummaryValue(item.quantity ?? item.equipmentQty)}`,
        `Observacao: ${formatSummaryValue(item.notes ?? item.equipmentNotes)}`
      ].join(" | "))
      : ["Nenhum equipamento informado."];

    return `${serviceName}
Postos:
- ${postLines.join("\n- ")}
Equipamentos:
- ${equipmentLines.join("\n- ")}`;
  });
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
        ${items.map((item) => `<li>${String(item).replaceAll("\n", "<br>")}</li>`).join("")}
      </ul>
    </div>
  `;
}

function renderProposalRequestSummary(detail) {
  const container = document.getElementById("proposal-request-summary");
  if (!container) return;

  const normalizedServices = [...new Set((detail.services || []).map((item) => normalizeServiceLabel(humanizeWorkflowText(item.serviceType))).filter(Boolean))];
  const benefits = (detail.benefits || []).map((item) => {
    const parts = [humanizeWorkflowText(item.benefitType)];
    if (item.optionLabel) parts.push(item.optionLabel);
    if (item.regionValue !== null && item.regionValue !== undefined) parts.push(`Regiao/dia: ${item.regionValue}`);
    if (item.notes) parts.push(item.notes);
    return parts.join(" | ");
  });
  const operationSummary = buildServiceOperationSummary(detail.posts || [], detail.equipments || []);
  const requestContext = [
    detail.initialNote ? `Solicitacao inicial: ${detail.initialNote}` : null,
    detail.generalNotes ? `Observacoes gerais: ${detail.generalNotes}` : null,
    detail.technicalDocNotes ? `Documento tecnico: ${detail.technicalDocNotes}` : null,
    detail.requiredDocumentsNotes ? `Documentacao para contratos: ${detail.requiredDocumentsNotes}` : null
  ].filter(Boolean);

  container.innerHTML = [
    renderSummaryCard("Contexto da solicitacao", requestContext),
    renderSummaryCard("Tipos de servico", normalizedServices),
    renderSummaryCard("Beneficios", benefits),
    renderSummaryCard("Operacao por servico", operationSummary)
  ].join("");
}

function workflowViewFromStage(stageCode, fallbackView = "solicitacoes") {
  if ((MODULE_STAGE_CONFIG.propostas || []).some((stage) => stage.code === stageCode)) return "propostas";
  if ((MODULE_STAGE_CONFIG.negociacoes || []).some((stage) => stage.code === stageCode)) return "negociacoes";
  if ((MODULE_STAGE_CONFIG.contratos || []).some((stage) => stage.code === stageCode)) return "contratos";
  if ((MODULE_STAGE_CONFIG.solicitacoes || []).some((stage) => stage.code === stageCode)) return "solicitacoes";
  return fallbackView;
}

function preferredWorkflowView(detail, fallbackView = "solicitacoes") {
  if (detail?.stageCode === "aguardando_informacoes") {
    return "solicitacoes";
  }
  if (detail?.stageCode === "em_preparacao_da_proposta" && !detail?.proposalRegistryId && !detail?.proposalNumber) {
    return "proposta_crm";
  }
  return workflowViewFromStage(detail?.stageCode, fallbackView);
}

function renderProposalNextStageOptions(stageCode) {
  const select = document.getElementById("next-stage-code");
  if (!select) return;

  const optionsByStage = {
    em_triagem: [
      { value: "em_triagem", label: "Em triagem" },
      { value: "aguardando_informacoes", label: "Aguardando informações" },
      { value: "em_preparacao_da_proposta", label: "Em Elaboração da Proposta" }
    ],
    aguardando_informacoes: [
      { value: "aguardando_informacoes", label: "Aguardando informações" },
      { value: "em_triagem", label: "Em triagem" },
      { value: "em_preparacao_da_proposta", label: "Em Elaboração da Proposta" }
    ],
    em_preparacao_da_proposta: [
      { value: "em_preparacao_da_proposta", label: "Em Elaboração da Proposta" },
      { value: "aguardando_informacoes", label: "Aguardando informações" },
      { value: "proposta_finalizada", label: "Proposta finalizada" }
    ],
    proposta_finalizada: [
      { value: "proposta_finalizada", label: "Proposta finalizada" },
      { value: "enviada_ao_vendedor", label: "Recebimento de Proposta" }
    ]
  };

  const options = optionsByStage[stageCode] || [
    { value: "em_triagem", label: "Em triagem" },
    { value: "aguardando_informacoes", label: "Aguardando informações" },
    { value: "em_preparacao_da_proposta", label: "Em Elaboração da Proposta" },
    { value: "proposta_finalizada", label: "Proposta finalizada" },
    { value: "enviada_ao_vendedor", label: "Recebimento de Proposta" }
  ];

  select.innerHTML = [
    '<option value=""></option>',
    ...options.map((item) => `<option value="${item.value}">${item.label}</option>`)
  ].join("");
  select.value = "";
}

function populateProposalForm(detail) {
  document.getElementById("selected-request-id").value = detail.id || "";
  document.getElementById("selected-request-number").value = detail.requestNumber || "";
  document.getElementById("selected-request-company").value = detail.company || "";
  document.getElementById("selected-request-stage").value = detail.stage || "";
  document.getElementById("selected-request-proposal-number").value = detail.proposalNumber || "Nao gerado";
  renderProposalNextStageOptions(detail.stageCode);
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
  document.getElementById("commercial-request-id").value = detail.requestId || detail.id || "";
  document.getElementById("commercial-proposal-registry-id").value = detail.proposalRegistryId || "";
  document.getElementById("commercial-request-number").value = detail.requestNumber || "-";
  document.getElementById("commercial-proposal-number").value = detail.proposalNumber || "-";
  document.getElementById("commercial-request-company").value = detail.company || detail.clientName || "";
  document.getElementById("commercial-request-stage").value = detail.proposalCommercialStageLabel || detail.commercialStageLabel || detail.stage || detail.stageLabel || "";
  document.getElementById("commercial-seller-name").value = detail.commercialSellerName || detail.seller || detail.manager || currentUser.name || "";
  document.getElementById("commercial-seller-email").value = detail.commercialSellerEmail || detail.sellerEmail || currentUser.email || "";
  document.getElementById("sent-to-seller-at").value = detail.commercialSentToSellerAt || detail.sentToSellerAt || "";
  document.getElementById("seller-receipt-confirmed").value = detail.commercialSellerReceiptConfirmed ? "true" : "false";
  document.getElementById("negotiation-status").value = detail.commercialNegotiationStatus || detail.status || "";
  document.getElementById("last-contact-at").value = detail.commercialLastContactAt || detail.lastContactAt || "";
  document.getElementById("expected-close-date").value = detail.commercialExpectedCloseDate || detail.expectedCloseDate || "";
  document.getElementById("commercial-next-action").value = detail.commercialNextAction || detail.nextAction || "";
  document.getElementById("commercial-notes").value = detail.commercialNotes || detail.notes || "";
  document.getElementById("negotiation-summary").value = "";
  document.getElementById("revised-proposal-value").value = "";
  document.getElementById("revised-proposal-bdi").value = "";
  document.getElementById("revised-proposal-value").placeholder = detail.proposalValueRaw || detail.proposalValue || "";
  document.getElementById("revised-proposal-bdi").placeholder = detail.bdiRaw || detail.proposalBdi || "";
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
  setFormSubmitState("commercial-form", false);
}

function populateContractForm(detail) {
  document.getElementById("contract-request-id").value = detail.requestId || detail.id || "";
  document.getElementById("contract-proposal-registry-id").value = detail.proposalRegistryId || "";
  document.getElementById("contract-request-number").value = detail.requestNumber || "-";
  document.getElementById("contract-request-company").value = detail.company || detail.clientName || "";
  document.getElementById("contract-request-stage").value = detail.proposalWorkflowStageLabel || detail.stage || detail.stageLabel || "";
  document.getElementById("contract-owner-name").value = detail.contractOwnerName || detail.manager || currentUser.name || "";
  document.getElementById("contract-owner-email").value = detail.contractOwnerEmail || detail.sellerEmail || currentUser.email || "";
  document.getElementById("contract-started-at").value = detail.contractStartedAt || "";
  document.getElementById("draft-version").value = detail.draftVersion || "";
  document.getElementById("clause-round-date").value = detail.clauseRoundDate || "";
  document.getElementById("contract-notes").value = detail.contractNotes || detail.notes || "";
  document.getElementById("document-pending-notes").value = detail.documentPendingNotes || "";
  document.getElementById("clauses-under-discussion").value = detail.clausesUnderDiscussion || "";
  document.getElementById("legal-notes").value = detail.legalNotes || "";
  document.getElementById("contract-next-action").value = detail.contractNextAction || detail.nextAction || "";
  document.getElementById("signed-at").value = detail.signedAt || "";
  document.getElementById("operation-start-date").value = detail.operationStartDate || "";
  document.getElementById("contract-next-stage-code").value = "";
  setFormSubmitState("contract-form", false);
}

function setCheckedValues(name, values = []) {
  const normalized = new Set((values || []).map((item) => String(item || "").trim().toLowerCase()));
  document.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
    input.checked = normalized.has(String(input.value || "").trim().toLowerCase());
  });
}

function clearTableBodyRows(tbodyId) {
  const tbody = document.getElementById(tbodyId);
  if (tbody) tbody.innerHTML = "";
}

function getSelectedServiceTypes() {
  return [...new Set(
    [...document.querySelectorAll('#service-type-chips input[name="serviceType"]:checked')]
      .map((item) => normalizeServiceLabel(item.value))
      .filter(Boolean)
  )];
}

function normalizedFieldKey(value) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function dedupeItems(items = [], createKey) {
  const seen = new Set();
  const unique = [];
  items.forEach((item) => {
    const key = createKey(item);
    if (!key || seen.has(key)) return;
    seen.add(key);
    unique.push(item);
  });
  return unique;
}

function isFilledValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function mergeOptionalValue(currentValue, nextValue) {
  if (isFilledValue(currentValue)) return currentValue;
  return nextValue;
}

function buildPostCoreKey(item) {
  return [
    normalizedFieldKey(item.postType),
    normalizedFieldKey(item.postQty),
    normalizedFieldKey(item.workerQty),
    normalizedFieldKey(item.functionName),
    normalizedFieldKey(item.workScale),
    normalizedFieldKey(item.startTime),
    normalizedFieldKey(item.endTime),
    normalizedFieldKey(item.saturdayStartTime ?? item.saturdayTime),
    normalizedFieldKey(item.saturdayEndTime),
    normalizedFieldKey(item.holidayFlag)
  ].join("|");
}

function dedupePostRows(items = []) {
  const merged = new Map();
  items.forEach((item) => {
    const key = buildPostCoreKey(item);
    if (!key) return;
    const current = merged.get(key);
    if (!current) {
      merged.set(key, { ...item });
      return;
    }
    merged.set(key, {
      ...current,
      additionalType: mergeOptionalValue(current.additionalType, item.additionalType),
      gratificationPercentage: mergeOptionalValue(current.gratificationPercentage, item.gratificationPercentage),
      indemnifiedFlag: mergeOptionalValue(current.indemnifiedFlag, item.indemnifiedFlag),
      uniformText: mergeOptionalValue(current.uniformText, item.uniformText),
      costAllowance: mergeOptionalValue(current.costAllowance, item.costAllowance)
    });
  });
  return [...merged.values()];
}

function dedupeEquipmentRows(items = []) {
  return dedupeItems(items, (item) => [
    normalizedFieldKey(item.category),
    normalizedFieldKey(item.equipmentName),
    normalizedFieldKey(item.equipmentQty ?? item.quantity),
    normalizedFieldKey(item.equipmentNotes ?? item.notes)
  ].join("|"));
}

function collectPostRowsFromDom() {
  return [...document.querySelectorAll(".post-row")].map((row) => ({
    postType: normalizeServiceLabel(row.dataset.service || ""),
    postQty: row.querySelector('[name="postQty[]"]')?.value || "",
    workerQty: row.querySelector('[name="workerQty[]"]')?.value || "",
    functionName: row.querySelector('[name="functionName[]"]')?.value || "",
    workScale: row.querySelector('[name="workScale[]"]')?.value || "",
    startTime: row.querySelector('[name="startTime[]"]')?.value || "",
    endTime: row.querySelector('[name="endTime[]"]')?.value || "",
    saturdayStartTime: row.querySelector('[name="saturdayStartTime[]"]')?.value || "",
    saturdayEndTime: row.querySelector('[name="saturdayEndTime[]"]')?.value || "",
    holidayFlag: row.querySelector('[name="holidayFlag[]"]')?.value || "",
    additionalType: row.querySelector('[name="additionalType[]"]')?.value || "",
    gratificationPercentage: row.querySelector('[name="gratificationPercentage[]"]')?.value || "",
    indemnifiedFlag: row.querySelector('[name="indemnifiedFlag[]"]')?.value || "",
    uniformText: row.querySelector('[name="uniformText[]"]')?.value || "",
    costAllowance: row.querySelector('[name="costAllowance[]"]')?.value || ""
  })).filter((item) => Object.entries(item).some(([key, value]) => key !== "postType" && Boolean(value)));
}

function collectEquipmentRowsFromDom() {
  return [...document.querySelectorAll(".equipment-row")].map((row) => ({
    category: normalizeServiceLabel(row.dataset.service || ""),
    equipmentName: row.querySelector('[name="equipmentName[]"]')?.value || "",
    equipmentQty: row.querySelector('[name="equipmentQty[]"]')?.value || "",
    equipmentNotes: row.querySelector('[name="equipmentNotes[]"]')?.value || ""
  })).filter((item) => Object.entries(item).some(([key, value]) => key !== "category" && Boolean(value)));
}

function getOperationServices(posts = [], equipments = []) {
  return [...new Set([
    ...getSelectedServiceTypes(),
    ...posts.map((item) => normalizeServiceLabel(item.postType || item.category || "")),
    ...equipments.map((item) => normalizeServiceLabel(item.category || item.postType || ""))
  ].filter(Boolean))];
}

function getEquipmentOptionsForService(serviceName) {
  return lookupsCache.equipmentOptionsByService?.[normalizeServiceLabel(serviceName)] || [];
}

function serviceUsesAdditional(serviceName) {
  const normalized = slugifyKey(normalizeServiceLabel(serviceName));
  return ["limpeza", "jardinagem", "manutencao", "zeladora"].includes(normalized);
}

function serviceUsesIndemnified(serviceName) {
  const normalized = slugifyKey(normalizeServiceLabel(serviceName));
  return normalized !== "limpeza";
}

function buildWorkScaleOptions(selectedValue = "") {
  const selected = String(selectedValue || "");
  const options = ['<option value=""></option>'];
  (lookupsCache.workScales || []).forEach((item) => {
    options.push(`<option value="${escapeHtml(item)}" ${selected === item ? "selected" : ""}>${escapeHtml(item)}</option>`);
  });
  if (selected && !(lookupsCache.workScales || []).includes(selected)) {
    options.push(`<option value="${escapeHtml(selected)}" selected>${escapeHtml(selected)}</option>`);
  }
  return options.join("");
}

function buildPostRowMarkup(serviceName, item = {}) {
  const holidayValue = item.holidayFlag === true ? "Sim" : item.holidayFlag === false ? "Nao" : String(item.holidayFlag || "");
  const additionalValue = String(item.additionalType || "");
  const showAdditional = serviceUsesAdditional(serviceName);
  const showIndemnified = serviceUsesIndemnified(serviceName);
  return `
    <tr class="post-row" data-service="${escapeHtml(serviceName)}">
      <td>${escapeHtml(serviceName)}</td>
      <td><input name="postQty[]" type="number" min="0" value="${escapeHtml(item.qtyPosts ?? item.postQty ?? "")}" /></td>
      <td><input name="workerQty[]" type="number" min="0" value="${escapeHtml(item.qtyWorkers ?? item.workerQty ?? "")}" /></td>
      <td><input name="functionName[]" value="${escapeHtml(item.functionName || "")}" /></td>
      <td><select name="workScale[]">${buildWorkScaleOptions(item.workScale || "")}</select></td>
      <td><input name="startTime[]" type="time" value="${escapeHtml(item.startTime || "")}" /></td>
      <td><input name="endTime[]" type="time" value="${escapeHtml(item.endTime || "")}" /></td>
      <td><input name="saturdayStartTime[]" type="time" value="${escapeHtml(item.saturdayStartTime ?? item.saturdayTime ?? "")}" /></td>
      <td><input name="saturdayEndTime[]" type="time" value="${escapeHtml(item.saturdayEndTime || "")}" /></td>
      <td><select name="holidayFlag[]"><option value=""></option><option value="Sim" ${holidayValue === "Sim" ? "selected" : ""}>Sim</option><option value="Nao" ${holidayValue === "Nao" ? "selected" : ""}>Nao</option><option value="Reveza" ${holidayValue === "Reveza" ? "selected" : ""}>Reveza</option></select></td>
      <td>${showAdditional
        ? `<select name="additionalType[]"><option value=""></option><option value="Sem Acréscimo" ${additionalValue === "Sem Acréscimo" ? "selected" : ""}>Sem Acréscimo</option><option value="Insalubridade 10%" ${additionalValue === "Insalubridade 10%" ? "selected" : ""}>Insalubridade 10%</option><option value="Insalubridade 20%" ${additionalValue === "Insalubridade 20%" ? "selected" : ""}>Insalubridade 20%</option><option value="Insalubridade 40%" ${additionalValue === "Insalubridade 40%" ? "selected" : ""}>Insalubridade 40%</option><option value="Periculosidade" ${additionalValue === "Periculosidade" ? "selected" : ""}>Periculosidade</option></select>`
        : `<input type="hidden" name="additionalType[]" value="" /><span class="muted inline-na">Nao se aplica</span>`}
      </td>
      <td><input name="gratificationPercentage[]" type="number" min="0" step="0.01" placeholder="%" value="${escapeHtml(item.gratificationPercentage || "")}" /></td>
      <td>${showIndemnified
        ? `<select name="indemnifiedFlag[]"><option value=""></option><option ${item.indemnifiedFlag === "Sim" ? "selected" : ""}>Sim</option><option ${item.indemnifiedFlag === "Nao" ? "selected" : ""}>Nao</option></select>`
        : `<input type="hidden" name="indemnifiedFlag[]" value="" /><span class="muted inline-na">Nao se aplica</span>`}
      </td>
      <td><select name="uniformText[]"><option value=""></option><option ${item.uniformText === "Padrao" ? "selected" : ""}>Padrao</option><option ${item.uniformText === "Social" ? "selected" : ""}>Social</option></select></td>
      <td><input name="costAllowance[]" type="number" min="0" step="0.01" value="${escapeHtml(item.costAllowanceValue ?? item.costAllowance ?? "")}" /></td>
      <td><button type="button" class="table-action delete-post-row">Excluir</button></td>
    </tr>
  `;
}

function buildEquipmentRowMarkup(serviceName, item = {}) {
  const dataListId = `equipment-options-${slugifyKey(serviceName)}`;
  return `
    <tr class="equipment-row" data-service="${escapeHtml(serviceName)}">
      <td>${escapeHtml(serviceName)}</td>
      <td><input name="equipmentName[]" list="${dataListId}" value="${escapeHtml(item.equipmentName || "")}" /></td>
      <td><input name="equipmentQty[]" type="number" min="0" value="${escapeHtml(item.quantity ?? item.equipmentQty ?? "")}" /></td>
      <td><input name="equipmentNotes[]" value="${escapeHtml(item.notes ?? item.equipmentNotes ?? "")}" /></td>
      <td><button type="button" class="table-action delete-equipment-row">Excluir</button></td>
    </tr>
  `;
}

function renderServiceOperationGroups(posts = [], equipments = []) {
  const container = document.getElementById("service-operation-groups");
  if (!container) return;

  const services = getOperationServices(posts, equipments);
  if (!services.length) {
    container.innerHTML = '<div class="service-operation-empty">Selecione pelo menos um tipo de serviço para organizar postos e equipamentos.</div>';
    return;
  }

  container.innerHTML = services.map((serviceName) => {
    const servicePosts = posts.filter((item) => String(item.postType || "").toLowerCase() === String(serviceName).toLowerCase());
    const serviceEquipments = equipments.filter((item) => String(item.category || "").toLowerCase() === String(serviceName).toLowerCase());
    const equipmentOptions = getEquipmentOptionsForService(serviceName);
    const dataListId = `equipment-options-${slugifyKey(serviceName)}`;

    return `
      <section class="service-operation-group">
        <div class="service-operation-head">
          <h4>${escapeHtml(serviceName)}</h4>
          <span>Itens da requisição para este serviço</span>
        </div>
        <div class="table-wrap">
          <table class="dense-table postos-table">
            <thead>
              <tr>
                <th>Serviço</th>
                <th>Qtd<br>postos</th>
                <th>Qtd<br>func.</th>
                <th>Funcao</th>
                <th>Escala</th>
                <th>Entrada</th>
                <th>Saida</th>
                <th>Sabado<br>entrada</th>
                <th>Sabado<br>saida</th>
                <th>Feriado</th>
                <th>Adicional</th>
                <th>Gratificação<br>%</th>
                <th>Indenizado</th>
                <th>Uniforme</th>
                <th>Ajuda de<br>custos</th>
                <th>Acao</th>
              </tr>
            </thead>
            <tbody data-post-service="${escapeHtml(serviceName)}">
              ${(servicePosts.length ? servicePosts : [{}]).map((item) => buildPostRowMarkup(serviceName, item)).join("")}
            </tbody>
          </table>
        </div>
        <div class="button-row inline-actions">
          <button type="button" class="secondary add-post-service-row" data-service="${escapeHtml(serviceName)}">Adicionar posto</button>
        </div>
        <div class="table-wrap">
          <datalist id="${dataListId}">
            ${equipmentOptions.map((item) => `<option value="${escapeHtml(item)}"></option>`).join("")}
          </datalist>
          <table class="dense-table equipamentos-table">
            <thead>
              <tr>
                <th>Serviço</th>
                <th>Equipamento</th>
                <th>Quantidade</th>
                <th>Observacao</th>
                <th>Acao</th>
              </tr>
            </thead>
            <tbody data-equipment-service="${escapeHtml(serviceName)}">
              ${(serviceEquipments.length ? serviceEquipments : [{}]).map((item) => buildEquipmentRowMarkup(serviceName, item)).join("")}
            </tbody>
          </table>
        </div>
        <div class="button-row inline-actions">
          <button type="button" class="secondary add-equipment-service-row" data-service="${escapeHtml(serviceName)}">Adicionar equipamento</button>
        </div>
      </section>
    `;
  }).join("");
}

function syncServiceOperationGroups() {
  renderServiceOperationGroups(collectPostRowsFromDom(), collectEquipmentRowsFromDom());
}

function renderPendingRequestBlock(detail) {
  const block = document.getElementById("request-pending-block");
  const summary = document.getElementById("request-pending-summary");
  const responseNote = document.getElementById("request-pending-response-note");
  const pendingInfo = detail?.pendingInfo;
  const shouldShow = detail?.stageCode === "aguardando_informacoes" && pendingInfo;

  block.hidden = !shouldShow;
  if (!shouldShow) {
    summary.textContent = "";
    responseNote.value = "";
    return;
  }

  summary.textContent = `Motivo: ${pendingInfo.pendingReason || "-"}
Detalhamento: ${pendingInfo.pendingDescription || "-"}
Responsável pela devolução: ${pendingInfo.pendingOwnerName || "-"}
Prazo da resposta: ${pendingInfo.pendingDueDate || "-"}
Última resposta registrada: ${pendingInfo.responseNote || "-"}
Respondido em: ${pendingInfo.respondedAt || "-"}`;
  responseNote.value = pendingInfo.responseNote || "";
}

function setRequestSaveState(inFlight) {
  requestSaveInFlight = Boolean(inFlight);
  const button = document.getElementById("save-request-button");
  if (!button) return;
  const idleLabel = button.dataset.idleLabel || "Salvar solicitacao";
  button.disabled = requestSaveInFlight;
  button.textContent = requestSaveInFlight ? "Salvando..." : idleLabel;
}

function setFormSubmitState(formId, inFlight, busyLabel = "Salvando...") {
  const form = document.getElementById(formId);
  const button = form?.querySelector('button[type="submit"]');
  if (!button) return;
  if (!button.dataset.idleLabel) {
    button.dataset.idleLabel = button.textContent.trim();
  }
  button.disabled = Boolean(inFlight);
  button.textContent = inFlight ? busyLabel : button.dataset.idleLabel;
}

function resetRequestForm() {
  const form = document.getElementById("request-form");
  form.reset();
  document.getElementById("request-id").value = "";
  document.getElementById("request-client-id").value = "";
  document.getElementById("request-submission-key").value = generateRequestSubmissionKey();
  document.getElementById("request-form-preview").textContent = "";
  document.getElementById("save-request-button").dataset.idleLabel = "Salvar solicitacao";
  setRequestSaveState(false);
  selectedExistingClient = null;
  clientMatchResultsCache = [];
  renderClientMatchPanel({ matches: [] });
  renderPendingRequestBlock(null);
  setCheckedValues("serviceType", []);
  setCheckedValues("transportOption", []);
  renderServiceOperationGroups();
  syncLoggedUserIntoForms();
}

function populateRequestForm(detail) {
  const form = document.getElementById("request-form");
  form.reset();
  document.getElementById("request-form-preview").textContent = "";
  setCheckedValues("serviceType", []);
  setCheckedValues("transportOption", []);
  renderServiceOperationGroups([], []);
  renderPendingRequestBlock(null);
  document.getElementById("request-id").value = detail.id || "";
  document.getElementById("request-client-id").value = detail.clientId || "";
  document.getElementById("request-submission-key").value = detail.id ? "" : generateRequestSubmissionKey();
  document.getElementById("request-date").value = detail.requestDateIso || "";
  document.getElementById("deadline-date").value = detail.deadlineDateIso || "";
  document.getElementById("seller-name").value = detail.seller || currentUser.name || "";
  document.getElementById("seller-email").value = detail.sellerEmail || currentUser.email || "";
  document.getElementById("branch-name").value = detail.branchName || "";
  document.getElementById("lead-source").value = detail.leadSource || "";
  document.getElementById("initial-note").value = detail.initialNote || "";
  document.getElementById("legal-name").value = detail.legalName || "";
  document.getElementById("trade-name").value = detail.tradeName || "";
  document.getElementById("cnpj").value = detail.cnpj || "";
  document.getElementById("industry-segment").value = detail.industrySegment || "";
  document.getElementById("main-email").value = detail.mainEmail || "";
  document.getElementById("address").value = detail.address || "";
  document.getElementById("address-number").value = detail.addressNumber || "";
  document.getElementById("address-complement").value = detail.addressComplement || "";
  document.getElementById("district").value = detail.district || "";
  document.getElementById("city").value = detail.city || "";
  document.getElementById("state").value = detail.state || "";
  document.getElementById("zip-code").value = detail.zipCode || "";
  document.getElementById("primary-contact-name").value = detail.primaryContactName || "";
  document.getElementById("primary-contact-role").value = detail.primaryContactRole || "";
  document.getElementById("primary-contact-email").value = detail.primaryContactEmail || "";
  document.getElementById("primary-contact-phone").value = detail.primaryContactPhone || "";
  document.getElementById("secondary-contact-name").value = detail.secondaryContactName || "";
  document.getElementById("secondary-contact-role").value = detail.secondaryContactRole || "";
  document.getElementById("secondary-contact-email").value = detail.secondaryContactEmail || "";
  document.getElementById("secondary-contact-phone").value = detail.secondaryContactPhone || "";
  document.getElementById("transport-region").value = detail.benefits?.find((item) => item.benefitType === "vale_transporte")?.regionValue || "18,00";
  document.getElementById("transport-notes").value = detail.benefits?.find((item) => item.benefitType === "vale_transporte")?.notes || "";
  document.getElementById("medical-notes").value = detail.benefits?.find((item) => item.benefitType === "assistencia_medica")?.notes || "";
  document.getElementById("meal-notes").value = detail.benefits?.find((item) => item.benefitType === "refeicao")?.notes || "";
  document.getElementById("food-notes").value = detail.benefits?.find((item) => item.benefitType === "vale_alimentacao")?.notes || "";
  document.getElementById("general-notes").value = detail.generalNotes || "";
  document.getElementById("technical-doc-notes").value = detail.technicalDocNotes || "";
  document.getElementById("required-documents-notes").value = detail.requiredDocumentsNotes || "";
  selectedExistingClient = buildSelectedClientFromDetail(detail);
  clientMatchResultsCache = [];
  renderClientMatchPanel({ matches: [] });
  document.getElementById("save-request-button").dataset.idleLabel = detail.stageCode === "aguardando_informacoes"
    ? "Salvar correções e devolver para triagem"
    : "Salvar solicitacao";
  setRequestSaveState(false);

  setCheckedValues("serviceType", (detail.services || []).map((item) => item.serviceType));
  setCheckedValues(
    "transportOption",
    (detail.benefits || [])
      .filter((item) => item.benefitType === "vale_transporte" && item.optionLabel)
      .map((item) => item.optionLabel)
  );
  renderServiceOperationGroups(detail.posts || [], detail.equipments || []);
  renderPendingRequestBlock(detail);
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
  if (!payload.triageOwnerName) missing.push("Responsável pela triagem");
  if (!payload.triageOwnerEmail) missing.push("Email do responsável");
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
    negotiationSummary: form.get("negotiationSummary"),
    revisedProposalValue: form.get("revisedProposalValue"),
    revisedBdi: form.get("revisedBdi"),
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
  if (!payload.sellerName) missing.push("Vendedor responsável");
  if (!payload.sellerEmail) missing.push("Email do vendedor");
  if (!payload.negotiationStatus && payload.nextStageCode !== "em_triagem") missing.push("Status da negociacao");
  if (!payload.nextStageCode) missing.push("Mover para etapa");
  if (payload.nextStageCode === "perdida" && !payload.lossReason) missing.push("Motivo padronizado da perda");
  if (payload.nextStageCode === "cancelada" && !payload.cancelReason) missing.push("Motivo padronizado do cancelamento");
  return missing;
}

function buildContractPayload() {
  const form = new FormData(document.getElementById("contract-form"));
  return {
    requestId: form.get("requestId"),
    proposalRegistryId: form.get("proposalRegistryId"),
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
  if (!payload.requestId && !payload.proposalRegistryId) missing.push("Selecione uma solicitacao");
  if (!payload.contractOwnerName) missing.push("Responsável pelo contrato");
  if (!payload.contractOwnerEmail) missing.push("Email do responsável");
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

async function buildRequestPayload() {
  const form = document.getElementById("request-form");
  const data = new FormData(form);
  const serviceTypes = getSelectedServiceTypes();
  const posts = dedupePostRows(collectPostRowsFromDom());
  const equipments = dedupeEquipmentRows(collectEquipmentRowsFromDom());

  return {
    requestId: data.get("requestId"),
    clientId: data.get("clientId"),
    submissionKey: data.get("submissionKey"),
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
    serviceTypes: [...new Set(serviceTypes)],
    transportRegion: data.get("transportRegion"),
    transportOptions: [...new Set([...document.querySelectorAll('input[name="transportOption"]:checked')].map((item) => item.value))],
    transportNotes: data.get("transportNotes"),
    medicalNotes: data.get("medicalNotes"),
    mealNotes: data.get("mealNotes"),
    foodNotes: data.get("foodNotes"),
    posts,
    equipments,
    generalNotes: data.get("generalNotes"),
    technicalDocNotes: data.get("technicalDocNotes"),
    requiredDocumentsNotes: data.get("requiredDocumentsNotes"),
    pendingResponseNote: data.get("pendingResponseNote"),
    initialAttachments: await collectFiles("initial-attachments"),
    technicalDocs: await collectFiles("technical-docs"),
    requiredDocumentsFiles: await collectFiles("required-documents-files")
  };
}

function validateRequestPayload(payload) {
  const missing = [];

  if (!payload.requestDate) missing.push("Data da solicitacao");
  if (!payload.deadlineDate) missing.push("Prazo de entrega");
  if (!payload.sellerName) missing.push("Vendedor responsável");
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
  const operationSummary = buildServiceOperationSummary(payload.posts, payload.equipments);

  const preview = `Razao social: ${payload.legalName || "-"}
Cliente vinculado: ${payload.clientId || "Novo cadastro"}
Nome fantasia: ${payload.tradeName || "-"}
CNPJ: ${payload.cnpj || "-"}
Email de faturamento: ${payload.mainEmail || "-"}
Contato principal: ${payload.primaryContactName || "-"}
Empresa / cliente: ${payload.legalName || "-"}
Vendedor: ${payload.sellerName || "-"}
Prazo de entrega: ${payload.deadlineDate || "-"}
Tipos de servico: ${payload.serviceTypes.join(", ") || "-"}

Beneficios:
Refeicao / VR: ${payload.mealNotes || "-"}
VA: ${payload.foodNotes || "-"}

Operacao por servico:
${operationSummary.join("\n\n") || "-"}

Observacoes gerais:
${payload.generalNotes || "-"}

Documentacao para contratos:
${payload.requiredDocumentsNotes || "-"}`;

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
    proposta_crm: "proposal-number-form-section",
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
  if (!payload.managerName) missing.push("Responsável pelo negócio");
  if (!payload.clientName && !payload.requestId) missing.push("Cliente ou solicitacao vinculada");
  return missing;
}

function syncLoggedUserIntoForms() {
  document.getElementById("request-date").value = getSaoPauloIsoDate();
  document.getElementById("seller-name").value = currentUser.name;
  document.getElementById("seller-email").value = currentUser.email;
  document.getElementById("proposal-number-manager-name").value = currentUser.name;
  document.getElementById("proposal-number-issue-date").value = getSaoPauloIsoDate();
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
    stageAccess: user.stageAccess || [],
    mustChangePassword: Boolean(user.mustChangePassword)
  };
  forcePasswordChange = Boolean(user.mustChangePassword);
  currentRole = user.primaryRole || user.roles?.[0] || "vendedor";
  syncLoggedUserIntoForms();
  resetChangePasswordForm();
  applyRoleAccess(currentRole);
  if (forcePasswordChange) {
    const feedback = document.getElementById("change-password-feedback");
    feedback.textContent = "Senha provisória detectada. Troque sua senha para continuar.";
    setActiveView("alterar_senha");
  }
}

function setupRequestForm() {
  syncLoggedUserIntoForms();
  renderServiceOperationGroups();
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

  document.getElementById("request-form").addEventListener("change", (event) => {
    if (event.target.name === "serviceType") {
      syncServiceOperationGroups();
    }
  });
  document.getElementById("legal-name").addEventListener("input", (event) => {
    const value = String(event.target.value || "");
    if (selectedExistingClient) {
      const selectedName = normalizeClientName(selectedExistingClient.legalName || selectedExistingClient.tradeName || "");
      if (normalizeClientName(value) !== selectedName) {
        clearSelectedExistingClient({ preserveTypedName: true });
      }
    }
    window.clearTimeout(clientMatchSearchTimer);
    clientMatchSearchTimer = window.setTimeout(() => {
      searchExistingClients(value);
    }, 300);
  });
  document.getElementById("trade-name").addEventListener("input", () => {
    if (selectedExistingClient) {
      renderClientMatchPanel({ matches: [] });
    }
  });
  document.getElementById("client-match-panel").addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-client-action]");
    if (!actionButton) return;
    const action = actionButton.dataset.clientAction;
    if (action === "unlink") {
      clearSelectedExistingClient({ preserveTypedName: true });
      return;
    }
    if (action === "select") {
      const selectedIndex = Number(actionButton.dataset.clientIndex || -1);
      const selectedMatch = clientMatchResultsCache[selectedIndex];
      if (selectedMatch) {
        selectExistingClient(selectedMatch);
      }
    }
  });
  document.getElementById("preview-request-form").addEventListener("click", async () => {
    await renderRequestFormPreview();
  });
  document.getElementById("zip-code").addEventListener("blur", async () => {
    await autofillAddressFromZipCode();
  });
  document.getElementById("go-to-request-form").addEventListener("click", () => {
    setActiveView("solicitacoes");
    resetRequestForm();
    updateRequestDeleteButton(null);
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
      const result = await deleteRequestAndRefresh(selectedRequestId);
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
      alert(`Não foi possível carregar o histórico de números: ${error.message}`);
    }
  });
  document.getElementById("clear-proposal-number-filters").addEventListener("click", async () => {
    resetProposalNumberFilters();
    try {
      await refreshProposalNumbers();
    } catch (error) {
      alert(`Não foi possível limpar os filtros do módulo: ${error.message}`);
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
    if (event.target.classList.contains("add-post-service-row")) {
      const tbody = document.querySelector(`[data-post-service="${event.target.dataset.service}"]`);
      if (tbody) tbody.insertAdjacentHTML("beforeend", buildPostRowMarkup(event.target.dataset.service));
    }

    if (event.target.classList.contains("add-equipment-service-row")) {
      const tbody = document.querySelector(`[data-equipment-service="${event.target.dataset.service}"]`);
      if (tbody) tbody.insertAdjacentHTML("beforeend", buildEquipmentRowMarkup(event.target.dataset.service));
    }

    if (event.target.classList.contains("delete-post-row")) {
      const tbody = event.target.closest("tbody");
      const rows = tbody ? tbody.querySelectorAll(".post-row") : [];
      if (rows.length > 1) {
        event.target.closest("tr").remove();
      }
    }

    if (event.target.classList.contains("delete-equipment-row")) {
      const tbody = event.target.closest("tbody");
      const rows = tbody ? tbody.querySelectorAll(".equipment-row") : [];
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

async function deleteJson(url) {
  const response = await fetchWithSession(url, { method: "DELETE" });
  if (!response.ok) {
    let message = `Falha ao excluir ${url}`;
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

function normalizeTableFilterText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function applyColumnFiltersToTable(table) {
  const tbody = table?.querySelector("tbody[id]");
  if (!tbody) return;
  const tableKey = tbody.id;
  const filters = tableFilterState.get(tableKey) || {};
  const rows = [...tbody.querySelectorAll("tr")];

  rows.forEach((row) => {
    const cells = [...row.children];
    const visible = Object.entries(filters).every(([index, rawValue]) => {
      const filterValue = normalizeTableFilterText(rawValue);
      if (!filterValue) return true;
      const cell = cells[Number(index)];
      if (!cell) return true;
      return normalizeTableFilterText(cell.textContent).includes(filterValue);
    });
    row.style.display = visible ? "" : "none";
  });
}

function setupColumnFiltersForTable(table) {
  const tbody = table?.querySelector("tbody[id]");
  const thead = table?.querySelector("thead");
  const headerRow = thead?.querySelector("tr");
  if (!tbody || !thead || !headerRow || tbody.id === "proposal-service-lines") return;
  if (thead.querySelector(".table-filter-row")) {
    applyColumnFiltersToTable(table);
    return;
  }

  const tableKey = tbody.id;
  const existingState = tableFilterState.get(tableKey) || {};
  tableFilterState.set(tableKey, existingState);

  const filterRow = document.createElement("tr");
  filterRow.className = "table-filter-row";

  [...headerRow.children].forEach((cell, index) => {
    const title = String(cell.textContent || "").trim();
    const th = document.createElement("th");
    if (/^acao$|^ação$/i.test(normalizeTableFilterText(title))) {
      th.innerHTML = `<span class="table-filter-placeholder">-</span>`;
      filterRow.appendChild(th);
      return;
    }

    const input = document.createElement("input");
    input.type = "search";
    input.className = "table-filter-input";
    input.placeholder = "Filtrar";
    input.value = existingState[index] || "";
    input.setAttribute("aria-label", `Filtrar coluna ${title || index + 1}`);
    input.addEventListener("input", () => {
      const nextState = tableFilterState.get(tableKey) || {};
      nextState[index] = input.value;
      tableFilterState.set(tableKey, nextState);
      applyColumnFiltersToTable(table);
    });
    th.appendChild(input);
    filterRow.appendChild(th);
  });

  thead.appendChild(filterRow);

  if (!tableFilterObservers.has(tableKey)) {
    const observer = new MutationObserver(() => applyColumnFiltersToTable(table));
    observer.observe(tbody, { childList: true, subtree: true });
    tableFilterObservers.set(tableKey, observer);
  }

  applyColumnFiltersToTable(table);
}

function initializeColumnFilters() {
  document.querySelectorAll("table").forEach((table) => {
    setupColumnFiltersForTable(table);
  });
}

function renderNotifications(items = notificationsCache) {
  const list = document.getElementById("notifications-list");
  const badge = document.getElementById("notifications-badge");
  if (!list || !badge) return;

  badge.hidden = notificationsUnreadCount <= 0;
  badge.textContent = String(notificationsUnreadCount);

  if (!items.length) {
    list.innerHTML = `<div class="notification-empty muted">Nenhuma notificação ainda.</div>`;
    return;
  }

  list.innerHTML = items.map((item) => `
    <button
      type="button"
      class="notification-item ${item.isRead ? "" : "unread"}"
      data-notification-id="${item.id}"
      data-request-id="${item.requestId || ""}"
      data-proposal-id="${item.proposalRegistryId || ""}"
      data-stage-code="${escapeHtml(item.toStageCode || "")}"
    >
      <strong>${escapeHtml(item.title || "Atualizacao de status")}</strong>
      <div class="notification-item-meta">
        <span>${escapeHtml(item.createdAtLabel || "-")}</span>
        <span class="pill ${item.isRead ? "info" : "ok"}">${item.isRead ? "Lida" : "Nova"}</span>
      </div>
      <div class="notification-item-message">${escapeHtml(item.message || "")}</div>
    </button>
  `).join("");
}

function setNotificationsPanelOpen(isOpen) {
  notificationsPanelOpen = Boolean(isOpen);
  const panel = document.getElementById("notifications-panel");
  if (!panel) return;
  panel.hidden = !notificationsPanelOpen;
}

function showNotificationToast(item) {
  const stack = document.getElementById("notification-toast-stack");
  if (!stack || !item?.id) return;
  const toast = document.createElement("div");
  toast.className = "notification-toast";
  toast.innerHTML = `
    <strong>${escapeHtml(item.title || "Atualizacao de status")}</strong>
    <p>${escapeHtml(item.message || "")}</p>
  `;
  stack.appendChild(toast);
  window.setTimeout(() => {
    toast.remove();
  }, 6000);
}

async function loadNotifications({ silent = false } = {}) {
  if (!authToken) return;
  const payload = await loadJson("/api/notifications?limit=12");
  const previousIds = new Set(notificationsCache.map((item) => String(item.id)));
  notificationsCache = payload.items || [];
  notificationsUnreadCount = Number(payload.unreadCount || 0);
  renderNotifications(notificationsCache);

  if (silent) {
    notificationsCache
      .filter((item) => !item.isRead && !previousIds.has(String(item.id)) && !notificationToastSeenIds.has(String(item.id)))
      .forEach((item) => {
        notificationToastSeenIds.add(String(item.id));
        showNotificationToast(item);
      });
  } else {
    notificationsCache.forEach((item) => notificationToastSeenIds.add(String(item.id)));
  }
}

function startNotificationsPolling() {
  if (notificationPollTimer) {
    window.clearInterval(notificationPollTimer);
  }
  notificationPollTimer = window.setInterval(() => {
    loadNotifications({ silent: true }).catch((error) => {
      console.warn("Nao foi possivel atualizar as notificacoes.", error);
    });
  }, 30000);
}

function stopNotificationsPolling() {
  if (notificationPollTimer) {
    window.clearInterval(notificationPollTimer);
    notificationPollTimer = null;
  }
}

function hasWorkflowSaveInFlight() {
  return Boolean(
    requestSaveInFlight
    || proposalNumberSaveInFlight
    || proposalSaveInFlight
    || commercialSaveInFlight
    || contractSaveInFlight
  );
}

function isInteractiveFieldFocused() {
  const activeElement = document.activeElement;
  return Boolean(
    activeElement
    && activeElement.matches
    && activeElement.matches("input, textarea, select")
  );
}

async function refreshSelectedRequestContextSilently() {
  if (!selectedRequestId) return;

  try {
    const detail = await loadJson(`/api/requests/${selectedRequestId}`);
    const attachments = await loadRequestAttachments(selectedRequestId);
    renderDetail(detail);
    renderHistory(detail.history || []);
    renderAttachmentList("proposal-attachments", attachments, ["anexo_inicial", "documento_tecnico_cliente", "documentacao_contratual"]);
    renderAttachmentList("commercial-attachments", attachments, ["proposta_final_pdf", "anexo_proposta_complementar", "planilha_aberta_proposta", "proposta_tecnica", "anexo_aceite"]);
    renderAttachmentList("contract-attachments", attachments, ["documentacao_contratual", "minuta_inicial", "contrato_assinado"]);
  } catch (error) {
    console.warn("Nao foi possivel atualizar o contexto da solicitacao selecionada.", error);
  }
}

async function refreshApplicationDataSilently() {
  if (!authToken || document.hidden || hasWorkflowSaveInFlight() || appDataRefreshInFlight) {
    return;
  }

  appDataRefreshInFlight = true;
  try {
    const refreshResults = await Promise.allSettled([
      refreshRequestsTable(),
      refreshDashboard(),
      refreshProposalNumbers(),
      refreshCrmProposalRequests(),
      refreshReports(),
      loadNotifications({ silent: true })
    ]);

    const requestsResult = refreshResults[0];
    const reportsResult = refreshResults[4];

    if (reportsResult?.status === "fulfilled") {
      reportRowsCache = reportsResult.value;
      renderAllStageBoards(reportRowsCache);
    }

    if (requestsResult?.status === "fulfilled") {
      const requests = requestsResult.value || [];
      const selectedStillExists = selectedRequestId
        ? requests.some((item) => String(item.id) === String(selectedRequestId))
        : false;

      if (!selectedStillExists) {
        selectedRequestId = requests[0]?.id || null;
        updateRequestDeleteButton(selectedRequestId);
      }
    }

    if (!isInteractiveFieldFocused()) {
      await refreshSelectedRequestContextSilently();
    }

    refreshResults
      .filter((item) => item.status === "rejected")
      .forEach((item) => console.warn("Falha secundaria ao atualizar o painel automaticamente:", item.reason));
  } finally {
    appDataRefreshInFlight = false;
  }
}

function startApplicationPolling() {
  if (appDataPollTimer) {
    window.clearInterval(appDataPollTimer);
  }
  appDataPollTimer = window.setInterval(() => {
    refreshApplicationDataSilently().catch((error) => {
      console.warn("Nao foi possivel atualizar os dados automaticamente.", error);
    });
  }, APP_AUTO_REFRESH_INTERVAL_MS);
}

function stopApplicationPolling() {
  if (appDataPollTimer) {
    window.clearInterval(appDataPollTimer);
    appDataPollTimer = null;
  }
  appDataRefreshInFlight = false;
}

async function markNotificationAsRead(notificationId) {
  const response = await fetchWithSession(`/api/notifications/${notificationId}/read`, { method: "POST" });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Falha ao marcar notificacao.");
  }
  const item = notificationsCache.find((entry) => String(entry.id) === String(notificationId));
  if (item && !item.isRead) {
    item.isRead = true;
    notificationsUnreadCount = Math.max(0, notificationsUnreadCount - 1);
    renderNotifications(notificationsCache);
  }
}

async function markAllNotificationsAsRead() {
  const response = await fetchWithSession("/api/notifications/read-all", { method: "POST" });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Falha ao marcar notificacoes.");
  }
  notificationsCache = notificationsCache.map((item) => ({ ...item, isRead: true }));
  notificationsUnreadCount = 0;
  renderNotifications(notificationsCache);
}

async function loadRequestAttachments(requestId) {
  return loadJson(`/api/requests/${requestId}/attachments`);
}

async function autofillAddressFromZipCode() {
  const zipCodeInput = document.getElementById("zip-code");
  const zipCode = String(zipCodeInput?.value || "").replace(/\D/g, "");
  if (zipCode.length !== 8) return;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`);
    if (!response.ok) return;
    const payload = await response.json();
    if (payload?.erro) return;

    document.getElementById("address").value = payload.logradouro || document.getElementById("address").value;
    document.getElementById("district").value = payload.bairro || document.getElementById("district").value;
    document.getElementById("city").value = payload.localidade || document.getElementById("city").value;
    document.getElementById("state").value = payload.uf || document.getElementById("state").value;
  } catch (error) {
    console.warn("Nao foi possivel consultar o CEP informado.", error);
  }
}

function showLoginScreen() {
  stopNotificationsPolling();
  stopApplicationPolling();
  forcePasswordChange = false;
  notificationsCache = [];
  notificationsUnreadCount = 0;
  notificationToastSeenIds = new Set();
  setNotificationsPanelOpen(false);
  document.getElementById("login-screen").hidden = false;
  document.getElementById("login-screen").style.display = "grid";
  document.getElementById("app-shell").hidden = true;
  document.getElementById("app-shell").classList.add("app-hidden");
  document.getElementById("login-feedback").textContent = "";
  renderNotifications([]);
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
  const [users, roles, auditLogs, lookupConfig, workflowStages] = await Promise.all([
    loadJson("/api/admin/users"),
    loadJson("/api/admin/roles"),
    loadJson("/api/admin/audit-logs"),
    loadJson("/api/admin/lookups-config"),
    loadJson("/api/admin/workflow-stages-config")
  ]);
  adminUsersCache = users;
  auditLogsCache = auditLogs;
  availableRoles = roles;
  adminLookupConfigCache = lookupConfig;
  adminWorkflowStagesCache = workflowStages;
  populateRoleSelect(roles);
  renderAdminUsers(users);
  renderAuditLogs(auditLogs);
  renderAdminWorkflowStages(workflowStages);
  resetAdminWorkflowStageForm();
  const availableCategory = getAdminLookupCategoryMeta(activeAdminLookupCategory)
    ? activeAdminLookupCategory
    : lookupConfig.categories?.[0]?.key;
  if (availableCategory) {
    setActiveAdminLookupCategory(availableCategory);
  } else {
    renderAdminLookupCategories();
    renderAdminLookupItems("");
  }
}

async function loadAuthenticatedAppData() {
  const [authMe, dashboard, requests, reportItems, proposalNumbers, crmProposalRequests, lookups, notifications] = await Promise.all([
    loadJson("/api/auth/me"),
    loadJson("/api/dashboard"),
    loadJson("/api/requests"),
    loadJson("/api/reports"),
    loadJson("/api/proposal-numbers"),
    loadJson("/api/proposal-numbers/crm-requests"),
    loadJson("/api/lookups"),
    loadJson("/api/notifications?limit=12")
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
  notificationsCache = notifications.items || [];
  notificationsUnreadCount = Number(notifications.unreadCount || 0);
  notificationToastSeenIds = new Set(notificationsCache.map((item) => String(item.id)));
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
  renderNotifications(notificationsCache);
  renderDetail(initialDetail);
  renderHistory(initialDetail.history || []);
  renderAttachmentList("proposal-attachments", initialAttachments, ["anexo_inicial", "documento_tecnico_cliente", "documentacao_contratual"]);
  renderAttachmentList("commercial-attachments", initialAttachments, ["proposta_final_pdf", "anexo_proposta_complementar", "planilha_aberta_proposta", "proposta_tecnica", "anexo_aceite"]);
  renderAttachmentList("contract-attachments", initialAttachments, ["documentacao_contratual", "minuta_inicial", "contrato_assinado"]);
  await renderRequestFormPreview();
  populateRequestForm(initialDetail);
  resetProposalNumberForm();
  populateProposalForm(initialDetail);
  populateCommercialForm(initialDetail);
  populateContractForm(initialDetail);
  populateProposalNumberLinkedRequest(requests.length ? initialDetail : null);
  await loadAdminModule();
  setActiveView("dashboard");
  showAppShell();
  startNotificationsPolling();
  startApplicationPolling();
}

async function reloadApplicationLookups() {
  const lookups = await loadJson("/api/lookups");
  applyLookups(lookups);
}

async function selectRequest(requestId) {
  selectedRequestId = Number(requestId);
  updateRequestDeleteButton(selectedRequestId);
  const detail = await loadJson(`/api/requests/${requestId}`);
  const attachments = await loadRequestAttachments(requestId);
  renderDetail(detail);
  renderHistory(detail.history || []);
  renderAttachmentList("proposal-attachments", attachments, ["anexo_inicial", "documento_tecnico_cliente", "documentacao_contratual"]);
  renderAttachmentList("commercial-attachments", attachments, ["proposta_final_pdf", "anexo_proposta_complementar", "planilha_aberta_proposta", "proposta_tecnica", "anexo_aceite"]);
  renderAttachmentList("contract-attachments", attachments, ["documentacao_contratual", "minuta_inicial", "contrato_assinado"]);
  populateRequestForm(detail);
  populateProposalForm(detail);
  populateCommercialForm(detail);
  populateContractForm(detail);
  populateProposalNumberLinkedRequest(detail);
  return detail;
}

async function refreshAttachmentPanels(requestId) {
  if (!requestId) return;
  const attachments = await loadRequestAttachments(requestId);
  renderAttachmentList("proposal-attachments", attachments, ["anexo_inicial", "documento_tecnico_cliente", "documentacao_contratual"]);
  renderAttachmentList("commercial-attachments", attachments, ["proposta_final_pdf", "anexo_proposta_complementar", "planilha_aberta_proposta", "proposta_tecnica", "anexo_aceite"]);
  renderAttachmentList("contract-attachments", attachments, ["documentacao_contratual", "minuta_inicial", "contrato_assinado"]);
}

async function deleteAttachmentItem(attachmentId, requestId) {
  if (!attachmentId) return;
  await deleteJson(`/api/attachments/${attachmentId}`);
  if (requestId) {
    await refreshAttachmentPanels(requestId);
  }
}

async function bootstrap() {
  setupRequestForm();
  organizeProposalModuleLayout();
  initializeColumnFilters();
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

  document.getElementById("notifications-toggle").addEventListener("click", async (event) => {
    event.stopPropagation();
    const nextState = !notificationsPanelOpen;
    setNotificationsPanelOpen(nextState);
    if (nextState && authToken) {
      try {
        await loadNotifications();
      } catch (error) {
        console.warn("Nao foi possivel carregar as notificacoes.", error);
      }
    }
  });

  document.getElementById("notifications-mark-all").addEventListener("click", async (event) => {
    event.stopPropagation();
    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      alert(`Nao foi possivel marcar as notificacoes: ${error.message}`);
    }
  });

  document.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".attachment-delete-button");
    if (!deleteButton) return;
    event.preventDefault();

    const attachmentId = Number(deleteButton.dataset.attachmentId);
    const requestId = Number(deleteButton.dataset.requestId);
    if (!attachmentId) return;

    if (!window.confirm("Deseja excluir este anexo?")) {
      return;
    }

    try {
      await deleteAttachmentItem(attachmentId, Number.isFinite(requestId) ? requestId : selectedRequestId);
    } catch (error) {
      alert(`Nao foi possivel excluir o anexo: ${error.message}`);
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (!authToken || document.hidden) return;
    refreshApplicationDataSilently().catch((error) => {
      console.warn("Nao foi possivel sincronizar os dados ao reabrir a aba.", error);
    });
  });

  document.addEventListener("click", async (event) => {
    const notificationItem = event.target.closest(".notification-item");
    const notificationsPanel = document.getElementById("notifications-panel");
    const notificationsShell = document.querySelector(".notifications-shell");

    if (notificationItem) {
      try {
        await markNotificationAsRead(notificationItem.dataset.notificationId);
      } catch (error) {
        console.warn("Nao foi possivel marcar a notificacao como lida.", error);
      }

      setNotificationsPanelOpen(false);

      try {
        if (notificationItem.dataset.requestId) {
          const detail = await selectRequest(notificationItem.dataset.requestId);
          setActiveView(preferredWorkflowView(detail, workflowViewFromStage(notificationItem.dataset.stageCode || detail.stageCode, "solicitacoes")));
          return;
        }

        if (notificationItem.dataset.proposalId) {
          const detail = await loadProposalNumberDetail(notificationItem.dataset.proposalId);
          renderProposalOnlyContext(detail);
          const targetView = workflowViewFromStage(notificationItem.dataset.stageCode || detail.stageCode, "negociacoes");
          if (targetView === "contratos") {
            populateContractForm(detail);
          } else {
            populateCommercialForm(detail);
          }
          setActiveView(targetView);
          scrollToWorkflowForm(targetView);
        }
      } catch (error) {
        alert(`Nao foi possivel abrir a notificacao: ${error.message}`);
      }
      return;
    }

    if (notificationsPanelOpen && notificationsShell && !notificationsShell.contains(event.target) && notificationsPanel && !notificationsPanel.contains(event.target)) {
      setNotificationsPanelOpen(false);
    }
  });

    document.getElementById("requests-table").addEventListener("click", async (event) => {
      const row = event.target.closest(".request-row");
      if (!row) return;

      try {
        const detail = await selectRequest(row.dataset.requestId);
        setActiveView(preferredWorkflowView(detail, "solicitacoes"));
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
        : stageTab.dataset.module === "contratos"
          ? buildContractRows()
          : reportRowsCache;
      renderStageBoard(stageTab.dataset.module, stageRows);
      return;
    }

    const stageRow = event.target.closest(".stage-table-row");
    if (!stageRow) return;

    if ((stageRow.dataset.moduleKey || currentView) === "contratos" && stageRow.dataset.proposalId) {
      try {
        const detail = await loadProposalNumberDetail(stageRow.dataset.proposalId);
        const attachments = detail.requestId ? await loadRequestAttachments(detail.requestId) : [];
        renderAttachmentList("commercial-attachments", attachments, ["proposta_final_pdf", "anexo_proposta_complementar", "planilha_aberta_proposta", "proposta_tecnica", "anexo_aceite"]);
        renderAttachmentList("contract-attachments", attachments, ["documentacao_contratual", "minuta_inicial", "contrato_assinado"]);
        renderProposalOnlyContext(detail);
        populateContractForm(detail);
        setActiveView("contratos");
        scrollToWorkflowForm("contratos");
      } catch (error) {
        alert(`Nao foi possivel carregar o contrato: ${error.message}`);
      }
      return;
    }

    if (stageRow.dataset.proposalId && !stageRow.dataset.requestId) {
      try {
        const detail = await loadProposalNumberDetail(stageRow.dataset.proposalId);
        const attachments = detail.requestId ? await loadRequestAttachments(detail.requestId) : [];
        renderAttachmentList("commercial-attachments", attachments, ["proposta_final_pdf", "anexo_proposta_complementar", "planilha_aberta_proposta", "proposta_tecnica", "anexo_aceite"]);
        renderAttachmentList("contract-attachments", attachments, ["documentacao_contratual", "minuta_inicial", "contrato_assinado"]);
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
        const targetView = preferredWorkflowView(detail, moduleKey);
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

  document.getElementById("proposal-number-table").addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".request-delete-button");
    if (!deleteButton) return;

    const requestId = deleteButton.dataset.requestId;
    if (!requestId) return;

    const confirmed = window.confirm("Deseja excluir esta solicitacao pendente de proposta? Esta acao nao pode ser desfeita.");
    if (!confirmed) return;

    try {
      const result = await deleteRequestAndRefresh(requestId);
      alert(result.message || "Solicitacao excluida com sucesso.");
    } catch (error) {
      alert(`Nao foi possivel excluir a solicitacao: ${error.message}`);
    }
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
      alert(`Não foi possível abrir a negociação: ${error.message}`);
    }
  });

  document.getElementById("request-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (requestSaveInFlight) return;

    const payload = await buildRequestPayload();
    await renderRequestFormPreview();
    const missing = validateRequestPayload(payload);

    if (missing.length) {
      alert(`Preencha os campos obrigatorios antes de salvar:\n- ${missing.join("\n- ")}`);
      return;
    }

    try {
      setRequestSaveState(true);
      const requestId = Number(payload.requestId || 0);
      const isEditing = Number.isFinite(requestId) && requestId > 0;
      const targetUrl = isEditing ? `/api/requests/${requestId}` : "/api/requests";
      const response = await fetchWithSession(targetUrl, {
        method: isEditing ? "PUT" : "POST",
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
      const detailId = result.request?.id || refreshed.find((item) => String(item.requestNumber) === String(savedNumber))?.id || refreshed[0]?.id;
      const role = ROLE_CONFIG[currentRole] || ROLE_CONFIG.diretoria;
      const canOpenProposalQueue = role.views.includes("propostas")
        && isViewAllowedByModule("propostas")
        && isViewAllowedByStage("propostas");

      if (detailId) {
        const detail = await selectRequest(detailId);
        if (result.returnedToTriage) {
          setActiveView(canOpenProposalQueue ? "propostas" : "solicitacoes");
        } else if (!isEditing) {
          const targetView = preferredWorkflowView(
            detail,
            canOpenProposalQueue ? "propostas" : "solicitacoes"
          );
          setActiveView(targetView);
          scrollToWorkflowForm(targetView);
        }
      }

      alert(result.message || `Solicitacao salva com sucesso: ${savedNumber}`);
    } catch (error) {
      alert(`Nao foi possivel salvar a solicitacao: ${error.message}`);
    } finally {
      setRequestSaveState(false);
    }
  });

  document.getElementById("proposal-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (proposalSaveInFlight) return;
    const payload = {
      ...buildProposalPayload(),
      proposalFinalPdfFiles: await collectFiles("proposal-final-pdf"),
      proposalOpenSpreadsheet: await collectFiles("proposal-open-sheet", false),
      proposalTechnicalFile: await collectFiles("proposal-technical-file", false),
      proposalSupportingFiles: await collectFiles("proposal-supporting-files")
    };
    const missing = validateProposalPayload(payload);

    if (missing.length) {
      alert(`Preencha os campos obrigatorios da triagem:\n- ${missing.join("\n- ")}`);
      return;
    }

    try {
      proposalSaveInFlight = true;
      setFormSubmitState("proposal-form", true);
      const response = await fetchWithSession(`/api/requests/${payload.requestId}/proposal-record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Falha ao salvar triagem.");
      }

      let refreshedDetail = payload.requestId ? await loadJson(`/api/requests/${payload.requestId}`) : null;
      if (payload.requestId) {
        refreshedDetail = await selectRequest(payload.requestId);
      } else if (payload.proposalRegistryId) {
        const detail = await loadProposalNumberDetail(payload.proposalRegistryId);
        populateCommercialForm(detail);
      }
      await refreshRequestsTable();
      await refreshDashboard();
      await refreshProposalNumbers();
      await refreshCrmProposalRequests();
      reportRowsCache = await refreshReports();
      renderAllStageBoards(reportRowsCache);
      await loadNotifications();
      if (refreshedDetail) {
        const targetView = preferredWorkflowView(refreshedDetail, "propostas");
        setActiveView(targetView);
        scrollToWorkflowForm(targetView);
      }
      if (payload.nextStageCode === "enviada_ao_vendedor") {
        setActiveView("negociacoes");
        scrollToWorkflowForm("negociacoes");
      }
      alert(result.message || "Triagem salva com sucesso.");
    } catch (error) {
      alert(`Nao foi possivel salvar a triagem: ${error.message}`);
    } finally {
      proposalSaveInFlight = false;
      setFormSubmitState("proposal-form", false);
    }
  });

  document.getElementById("commercial-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (commercialSaveInFlight) return;
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
      commercialSaveInFlight = true;
      setFormSubmitState("commercial-form", true);
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
        try {
          await selectRequest(payload.requestId);
        } catch (refreshError) {
          console.warn("Nao foi possivel recarregar a solicitacao apos salvar a negociacao:", refreshError);
        }
      } else if (payload.proposalRegistryId) {
        try {
          const detail = await loadProposalNumberDetail(payload.proposalRegistryId);
          renderProposalOnlyContext(detail);
          populateCommercialForm(detail);
        } catch (refreshError) {
          console.warn("Nao foi possivel recarregar a proposta apos salvar a negociacao:", refreshError);
        }
      }
      const refreshResults = await Promise.allSettled([
        refreshRequestsTable(),
        refreshDashboard(),
        refreshProposalNumbers(),
        refreshCrmProposalRequests(),
        refreshReports(),
        loadNotifications()
      ]);
      const reportsResult = refreshResults[4];
      if (reportsResult?.status === "fulfilled") {
        reportRowsCache = reportsResult.value;
        renderAllStageBoards(reportRowsCache);
      }
      refreshResults
        .filter((item) => item.status === "rejected")
        .forEach((item) => console.warn("Falha secundaria ao atualizar a tela apos salvar negociacao:", item.reason));
      alert(result.message || "Negociacao salva com sucesso.");
    } catch (error) {
      alert(`Nao foi possivel salvar a negociacao: ${error.message}`);
    } finally {
      commercialSaveInFlight = false;
      setFormSubmitState("commercial-form", false);
    }
  });

  document.getElementById("contract-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (contractSaveInFlight) return;
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
      contractSaveInFlight = true;
      setFormSubmitState("contract-form", true);
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
      await refreshProposalNumbers();
      await refreshCrmProposalRequests();
      reportRowsCache = await refreshReports();
      renderAllStageBoards(reportRowsCache);
      await loadNotifications();
      alert(result.message || "Contratual salvo com sucesso.");
    } catch (error) {
      alert(`Nao foi possivel salvar o contratual: ${error.message}`);
    } finally {
      contractSaveInFlight = false;
      setFormSubmitState("contract-form", false);
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
    if (proposalNumberSaveInFlight) return;
    const feedback = document.getElementById("proposal-number-feedback");
    feedback.textContent = "";
    const payload = await buildProposalNumberPayload();
    const missing = validateProposalNumberPayload(payload);

    if (missing.length) {
      feedback.textContent = `Preencha os campos obrigatorios: ${missing.join(", ")}.`;
      return;
    }

    try {
      proposalNumberSaveInFlight = true;
      setFormSubmitState("proposal-number-form", true);
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
      await refreshProposalNumbers();
      await refreshCrmProposalRequests();
      if (isEditing && result.proposalNumber?.id) {
        const detail = await loadProposalNumberDetail(result.proposalNumber.id);
        populateProposalNumberForEdit(detail);
        setActiveView("proposta_crm");
      } else {
        resetProposalNumberForm();
      }
      if (selectedRequestId) {
        const detail = await loadJson(`/api/requests/${selectedRequestId}`);
        populateProposalNumberLinkedRequest(detail);
      }
    } catch (error) {
      feedback.textContent = error.message;
    } finally {
      proposalNumberSaveInFlight = false;
      setFormSubmitState("proposal-number-form", false);
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
      const selectedRole = document.getElementById("admin-user-role").value;
      applyAdminModuleSelection(defaultModulesForRole(selectedRole));
      applyAdminStageSelection(defaultStageAccessForRole(selectedRole));
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
      alert("Selecione um usuário para desativar.");
      return;
    }

    try {
      const response = await fetchWithSession(`/api/admin/users/${userId}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Falha ao desativar usuário.");
      }

      await loadAdminModule();
      resetAdminUserForm();
      alert(result.message || "Usuário desativado com sucesso.");
    } catch (error) {
      alert(`Não foi possível desativar o usuário: ${error.message}`);
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

  document.getElementById("admin-lookup-categories").addEventListener("click", (event) => {
    const button = event.target.closest("[data-lookup-category]");
    if (!button) return;
    setActiveAdminLookupCategory(button.dataset.lookupCategory);
  });

  document.getElementById("admin-lookup-items-table").addEventListener("click", (event) => {
    const button = event.target.closest(".admin-lookup-edit");
    if (!button) return;
    const categoryKey = button.dataset.lookupCategory;
    if (categoryKey !== activeAdminLookupCategory) {
      setActiveAdminLookupCategory(categoryKey);
    }
    const items = adminLookupConfigCache.itemsByCategory?.[categoryKey] || [];
    const item = items.find((entry) => String(entry.id) === String(button.dataset.lookupId));
    if (item) {
      populateAdminLookupForm(item);
    }
  });

  document.getElementById("admin-lookup-reset").addEventListener("click", () => {
    resetAdminLookupForm();
  });

  document.getElementById("admin-lookup-deactivate").addEventListener("click", async () => {
    const itemId = document.getElementById("admin-lookup-item-id").value;
    const categoryKey = document.getElementById("admin-lookup-category-key").value || activeAdminLookupCategory;
    const relatedIds = document.getElementById("admin-lookup-related-ids").value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (!itemId || !categoryKey) {
      alert("Selecione um item para retirar da lista.");
      return;
    }

    try {
      const response = await fetchWithSession(`/api/admin/lookups-config/${categoryKey}/${itemId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relatedIds })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Falha ao retirar item da lista.");
      }

      await Promise.all([loadAdminModule(), reloadApplicationLookups()]);
      resetAdminLookupForm();
      alert(result.message || "Item retirado da lista com sucesso.");
    } catch (error) {
      alert(`Não foi possível retirar o item da lista: ${error.message}`);
    }
  });

  document.getElementById("admin-sla-table").addEventListener("click", (event) => {
    const button = event.target.closest(".admin-sla-edit");
    if (!button) return;
    const item = adminWorkflowStagesCache.find((entry) => String(entry.id) === String(button.dataset.stageId));
    if (item) {
      populateAdminWorkflowStageForm(item);
    }
  });

  document.getElementById("admin-sla-reset").addEventListener("click", () => {
    resetAdminWorkflowStageForm();
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
      stageAccess: [...document.querySelectorAll('input[name="stageAccess"]:checked')].map((input) => input.value),
      password: passwordValue || undefined
    };

    if (!payload.name || !payload.email || !payload.role) {
      alert("Preencha nome, e-mail e perfil do usuário.");
      return;
    }

    if (!userId && !passwordValue) {
      alert("Informe uma senha provisória para criar o novo usuário.");
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
        throw new Error(result.error || "Falha ao salvar usuário.");
      }

      await loadAdminModule();
      await loadAuthenticatedAppData();
      resetAdminUserForm();
      const successMessage = result.temporaryPassword
        ? `${result.message || "Usuário salvo com sucesso."}\nSenha provisória: ${result.temporaryPassword}`
        : (result.message || "Usuário salvo com sucesso.");
      alert(successMessage);
    } catch (error) {
      alert(`Não foi possível salvar o usuário: ${error.message}`);
    }
  });

  document.getElementById("admin-lookup-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const categoryKey = document.getElementById("admin-lookup-category-key").value || activeAdminLookupCategory;
    const itemId = document.getElementById("admin-lookup-item-id").value;
    const relatedIds = document.getElementById("admin-lookup-related-ids").value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const selectedGroupKeys = [...document.querySelectorAll('input[name="adminLookupGroupKeys"]:checked')].map((input) => input.value);
    const payload = {
      value: document.getElementById("admin-lookup-value").value.trim(),
      groupKey: document.getElementById("admin-lookup-group-key").value.trim(),
      groupKeys: selectedGroupKeys,
      relatedIds,
      sortOrder: document.getElementById("admin-lookup-sort-order").value.trim(),
      isActive: document.getElementById("admin-lookup-active").value === "true"
    };
    const category = getAdminLookupCategoryMeta(categoryKey);

    if (!categoryKey || !payload.value) {
      alert("Selecione uma categoria e informe o valor do item.");
      return;
    }

    if (categoryKey === "equipmentOptions" && payload.groupKeys.length === 0) {
      alert("Selecione pelo menos um tipo de serviço para este equipamento.");
      return;
    }

    if (category?.grouped && categoryKey !== "equipmentOptions" && !payload.groupKey) {
      alert("Informe o agrupamento deste item.");
      return;
    }

    try {
      const response = await fetchWithSession(
        itemId
          ? `/api/admin/lookups-config/${categoryKey}/${itemId}`
          : `/api/admin/lookups-config/${categoryKey}`,
        {
          method: itemId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Falha ao salvar item da lista.");
      }

      await Promise.all([loadAdminModule(), reloadApplicationLookups()]);
      resetAdminLookupForm();
      alert(result.message || "Item salvo com sucesso.");
    } catch (error) {
      alert(`Não foi possível salvar o item da lista: ${error.message}`);
    }
  });

  document.getElementById("admin-sla-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const stageId = document.getElementById("admin-sla-stage-id").value;
    if (!stageId) {
      alert("Selecione uma etapa para editar o SLA.");
      return;
    }

    const rawHours = document.getElementById("admin-sla-hours").value.trim();
    const payload = {
      slaHours: rawHours === "" ? null : Number(rawHours),
      slaPaused: document.getElementById("admin-sla-paused").value === "true"
    };

    if (rawHours !== "" && (!Number.isFinite(payload.slaHours) || payload.slaHours < 0)) {
      alert("Informe um SLA valido em horas.");
      return;
    }

    try {
      const response = await fetchWithSession(`/api/admin/workflow-stages-config/${stageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Falha ao atualizar o SLA.");
      }

      await Promise.all([loadAdminModule(), reloadApplicationLookups()]);
      alert(result.message || "SLA atualizado com sucesso.");
    } catch (error) {
      alert(`Não foi possível atualizar o SLA: ${error.message}`);
    }
  });
}

bootstrap().catch((error) => {
  console.error(error);
  document.body.innerHTML = `<pre style="padding:24px">Erro ao carregar a aplicação: ${error.message}</pre>`;
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






