const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { pool, query, withTransaction } = require("./db");
const { dashboard, requests, requestDetail } = require("./src/data/sample-data");

const PORT = Number(process.env.PORT || 3100);
const HOST = process.env.HOST || "0.0.0.0";
const NODE_ENV = process.env.NODE_ENV || "development";
const APP_BASE_URL = process.env.APP_BASE_URL || "";
const SESSION_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS || 12);
const PUBLIC_DIR = path.join(__dirname, "public");
const UPLOADS_DIR = process.env.APP_UPLOADS_DIR
  ? path.resolve(process.env.APP_UPLOADS_DIR)
  : path.join(__dirname, "uploads");
const sessions = new Map();
const APP_TIMEZONE = "America/Sao_Paulo";
const BRANCH_OPTIONS = ["Matriz - Campinas", "Filial Minas"];
const RESPONSIBLE_OPTIONS = ["ANDRE", "LANA", "RODRIGO", "GUILHERME", "KLEYTON", "MACCARI", "SUPERVISAO", "COORDENACAO"];
const LEAD_SOURCE_OPTIONS = ["Prospeccao", "Indicacao Diretoria", "Indicacao Seter", "Cliente Ativo", "Campseg", "Marcondes"];
const PROPOSAL_STATUS_OPTIONS = ["Gerado", "Em uso", "Vinculado ao CRM", "Em Negociacao", "Ganho", "Pedido", "Perdido", "Cancelado"];
const DOCUMENT_TYPE_OPTIONS = ["PROPOSTA", "ORCAMENTO", "ADITIVO", "NOVA PROPOSTA", "REVISAO", "AUMENTO", "REDUCAO"];
const INDUSTRY_OPTIONS = [
  "AEROPORTOS",
  "AGROPECUARIA",
  "ASSOCIACOES DIVERSAS",
  "BANCOS / FINANCEIRAS",
  "BARES E RESTAURANTES",
  "CALL CENTER",
  "COMERCIO VAREJISTA",
  "CONCESSIONARIAS",
  "CONDOMINIO RESIDENCIAL",
  "CONDOMINIOS COMERCIAL",
  "CONSULTORIOS MEDICO/ODONTOLOGICO",
  "CONSTRUTORAS",
  "DISTRIBUIDORES/ COMERCIO ATACADISTA",
  "ESCRITORIOS DE ADVOCACIA",
  "FARMACEUTICAS",
  "GERADORAS/ DISTRIB. DE ENERGIA",
  "HOSPITAIS",
  "HOTEIS",
  "INCORPORADORAS E ADM IMOBILIARIAS",
  "INDUSTRIA ALIMENTICIA",
  "INDUSTRIAS",
  "INSTITUICOES DE ENSINO",
  "LABORATORIOS DE ANALISE CLINICA",
  "LOGISTICA / CENTROS DE DISTRIBUICAO",
  "METALURGICAS E FUNDICOES",
  "SERVICOS",
  "SHOPPING CENTER",
  "SUPERMERCADOS",
  "TECNOLOGIA",
  "TRANSPORTES",
  "USINAS",
  "BOMBEIRO"
];
const SERVICE_TYPE_OPTIONS = [
  "Vigilancia",
  "Portaria",
  "Limpeza",
  "Jardinagem",
  "Monitoramento",
  "Bombeiro",
  "Manutencao",
  "Zeladoria",
  "Orientador de Transito",
  "Motorista",
  "Logistica"
];
const WORK_SCALE_OPTIONS = ["12 x 36", "6 x 1", "6 x 2", "5 x 1", "5 x 2", "4 x 2", "SDF", "Sab/Dom", "Dom", "Sab", "Feriado"];
const EQUIPMENT_OPTIONS_BY_SERVICE = {
  Vigilancia: [
    "Acorda Vigia Alabella",
    "Arma calibre 38 e municao",
    "Arma Pistola 380 e municao",
    "Lanterna recarregavel",
    "Radio HT",
    "Ronda Eletronica FindMe",
    "Detector de metal tipo bastao",
    "Colete e capa",
    "Computador completo (simples)",
    "Guarita simples",
    "Guarita com banheiro quimico"
  ],
  Portaria: [
    "Guarita simples",
    "Guarita com banheiro quimico",
    "Impressora Multifuncional (simples)",
    "Kit botao de panico + modulo gprs",
    "Lanterna recarregavel",
    "Material de escritorio (verba)",
    "Mesas e cadeiras",
    "Nextel somente radio",
    "Radio base (estacao fixa)",
    "Radio HT"
  ],
  Limpeza: [
    "Aspirador de liquidos LD 70",
    "Aspirador de po/liquido 35L",
    "Aspirador vertical CV 38/2",
    "Balde Espremedor amarelo",
    "Balde Espremedor azul",
    "Carrinho Funcional America Completo",
    "Carrinho Coletor 120 litros",
    "Carrinho Coletor 240 litros",
    "Conjunto MOP PO 60 CM",
    "Conjunto MOP UMIDO",
    "Enceradeira Industrial 350mm",
    "Escada 5 degraus de Aluminio",
    "Lavadora de Piso 510 mm - Eletrica",
    "Lavadora de Pisos B70",
    "Mini kit limpa vidros",
    "Polidora High Speed - 510 mm UHS",
    "Varredeira Manual",
    "Varredeira Tripulada KM 100/100",
    "Placa Sinalizadora"
  ],
  Jardinagem: [
    "Aparador de Cerca Viva",
    "Carrinho tipo Prefeitura 120 lts",
    "Cortador de Grama - Elet.1800W-35 cm",
    "Cortador de Grama - Gas.6 HP- 48 cm",
    "Escada Light 10,2 metros",
    "Extensao 40m com Carretel",
    "Kit Jardinagem",
    "Lamina para rocadeira",
    "Motoserra - Gasolina 4.6 HP sabre 18",
    "Pulverizador Costal 10litros",
    "Rocadeira - Eletrica 0.5 HP",
    "Rocadeira Lateral - Gas.",
    "Soprador de folhas - Gas."
  ],
  Zeladoria: [
    "Armario roupeiro",
    "Computador",
    "Mesa com cadeiras",
    "Micro ondas",
    "Organizador de Acessorios",
    "Radio HT"
  ],
  Bombeiro: [
    "Lanterna a prova de explosao",
    "Lanterna recarregavel",
    "Radio HT a prova de explosao",
    "Detector de metal tipo bastao",
    "Colete e capa"
  ],
  Monitoramento: [
    "Camera fotografica digital",
    "Computador completo (simples)",
    "Impressora Multifuncional (simples)",
    "Kit botao de panico + modulo gprs",
    "Radio base (estacao fixa)",
    "Radio HT"
  ],
  Manutencao: [
    "Escada Pintor 6 degraus de Aluminio",
    "Extensor 6,0 mts",
    "Mangueira 50 mts",
    "Organizador de Acessorios",
    "Placa Sinalizadora"
  ],
  "Orientador de Transito": [
    "Banqueta articulada",
    "Colete e capa",
    "Guarda chuva",
    "Radio HT"
  ],
  Motorista: [
    "Carro basico c/ar cond.4 portas",
    "Giroflex",
    "Moto 150cc",
    "Rastreador"
  ],
  Logistica: [
    "Carrinho Container 700 lts com tampa",
    "Carrinho Cuba 400 lts com tampa",
    "Carrinho Cuba com Estrutura Metalica",
    "Computador",
    "Organizador de Acessorios"
  ]
};
const LOSS_REASON_OPTIONS = [
  "Preco acima do esperado",
  "Perda para concorrente",
  "Escopo nao aderente",
  "Cliente suspendeu a demanda",
  "Prazo de implantacao inviavel"
];
const CANCEL_REASON_OPTIONS = [
  "Solicitacao duplicada",
  "Cliente desistiu antes da proposta",
  "Mudanca de estrategia comercial",
  "Dados insuficientes para continuidade",
  "Demanda cancelada internamente"
];
const MODULE_OPTIONS = ["proposta", "vendas", "contratos", "relatorios", "admin"];
const WORKFLOW_STAGE_OPTIONS = [
  "solicitacao_criada",
  "em_triagem",
  "aguardando_informacoes",
  "em_preparacao_da_proposta",
  "proposta_finalizada",
  "enviada_ao_vendedor",
  "em_negociacao",
  "proposta_aceita",
  "perdida",
  "cancelada",
  "elaboracao_de_contrato",
  "negociacao_de_clausulas",
  "contrato_assinado"
];
const LOOKUP_CATEGORY_DEFINITIONS = [
  { key: "branches", label: "Filiais", description: "Unidades e bases comerciais disponíveis nos formulários.", grouped: false, source: "app_lookup_options" },
  { key: "responsibles", label: "Responsáveis", description: "Responsáveis sugeridos para preenchimento de negócio e proposta.", grouped: false, source: "app_lookup_options" },
  { key: "leadSources", label: "Origem do lead", description: "Canais de origem da oportunidade comercial.", grouped: false, source: "app_lookup_options" },
  { key: "proposalStatuses", label: "Status da proposta", description: "Situações disponíveis para o cadastro da proposta.", grouped: false, source: "app_lookup_options" },
  { key: "documentTypes", label: "Tipos de documento", description: "Tipos usados na geração do número de proposta.", grouped: false, source: "app_lookup_options" },
  { key: "industries", label: "Segmentos", description: "Segmentos de atuação do cliente.", grouped: false, source: "app_lookup_options" },
  { key: "serviceTypes", label: "Tipos de serviço", description: "Serviços utilizados na requisição e na composição das operações.", grouped: false, source: "app_lookup_options" },
  { key: "workScales", label: "Escalas", description: "Escalas operacionais disponíveis nos postos.", grouped: false, source: "app_lookup_options" },
  { key: "equipmentOptions", label: "Equipamentos por serviço", description: "Equipamentos sugeridos para cada tipo de serviço.", grouped: true, source: "app_lookup_options" },
  { key: "lossReasons", label: "Motivos de perda", description: "Motivos de perda utilizados na negociação.", grouped: false, source: "reason_table", tableName: "loss_reasons" },
  { key: "cancelReasons", label: "Motivos de cancelamento", description: "Motivos de cancelamento utilizados no fluxo comercial.", grouped: false, source: "reason_table", tableName: "cancel_reasons" }
];
const LOOKUP_CATEGORY_MAP = Object.fromEntries(
  LOOKUP_CATEGORY_DEFINITIONS.map((item) => [item.key, item])
);
const STATIC_LOOKUP_DEFAULTS = {
  branches: BRANCH_OPTIONS,
  responsibles: RESPONSIBLE_OPTIONS,
  leadSources: LEAD_SOURCE_OPTIONS,
  proposalStatuses: PROPOSAL_STATUS_OPTIONS,
  documentTypes: DOCUMENT_TYPE_OPTIONS,
  industries: INDUSTRY_OPTIONS,
  serviceTypes: SERVICE_TYPE_OPTIONS,
  workScales: WORK_SCALE_OPTIONS
};

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": MIME_TYPES[".json"] });
  response.end(JSON.stringify(payload));
}

function sendCsv(response, fileName, content) {
  response.writeHead(200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${fileName}"`
  });

process.on("SIGINT", () => {
  server.close(() => {
    pool.end()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  });
});

process.on("SIGTERM", () => {
  server.close(() => {
    pool.end()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  });
});
  response.end(`\uFEFF${content}`);
}

function getSessionContext(request, url) {
  pruneExpiredSessions();
  const authHeader = request.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : String(url.searchParams.get("sessionToken") || "").trim();
  const sessionFromToken = token ? sessions.get(token) : null;
  const headerRole = request.headers["x-user-role"];
  const headerEmail = request.headers["x-user-email"];
  const headerName = request.headers["x-user-name"];

  return {
    token,
    userId: sessionFromToken?.userId || null,
    roles: sessionFromToken?.roles || [],
    role: String(sessionFromToken?.primaryRole || headerRole || url.searchParams.get("sessionRole") || ""),
    moduleAccess: sessionFromToken?.moduleAccess || [],
    stageAccess: sessionFromToken?.stageAccess || [],
    mustChangePassword: Boolean(sessionFromToken?.mustChangePassword),
    email: String(sessionFromToken?.email || headerEmail || url.searchParams.get("sessionEmail") || "").trim().toLowerCase(),
    name: String(sessionFromToken?.name || headerName || url.searchParams.get("sessionName") || "").trim(),
    authenticated: Boolean(sessionFromToken)
  };
}

function assertAdmin(session) {
  if (session.role !== "administrador") {
    throw new Error("Acesso permitido apenas para Administrador.");
  }
}

const ROLE_PERMISSIONS = {
  vendedor: {
    createRequest: true,
    deleteRequest: true,
    createProposalNumber: true,
    saveProposal: false,
    saveCommercial: true,
    saveContract: false,
    manageUsers: false,
    readAllRequests: false,
    readAllProposalNumbers: false
  },
  comercial_interno: {
    createRequest: true,
    deleteRequest: true,
    createProposalNumber: true,
    saveProposal: true,
    saveCommercial: true,
    saveContract: true,
    manageUsers: false,
    readAllRequests: true,
    readAllProposalNumbers: true
  },
  propostas: {
    createRequest: false,
    deleteRequest: false,
    createProposalNumber: true,
    saveProposal: true,
    saveCommercial: false,
    saveContract: false,
    manageUsers: false,
    readAllRequests: true,
    readAllProposalNumbers: true
  },
  juridico: {
    createRequest: false,
    deleteRequest: false,
    createProposalNumber: false,
    saveProposal: false,
    saveCommercial: false,
    saveContract: true,
    manageUsers: false,
    readAllRequests: true,
    readAllProposalNumbers: false
  },
  gestor: {
    createRequest: false,
    deleteRequest: false,
    createProposalNumber: false,
    saveProposal: false,
    saveCommercial: false,
    saveContract: false,
    manageUsers: false,
    readAllRequests: true,
    readAllProposalNumbers: true
  },
  diretoria: {
    createRequest: false,
    deleteRequest: false,
    createProposalNumber: false,
    saveProposal: false,
    saveCommercial: false,
    saveContract: false,
    manageUsers: false,
    readAllRequests: true,
    readAllProposalNumbers: true
  },
  administrador: {
    createRequest: true,
    deleteRequest: true,
    createProposalNumber: true,
    saveProposal: true,
    saveCommercial: true,
    saveContract: true,
    manageUsers: true,
    readAllRequests: true,
    readAllProposalNumbers: true
  }
};

function assertAuthenticated(session) {
  if (!session?.authenticated) {
    const error = new Error("Sessão expirada ou usuário não autenticado.");
    error.statusCode = 401;
    throw error;
  }
}

function hasPermission(session, permission) {
  const role = session?.role || "vendedor";
  return Boolean(ROLE_PERMISSIONS[role]?.[permission]);
}

function assertPermission(session, permission, message) {
  if (!hasPermission(session, permission)) {
    const error = new Error(message || "Acesso negado para esta ação.");
    error.statusCode = 403;
    throw error;
  }
}

function hasModuleAccess(session, moduleName) {
  const modules = session?.moduleAccess || [];
  if (moduleName === "crm") {
    return modules.includes("vendas") || modules.includes("contratos") || modules.includes("relatorios");
  }
  return modules.includes(moduleName);
}

function defaultStageAccessForRole(roleName) {
  const defaults = {
    vendedor: [
      "solicitacao_criada",
      "aguardando_informacoes",
      "enviada_ao_vendedor",
      "em_negociacao",
      "proposta_aceita",
      "perdida",
      "cancelada"
    ],
    comercial_interno: [...WORKFLOW_STAGE_OPTIONS],
    propostas: [
      "em_triagem",
      "aguardando_informacoes",
      "em_preparacao_da_proposta",
      "proposta_finalizada"
    ],
    juridico: [
      "proposta_aceita",
      "elaboracao_de_contrato",
      "negociacao_de_clausulas",
      "contrato_assinado"
    ],
    gestor: [...WORKFLOW_STAGE_OPTIONS],
    diretoria: [...WORKFLOW_STAGE_OPTIONS],
    administrador: [...WORKFLOW_STAGE_OPTIONS]
  };

  return defaults[roleName] || [...WORKFLOW_STAGE_OPTIONS];
}

function stageAccessMatches(items, expected) {
  if (!Array.isArray(items) || !Array.isArray(expected) || items.length !== expected.length) {
    return false;
  }
  return items.every((item, index) => item === expected[index]);
}

function shouldRefreshStageAccess(stageAccess, roleName) {
  const normalized = normalizeStageAccess(stageAccess, roleName);
  const desired = defaultStageAccessForRole(roleName);
  if (!Array.isArray(stageAccess) || stageAccess.length === 0) {
    return true;
  }

  if (stageAccessMatches(normalized, desired)) {
    return false;
  }

  const legacyDefaults = {
    vendedor: [
      "solicitacao_criada",
      "enviada_ao_vendedor",
      "em_negociacao",
      "proposta_aceita",
      "perdida",
      "cancelada"
    ],
    juridico: [
      "proposta_aceita",
      "elaboracao_de_contrato",
      "negociacao_de_clausulas",
      "contrato_assinado"
    ]
  };

  return stageAccessMatches(normalized, legacyDefaults[roleName] || []);
}

function normalizeStageAccess(stageAccess, roleName) {
  const base = Array.isArray(stageAccess)
    ? stageAccess
    : String(stageAccess || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  const normalized = [...new Set(base.filter((item) => WORKFLOW_STAGE_OPTIONS.includes(item)))];
  return normalized.length ? normalized : defaultStageAccessForRole(roleName);
}

function hasStageAccess(session, stageCode) {
  if (!stageCode) return true;
  const allowedStages = normalizeStageAccess(session?.stageAccess, session?.role);
  return allowedStages.includes(stageCode);
}

function assertStageAccess(session, stageCode, message) {
  if (!hasStageAccess(session, stageCode)) {
    const error = new Error(message || "Seu usuário não tem acesso a esta etapa.");
    error.statusCode = 403;
    throw error;
  }
}

function assertModuleAccess(session, moduleName, message) {
  if (!hasModuleAccess(session, moduleName)) {
    const error = new Error(message || "Seu usuário não tem acesso a este módulo.");
    error.statusCode = 403;
    throw error;
  }
}

function assertAnyModuleAccess(session, moduleNames, message) {
  if (!moduleNames.some((moduleName) => hasModuleAccess(session, moduleName))) {
    const error = new Error(message || "Seu usuário não tem acesso a este módulo.");
    error.statusCode = 403;
    throw error;
  }
}

function canDownloadAttachment(session, attachmentType) {
  const role = session?.role || "vendedor";
  const sensitiveContract = ["minuta_inicial", "contrato_assinado"];
  const sellerDocs = ["anexo_inicial", "documento_tecnico_cliente", "proposta_final_pdf", "anexo_proposta_complementar", "anexo_aceite"];

  if (role === "administrador" || role === "comercial_interno") return true;
  if (role === "diretoria" || role === "gestor") return true;
  if (role === "propostas") return !sensitiveContract.includes(attachmentType);
  if (role === "juridico") return true;
  if (role === "vendedor") return sellerDocs.includes(attachmentType);
  return false;
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function serveFile(response, filePath) {
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendJson(response, 404, { error: "Arquivo nao encontrado." });
      return;
    }

    response.writeHead(200, { "Content-Type": contentType });
    response.end(data);
  });
}

function serveDownload(response, filePath, downloadName, mimeType) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendJson(response, 404, { error: "Arquivo nao encontrado." });
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(downloadName || path.basename(filePath))}"`
    });
    response.end(data);
  });
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function generateTemporaryPassword() {
  return `Temp${Math.random().toString(36).slice(2, 8)}!`;
}

function verifyPassword(password, storedHash) {
  if (!password || !storedHash || !storedHash.includes(":")) return false;
  const [salt, originalHash] = storedHash.split(":");
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(originalHash, "hex"));
}

function createSession(user) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000;
  sessions.set(token, {
    userId: user.id,
    name: user.name,
    email: String(user.email || "").toLowerCase(),
    roles: user.roles || [],
    primaryRole: user.primaryRole || user.roles?.[0] || "vendedor",
    moduleAccess: user.moduleAccess || ["vendas"],
    stageAccess: user.stageAccess || [],
    mustChangePassword: Boolean(user.mustChangePassword),
    expiresAt
  });
  return token;
}

function pruneExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (session?.expiresAt && session.expiresAt <= now) {
      sessions.delete(token);
    }
  }
}

const sessionCleanupTimer = setInterval(pruneExpiredSessions, 15 * 60 * 1000);
sessionCleanupTimer.unref();

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

function normalizeModuleAccess(moduleAccess, roleName) {
  const base = Array.isArray(moduleAccess)
    ? moduleAccess
    : String(moduleAccess || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  const expanded = base.flatMap((item) => {
    if (item === "crm") {
      return ["vendas", "contratos", "relatorios"];
    }
    return [item];
  });
  const normalized = [...new Set(expanded.filter((item) => MODULE_OPTIONS.includes(item)))];
  return normalized.length ? normalized : defaultModulesForRole(roleName);
}

function buildAuthUser(row) {
  const primaryRole = row.primaryRole || row.roles?.[0] || "vendedor";
  return {
    id: row.id,
    name: row.name,
    email: String(row.email || "").toLowerCase(),
    roles: row.roles?.length ? row.roles : ["vendedor"],
    primaryRole,
    moduleAccess: normalizeModuleAccess(row.moduleAccess, primaryRole),
    stageAccess: normalizeStageAccess(row.stageAccess, primaryRole),
    mustChangePassword: Boolean(row.mustChangePassword)
  };
}

function ensureDirSync(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function sanitizeFileName(fileName) {
  const ext = path.extname(fileName || "").toLowerCase();
  const base = path.basename(fileName || "arquivo", ext);
  const safeBase = slugify(base) || "arquivo";
  return `${safeBase}${ext}`;
}

function saveAttachmentFile(requestId, attachmentType, file) {
  if (!file?.contentBase64) return null;

  ensureDirSync(UPLOADS_DIR);
  const requestDir = path.join(UPLOADS_DIR, `request-${requestId}`);
  ensureDirSync(requestDir);

  const safeType = slugify(attachmentType || "anexo");
  const safeName = sanitizeFileName(file.fileName);
  const finalName = `${Date.now()}-${safeType}-${safeName}`;
  const storagePath = path.join(requestDir, finalName);

  fs.writeFileSync(storagePath, Buffer.from(file.contentBase64, "base64"));
  return storagePath;
}

function saveModuleFile(moduleFolder, fileType, file) {
  if (!file?.contentBase64) return null;

  ensureDirSync(UPLOADS_DIR);
  const targetDir = path.join(UPLOADS_DIR, moduleFolder);
  ensureDirSync(targetDir);

  const safeType = slugify(fileType || "arquivo");
  const safeName = sanitizeFileName(file.fileName);
  const finalName = `${Date.now()}-${safeType}-${safeName}`;
  const storagePath = path.join(targetDir, finalName);

  fs.writeFileSync(storagePath, Buffer.from(file.contentBase64, "base64"));
  return storagePath;
}

function parsePositiveInteger(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

async function createAttachmentRecord(client, {
  requestId,
  uploadedByUserId,
  attachmentType,
  file,
  description
}) {
  if (!file?.contentBase64) return null;

  const storagePath = saveAttachmentFile(requestId, attachmentType, file);
  const result = await client.query(
    `INSERT INTO attachments (
      request_id, uploaded_by_user_id, attachment_type, file_name,
      storage_path, mime_type, file_size, description
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id`,
    [
      requestId,
      uploadedByUserId,
      attachmentType,
      file.fileName || "arquivo",
      storagePath,
      file.mimeType || null,
      file.fileSize || null,
      description || null
    ]
  );

  return result.rows[0].id;
}

async function createAttachmentRecords(client, options) {
  const ids = [];
  for (const file of options.files || []) {
    const id = await createAttachmentRecord(client, { ...options, file });
    if (id) ids.push(id);
  }
  return ids;
}

function slugify(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizedStructureKey(value) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function dedupeByKey(items = [], createKey) {
  const seen = new Set();
  const unique = [];
  for (const item of items || []) {
    const key = createKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique;
}

function hasStructureValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function mergeStructureValue(currentValue, nextValue) {
  if (hasStructureValue(currentValue)) return currentValue;
  return nextValue;
}

function buildPostStructureCoreKey(item = {}) {
  return [
    normalizedStructureKey(normalizeServiceLabel(item.postType)),
    normalizedStructureKey(item.postQty),
    normalizedStructureKey(item.workerQty),
    normalizedStructureKey(item.functionName),
    normalizedStructureKey(item.workScale),
    normalizedStructureKey(item.startTime),
    normalizedStructureKey(item.endTime),
    normalizedStructureKey(item.saturdayStartTime ?? item.saturdayTime),
    normalizedStructureKey(item.saturdayEndTime),
    normalizedStructureKey(item.holidayFlag)
  ].join("|");
}

function dedupeRequestStructurePayload(payload = {}) {
  const serviceTypes = [...new Set((payload.serviceTypes || []).map((item) => normalizeServiceLabel(item)).filter(Boolean))];
  const transportOptions = [...new Set((payload.transportOptions || []).map((item) => String(item || "").trim()).filter(Boolean))];
  const postMap = new Map();
  for (const item of payload.posts || []) {
    const key = buildPostStructureCoreKey(item);
    if (!key) continue;
    const current = postMap.get(key);
    if (!current) {
      postMap.set(key, { ...item });
      continue;
    }
    postMap.set(key, {
      ...current,
      additionalType: mergeStructureValue(current.additionalType, item.additionalType),
      gratificationPercentage: mergeStructureValue(current.gratificationPercentage, item.gratificationPercentage),
      indemnifiedFlag: mergeStructureValue(current.indemnifiedFlag, item.indemnifiedFlag),
      uniformText: mergeStructureValue(current.uniformText, item.uniformText),
      costAllowance: mergeStructureValue(current.costAllowance, item.costAllowance)
    });
  }
  const posts = [...postMap.values()];
  const equipments = dedupeByKey(payload.equipments || [], (item) => [
    normalizedStructureKey(normalizeServiceLabel(item.category || "")),
    normalizedStructureKey(item.equipmentName),
    normalizedStructureKey(item.equipmentQty ?? item.quantity),
    normalizedStructureKey(item.equipmentNotes ?? item.notes)
  ].join("|"));

  return {
    ...payload,
    serviceTypes,
    transportOptions,
    posts,
    equipments
  };
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (/[",;\n]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const normalized = String(value).replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeServiceLabel(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.toLowerCase() === "seguranca") return "Vigilancia";
  return text;
}

function normalizeProposalServiceLines(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      serviceType: String(item?.serviceType || "").trim(),
      proposalValue: toNullableNumber(item?.proposalValue),
      bdi: toNullableNumber(item?.bdi)
    }))
    .filter((item) => item.serviceType && (item.proposalValue !== null || item.bdi !== null));
}

function deriveProposalTotals(payload = {}) {
  const serviceLines = normalizeProposalServiceLines(payload.serviceLines);
  const explicitValue = toNullableNumber(payload.proposalValue);
  const explicitBdi = toNullableNumber(payload.bdi);

  const derivedValue = serviceLines.reduce((sum, item) => sum + Number(item.proposalValue || 0), 0);
  const bdiItems = serviceLines.filter((item) => item.bdi !== null);
  const averageBdi = bdiItems.length
    ? bdiItems.reduce((sum, item) => sum + Number(item.bdi || 0), 0) / bdiItems.length
    : null;

  return {
    serviceLines,
    proposalValue: explicitValue !== null ? explicitValue : (derivedValue > 0 ? derivedValue : null),
    bdi: explicitBdi !== null ? explicitBdi : averageBdi
  };
}

function buildSlaStatusCase() {
  return `
    CASE
      WHEN ws.is_terminal THEN 'Encerrado'
      WHEN ws.sla_paused THEN 'Pausado'
      WHEN ws.sla_hours IS NULL THEN 'Sem SLA'
      WHEN latest.entered_at IS NULL THEN 'Sem historico'
      WHEN NOW() > (latest.entered_at + make_interval(hours => ws.sla_hours)) THEN 'Vencido'
      WHEN NOW() >= (latest.entered_at + make_interval(hours => ws.sla_hours) - interval '8 hours') THEN 'Em risco'
      ELSE 'No prazo'
    END
  `;
}

function buildProposalNumberAccessClause(session, values) {
  if (hasPermission(session, "readAllProposalNumbers")) {
    return "TRUE";
  }

  if (session?.role === "vendedor") {
    const userIdIndex = values.push(session.userId || null);
    const nameIndex = values.push(session.name || "");
    return `(pr.seller_user_id = $${userIdIndex} OR (pr.seller_user_id IS NULL AND LOWER(COALESCE(pr.manager_name, '')) = LOWER($${nameIndex})))`;
  }

  return "FALSE";
}

async function assertProposalRegistryAccessBySession(client, proposalRegistryId, session) {
  if (hasPermission(session, "readAllProposalNumbers")) return;

  if (session?.role !== "vendedor" || !session.userId) {
    throw new Error("Acesso negado a esta proposta.");
  }

  const result = await client.query(
    `SELECT
       pr.seller_user_id AS "sellerUserId",
       pr.manager_name AS "managerName"
     FROM proposal_registry pr
     WHERE pr.id = $1`,
    [proposalRegistryId]
  );

  const proposal = result.rows[0];
  if (!proposal) {
    throw new Error("Proposta nao encontrada.");
  }

  const ownedBySeller = proposal.sellerUserId && Number(proposal.sellerUserId) === Number(session.userId);
  const ownedByManagerName = !proposal.sellerUserId
    && String(proposal.managerName || "").trim().toLowerCase() === String(session.name || "").trim().toLowerCase();

  if (!ownedBySeller && !ownedByManagerName) {
    throw new Error("Acesso negado a esta proposta.");
  }
}

function formatProposalNumberDisplay(sequence, issueDate) {
  const year = issueDate
    ? Number(String(issueDate).slice(0, 4))
    : Number(
        new Intl.DateTimeFormat("en-CA", {
          timeZone: APP_TIMEZONE,
          year: "numeric"
        }).format(new Date())
      );
  return `${sequence}/${year}`;
}

function getSaoPauloIsoDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function buildProposalStageCodeSql(alias = "pr") {
  return `CASE
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'em triagem' THEN 'em_triagem'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'aguardando informacoes' THEN 'aguardando_informacoes'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) IN ('em preparacao da proposta', 'em elaboracao da proposta') THEN 'em_preparacao_da_proposta'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'proposta finalizada' THEN 'proposta_finalizada'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'recebimento de proposta' THEN 'enviada_ao_vendedor'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) IN ('ganho', 'pedido', 'proposta aceita', 'proposta ganha') THEN 'proposta_aceita'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'elaboracao de contrato' THEN 'elaboracao_de_contrato'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'negociacao de clausulas' THEN 'negociacao_de_clausulas'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'contrato assinado' THEN 'contrato_assinado'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'perdido' THEN 'perdida'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'cancelado' THEN 'cancelada'
    ELSE 'em_negociacao'
  END`;
}

function buildProposalStageLabelSql(alias = "pr") {
  return `CASE
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'em triagem' THEN 'Em triagem'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'aguardando informacoes' THEN 'Aguardando informações'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) IN ('em preparacao da proposta', 'em elaboracao da proposta') THEN 'Em Elaboração da Proposta'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'proposta finalizada' THEN 'Proposta finalizada'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'recebimento de proposta' THEN 'Recebimento de Proposta'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) IN ('ganho', 'pedido', 'proposta aceita', 'proposta ganha') THEN 'Proposta Ganha'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'elaboracao de contrato' THEN 'Elaboração de contrato'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'negociacao de clausulas' THEN 'Negociação de cláusulas'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'contrato assinado' THEN 'Contrato assinado'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'perdido' THEN 'Perdida'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'cancelado' THEN 'Cancelada'
    ELSE 'Em negociacao'
  END`;
}

function buildProposalCommercialStageCodeSql(alias = "pr") {
  return `CASE
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'em triagem' THEN 'em_triagem'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'aguardando informacoes' THEN 'aguardando_informacoes'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) IN ('em preparacao da proposta', 'em elaboracao da proposta') THEN 'em_preparacao_da_proposta'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'proposta finalizada' THEN 'proposta_finalizada'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'recebimento de proposta' THEN 'enviada_ao_vendedor'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) IN (
      'ganho',
      'pedido',
      'proposta aceita',
      'proposta ganha',
      'elaboracao de contrato',
      'negociacao de clausulas',
      'contrato assinado'
    ) THEN 'proposta_aceita'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'perdido' THEN 'perdida'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'cancelado' THEN 'cancelada'
    ELSE 'em_negociacao'
  END`;
}

function buildProposalCommercialStageLabelSql(alias = "pr") {
  return `CASE
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'em triagem' THEN 'Em triagem'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'aguardando informacoes' THEN 'Aguardando informações'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) IN ('em preparacao da proposta', 'em elaboracao da proposta') THEN 'Em Elaboração da Proposta'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'proposta finalizada' THEN 'Proposta finalizada'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'recebimento de proposta' THEN 'Recebimento de Proposta'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) IN (
      'ganho',
      'pedido',
      'proposta aceita',
      'proposta ganha',
      'elaboracao de contrato',
      'negociacao de clausulas',
      'contrato assinado'
    ) THEN 'Proposta Ganha'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'perdido' THEN 'Perdida'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'cancelado' THEN 'Cancelada'
    ELSE 'Em negociacao'
  END`;
}

function mapProposalStageCodeToStatus(nextStageCode, fallbackStatus = null) {
  const mapping = {
    em_triagem: "Em triagem",
    aguardando_informacoes: "Aguardando informacoes",
    em_preparacao_da_proposta: "Em Elaboracao da Proposta",
    proposta_finalizada: "Proposta finalizada",
    enviada_ao_vendedor: "Recebimento de Proposta",
    em_negociacao: "Em negociacao",
    proposta_aceita: "Proposta Ganha",
    elaboracao_de_contrato: "Elaboracao de contrato",
    negociacao_de_clausulas: "Negociacao de clausulas",
    contrato_assinado: "Contrato assinado",
    perdida: "Perdido",
    cancelada: "Cancelado"
  };

  return mapping[nextStageCode] || fallbackStatus || "Em negociacao";
}

function stageRequiresProposalRegistry(stageCode) {
  return new Set([
    "enviada_ao_vendedor",
    "em_negociacao",
    "proposta_aceita",
    "perdida",
    "cancelada",
    "elaboracao_de_contrato",
    "negociacao_de_clausulas",
    "contrato_assinado"
  ]).has(stageCode);
}

async function getRequestServiceScope(client, requestId) {
  const result = await client.query(
    `SELECT DISTINCT service_type AS "serviceType"
     FROM request_services
     WHERE request_id = $1
       AND COALESCE(service_type, '') <> ''
     ORDER BY "serviceType"`,
    [requestId]
  );

  return result.rows
    .map((row) => String(row.serviceType || "").trim())
    .filter(Boolean)
    .join(", ");
}

async function backfillMissingProposalRegistryForAdvancedRequests(client, session = null) {
  const advancedStages = [
    "enviada_ao_vendedor",
    "em_negociacao",
    "proposta_aceita",
    "perdida",
    "cancelada",
    "elaboracao_de_contrato",
    "negociacao_de_clausulas",
    "contrato_assinado"
  ];
  const result = await client.query(
    `SELECT
       r.id,
       r.request_number AS "requestNumber",
       TO_CHAR(COALESCE(r.request_date, CURRENT_DATE), 'YYYY-MM-DD') AS "issueDate",
       r.branch_name AS "branchName",
       r.lead_source AS "leadSource",
       r.seller_user_id AS "sellerUserId",
       ws.code AS "stageCode",
       UPPER(c.legal_name) AS "clientName",
       c.industry_segment AS "industrySegment",
       COALESCE(commercial_seller_user.name, seller_user.name) AS "managerName"
     FROM requests r
     JOIN clients c ON c.id = r.client_id
     JOIN workflow_stages ws ON ws.id = r.current_stage_id
     JOIN users seller_user ON seller_user.id = r.seller_user_id
     LEFT JOIN commercial_records commercial_record ON commercial_record.request_id = r.id
     LEFT JOIN users commercial_seller_user ON commercial_seller_user.id = commercial_record.seller_user_id
     LEFT JOIN LATERAL (
       SELECT id
       FROM proposal_registry
       WHERE request_id = r.id
       ORDER BY id DESC
       LIMIT 1
     ) linked_proposal ON TRUE
     WHERE ws.code = ANY($1::text[])
       AND linked_proposal.id IS NULL
     ORDER BY COALESCE(r.request_date, CURRENT_DATE), r.id`,
    [advancedStages]
  );

  const created = [];

  for (const row of result.rows) {
    const nextResult = await client.query(
      "SELECT COALESCE(MAX(proposal_sequence), 0)::int + 1 AS next_sequence FROM proposal_registry"
    );
    const proposalSequence = Number(nextResult.rows[0]?.next_sequence || 1);
    const issueDate = row.issueDate || getSaoPauloIsoDate();
    const proposalNumberDisplay = formatProposalNumberDisplay(proposalSequence, issueDate);
    const proposalYear = Number(String(issueDate).slice(0, 4)) || new Date().getFullYear();
    const serviceScope = await getRequestServiceScope(client, row.id);
    const negotiationStatus = mapProposalStageCodeToStatus(row.stageCode, "Em negociacao");

    const insertResult = await client.query(
      `INSERT INTO proposal_registry (
        proposal_sequence, proposal_year, proposal_number_display, issue_date,
        manager_name, service_scope, document_type, client_name, contact_name,
        phone, industry_segment, proposal_value, bdi, negotiation_status, notes,
        request_id, crm_request_number, seller_user_id, branch_name, lead_source,
        uploaded_file_name, uploaded_storage_path, uploaded_mime_type, uploaded_file_size,
        imported_from_legacy, legacy_source_file
      ) VALUES (
        $1, $2, $3, $4::date,
        $5, $6, 'PROPOSTA', $7, NULL,
        NULL, $8, NULL, NULL, $9, $10,
        $11, NULL, $12, $13, $14,
        NULL, NULL, NULL, NULL,
        FALSE, NULL
      )
      RETURNING id, proposal_number_display AS "proposalNumberDisplay"`,
      [
        proposalSequence,
        proposalYear,
        proposalNumberDisplay,
        issueDate,
        row.managerName || null,
        serviceScope || null,
        row.clientName || null,
        row.industrySegment || null,
        negotiationStatus,
        `Numero gerado automaticamente para regularizar a solicitacao ${row.requestNumber}.`,
        row.id,
        row.sellerUserId || null,
        row.branchName || null,
        row.leadSource || null
      ]
    );

    await logAuditEntry(client, {
      actor: session || {
        userId: null,
        name: "Sistema",
        email: null,
        role: "administrador"
      },
      actionType: "proposal_number_backfilled",
      entityType: "proposal_registry",
      entityId: insertResult.rows[0].id,
      requestId: row.id,
      description: `Proposta ${insertResult.rows[0].proposalNumberDisplay} criada automaticamente para a solicitacao ${row.requestNumber}.`,
      metadata: {
        requestId: row.id,
        requestNumber: row.requestNumber,
        stageCode: row.stageCode
      }
    });

    created.push({
      requestId: row.id,
      requestNumber: row.requestNumber,
      proposalRegistryId: insertResult.rows[0].id,
      proposalNumber: insertResult.rows[0].proposalNumberDisplay,
      stageCode: row.stageCode
    });
  }

  return created;
}

const WORKFLOW_STAGE_LABELS = {
  solicitacao_criada: "Solicitacao criada",
  em_triagem: "Em triagem",
  aguardando_informacoes: "Aguardando informacoes",
  em_preparacao_da_proposta: "Em Elaboracao da Proposta",
  proposta_finalizada: "Proposta finalizada",
  enviada_ao_vendedor: "Recebimento de Proposta",
  em_negociacao: "Em negociacao",
  proposta_aceita: "Proposta Ganha",
  perdida: "Perdida",
  cancelada: "Cancelada",
  elaboracao_de_contrato: "Elaboracao de contrato",
  negociacao_de_clausulas: "Negociacao de clausulas",
  contrato_assinado: "Contrato assinado"
};

function getWorkflowStageLabel(stageCode) {
  return WORKFLOW_STAGE_LABELS[String(stageCode || "").trim()] || String(stageCode || "").trim() || "Etapa atualizada";
}

function toUpperOrNull(value) {
  const text = String(value || "").trim();
  return text ? text.toUpperCase() : null;
}

function buildRequestOverviewQuery() {
  const slaStatusCase = buildSlaStatusCase();

  return `
    WITH latest AS (
      SELECT DISTINCT ON (request_id)
        request_id,
        entered_at,
        sla_deadline_at,
        note
      FROM request_stage_history
      ORDER BY request_id, entered_at DESC, id DESC
    )
    SELECT
      r.id,
      r.request_number AS "requestNumber",
        UPPER(c.legal_name) AS company,
      seller_user.name AS seller,
      seller_user.email AS "sellerEmail",
      linked_proposal.id AS "proposalRegistryId",
      linked_proposal.proposal_number_display AS "proposalNumber",
      ws.name AS "currentStage",
      ws.code AS "stageCode",
      ${slaStatusCase} AS "slaStatus",
      COALESCE(owner_user.name, seller_user.name) AS "currentOwner",
      TO_CHAR(r.updated_at AT TIME ZONE '${APP_TIMEZONE}', 'DD/MM/YYYY HH24:MI') AS "updatedAt",
      latest.entered_at AS "stageEnteredAt",
      latest.note AS "latestHistoryNote"
    FROM requests r
    JOIN clients c ON c.id = r.client_id
    JOIN users seller_user ON seller_user.id = r.seller_user_id
    JOIN workflow_stages ws ON ws.id = r.current_stage_id
    LEFT JOIN users owner_user ON owner_user.id = r.current_owner_user_id
    LEFT JOIN latest ON latest.request_id = r.id
    LEFT JOIN LATERAL (
      SELECT id, proposal_number_display
      FROM proposal_registry
      WHERE request_id = r.id
      ORDER BY id DESC
      LIMIT 1
    ) linked_proposal ON TRUE
  `;
}

async function ensureUser(client, name, email) {
  const existing = await client.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows[0]) return existing.rows[0].id;

  const inserted = await client.query(
    "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id",
    [name, email]
  );
  return inserted.rows[0].id;
}

async function ensureRole(client, name, description) {
  const existing = await client.query("SELECT id FROM roles WHERE name = $1", [name]);
  if (existing.rows[0]) return existing.rows[0].id;
  const inserted = await client.query(
    "INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id",
    [name, description]
  );
  return inserted.rows[0].id;
}

async function ensureUserRole(client, userId, roleId) {
  await client.query(
    "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT (user_id, role_id) DO NOTHING",
    [userId, roleId]
  );
}

async function ensurePasswordColumn() {
  await query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_hash TEXT
  `);
}

async function ensureMustChangePasswordColumn() {
  await query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE
  `);
}

async function ensureModuleAccessColumn() {
  await query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS module_access TEXT[] DEFAULT ARRAY['crm']::TEXT[]
  `);
}

async function ensureWorkflowStageAccessColumn() {
  await query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS workflow_stage_access TEXT[] DEFAULT ARRAY[]::TEXT[]
  `);
}

async function ensureRequestSubmissionKeyColumn() {
  await query(`
    ALTER TABLE requests
    ADD COLUMN IF NOT EXISTS submission_key VARCHAR(120)
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_requests_submission_key
    ON requests(submission_key)
  `);
}

async function ensureProposalRegistryColumns() {
  await query(`
    ALTER TABLE proposal_registry
    ADD COLUMN IF NOT EXISTS crm_request_number TEXT,
    ADD COLUMN IF NOT EXISTS probability_level VARCHAR(20),
    ADD COLUMN IF NOT EXISTS probability_reason TEXT,
    ADD COLUMN IF NOT EXISTS next_action TEXT,
    ADD COLUMN IF NOT EXISTS expected_close_date DATE,
    ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sent_to_seller_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS seller_receipt_confirmed BOOLEAN,
    ADD COLUMN IF NOT EXISTS requested_adjustments TEXT,
    ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS accepted_scope TEXT,
    ADD COLUMN IF NOT EXISTS accepted_conditions TEXT,
    ADD COLUMN IF NOT EXISTS accepted_note TEXT,
    ADD COLUMN IF NOT EXISTS contract_started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS draft_version TEXT,
    ADD COLUMN IF NOT EXISTS clause_round_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS document_pending_notes TEXT,
    ADD COLUMN IF NOT EXISTS operation_start_date DATE,
    ADD COLUMN IF NOT EXISTS uploaded_file_name TEXT,
    ADD COLUMN IF NOT EXISTS uploaded_storage_path TEXT,
    ADD COLUMN IF NOT EXISTS uploaded_mime_type TEXT,
    ADD COLUMN IF NOT EXISTS uploaded_file_size BIGINT
  `);

  await query(`
    UPDATE proposal_registry
    SET probability_level = CASE
      WHEN notes ILIKE '%Probabilidade: Alta%' THEN 'Alta'
      WHEN notes ILIKE '%Probabilidade: Media%' THEN 'Media'
      WHEN notes ILIKE '%Probabilidade: Média%' THEN 'Media'
      WHEN notes ILIKE '%Probabilidade: Baixa%' THEN 'Baixa'
      ELSE probability_level
    END
    WHERE probability_level IS NULL
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS proposal_registry_service_lines (
      id BIGSERIAL PRIMARY KEY,
      proposal_registry_id BIGINT NOT NULL REFERENCES proposal_registry(id) ON DELETE CASCADE,
      service_type VARCHAR(80) NOT NULL,
      proposal_value NUMERIC(18,2),
      bdi NUMERIC(12,4),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_proposal_registry_service_line
    ON proposal_registry_service_lines(proposal_registry_id, service_type)
  `);
}

async function ensureWorkflowStageColumns() {
  await query(`
    ALTER TABLE workflow_stages
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0
  `);
}

async function ensureWorkflowStageNames() {
  const stageNames = {
    solicitacao_criada: "Solicitacao criada",
    em_triagem: "Em triagem",
    aguardando_informacoes: "Aguardando informacoes",
    em_preparacao_da_proposta: "Em Elaboracao da Proposta",
    proposta_finalizada: "Proposta finalizada",
    enviada_ao_vendedor: "Recebimento de Proposta",
    em_negociacao: "Em negociacao",
    proposta_aceita: "Proposta Ganha",
    perdida: "Perdida",
    cancelada: "Cancelada",
    elaboracao_de_contrato: "Elaboracao de contrato",
    negociacao_de_clausulas: "Negociacao de clausulas",
    contrato_assinado: "Contrato assinado"
  };

  for (const [code, name] of Object.entries(stageNames)) {
    await query(
      `UPDATE workflow_stages
       SET name = $2
       WHERE code = $1`,
      [code, name]
    );
  }
}

async function ensureUppercaseClientNames() {
  await query(`
    UPDATE clients
    SET legal_name = UPPER(legal_name),
        trade_name = CASE WHEN trade_name IS NULL THEN NULL ELSE UPPER(trade_name) END
    WHERE legal_name IS NOT NULL
       OR trade_name IS NOT NULL
  `);

  await query(`
    UPDATE proposal_registry
    SET client_name = UPPER(client_name)
    WHERE client_name IS NOT NULL
  `);
}

async function ensureCanonicalSellerNames() {
  await query(`
    UPDATE users
    SET name = CASE
      WHEN UPPER(name) = 'ANDRE' THEN 'ANDRE'
      WHEN UPPER(name) = 'LANA' THEN 'LANA'
      ELSE name
    END
    WHERE UPPER(name) IN ('ANDRE', 'LANA')
  `);

  await query(`
    UPDATE proposal_registry
    SET manager_name = CASE
      WHEN UPPER(manager_name) = 'ANDRE' THEN 'ANDRE'
      WHEN UPPER(manager_name) = 'LANA' THEN 'LANA'
      ELSE manager_name
    END
    WHERE manager_name IS NOT NULL
      AND UPPER(manager_name) IN ('ANDRE', 'LANA')
  `);
}

async function ensureRequestStructureDeduplication() {
  await query(`
    DELETE FROM request_services current_row
    USING request_services duplicate_row
    WHERE current_row.id > duplicate_row.id
      AND current_row.request_id = duplicate_row.request_id
      AND current_row.service_type IS NOT DISTINCT FROM duplicate_row.service_type
  `);

  await query(`
    DELETE FROM request_benefits current_row
    USING request_benefits duplicate_row
    WHERE current_row.id > duplicate_row.id
      AND current_row.request_id = duplicate_row.request_id
      AND current_row.benefit_type IS NOT DISTINCT FROM duplicate_row.benefit_type
      AND current_row.option_label IS NOT DISTINCT FROM duplicate_row.option_label
      AND current_row.region_value IS NOT DISTINCT FROM duplicate_row.region_value
      AND current_row.notes IS NOT DISTINCT FROM duplicate_row.notes
  `);

  await query(`
    DELETE FROM request_posts current_row
    USING request_posts duplicate_row
    WHERE current_row.id > duplicate_row.id
      AND current_row.request_id = duplicate_row.request_id
      AND current_row.post_type IS NOT DISTINCT FROM duplicate_row.post_type
      AND current_row.qty_posts IS NOT DISTINCT FROM duplicate_row.qty_posts
      AND current_row.qty_workers IS NOT DISTINCT FROM duplicate_row.qty_workers
      AND current_row.function_name IS NOT DISTINCT FROM duplicate_row.function_name
      AND current_row.work_scale IS NOT DISTINCT FROM duplicate_row.work_scale
      AND current_row.start_time IS NOT DISTINCT FROM duplicate_row.start_time
      AND current_row.end_time IS NOT DISTINCT FROM duplicate_row.end_time
      AND current_row.saturday_time IS NOT DISTINCT FROM duplicate_row.saturday_time
      AND current_row.saturday_end_time IS NOT DISTINCT FROM duplicate_row.saturday_end_time
      AND current_row.holiday_flag IS NOT DISTINCT FROM duplicate_row.holiday_flag
      AND current_row.additional_type IS NOT DISTINCT FROM duplicate_row.additional_type
      AND current_row.gratification_percentage IS NOT DISTINCT FROM duplicate_row.gratification_percentage
      AND current_row.indemnified_flag IS NOT DISTINCT FROM duplicate_row.indemnified_flag
      AND current_row.uniform_text IS NOT DISTINCT FROM duplicate_row.uniform_text
      AND current_row.cost_allowance_value IS NOT DISTINCT FROM duplicate_row.cost_allowance_value
  `);

  await query(`
    WITH ranked_posts AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY
            request_id,
            post_type,
            qty_posts,
            qty_workers,
            function_name,
            work_scale,
            start_time,
            end_time,
            saturday_time,
            saturday_end_time,
            holiday_flag
          ORDER BY
            (
              CASE WHEN additional_type IS NOT NULL AND additional_type <> '' THEN 1 ELSE 0 END +
              CASE WHEN gratification_percentage IS NOT NULL THEN 1 ELSE 0 END +
              CASE WHEN indemnified_flag IS NOT NULL THEN 1 ELSE 0 END +
              CASE WHEN uniform_text IS NOT NULL AND uniform_text <> '' THEN 1 ELSE 0 END +
              CASE WHEN cost_allowance_value IS NOT NULL THEN 1 ELSE 0 END
            ) DESC,
            id ASC
        ) AS row_rank
      FROM request_posts
    )
    DELETE FROM request_posts
    WHERE id IN (
      SELECT id
      FROM ranked_posts
      WHERE row_rank > 1
    )
  `);

  await query(`
    DELETE FROM request_equipments current_row
    USING request_equipments duplicate_row
    WHERE current_row.id > duplicate_row.id
      AND current_row.request_id = duplicate_row.request_id
      AND current_row.category IS NOT DISTINCT FROM duplicate_row.category
      AND current_row.equipment_name IS NOT DISTINCT FROM duplicate_row.equipment_name
      AND current_row.quantity IS NOT DISTINCT FROM duplicate_row.quantity
      AND current_row.notes IS NOT DISTINCT FROM duplicate_row.notes
  `);
}

async function ensureCommercialRecordColumns() {
  await query(`
    ALTER TABLE commercial_records
    ADD COLUMN IF NOT EXISTS probability_level VARCHAR(20),
    ADD COLUMN IF NOT EXISTS probability_reason TEXT
  `);
}

async function ensureRequestPendingResponseColumns() {
  await query(`
    ALTER TABLE request_pending_info
    ADD COLUMN IF NOT EXISTS responded_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS response_note TEXT,
    ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ
  `);
}

async function ensureRequestPostColumns() {
  await query(`
    ALTER TABLE request_posts
    ADD COLUMN IF NOT EXISTS saturday_end_time VARCHAR(40),
    ADD COLUMN IF NOT EXISTS additional_type VARCHAR(60),
    ADD COLUMN IF NOT EXISTS gratification_percentage NUMERIC(8,2)
  `);

  await query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'request_posts'
          AND column_name = 'holiday_flag'
          AND data_type = 'boolean'
      ) THEN
        ALTER TABLE request_posts
        ALTER COLUMN holiday_flag TYPE VARCHAR(20)
        USING CASE
          WHEN holiday_flag IS TRUE THEN 'Sim'
          WHEN holiday_flag IS FALSE THEN 'Nao'
          ELSE NULL
        END;
      END IF;
    END $$;
  `);
}

async function ensureAuditLogTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGSERIAL PRIMARY KEY,
      actor_user_id BIGINT REFERENCES users(id),
      actor_name VARCHAR(150),
      actor_email VARCHAR(255),
      actor_role VARCHAR(80),
      action_type VARCHAR(80) NOT NULL,
      entity_type VARCHAR(80) NOT NULL,
      entity_id BIGINT,
      request_id BIGINT REFERENCES requests(id) ON DELETE SET NULL,
      target_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
      description TEXT NOT NULL,
      metadata_json JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
    ON audit_logs(created_at DESC)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id
    ON audit_logs(request_id)
  `);
}

async function ensureNegotiationDiaryTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS negotiation_diary_entries (
      id BIGSERIAL PRIMARY KEY,
      request_id BIGINT REFERENCES requests(id) ON DELETE CASCADE,
      proposal_registry_id BIGINT REFERENCES proposal_registry(id) ON DELETE CASCADE,
      actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
      actor_name VARCHAR(150),
      actor_email VARCHAR(255),
      contact_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      summary TEXT NOT NULL,
      next_action TEXT,
      probability_level VARCHAR(20),
      commercial_notes TEXT,
      requested_adjustments TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    ALTER TABLE negotiation_diary_entries
    ADD COLUMN IF NOT EXISTS revised_proposal_value NUMERIC(18,2)
  `);

  await query(`
    ALTER TABLE negotiation_diary_entries
    ADD COLUMN IF NOT EXISTS revised_bdi NUMERIC(12,4)
  `);

  await query(`
    ALTER TABLE negotiation_diary_entries
    ADD COLUMN IF NOT EXISTS stage_code VARCHAR(80)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_negotiation_diary_request_id
    ON negotiation_diary_entries(request_id, contact_date DESC, id DESC)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_negotiation_diary_proposal_id
    ON negotiation_diary_entries(proposal_registry_id, contact_date DESC, id DESC)
  `);
}

async function ensureNegotiationValueHistoryTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS negotiation_value_history (
      id BIGSERIAL PRIMARY KEY,
      request_id BIGINT REFERENCES requests(id) ON DELETE CASCADE,
      proposal_registry_id BIGINT REFERENCES proposal_registry(id) ON DELETE CASCADE,
      actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
      actor_name VARCHAR(150),
      actor_email VARCHAR(255),
      stage_code VARCHAR(80),
      entry_type VARCHAR(80) NOT NULL DEFAULT 'revisao_negociacao',
      proposal_value NUMERIC(18,2),
      bdi NUMERIC(12,4),
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_negotiation_value_history_request_id
    ON negotiation_value_history(request_id, created_at DESC, id DESC)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_negotiation_value_history_proposal_id
    ON negotiation_value_history(proposal_registry_id, created_at DESC, id DESC)
  `);
}

async function ensureNotificationTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS user_notifications (
      id BIGSERIAL PRIMARY KEY,
      recipient_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      request_id BIGINT REFERENCES requests(id) ON DELETE CASCADE,
      proposal_registry_id BIGINT REFERENCES proposal_registry(id) ON DELETE CASCADE,
      notification_type VARCHAR(80) NOT NULL DEFAULT 'status_change',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      from_stage_code VARCHAR(80),
      to_stage_code VARCHAR(80),
      actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
      actor_name VARCHAR(150),
      actor_email VARCHAR(255),
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      read_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_user_notifications_recipient_created
    ON user_notifications(recipient_user_id, created_at DESC, id DESC)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_user_notifications_recipient_read
    ON user_notifications(recipient_user_id, is_read, created_at DESC, id DESC)
  `);
}

async function ensureAppLookupOptionsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS app_lookup_options (
      id BIGSERIAL PRIMARY KEY,
      category VARCHAR(80) NOT NULL,
      group_key VARCHAR(150),
      value TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_app_lookup_options_category_group_value
    ON app_lookup_options (category, COALESCE(group_key, ''), value)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_app_lookup_options_category_order
    ON app_lookup_options (category, group_key, sort_order, value)
  `);
}

async function ensureCanonicalServiceLabels() {
  await query(`
    UPDATE request_services
    SET service_type = 'vigilancia'
    WHERE service_type = 'seguranca'
  `);

  await query(`
    UPDATE request_posts
    SET post_type = 'vigilancia'
    WHERE post_type = 'seguranca'
  `);

  await query(`
    UPDATE request_equipments
    SET category = 'vigilancia'
    WHERE category = 'seguranca'
  `);

  await query(`
    DELETE FROM app_lookup_options
    WHERE category = 'serviceTypes'
      AND LOWER(value) = 'seguranca'
      AND EXISTS (
        SELECT 1
        FROM app_lookup_options existing
        WHERE existing.category = 'serviceTypes'
          AND existing.id <> app_lookup_options.id
          AND COALESCE(existing.group_key, '') = COALESCE(app_lookup_options.group_key, '')
          AND existing.value = 'Vigilancia'
      )
  `);

  await query(`
    UPDATE app_lookup_options
    SET value = 'Vigilancia'
    WHERE category = 'serviceTypes'
      AND LOWER(value) = 'seguranca'
  `);

  await query(`
    DELETE FROM app_lookup_options
    WHERE category = 'equipmentOptions'
      AND LOWER(COALESCE(group_key, '')) = 'seguranca'
      AND EXISTS (
        SELECT 1
        FROM app_lookup_options existing
        WHERE existing.category = 'equipmentOptions'
          AND existing.id <> app_lookup_options.id
          AND COALESCE(existing.group_key, '') = 'Vigilancia'
          AND existing.value = app_lookup_options.value
      )
  `);

  await query(`
    UPDATE app_lookup_options
    SET group_key = 'Vigilancia'
    WHERE category = 'equipmentOptions'
      AND LOWER(COALESCE(group_key, '')) = 'seguranca'
  `);

  await query(`
    DELETE FROM app_lookup_options first
    USING app_lookup_options second
    WHERE first.id < second.id
      AND first.category = second.category
      AND COALESCE(first.group_key, '') = COALESCE(second.group_key, '')
      AND first.value = second.value
  `);
}

async function ensureAppLookupCategoryValues(client, category, values = [], groupKey = null) {
  for (const [index, value] of values.entries()) {
    const text = category === "serviceTypes"
      ? normalizeServiceLabel(value)
      : String(value || "").trim();
    if (!text) continue;
    const normalizedGroupKey = category === "equipmentOptions"
      ? normalizeServiceLabel(groupKey)
      : groupKey;
    await client.query(
      `INSERT INTO app_lookup_options (category, group_key, value, sort_order, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       ON CONFLICT DO NOTHING`,
      [category, normalizedGroupKey, text, (index + 1) * 10]
    );
  }
}

function buildConfigLookups(rows = []) {
  const bucket = {
    branches: [],
    responsibles: [],
    leadSources: [],
    proposalStatuses: [],
    documentTypes: [],
    industries: [],
    serviceTypes: [],
    workScales: [],
    equipmentOptionsByService: {}
  };

  rows.forEach((row) => {
    if (!row.isActive) return;
    if (row.category === "equipmentOptions") {
      const serviceKey = normalizeServiceLabel(row.groupKey);
      if (!serviceKey) return;
      if (!bucket.equipmentOptionsByService[serviceKey]) {
        bucket.equipmentOptionsByService[serviceKey] = [];
      }
      bucket.equipmentOptionsByService[serviceKey].push(String(row.value || "").trim());
      return;
    }

    if (!bucket[row.category]) {
      bucket[row.category] = [];
    }
    const nextValue = row.category === "serviceTypes"
      ? normalizeServiceLabel(row.value)
      : row.value;
    bucket[row.category].push(nextValue);
  });

  bucket.serviceTypes = [...new Set(bucket.serviceTypes.filter(Boolean))];
  Object.keys(bucket.equipmentOptionsByService).forEach((serviceKey) => {
    bucket.equipmentOptionsByService[serviceKey] = [
      ...new Set(bucket.equipmentOptionsByService[serviceKey].filter(Boolean))
    ];
  });

  return bucket;
}

async function listAppLookupRows(includeInactive = false) {
  const result = await query(
    `SELECT
       id,
       category,
       group_key AS "groupKey",
       value,
       sort_order AS "sortOrder",
       is_active AS "isActive"
     FROM app_lookup_options
     ${includeInactive ? "" : "WHERE is_active = TRUE"}
     ORDER BY category ASC, COALESCE(group_key, '') ASC, sort_order ASC, value ASC`
  );

  return result.rows;
}

function buildLookupConfigResponse(appLookupRows, reasonLookupMap) {
  const itemsByCategory = {};

  LOOKUP_CATEGORY_DEFINITIONS.forEach((category) => {
    if (category.source === "app_lookup_options") {
      const rawItems = appLookupRows.filter((item) => item.category === category.key);
      if (category.key === "equipmentOptions") {
        const groupedItems = new Map();
        rawItems.forEach((item) => {
          const key = String(item.value || "").trim().toLowerCase();
          if (!groupedItems.has(key)) {
            groupedItems.set(key, {
              ...item,
              relatedIds: [item.id],
              groupKeys: item.groupKey ? [item.groupKey] : []
            });
            return;
          }

          const current = groupedItems.get(key);
          current.relatedIds.push(item.id);
          if (item.groupKey && !current.groupKeys.includes(item.groupKey)) {
            current.groupKeys.push(item.groupKey);
          }
          current.sortOrder = Math.min(Number(current.sortOrder ?? 0), Number(item.sortOrder ?? 0));
          current.isActive = current.isActive || item.isActive;
        });

        itemsByCategory[category.key] = [...groupedItems.values()]
          .map((item) => ({
            ...item,
            groupKeys: [...item.groupKeys].sort((left, right) => left.localeCompare(right, "pt-BR")),
            groupKey: [...item.groupKeys].sort((left, right) => left.localeCompare(right, "pt-BR")).join(", ")
          }))
          .sort((left, right) => {
            const orderDiff = Number(left.sortOrder ?? 0) - Number(right.sortOrder ?? 0);
            if (orderDiff !== 0) return orderDiff;
            return String(left.value || "").localeCompare(String(right.value || ""), "pt-BR");
          });
        return;
      }

      itemsByCategory[category.key] = rawItems;
      return;
    }

    itemsByCategory[category.key] = reasonLookupMap[category.key] || [];
  });

  const serviceGroups = new Set([
    ...(itemsByCategory.serviceTypes || []).map((item) => item.value),
    ...(itemsByCategory.equipmentOptions || []).map((item) => item.groupKey).filter(Boolean)
  ]);

  return {
    categories: LOOKUP_CATEGORY_DEFINITIONS,
    itemsByCategory,
    groupOptions: {
      equipmentOptions: [...serviceGroups].sort((left, right) => left.localeCompare(right, "pt-BR"))
    }
  };
}

function composeNegotiationDiaryNote(entry) {
  const parts = [];
  const summary = String(entry.summary || "").trim();
  const nextAction = String(entry.nextAction || "").trim();
  const probabilityLevel = String(entry.probabilityLevel || "").trim();
  const commercialNotes = String(entry.commercialNotes || "").trim();
  const requestedAdjustments = String(entry.requestedAdjustments || "").trim();
  const revisedProposalValue = entry.revisedProposalValue === null || entry.revisedProposalValue === undefined
    ? null
    : Number(entry.revisedProposalValue);
  const revisedBdi = entry.revisedBdi === null || entry.revisedBdi === undefined
    ? null
    : Number(entry.revisedBdi);

  if (summary) parts.push(summary);
  if (nextAction) parts.push(`Proxima acao: ${nextAction}`);
  if (probabilityLevel) parts.push(`Probabilidade: ${probabilityLevel}`);
  if (revisedProposalValue !== null && Number.isFinite(revisedProposalValue)) {
    parts.push(`Valor revisado: ${revisedProposalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`);
  }
  if (revisedBdi !== null && Number.isFinite(revisedBdi)) {
    parts.push(`Margem revisada: ${revisedBdi.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`);
  }
  if (commercialNotes && commercialNotes !== summary) parts.push(`Observacoes: ${commercialNotes}`);
  if (requestedAdjustments) parts.push(`Ajustes solicitados: ${requestedAdjustments}`);

  return parts.join(" | ");
}

function buildHistoryActorLabel(actorName, actorEmail) {
  const name = String(actorName || "").trim();
  const email = String(actorEmail || "").trim();
  return name || email || "Sistema";
}

async function createNegotiationDiaryEntry(client, payload, session, context = {}) {
  const summary = String(payload.negotiationSummary || "").trim();
  const revisedProposalValue = toNullableNumber(payload.revisedProposalValue);
  const revisedBdi = toNullableNumber(payload.revisedBdi);
  if (!summary && revisedProposalValue === null && revisedBdi === null) return;

  await client.query(
    `INSERT INTO negotiation_diary_entries (
      request_id,
      proposal_registry_id,
      actor_user_id,
      actor_name,
      actor_email,
      contact_date,
      summary,
      next_action,
      probability_level,
      commercial_notes,
      requested_adjustments,
      revised_proposal_value,
      revised_bdi,
      stage_code
    ) VALUES (
      $1, $2, $3, $4, $5, NOW(), $6, $7, $8, $9, $10, $11, $12, $13
    )`,
    [
      context.requestId || null,
      context.proposalRegistryId || null,
      session?.userId || context.actorUserId || null,
      session?.name || payload.sellerName || null,
      session?.email || payload.sellerEmail || null,
      summary,
      payload.nextAction || null,
      payload.probabilityLevel || null,
      payload.commercialNotes || null,
      payload.requestedAdjustments || null,
      revisedProposalValue,
      revisedBdi,
      payload.nextStageCode || context.stageCode || null
    ]
  );
}

async function listNegotiationDiaryEntries(filters = {}) {
  const values = [];
  const clauses = [];

  if (filters.requestId && filters.proposalRegistryId) {
    const requestIndex = values.push(filters.requestId);
    const proposalIndex = values.push(filters.proposalRegistryId);
    clauses.push(`(request_id = $${requestIndex} OR proposal_registry_id = $${proposalIndex})`);
  } else if (filters.requestId) {
    const index = values.push(filters.requestId);
    clauses.push(`request_id = $${index}`);
  } else if (filters.proposalRegistryId) {
    const index = values.push(filters.proposalRegistryId);
    clauses.push(`proposal_registry_id = $${index}`);
  }

  if (!clauses.length) return [];

  const result = await query(
    `SELECT
       id,
       request_id AS "requestId",
       proposal_registry_id AS "proposalRegistryId",
       actor_name AS "actorName",
       actor_email AS "actorEmail",
       contact_date AS "contactDate",
       TO_CHAR(contact_date AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS "contactDateLabel",
       summary,
       next_action AS "nextAction",
       probability_level AS "probabilityLevel",
       commercial_notes AS "commercialNotes",
       requested_adjustments AS "requestedAdjustments",
       revised_proposal_value AS "revisedProposalValue",
       revised_bdi AS "revisedBdi",
       stage_code AS "stageCode"
     FROM negotiation_diary_entries
     WHERE ${clauses.join(" AND ")}
     ORDER BY contact_date DESC, id DESC`,
    values
  );

  return result.rows;
}

async function createNegotiationValueHistoryEntry(client, payload = {}, session = null, context = {}) {
  const proposalValue = toNullableNumber(payload.proposalValue);
  const bdi = toNullableNumber(payload.bdi);
  if (proposalValue === null && bdi === null) return;

  await client.query(
    `INSERT INTO negotiation_value_history (
      request_id,
      proposal_registry_id,
      actor_user_id,
      actor_name,
      actor_email,
      stage_code,
      entry_type,
      proposal_value,
      bdi,
      notes
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
    )`,
    [
      context.requestId || null,
      context.proposalRegistryId || null,
      session?.userId || context.actorUserId || null,
      session?.name || payload.actorName || payload.sellerName || payload.managerName || null,
      session?.email || payload.actorEmail || payload.sellerEmail || null,
      context.stageCode || payload.stageCode || null,
      context.entryType || payload.entryType || "revisao_negociacao",
      proposalValue,
      bdi,
      payload.notes || null
    ]
  );
}

async function listNegotiationValueHistoryEntries(filters = {}) {
  const values = [];
  const clauses = [];

  if (filters.requestId && filters.proposalRegistryId) {
    const requestIndex = values.push(filters.requestId);
    const proposalIndex = values.push(filters.proposalRegistryId);
    clauses.push(`(request_id = $${requestIndex} OR proposal_registry_id = $${proposalIndex})`);
  } else if (filters.requestId) {
    const index = values.push(filters.requestId);
    clauses.push(`request_id = $${index}`);
  } else if (filters.proposalRegistryId) {
    const index = values.push(filters.proposalRegistryId);
    clauses.push(`proposal_registry_id = $${index}`);
  }

  if (!clauses.length) return [];

  const result = await query(
    `SELECT
       id,
       request_id AS "requestId",
       proposal_registry_id AS "proposalRegistryId",
       actor_name AS "actorName",
       actor_email AS "actorEmail",
       stage_code AS "stageCode",
       entry_type AS "entryType",
       proposal_value AS "proposalValue",
       bdi,
       notes,
       created_at AS "createdAt",
       TO_CHAR(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS "createdAtLabel"
     FROM negotiation_value_history
     WHERE ${clauses.join(" AND ")}
     ORDER BY created_at DESC, id DESC`,
    values
  );

  return result.rows.map((row) => ({
    ...row,
    actorLabel: buildHistoryActorLabel(row.actorName, row.actorEmail),
    stageLabel: row.stageCode ? getWorkflowStageLabel(row.stageCode) : "-",
    entryTypeLabel: row.entryType === "proposta_inicial" ? "Proposta inicial" : "Revisão comercial",
    proposalValueLabel: row.proposalValue === null || row.proposalValue === undefined
      ? "-"
      : Number(row.proposalValue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
    bdiLabel: row.bdi === null || row.bdi === undefined
      ? "-"
      : `${Number(row.bdi).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
  }));
}

async function collectRequestNotificationRecipientIds(client, requestId, extraUserIds = []) {
  const result = await client.query(
    `SELECT
       r.seller_user_id AS "sellerUserId",
       r.current_owner_user_id AS "currentOwnerUserId",
       pr.triage_owner_user_id AS "triageOwnerUserId",
       pr.proposal_owner_user_id AS "proposalOwnerUserId",
       cr.seller_user_id AS "commercialSellerUserId",
       ctr.contract_owner_user_id AS "contractOwnerUserId"
     FROM requests r
     LEFT JOIN proposal_records pr ON pr.request_id = r.id
     LEFT JOIN commercial_records cr ON cr.request_id = r.id
     LEFT JOIN contract_records ctr ON ctr.request_id = r.id
     WHERE r.id = $1`,
    [requestId]
  );

  const row = result.rows[0] || {};
  return [...new Set([
    row.sellerUserId,
    row.currentOwnerUserId,
    row.triageOwnerUserId,
    row.proposalOwnerUserId,
    row.commercialSellerUserId,
    row.contractOwnerUserId,
    ...(extraUserIds || [])
  ].filter((item) => Number.isInteger(Number(item)) && Number(item) > 0).map((item) => Number(item)))];
}

async function collectProposalNotificationRecipientIds(client, proposalRegistryId, extraUserIds = []) {
  const result = await client.query(
    `SELECT request_id AS "requestId", seller_user_id AS "sellerUserId"
     FROM proposal_registry
     WHERE id = $1`,
    [proposalRegistryId]
  );
  const proposal = result.rows[0];
  if (!proposal) {
    return [...new Set((extraUserIds || []).filter((item) => Number.isInteger(Number(item)) && Number(item) > 0).map((item) => Number(item)))];
  }

  const requestRecipients = proposal.requestId
    ? await collectRequestNotificationRecipientIds(client, proposal.requestId, extraUserIds)
    : [];

  return [...new Set([
    proposal.sellerUserId,
    ...requestRecipients,
    ...(extraUserIds || [])
  ].filter((item) => Number.isInteger(Number(item)) && Number(item) > 0).map((item) => Number(item)))];
}

async function createStatusChangeNotifications(client, {
  recipientUserIds = [],
  actor = {},
  requestId = null,
  proposalRegistryId = null,
  fromStageCode = null,
  toStageCode = null,
  requestNumber = null,
  proposalNumber = null,
  company = null,
  note = null
} = {}) {
  if (!toStageCode || String(fromStageCode || "") === String(toStageCode || "")) {
    return [];
  }

  const actorUserId = parsePositiveInteger(actor.userId);
  const recipients = [...new Set(
    (recipientUserIds || [])
      .map((item) => parsePositiveInteger(item))
      .filter(Boolean)
  )];

  if (!recipients.length) return [];

  const title = `Status atualizado para ${getWorkflowStageLabel(toStageCode)}`;
  const origin = requestNumber
    ? `${requestNumber}${company ? ` | ${company}` : ""}`
    : proposalNumber
      ? `${proposalNumber}${company ? ` | ${company}` : ""}`
      : (company || "Solicitacao atualizada");
  const movement = fromStageCode
    ? `${getWorkflowStageLabel(fromStageCode)} -> ${getWorkflowStageLabel(toStageCode)}`
    : `Nova etapa: ${getWorkflowStageLabel(toStageCode)}`;
  const actorLabel = buildHistoryActorLabel(actor.name, actor.email);
  const message = [origin, movement, `Responsavel pela atualizacao: ${actorLabel}`, String(note || "").trim()]
    .filter(Boolean)
    .join(" | ");

  const createdIds = [];
  for (const recipientUserId of recipients) {
    const result = await client.query(
      `INSERT INTO user_notifications (
        recipient_user_id,
        request_id,
        proposal_registry_id,
        notification_type,
        title,
        message,
        from_stage_code,
        to_stage_code,
        actor_user_id,
        actor_name,
        actor_email
      ) VALUES (
        $1, $2, $3, 'status_change', $4, $5, $6, $7, $8, $9, $10
      )
      RETURNING id`,
      [
        recipientUserId,
        requestId || null,
        proposalRegistryId || null,
        title,
        message,
        fromStageCode || null,
        toStageCode || null,
        actorUserId || null,
        actor.name || null,
        actor.email || null
      ]
    );
    if (result.rows[0]?.id) {
      createdIds.push(result.rows[0].id);
    }
  }

  return createdIds;
}

async function listUserNotifications(userId, limit = 20) {
  const safeLimit = Math.min(Math.max(parsePositiveInteger(limit) || 20, 1), 50);
  const result = await query(
    `SELECT
       id,
       request_id AS "requestId",
       proposal_registry_id AS "proposalRegistryId",
       notification_type AS "type",
       title,
       message,
       from_stage_code AS "fromStageCode",
       to_stage_code AS "toStageCode",
       is_read AS "isRead",
       created_at AS "createdAt",
       TO_CHAR(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS "createdAtLabel"
     FROM user_notifications
     WHERE recipient_user_id = $1
     ORDER BY created_at DESC, id DESC
     LIMIT $2`,
    [userId, safeLimit]
  );

  const unreadCountResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM user_notifications
     WHERE recipient_user_id = $1
       AND is_read = FALSE`,
    [userId]
  );

  return {
    items: result.rows,
    unreadCount: unreadCountResult.rows[0]?.total || 0
  };
}

async function markUserNotificationAsRead(notificationId, userId) {
  const result = await query(
    `UPDATE user_notifications
     SET is_read = TRUE,
         read_at = COALESCE(read_at, NOW())
     WHERE id = $1
       AND recipient_user_id = $2
     RETURNING id`,
    [notificationId, userId]
  );

  if (!result.rows[0]) {
    throw new Error("Notificacao nao encontrada.");
  }

  return result.rows[0];
}

async function markAllUserNotificationsAsRead(userId) {
  await query(
    `UPDATE user_notifications
     SET is_read = TRUE,
         read_at = COALESCE(read_at, NOW())
     WHERE recipient_user_id = $1
       AND is_read = FALSE`,
    [userId]
  );
}

async function ensureLookupValues(client, tableName, names) {
  for (const name of names) {
    await client.query(
      `INSERT INTO ${tableName} (name, is_active)
       VALUES ($1, TRUE)
       ON CONFLICT (name) DO NOTHING`,
      [name]
    );
  }
}

async function logAuditEntry(clientOrNull, entry = {}) {
  const executor = clientOrNull && typeof clientOrNull.query === "function"
    ? (sql, params) => clientOrNull.query(sql, params)
    : query;

  const actor = entry.actor || {};
  await executor(
    `INSERT INTO audit_logs (
      actor_user_id, actor_name, actor_email, actor_role,
      action_type, entity_type, entity_id, request_id, target_user_id,
      description, metadata_json
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)`,
    [
      actor.userId || null,
      actor.name || null,
      actor.email || null,
      actor.role || null,
      entry.actionType,
      entry.entityType,
      entry.entityId || null,
      entry.requestId || null,
      entry.targetUserId || null,
      entry.description,
      JSON.stringify(entry.metadata || {})
    ]
  );
}

async function listAuditLogs(limit = 40) {
  const result = await query(
    `SELECT
       id,
       COALESCE(actor_name, 'Sistema') AS "actorName",
       actor_email AS "actorEmail",
       actor_role AS "actorRole",
       action_type AS "actionType",
       entity_type AS "entityType",
       entity_id AS "entityId",
       request_id AS "requestId",
       target_user_id AS "targetUserId",
       description,
       created_at AS "createdAt"
     FROM audit_logs
     ORDER BY created_at DESC, id DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows;
}

async function ensureBaseAccessData() {
  return withTransaction(async (client) => {
    const roleDefinitions = [
      ["vendedor", "Responsável por abrir solicitações e conduzir negociações"],
      ["comercial_interno", "Responsável por triagem e apoio comercial"],
      ["propostas", "Responsável por elaborar propostas"],
      ["juridico", "Responsável por contratos e cláusulas"],
      ["gestor", "Responsável por gestão e indicadores"],
      ["diretoria", "Responsável por acompanhamento total do processo, sem criação de usuários"],
      ["administrador", "Responsável por configurações do sistema"]
    ];

    const roleIds = {};
    for (const [name, description] of roleDefinitions) {
      roleIds[name] = await ensureRole(client, name, description);
    }

    const seedUsers = [
      { name: "Andre", email: "andre@empresa.com.br", role: "vendedor", department: "Comercial", password: "andre123" },
      { name: "Gisele", email: "gisele@empresa.com.br", role: "comercial_interno", department: "Comercial interno", password: "gisele123" },
      { name: "Equipe Propostas", email: "propostas@empresa.com.br", role: "propostas", department: "Propostas", password: "propostas123" },
      { name: "Juridico", email: "juridico@empresa.com.br", role: "juridico", department: "Juridico", password: "juridico123" },
      { name: "Diretoria", email: "diretoria@empresa.com.br", role: "diretoria", department: "Diretoria", password: "diretoria123" },
      { name: "Administrador", email: "admin@empresa.com.br", role: "administrador", department: "TI", password: "admin123" }
    ];

    for (const user of seedUsers) {
      const passwordHash = hashPassword(user.password);
      const insertResult = await client.query(
      `INSERT INTO users (name, email, department, is_active, password_hash, must_change_password)
         VALUES ($1, $2, $3, TRUE, $4, FALSE)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [user.name, user.email, user.department, passwordHash]
      );

      let userId = insertResult.rows[0]?.id || null;
      if (!userId) {
        const existingUser = await client.query(
          `SELECT id, module_access, workflow_stage_access
             FROM users
            WHERE email = $1`,
          [user.email]
        );
        userId = existingUser.rows[0]?.id || null;

        // Preserve customized access for existing users and only fill modules if blank.
        const moduleAccess = existingUser.rows[0]?.module_access;
        const stageAccess = existingUser.rows[0]?.workflow_stage_access;
        if (
          userId &&
          (!Array.isArray(moduleAccess) || moduleAccess.length === 0)
        ) {
          await client.query(
            `UPDATE users
                SET module_access = $2::text[],
                    must_change_password = COALESCE(must_change_password, FALSE)
              WHERE id = $1`,
            [userId, defaultModulesForRole(user.role)]
          );
        }

        if (userId && shouldRefreshStageAccess(stageAccess, user.role)) {
          await client.query(
            `UPDATE users
                SET workflow_stage_access = $2::text[]
              WHERE id = $1`,
            [userId, defaultStageAccessForRole(user.role)]
          );
        }
      } else {
        await client.query(
          `UPDATE users
              SET module_access = $2::text[],
                  workflow_stage_access = $3::text[],
                  must_change_password = FALSE
            WHERE id = $1`,
          [userId, defaultModulesForRole(user.role), defaultStageAccessForRole(user.role)]
        );
      }

      if (userId) {
        const roleCountResult = await client.query(
          `SELECT COUNT(*)::int AS total
             FROM user_roles
            WHERE user_id = $1`,
          [userId]
        );
        if ((roleCountResult.rows[0]?.total || 0) === 0) {
          await ensureUserRole(client, userId, roleIds[user.role]);
        }
      }
    }

    await ensureLookupValues(client, "loss_reasons", LOSS_REASON_OPTIONS);
    await ensureLookupValues(client, "cancel_reasons", CANCEL_REASON_OPTIONS);
    for (const [category, values] of Object.entries(STATIC_LOOKUP_DEFAULTS)) {
      await ensureAppLookupCategoryValues(client, category, values);
    }
    for (const [serviceName, equipmentItems] of Object.entries(EQUIPMENT_OPTIONS_BY_SERVICE)) {
      await ensureAppLookupCategoryValues(client, "equipmentOptions", equipmentItems, serviceName);
    }
  });
}

async function getLookups(session = null) {
  const [appLookupRows, lossReasons, cancelReasons, sellers, workflowStages] = await Promise.all([
    listAppLookupRows(false),
    query("SELECT id, name FROM loss_reasons WHERE is_active = TRUE ORDER BY name ASC"),
    query("SELECT id, name FROM cancel_reasons WHERE is_active = TRUE ORDER BY name ASC"),
    query(
      `SELECT DISTINCT u.id, u.name
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN roles r ON r.id = ur.role_id
       WHERE u.is_active = TRUE
         AND r.name IN ('vendedor', 'comercial_interno', 'gestor', 'diretoria', 'administrador')
       ORDER BY u.name ASC`
    ),
    query(
      `SELECT code, name
       FROM workflow_stages
       WHERE is_active = TRUE
       ORDER BY display_order ASC, name ASC`
    )
  ]);

  const configLookups = buildConfigLookups(appLookupRows);

  return {
    branches: configLookups.branches.length ? configLookups.branches : BRANCH_OPTIONS,
    responsibles: configLookups.responsibles.length ? configLookups.responsibles : RESPONSIBLE_OPTIONS,
    leadSources: configLookups.leadSources.length ? configLookups.leadSources : LEAD_SOURCE_OPTIONS,
    proposalStatuses: configLookups.proposalStatuses.length ? configLookups.proposalStatuses : PROPOSAL_STATUS_OPTIONS,
    documentTypes: configLookups.documentTypes.length ? configLookups.documentTypes : DOCUMENT_TYPE_OPTIONS,
    industries: configLookups.industries.length ? configLookups.industries : INDUSTRY_OPTIONS,
    serviceTypes: configLookups.serviceTypes.length ? configLookups.serviceTypes : SERVICE_TYPE_OPTIONS,
    workScales: configLookups.workScales.length ? configLookups.workScales : WORK_SCALE_OPTIONS,
    equipmentOptionsByService: Object.keys(configLookups.equipmentOptionsByService).length
      ? configLookups.equipmentOptionsByService
      : EQUIPMENT_OPTIONS_BY_SERVICE,
    lossReasons: lossReasons.rows,
    cancelReasons: cancelReasons.rows,
    sellers: sellers.rows,
    workflowStages: session
      ? workflowStages.rows.filter((stage) => hasStageAccess(session, stage.code))
      : workflowStages.rows
  };
}

function getLookupCategoryConfig(categoryKey) {
  const category = LOOKUP_CATEGORY_MAP[categoryKey];
  if (!category) {
    throw new Error("Categoria de configuração não encontrada.");
  }
  return category;
}

async function listLookupConfigurations() {
  const [appLookupRows, lossReasons, cancelReasons] = await Promise.all([
    listAppLookupRows(true),
    query(
      `SELECT id, name AS value, NULL::text AS "groupKey", 0 AS "sortOrder", is_active AS "isActive"
       FROM loss_reasons
       ORDER BY is_active DESC, name ASC`
    ),
    query(
      `SELECT id, name AS value, NULL::text AS "groupKey", 0 AS "sortOrder", is_active AS "isActive"
       FROM cancel_reasons
       ORDER BY is_active DESC, name ASC`
    )
  ]);

  return buildLookupConfigResponse(appLookupRows, {
    lossReasons: lossReasons.rows,
    cancelReasons: cancelReasons.rows
  });
}

async function listWorkflowStageConfigurations() {
  const result = await query(
    `SELECT
       id,
       code,
       name,
       sla_hours AS "slaHours",
       sla_paused AS "slaPaused",
       is_terminal AS "isTerminal",
       is_active AS "isActive",
       display_order AS "displayOrder"
     FROM workflow_stages
     ORDER BY display_order ASC, name ASC`
  );
  return result.rows;
}

async function updateWorkflowStageConfiguration(stageId, payload, session) {
  const hasHours = Object.prototype.hasOwnProperty.call(payload, "slaHours");
  const hasPaused = Object.prototype.hasOwnProperty.call(payload, "slaPaused");
  if (!hasHours && !hasPaused) {
    throw new Error("Nenhuma alteração de SLA informada.");
  }

  const normalizedHours = hasHours
    ? (payload.slaHours === null || payload.slaHours === "" ? null : Number(payload.slaHours))
    : undefined;
  if (hasHours && normalizedHours !== null && (!Number.isFinite(normalizedHours) || normalizedHours < 0)) {
    throw new Error("Informe um SLA válido em horas.");
  }

  const result = await query(
    `UPDATE workflow_stages
     SET sla_hours = CASE WHEN $4 THEN $2::int ELSE sla_hours END,
         sla_paused = CASE WHEN $5 THEN $3::boolean ELSE sla_paused END
     WHERE id = $1
     RETURNING id, code, name, sla_hours AS "slaHours", sla_paused AS "slaPaused"`,
    [
      stageId,
      hasHours ? normalizedHours : null,
      hasPaused ? Boolean(payload.slaPaused) : null,
      hasHours,
      hasPaused
    ]
  );

  if (!result.rows[0]) {
    throw new Error("Etapa de workflow não encontrada.");
  }

  await logAuditEntry(null, {
    actor: session,
    actionType: "workflow_stage_sla_updated",
    entityType: "workflow_stage",
    entityId: stageId,
    description: `SLA da etapa ${result.rows[0].code} atualizado.`,
    metadata: {
      code: result.rows[0].code,
      slaHours: result.rows[0].slaHours,
      slaPaused: result.rows[0].slaPaused
    }
  });

  return result.rows[0];
}

async function getNextLookupSortOrder(client, categoryKey, groupKey = null) {
  const category = getLookupCategoryConfig(categoryKey);
  if (category.source === "reason_table") {
    return 0;
  }

  const result = await client.query(
    `SELECT COALESCE(MAX(sort_order), 0)::int + 10 AS next_order
     FROM app_lookup_options
     WHERE category = $1
       AND COALESCE(group_key, '') = COALESCE($2, '')`,
    [categoryKey, groupKey]
  );

  return result.rows[0]?.next_order || 10;
}

async function createLookupConfigurationItem(categoryKey, payload, session) {
  const category = getLookupCategoryConfig(categoryKey);
  const value = String(payload.value || "").trim();
  const groupKey = String(payload.groupKey || "").trim() || null;
  const groupKeys = Array.isArray(payload.groupKeys)
    ? [...new Set(payload.groupKeys.map((item) => normalizeServiceLabel(item)).filter(Boolean))]
    : [];
  const isActive = payload.isActive !== false;
  const rawSortOrder = String(payload.sortOrder ?? "").trim();

  if (!value) {
    throw new Error("Informe o valor do item.");
  }
  if (categoryKey === "equipmentOptions" && groupKeys.length === 0) {
    throw new Error("Selecione pelo menos um tipo de serviço para o equipamento.");
  }
  if (category.grouped && !groupKey) {
    if (categoryKey !== "equipmentOptions") {
      throw new Error("Informe o agrupamento do item.");
    }
  }

  return withTransaction(async (client) => {
    if (category.source === "reason_table") {
      const result = await client.query(
        `INSERT INTO ${category.tableName} (name, is_active)
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE
         SET is_active = EXCLUDED.is_active
         RETURNING id, name AS value, NULL::text AS "groupKey", 0 AS "sortOrder", is_active AS "isActive"`,
        [value, isActive]
      );

      await logAuditEntry(client, {
        actor: session,
        actionType: "lookup_config_create",
        entityType: categoryKey,
        entityId: result.rows[0]?.id || null,
        description: `${category.label}: item '${value}' cadastrado.`,
        metadata: { categoryKey, value, groupKey, isActive }
      });
      return result.rows[0];
    }

    const sortOrder = rawSortOrder !== "" && Number.isFinite(Number(rawSortOrder))
      ? Number(rawSortOrder)
      : await getNextLookupSortOrder(client, categoryKey, categoryKey === "equipmentOptions" ? groupKeys[0] || null : groupKey);

    if (categoryKey === "equipmentOptions") {
      const rows = [];
      for (const serviceKey of groupKeys) {
        const existing = await client.query(
          `SELECT id
             FROM app_lookup_options
            WHERE category = $1
              AND COALESCE(group_key, '') = COALESCE($2, '')
              AND value = $3
            LIMIT 1`,
          [categoryKey, serviceKey, value]
        );
        const result = existing.rows[0]
          ? await client.query(
            `UPDATE app_lookup_options
                SET sort_order = $2,
                    is_active = $3,
                    updated_at = NOW()
              WHERE id = $1
            RETURNING id, category, group_key AS "groupKey", value, sort_order AS "sortOrder", is_active AS "isActive"`,
            [existing.rows[0].id, sortOrder, isActive]
          )
          : await client.query(
            `INSERT INTO app_lookup_options (category, group_key, value, sort_order, is_active)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, category, group_key AS "groupKey", value, sort_order AS "sortOrder", is_active AS "isActive"`,
            [categoryKey, serviceKey, value, sortOrder, isActive]
          );
        rows.push(result.rows[0]);
      }

      await logAuditEntry(client, {
        actor: session,
        actionType: "lookup_config_create",
        entityType: categoryKey,
        entityId: rows[0]?.id || null,
        description: `${category.label}: item '${value}' cadastrado.`,
        metadata: { categoryKey, value, groupKeys, sortOrder, isActive }
      });

      return {
        ...(rows[0] || {}),
        groupKey: groupKeys.join(", "),
        groupKeys,
        relatedIds: rows.map((row) => row.id)
      };
    }

    const existing = await client.query(
      `SELECT id
         FROM app_lookup_options
        WHERE category = $1
          AND COALESCE(group_key, '') = COALESCE($2, '')
          AND value = $3
        LIMIT 1`,
      [categoryKey, groupKey, value]
    );
    const result = existing.rows[0]
      ? await client.query(
        `UPDATE app_lookup_options
            SET sort_order = $2,
                is_active = $3,
                updated_at = NOW()
          WHERE id = $1
        RETURNING id, category, group_key AS "groupKey", value, sort_order AS "sortOrder", is_active AS "isActive"`,
        [existing.rows[0].id, sortOrder, isActive]
      )
      : await client.query(
        `INSERT INTO app_lookup_options (category, group_key, value, sort_order, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, category, group_key AS "groupKey", value, sort_order AS "sortOrder", is_active AS "isActive"`,
        [categoryKey, groupKey, value, sortOrder, isActive]
      );

    await logAuditEntry(client, {
      actor: session,
      actionType: "lookup_config_create",
      entityType: categoryKey,
      entityId: result.rows[0]?.id || null,
      description: `${category.label}: item '${value}' cadastrado.`,
      metadata: { categoryKey, value, groupKey, sortOrder, isActive }
    });
    return result.rows[0];
  });
}

async function updateLookupConfigurationItem(categoryKey, itemId, payload, session) {
  const category = getLookupCategoryConfig(categoryKey);
  const value = String(payload.value || "").trim();
  const groupKey = String(payload.groupKey || "").trim() || null;
  const groupKeys = Array.isArray(payload.groupKeys)
    ? [...new Set(payload.groupKeys.map((item) => normalizeServiceLabel(item)).filter(Boolean))]
    : [];
  const relatedIds = Array.isArray(payload.relatedIds)
    ? [...new Set(payload.relatedIds.map((item) => parsePositiveInteger(item)).filter(Boolean))]
    : [];
  const isActive = payload.isActive !== false;
  const rawSortOrder = String(payload.sortOrder ?? "").trim();

  if (!value) {
    throw new Error("Informe o valor do item.");
  }
  if (categoryKey === "equipmentOptions" && groupKeys.length === 0) {
    throw new Error("Selecione pelo menos um tipo de serviço para o equipamento.");
  }
  if (category.grouped && !groupKey) {
    if (categoryKey !== "equipmentOptions") {
      throw new Error("Informe o agrupamento do item.");
    }
  }

  return withTransaction(async (client) => {
    if (category.source === "reason_table") {
      const result = await client.query(
        `UPDATE ${category.tableName}
            SET name = $2,
                is_active = $3
          WHERE id = $1
        RETURNING id, name AS value, NULL::text AS "groupKey", 0 AS "sortOrder", is_active AS "isActive"`,
        [itemId, value, isActive]
      );
      if (!result.rows[0]) {
        throw new Error("Item não encontrado.");
      }

      await logAuditEntry(client, {
        actor: session,
        actionType: "lookup_config_update",
        entityType: categoryKey,
        entityId: itemId,
        description: `${category.label}: item '${value}' atualizado.`,
        metadata: { categoryKey, value, isActive }
      });
      return result.rows[0];
    }

    const sortOrder = rawSortOrder !== "" && Number.isFinite(Number(rawSortOrder))
      ? Number(rawSortOrder)
      : await getNextLookupSortOrder(client, categoryKey, categoryKey === "equipmentOptions" ? groupKeys[0] || null : groupKey);

    if (categoryKey === "equipmentOptions") {
      const idsToReplace = relatedIds.length ? relatedIds : [itemId];
      const existingRows = await client.query(
        `SELECT id
           FROM app_lookup_options
          WHERE category = $1
            AND id = ANY($2::bigint[])`,
        [categoryKey, idsToReplace]
      );
      if (!existingRows.rows.length) {
        throw new Error("Item não encontrado.");
      }

      await client.query(
        `DELETE FROM app_lookup_options
          WHERE category = $1
            AND id = ANY($2::bigint[])`,
        [categoryKey, existingRows.rows.map((row) => row.id)]
      );

      const rows = [];
      for (const serviceKey of groupKeys) {
        const result = await client.query(
          `INSERT INTO app_lookup_options (category, group_key, value, sort_order, is_active)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, category, group_key AS "groupKey", value, sort_order AS "sortOrder", is_active AS "isActive"`,
          [categoryKey, serviceKey, value, sortOrder, isActive]
        );
        rows.push(result.rows[0]);
      }

      await logAuditEntry(client, {
        actor: session,
        actionType: "lookup_config_update",
        entityType: categoryKey,
        entityId: rows[0]?.id || itemId,
        description: `${category.label}: item '${value}' atualizado.`,
        metadata: { categoryKey, value, groupKeys, sortOrder, isActive }
      });

      return {
        ...(rows[0] || {}),
        groupKey: groupKeys.join(", "),
        groupKeys,
        relatedIds: rows.map((row) => row.id)
      };
    }

    const result = await client.query(
      `UPDATE app_lookup_options
          SET value = $2,
              group_key = $3,
              sort_order = $4,
              is_active = $5,
              updated_at = NOW()
        WHERE id = $1
          AND category = $6
      RETURNING id, category, group_key AS "groupKey", value, sort_order AS "sortOrder", is_active AS "isActive"`,
      [itemId, value, groupKey, sortOrder, isActive, categoryKey]
    );
    if (!result.rows[0]) {
      throw new Error("Item não encontrado.");
    }

    await logAuditEntry(client, {
      actor: session,
      actionType: "lookup_config_update",
      entityType: categoryKey,
      entityId: itemId,
      description: `${category.label}: item '${value}' atualizado.`,
      metadata: { categoryKey, value, groupKey, sortOrder, isActive }
    });
    return result.rows[0];
  });
}

async function deactivateLookupConfigurationItem(categoryKey, itemId, session, payload = {}) {
  const category = getLookupCategoryConfig(categoryKey);
  return withTransaction(async (client) => {
    let result;
    if (category.source === "reason_table") {
      result = await client.query(
        `UPDATE ${category.tableName}
            SET is_active = FALSE
          WHERE id = $1
        RETURNING id, name AS value`,
        [itemId]
      );
    } else {
      const relatedIds = Array.isArray(payload.relatedIds)
        ? [...new Set(payload.relatedIds.map((item) => parsePositiveInteger(item)).filter(Boolean))]
        : [];
      const idsToDeactivate = categoryKey === "equipmentOptions" && relatedIds.length
        ? relatedIds
        : [itemId];
      result = await client.query(
        `UPDATE app_lookup_options
            SET is_active = FALSE,
                updated_at = NOW()
          WHERE category = $1
            AND id = ANY($2::bigint[])
        RETURNING id, value`,
        [categoryKey, idsToDeactivate]
      );
    }

    if (!result.rows[0]) {
      throw new Error("Item não encontrado.");
    }

    await logAuditEntry(client, {
      actor: session,
      actionType: "lookup_config_deactivate",
      entityType: categoryKey,
      entityId: itemId,
      description: `${category.label}: item '${result.rows[0].value}' retirado da lista.`,
      metadata: { categoryKey }
    });

    return result.rows[0];
  });
}

async function getReasonId(client, tableName, reasonName) {
  if (!reasonName) return null;
  const result = await client.query(
    `SELECT id FROM ${tableName} WHERE name = $1 AND is_active = TRUE`,
    [reasonName]
  );
  return result.rows[0]?.id || null;
}

async function getStageId(client, code) {
  const result = await client.query("SELECT id FROM workflow_stages WHERE code = $1", [code]);
  if (!result.rows[0]) throw new Error(`Etapa '${code}' nao encontrada no banco.`);
  return result.rows[0].id;
}

async function getNextCrmSequence(client, year) {
  const result = await client.query(
    `SELECT COALESCE(MAX(seq), 0)::int + 1 AS next_sequence
     FROM (
       SELECT NULLIF(split_part(request_number, '-', 3), '')::int AS seq
       FROM requests
       WHERE request_number LIKE $1
       UNION ALL
       SELECT NULLIF(split_part(crm_request_number, '-', 3), '')::int AS seq
       FROM proposal_registry
       WHERE crm_request_number LIKE $1
     ) numbers`,
    [`RP-${year}-%`]
  );
  return result.rows[0].next_sequence;
}

async function generateRequestNumber(client) {
  const year = new Date().getFullYear();
  const next = await getNextCrmSequence(client, year);
  return `RP-${year}-${String(next).padStart(4, "0")}`;
}

async function generateProposalCrmRequestNumber(client, issueDate) {
  const year = Number(String(issueDate || "").slice(0, 4)) || new Date().getFullYear();
  const next = await getNextCrmSequence(client, year);
  return `RP-${year}-${String(next).padStart(4, "0")}`;
}

async function ensureProposalRegistryRequestNumbers() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const pendingResult = await client.query(
      `SELECT id, TO_CHAR(COALESCE(issue_date, created_at::date), 'YYYY-MM-DD') AS issue_date
       FROM proposal_registry
       WHERE request_id IS NULL
         AND crm_request_number IS NULL
       ORDER BY COALESCE(issue_date, created_at::date), proposal_sequence, id`
    );

    for (const row of pendingResult.rows) {
      const generatedNumber = await generateProposalCrmRequestNumber(client, row.issue_date);
      await client.query(
        "UPDATE proposal_registry SET crm_request_number = $1 WHERE id = $2",
        [generatedNumber, row.id]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function ensureNegotiationProposalBranches() {
  await query(
    `UPDATE proposal_registry
     SET branch_name = 'Matriz - Campinas'
     WHERE LOWER(COALESCE(negotiation_status, '')) = 'em negociacao'`
  );
}

function mapBenefits(payload) {
  const rows = [];

  (payload.transportOptions || []).forEach((option) => {
    rows.push({
      benefitType: "vale_transporte",
      optionLabel: option,
      regionValue: toNullableNumber(payload.transportRegion),
      notes: payload.transportNotes || null
    });
  });

  if (payload.medicalNotes) {
    rows.push({
      benefitType: "assistencia_medica",
      optionLabel: null,
      regionValue: null,
      notes: payload.medicalNotes
    });
  }

  if (payload.mealNotes) {
    rows.push({
      benefitType: "refeicao",
      optionLabel: null,
      regionValue: null,
      notes: payload.mealNotes
    });
  }

  if (payload.foodNotes) {
    rows.push({
      benefitType: "vale_alimentacao",
      optionLabel: null,
      regionValue: null,
      notes: payload.foodNotes
    });
  }

  return rows;
}

function validateRequestPayload(payload) {
  const missing = [];

  if (!payload.requestDate) missing.push("Data da solicitacao");
  if (!payload.deadlineDate) missing.push("Prazo de entrega");
  if (!payload.sellerName) missing.push("Vendedor responsavel");
  if (!payload.sellerEmail) missing.push("Email do vendedor");
  if (!payload.legalName) missing.push("Razao social");
  if (!payload.city) missing.push("Cidade");
  if (!payload.state) missing.push("Estado");
  if (!payload.primaryContactName) missing.push("Contato principal");
  if (!Array.isArray(payload.serviceTypes) || payload.serviceTypes.length === 0) {
    missing.push("Pelo menos um tipo de servico");
  }

  return missing;
}

async function replaceClientContacts(client, clientId, payload) {
  await client.query("DELETE FROM client_contacts WHERE client_id = $1", [clientId]);

  await client.query(
    `INSERT INTO client_contacts (client_id, name, job_title, email, phone, is_primary)
     VALUES ($1, $2, $3, $4, $5, TRUE)`,
    [
      clientId,
      payload.primaryContactName,
      payload.primaryContactRole || null,
      payload.primaryContactEmail || null,
      payload.primaryContactPhone || null
    ]
  );

  if (payload.secondaryContactName || payload.secondaryContactEmail || payload.secondaryContactPhone) {
    await client.query(
      `INSERT INTO client_contacts (client_id, name, job_title, email, phone, is_primary)
       VALUES ($1, $2, $3, $4, $5, FALSE)`,
      [
        clientId,
        payload.secondaryContactName || "Contato secundario",
        payload.secondaryContactRole || null,
        payload.secondaryContactEmail || null,
        payload.secondaryContactPhone || null
      ]
    );
  }
}

async function replaceRequestStructure(client, requestId, payload) {
  const normalizedPayload = dedupeRequestStructurePayload(payload);
  await client.query("DELETE FROM request_services WHERE request_id = $1", [requestId]);
  await client.query("DELETE FROM request_benefits WHERE request_id = $1", [requestId]);
  await client.query("DELETE FROM request_posts WHERE request_id = $1", [requestId]);
  await client.query("DELETE FROM request_equipments WHERE request_id = $1", [requestId]);

  for (const serviceType of normalizedPayload.serviceTypes || []) {
    const normalizedServiceType = normalizeServiceLabel(serviceType);
    if (!normalizedServiceType) continue;
    await client.query(
      "INSERT INTO request_services (request_id, service_type) VALUES ($1, $2)",
      [requestId, slugify(normalizedServiceType)]
    );
  }

  for (const benefit of dedupeByKey(mapBenefits(normalizedPayload), (item) => [
    normalizedStructureKey(item.benefitType),
    normalizedStructureKey(item.optionLabel),
    normalizedStructureKey(item.regionValue),
    normalizedStructureKey(item.notes)
  ].join("|"))) {
    await client.query(
      `INSERT INTO request_benefits (
        request_id, benefit_type, option_label, region_value, notes
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        requestId,
        benefit.benefitType,
        benefit.optionLabel,
        benefit.regionValue,
        benefit.notes
      ]
    );
  }

  for (const post of normalizedPayload.posts || []) {
    const normalizedPostType = normalizeServiceLabel(post.postType);
    await client.query(
      `INSERT INTO request_posts (
        request_id, post_type, qty_posts, qty_workers, function_name, work_scale,
        start_time, end_time, saturday_time, saturday_end_time, holiday_flag, additional_type,
        gratification_percentage, indemnified_flag, uniform_text, cost_allowance_value
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        requestId,
        slugify(normalizedPostType),
        toNullableNumber(post.postQty),
        toNullableNumber(post.workerQty),
        post.functionName || null,
        post.workScale || null,
        post.startTime || null,
        post.endTime || null,
        post.saturdayStartTime || post.saturdayTime || null,
        post.saturdayEndTime || null,
        post.holidayFlag || null,
        post.additionalType || null,
        toNullableNumber(post.gratificationPercentage),
        post.indemnifiedFlag === "" ? null : post.indemnifiedFlag === "Sim",
        post.uniformText || null,
        toNullableNumber(post.costAllowance)
      ]
    );
  }

  for (const equipment of normalizedPayload.equipments || []) {
    const normalizedCategory = normalizeServiceLabel(equipment.category || "");
    await client.query(
      `INSERT INTO request_equipments (
        request_id, category, equipment_name, quantity, notes
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        requestId,
        slugify(normalizedCategory),
        equipment.equipmentName,
        toNullableNumber(equipment.equipmentQty),
        equipment.equipmentNotes || null
      ]
    );
  }
}

async function createRequest(payload, session) {
  payload = dedupeRequestStructurePayload(payload);
  const missing = validateRequestPayload(payload);
  if (missing.length) {
    throw new Error(`Campos obrigatorios nao preenchidos: ${missing.join(", ")}`);
  }

  return withTransaction(async (client) => {
    const submissionKey = String(payload.submissionKey || "").trim() || null;
    if (submissionKey) {
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [submissionKey]);
      const existingBySubmissionKey = await client.query(
        `SELECT id, request_number
         FROM requests
         WHERE submission_key = $1`,
        [submissionKey]
      );

      if (existingBySubmissionKey.rows[0]) {
        return {
          id: existingBySubmissionKey.rows[0].id,
          requestNumber: existingBySubmissionKey.rows[0].request_number,
          reusedSubmission: true
        };
      }
    }

    const sellerUserId = await ensureUser(client, payload.sellerName, payload.sellerEmail);
    const stageId = await getStageId(client, "em_triagem");

    const clientResult = await client.query(
      `INSERT INTO clients (
        legal_name, trade_name, cnpj, industry_segment, main_email,
        address, address_number, address_complement, district, city, state, zip_code
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11, $12
      ) RETURNING id`,
        [
          toUpperOrNull(payload.legalName),
          toUpperOrNull(payload.tradeName),
          payload.cnpj || null,
          payload.industrySegment || null,
        payload.mainEmail || null,
        payload.address || null,
        payload.addressNumber || null,
        payload.addressComplement || null,
        payload.district || null,
        payload.city,
        payload.state,
        payload.zipCode || null
      ]
    );

    const clientId = clientResult.rows[0].id;
    await replaceClientContacts(client, clientId, payload);

    const requestNumber = await generateRequestNumber(client);

    const requestResult = await client.query(
      `INSERT INTO requests (
        request_number, client_id, seller_user_id, current_stage_id, current_owner_user_id,
        request_date, deadline_date, branch_name, lead_source, initial_note, general_notes,
        submission_key
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11, $12
      ) RETURNING id, request_number`,
      [
        requestNumber,
        clientId,
        sellerUserId,
        stageId,
        sellerUserId,
        payload.requestDate,
        payload.deadlineDate,
        payload.branchName || null,
        payload.leadSource || null,
        payload.initialNote || null,
        payload.generalNotes || null,
        submissionKey
      ]
    );

    const requestId = requestResult.rows[0].id;
    await replaceRequestStructure(client, requestId, payload);

    await client.query(
      `INSERT INTO request_stage_history (
        request_id, from_stage_id, to_stage_id, changed_by_user_id,
        owner_user_id, entered_at, sla_deadline_at, sla_status, note
      ) VALUES ($1, NULL, $2, $3, $4, NOW(), NOW(), $5, $6)`,
      [
        requestId,
        stageId,
        sellerUserId,
        sellerUserId,
        "ok",
          payload.initialNote || "Solicitacao criada pelo vendedor e encaminhada para triagem."
        ]
      );

    await createAttachmentRecords(client, {
      requestId,
      uploadedByUserId: sellerUserId,
      attachmentType: "anexo_inicial",
      files: payload.initialAttachments,
      description: "Anexos iniciais da solicitacao"
    });

    await createAttachmentRecords(client, {
      requestId,
      uploadedByUserId: sellerUserId,
      attachmentType: "documento_tecnico_cliente",
      files: payload.technicalDocs,
      description: payload.technicalDocNotes || "Documentos tecnicos do cliente"
    });

    await logAuditEntry(client, {
      actor: {
        userId: session?.userId || sellerUserId,
        name: session?.name || payload.sellerName,
        email: session?.email || payload.sellerEmail,
        role: session?.role || "vendedor"
      },
      actionType: "request_created",
      entityType: "request",
      entityId: requestId,
      requestId,
      description: `Solicitacao ${requestResult.rows[0].request_number} criada.`,
      metadata: {
        requestNumber: requestResult.rows[0].request_number,
        sellerEmail: payload.sellerEmail,
        company: payload.legalName
      }
    });

    return {
      id: requestId,
      requestNumber: requestResult.rows[0].request_number
    };
  });
}

async function updateRequest(payload, requestId, session) {
  payload = dedupeRequestStructurePayload(payload);
  const missing = validateRequestPayload(payload);
  if (missing.length) {
    throw new Error(`Campos obrigatorios nao preenchidos: ${missing.join(", ")}`);
  }

  return withTransaction(async (client) => {
    const existingResult = await client.query(
      `SELECT
         r.id,
         r.request_number AS "requestNumber",
         r.client_id AS "clientId",
         r.current_stage_id AS "currentStageId",
         r.current_owner_user_id AS "currentOwnerUserId",
         seller_user.email AS "sellerEmail",
         ws.code AS "currentStageCode",
         proposal_records.triage_owner_user_id AS "triageOwnerUserId"
       FROM requests r
       JOIN users seller_user ON seller_user.id = r.seller_user_id
       JOIN workflow_stages ws ON ws.id = r.current_stage_id
       LEFT JOIN proposal_records ON proposal_records.request_id = r.id
       WHERE r.id = $1`,
      [requestId]
    );

    const existing = existingResult.rows[0];
    if (!existing) {
      throw new Error("Solicitacao nao encontrada.");
    }

    if (session?.role === "vendedor" && session.email) {
      if (String(existing.sellerEmail || "").toLowerCase() !== session.email) {
        throw new Error("Acesso negado a esta solicitacao.");
      }
    }

    assertStageAccess(session, existing.currentStageCode, "Seu usuário não tem acesso à etapa atual desta solicitação.");

    const sellerUserId = await ensureUser(client, payload.sellerName, payload.sellerEmail);

    await client.query(
      `UPDATE clients
       SET legal_name = $2,
           trade_name = $3,
           cnpj = $4,
           industry_segment = $5,
           main_email = $6,
           address = $7,
           address_number = $8,
           address_complement = $9,
           district = $10,
           city = $11,
           state = $12,
           zip_code = $13
       WHERE id = $1`,
      [
        existing.clientId,
        toUpperOrNull(payload.legalName),
        toUpperOrNull(payload.tradeName),
        payload.cnpj || null,
        payload.industrySegment || null,
        payload.mainEmail || null,
        payload.address || null,
        payload.addressNumber || null,
        payload.addressComplement || null,
        payload.district || null,
        payload.city,
        payload.state,
        payload.zipCode || null
      ]
    );

    await replaceClientContacts(client, existing.clientId, payload);

    await client.query(
      `UPDATE requests
       SET seller_user_id = $2,
           request_date = $3,
           deadline_date = $4,
           branch_name = $5,
           lead_source = $6,
           initial_note = $7,
           general_notes = $8,
           updated_at = NOW()
       WHERE id = $1`,
      [
        requestId,
        sellerUserId,
        payload.requestDate,
        payload.deadlineDate,
        payload.branchName || null,
        payload.leadSource || null,
        payload.initialNote || null,
        payload.generalNotes || null
      ]
    );

    await replaceRequestStructure(client, requestId, payload);

    await createAttachmentRecords(client, {
      requestId,
      uploadedByUserId: session?.userId || sellerUserId,
      attachmentType: "anexo_inicial",
      files: payload.initialAttachments,
      description: "Anexos iniciais da solicitacao"
    });

    await createAttachmentRecords(client, {
      requestId,
      uploadedByUserId: session?.userId || sellerUserId,
      attachmentType: "documento_tecnico_cliente",
      files: payload.technicalDocs,
      description: payload.technicalDocNotes || "Documentos tecnicos do cliente"
    });

    let returnedToTriage = false;
    if (existing.currentStageCode === "aguardando_informacoes") {
      const nextStageId = await getStageId(client, "em_triagem");
      const nextOwnerId = existing.triageOwnerUserId || existing.currentOwnerUserId || null;
      const responseNote =
        payload.pendingResponseNote
        || payload.initialNote
        || payload.generalNotes
        || "Correcoes enviadas pelo vendedor e devolvidas para triagem.";

      await client.query(
        `UPDATE requests
         SET current_stage_id = $2,
             current_owner_user_id = $3,
             updated_at = NOW()
         WHERE id = $1`,
        [requestId, nextStageId, nextOwnerId]
      );

      await client.query(
        `UPDATE request_pending_info
         SET responded_by_user_id = $2,
             response_note = $3,
             responded_at = NOW()
         WHERE id = (
           SELECT id
           FROM request_pending_info
           WHERE request_id = $1
           ORDER BY id DESC
           LIMIT 1
         )`,
        [requestId, session?.userId || sellerUserId, responseNote]
      );

      await client.query(
        `INSERT INTO request_stage_history (
          request_id, from_stage_id, to_stage_id, changed_by_user_id,
          owner_user_id, entered_at, sla_deadline_at, sla_status, note
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6, $7)`,
        [
          requestId,
          existing.currentStageId,
          nextStageId,
          session?.userId || sellerUserId,
          nextOwnerId,
          "ok",
          responseNote
        ]
      );

      returnedToTriage = true;
    }

    await logAuditEntry(client, {
      actor: {
        userId: session?.userId || sellerUserId,
        name: session?.name || payload.sellerName,
        email: session?.email || payload.sellerEmail,
        role: session?.role || "vendedor"
      },
      actionType: returnedToTriage ? "request_corrected" : "request_updated",
      entityType: "request",
      entityId: requestId,
      requestId,
      description: returnedToTriage
        ? `Solicitacao ${existing.requestNumber} corrigida pelo vendedor e devolvida para triagem.`
        : `Solicitacao ${existing.requestNumber} atualizada.`,
      metadata: {
        requestNumber: existing.requestNumber,
        returnedToTriage,
        currentStageCode: existing.currentStageCode
      }
    });

    return {
      id: requestId,
      requestNumber: existing.requestNumber,
      returnedToTriage
    };
  });
}

async function deleteRequest(requestId, session) {
  return withTransaction(async (client) => {
    const requestResult = await client.query(
      "SELECT id, request_number, client_id FROM requests WHERE id = $1",
      [requestId]
    );

    if (!requestResult.rows[0]) {
      const error = new Error("Solicitacao nao encontrada.");
      error.statusCode = 404;
      throw error;
    }

    const linkedProposal = await client.query(
      `SELECT proposal_number_display
       FROM proposal_registry
       WHERE request_id = $1
       ORDER BY id DESC
       LIMIT 1`,
      [requestId]
    );

    if (linkedProposal.rows[0]) {
      const error = new Error(
        `Esta solicitacao possui numero de proposta vinculado (${linkedProposal.rows[0].proposal_number_display}). Exclua ou desvincule o numero de proposta antes.`
      );
      error.statusCode = 400;
      throw error;
    }

    const attachmentResult = await client.query(
      "SELECT storage_path FROM attachments WHERE request_id = $1",
      [requestId]
    );

    await client.query("DELETE FROM contract_records WHERE request_id = $1", [requestId]);
    await client.query("DELETE FROM commercial_records WHERE request_id = $1", [requestId]);
    await client.query("DELETE FROM proposal_records WHERE request_id = $1", [requestId]);
    await client.query("DELETE FROM attachments WHERE request_id = $1", [requestId]);
    await client.query("DELETE FROM request_pending_info WHERE request_id = $1", [requestId]);
    await client.query("DELETE FROM request_stage_history WHERE request_id = $1", [requestId]);
    await client.query("DELETE FROM request_equipments WHERE request_id = $1", [requestId]);
    await client.query("DELETE FROM request_posts WHERE request_id = $1", [requestId]);
    await client.query("DELETE FROM request_benefits WHERE request_id = $1", [requestId]);
    await client.query("DELETE FROM request_services WHERE request_id = $1", [requestId]);
    await client.query("DELETE FROM requests WHERE id = $1", [requestId]);

    const clientId = requestResult.rows[0].client_id;
    if (clientId) {
      const remainingRequests = await client.query(
        "SELECT 1 FROM requests WHERE client_id = $1 LIMIT 1",
        [clientId]
      );
      if (!remainingRequests.rows[0]) {
        await client.query("DELETE FROM client_contacts WHERE client_id = $1", [clientId]);
        await client.query("DELETE FROM clients WHERE id = $1", [clientId]);
      }
    }

    await logAuditEntry(client, {
      actor: {
        userId: session?.userId || null,
        name: session?.name || "Usuario",
        email: session?.email || "",
        role: session?.role || ""
      },
      actionType: "request_deleted",
      entityType: "request",
      entityId: requestId,
      requestId: null,
      description: `Solicitacao ${requestResult.rows[0].request_number} excluida.`,
      metadata: {
        deletedRequestId: requestId,
        requestNumber: requestResult.rows[0].request_number
      }
    });

    return {
      requestNumber: requestResult.rows[0].request_number,
      attachmentPaths: attachmentResult.rows
        .map((row) => row.storage_path)
        .filter(Boolean)
    };
  });
}

async function listRequests() {
  const result = await query(
    `${buildRequestOverviewQuery()}
     ORDER BY "stageEnteredAt" DESC NULLS LAST, id DESC
     LIMIT 50`
  );

  return result.rows;
}

function filterRowsBySession(rows, session) {
  if (session.role !== "vendedor") {
    return rows.filter((row) => hasStageAccess(session, row.stageCode));
  }
  if (!session.email) return [];
  return rows.filter((row) => String(row.sellerEmail || "").toLowerCase() === session.email);
}

async function getReports(filters = {}) {
  const slaStatusCase = buildSlaStatusCase();
  const clauses = [];
  const values = [];
  let index = 1;

  if (filters.dateStart) {
    clauses.push(`r.request_date >= $${index++}`);
    values.push(filters.dateStart);
  }

  if (filters.dateEnd) {
    clauses.push(`r.request_date <= $${index++}`);
    values.push(filters.dateEnd);
  }

  if (filters.seller) {
    clauses.push(`seller_user.name ILIKE $${index++}`);
    values.push(`%${filters.seller}%`);
  }

  if (filters.stageCode) {
    clauses.push(`ws.code = $${index++}`);
    values.push(filters.stageCode);
  }

  if (filters.search) {
    clauses.push(`(r.request_number ILIKE $${index} OR c.legal_name ILIKE $${index})`);
    values.push(`%${filters.search}%`);
    index += 1;
  }

  const havingClauses = [];
  if (filters.slaStatus) {
    havingClauses.push(`report."slaStatus" = $${index++}`);
    values.push(filters.slaStatus);
  }

  const result = await query(
    `WITH latest AS (
       SELECT DISTINCT ON (request_id)
         request_id,
         entered_at
       FROM request_stage_history
       ORDER BY request_id, entered_at DESC, id DESC
     ),
     report AS (
       SELECT
         r.id,
         r.request_number AS "requestNumber",
         UPPER(c.legal_name) AS company,
         seller_user.name AS seller,
         seller_user.email AS "sellerEmail",
         linked_proposal.id AS "proposalRegistryId",
         linked_proposal.proposal_number_display AS "proposalNumber",
         ws.code AS "stageCode",
         ws.name AS "currentStage",
         ${slaStatusCase} AS "slaStatus",
         COALESCE(owner_user.name, seller_user.name) AS "currentOwner",
         TO_CHAR(r.request_date, 'DD/MM/YYYY') AS "requestDate",
         TO_CHAR(r.deadline_date, 'DD/MM/YYYY') AS "deadlineDate",
         COALESCE(r.status_final, 'Em andamento') AS "finalStatus",
         TO_CHAR(r.updated_at, 'DD/MM/YYYY HH24:MI') AS "updatedAt"
       FROM requests r
       JOIN clients c ON c.id = r.client_id
       JOIN users seller_user ON seller_user.id = r.seller_user_id
       JOIN workflow_stages ws ON ws.id = r.current_stage_id
       LEFT JOIN users owner_user ON owner_user.id = r.current_owner_user_id
       LEFT JOIN latest ON latest.request_id = r.id
       LEFT JOIN LATERAL (
         SELECT id, proposal_number_display
         FROM proposal_registry
         WHERE request_id = r.id
         ORDER BY id DESC
         LIMIT 1
       ) linked_proposal ON TRUE
       WHERE ${clauses.length ? clauses.join(" AND ") : "TRUE"}
     )
     SELECT *
     FROM report
     ${havingClauses.length ? `WHERE ${havingClauses.join(" AND ")}` : ""}
     ORDER BY id DESC`,
    values
  );

  return result.rows;
}

async function listProposalNumbers(filters = {}, session) {
  const proposalClauses = [];
  const proposalValues = [];

  proposalClauses.push(buildProposalNumberAccessClause(session, proposalValues));

  if (filters.search) {
    const index = proposalValues.push(`%${filters.search}%`);
    proposalClauses.push(`(
      pr.proposal_number_display ILIKE $${index}
      OR COALESCE(c.legal_name, pr.client_name, '') ILIKE $${index}
      OR COALESCE(req.request_number, pr.crm_request_number, '') ILIKE $${index}
    )`);
  }

  if (filters.manager) {
    const index = proposalValues.push(`%${filters.manager}%`);
    proposalClauses.push(`COALESCE(pr.manager_name, '') ILIKE $${index}`);
  }

  if (filters.status) {
    const index = proposalValues.push(filters.status);
    proposalClauses.push(`COALESCE(pr.negotiation_status, '') = $${index}`);
  }

  if (filters.branch) {
    const index = proposalValues.push(filters.branch);
    proposalClauses.push(`COALESCE(pr.branch_name, '') = $${index}`);
  }

  if (filters.stage) {
    const index = proposalValues.push(filters.stage);
    proposalClauses.push(`${buildProposalStageCodeSql("pr")} = $${index}`);
  }

  const proposalResult = await query(
    `SELECT
       pr.id,
       'proposal' AS "sourceType",
       pr.proposal_sequence AS "proposalSequence",
       pr.proposal_number_display AS "proposalNumberDisplay",
       TO_CHAR(pr.issue_date, 'DD/MM/YYYY') AS "issueDate",
       pr.manager_name AS manager,
       UPPER(COALESCE(c.legal_name, pr.client_name)) AS "clientName",
       COALESCE(req.request_number, pr.crm_request_number, '-') AS "requestNumber",
       ${buildProposalStageCodeSql("pr")} AS "stageCode",
       ${buildProposalStageLabelSql("pr")} AS "stageLabel",
       ${buildProposalCommercialStageCodeSql("pr")} AS "commercialStageCode",
       ${buildProposalCommercialStageLabelSql("pr")} AS "commercialStageLabel",
       pr.document_type AS "documentType",
       pr.branch_name AS "branchName",
       pr.negotiation_status AS status,
       pr.proposal_value AS "proposalValue",
       pr.bdi AS bdi,
       pr.probability_level AS "probabilityLevel",
       pr.imported_from_legacy AS "importedFromLegacy",
       pr.uploaded_file_name AS "uploadedFileName",
       seller_user.email AS "sellerEmail",
       pr.request_id AS "requestId"
     FROM proposal_registry pr
     LEFT JOIN requests req ON req.id = pr.request_id
     LEFT JOIN clients c ON c.id = req.client_id
     LEFT JOIN users seller_user ON seller_user.id = pr.seller_user_id
     WHERE ${proposalClauses.join(" AND ")}
     ORDER BY pr.proposal_sequence DESC, pr.id DESC`,
    proposalValues
  );

  const proposalRows = proposalResult.rows.map((row) => ({
    ...row,
    proposalValue: row.proposalValue === null || row.proposalValue === undefined
      ? "-"
      : Number(row.proposalValue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
    proposalValueRaw: row.proposalValue,
    bdiRaw: row.bdi,
    status: row.status || "Gerado",
    branchName: row.branchName || "-",
    requestNumber: row.requestNumber || "-"
  }));

  const requestValues = [];
  const requestClauses = ["linked_proposal.id IS NULL", "ws.code = 'em_preparacao_da_proposta'"];

  if (!hasPermission(session, "readAllRequests")) {
    const emailIndex = requestValues.push(session.email || "");
    requestClauses.push(`LOWER(seller_user.email) = LOWER($${emailIndex})`);
  }

  if (filters.search) {
    const searchIndex = requestValues.push(`%${filters.search}%`);
    requestClauses.push(`(
      r.request_number ILIKE $${searchIndex}
      OR COALESCE(c.legal_name, '') ILIKE $${searchIndex}
      OR COALESCE(c.trade_name, '') ILIKE $${searchIndex}
    )`);
  }

  if (filters.manager) {
    const managerIndex = requestValues.push(`%${filters.manager}%`);
    requestClauses.push(`COALESCE(seller_user.name, '') ILIKE $${managerIndex}`);
  }

  if (filters.branch) {
    const branchIndex = requestValues.push(filters.branch);
    requestClauses.push(`COALESCE(r.branch_name, '') = $${branchIndex}`);
  }

  if (filters.stage) {
    const stageIndex = requestValues.push(filters.stage);
    requestClauses.push(`ws.code = $${stageIndex}`);
  }

  if (filters.status) {
    if (filters.status === "Sem numero") {
      // Keep all request-only rows visible when explicitly filtering by missing proposal number.
    } else {
      requestClauses.push("FALSE");
    }
  }

  const requestResult = await query(
    `SELECT
       NULL::bigint AS id,
       'request' AS "sourceType",
       NULL::integer AS "proposalSequence",
       '-'::text AS "proposalNumberDisplay",
       TO_CHAR(r.request_date, 'DD/MM/YYYY') AS "issueDate",
       seller_user.name AS manager,
       UPPER(c.legal_name) AS "clientName",
       r.request_number AS "requestNumber",
       ws.code AS "stageCode",
       ws.name AS "stageLabel",
       '-'::text AS "documentType",
       COALESCE(r.branch_name, '-') AS "branchName",
       'Sem numero'::text AS status,
       NULL::numeric AS "proposalValue",
       NULL::numeric AS bdi,
       NULL::text AS "probabilityLevel",
       FALSE AS "importedFromLegacy",
       NULL::text AS "uploadedFileName",
       seller_user.email AS "sellerEmail",
       r.id AS "requestId"
     FROM requests r
     JOIN clients c ON c.id = r.client_id
     JOIN users seller_user ON seller_user.id = r.seller_user_id
     JOIN workflow_stages ws ON ws.id = r.current_stage_id
     LEFT JOIN LATERAL (
       SELECT id
       FROM proposal_registry
       WHERE request_id = r.id
       ORDER BY id DESC
       LIMIT 1
     ) linked_proposal ON TRUE
     WHERE ${requestClauses.join(" AND ")}
     ORDER BY r.request_date DESC, r.id DESC`,
    requestValues
  );

  const requestRows = requestResult.rows.map((row) => ({
    ...row,
    proposalValue: "-",
    proposalValueRaw: 0,
    bdiRaw: null,
    branchName: row.branchName || "-",
    requestNumber: row.requestNumber || "-"
  }));

  return [...proposalRows, ...requestRows].sort((left, right) => {
    if (left.sourceType !== right.sourceType) {
      return left.sourceType === "proposal" ? -1 : 1;
    }

    const leftSequence = Number(left.proposalSequence || 0);
    const rightSequence = Number(right.proposalSequence || 0);
    if (leftSequence !== rightSequence) {
      return rightSequence - leftSequence;
    }

    const leftRequestNumber = String(left.requestNumber || "");
    const rightRequestNumber = String(right.requestNumber || "");
    return rightRequestNumber.localeCompare(leftRequestNumber, "pt-BR", { numeric: true, sensitivity: "base" });
  });
}

async function listCrmRequestsWithoutProposal(filters = {}, session) {
  const values = [];
  const clauses = ["pr.id IS NULL", "ws.code = 'em_preparacao_da_proposta'"];

  if (!hasPermission(session, "readAllRequests")) {
    const emailIndex = values.push(session.email || "");
    clauses.push(`LOWER(seller_user.email) = LOWER($${emailIndex})`);
  }

  if (filters.dateStart) {
    const dateStartIndex = values.push(filters.dateStart);
    clauses.push(`r.request_date >= $${dateStartIndex}::date`);
  }

  if (filters.dateEnd) {
    const dateEndIndex = values.push(filters.dateEnd);
    clauses.push(`r.request_date <= $${dateEndIndex}::date`);
  }

  if (filters.client) {
    const clientIndex = values.push(`%${String(filters.client).toLowerCase()}%`);
    clauses.push(`(
       LOWER(c.legal_name) LIKE $${clientIndex}
      OR LOWER(COALESCE(c.trade_name, '')) LIKE $${clientIndex}
    )`);
  }

  if (filters.seller) {
    const sellerIndex = values.push(String(filters.seller).toLowerCase());
    clauses.push(`LOWER(seller_user.name) = $${sellerIndex}`);
  }

  const result = await query(
    `SELECT
       r.id,
       r.request_number AS "requestNumber",
        UPPER(c.legal_name) AS company,
       seller_user.name AS seller,
       seller_user.email AS "sellerEmail",
       r.branch_name AS "branchName",
       r.lead_source AS "leadSource",
       TO_CHAR(r.request_date, 'DD/MM/YYYY') AS "requestDate",
       TO_CHAR(r.deadline_date, 'DD/MM/YYYY') AS "deadlineDate",
       ws.name AS "currentStage",
       COALESCE(primary_contact.name, '') AS "contactName",
       COALESCE(primary_contact.phone, '') AS phone,
       COALESCE(c.industry_segment, '') AS "industrySegment",
       COALESCE(string_agg(DISTINCT INITCAP(REPLACE(rs.service_type, '_', ' ')), ', '), '') AS "serviceScope"
     FROM requests r
     JOIN clients c ON c.id = r.client_id
     JOIN users seller_user ON seller_user.id = r.seller_user_id
     JOIN workflow_stages ws ON ws.id = r.current_stage_id
     LEFT JOIN proposal_registry pr ON pr.request_id = r.id
     LEFT JOIN request_services rs ON rs.request_id = r.id
     LEFT JOIN client_contacts primary_contact
       ON primary_contact.client_id = c.id
      AND primary_contact.is_primary = TRUE
     WHERE ${clauses.join(" AND ")}
     GROUP BY
       r.id, r.request_number, c.legal_name, seller_user.name, seller_user.email,
       r.branch_name, r.lead_source, r.request_date, r.deadline_date, ws.name,
       primary_contact.name, primary_contact.phone, c.industry_segment
     ORDER BY r.created_at DESC, r.id DESC`,
    values
  );

  return result.rows;
}

function buildProposalRegistryCsv(rows) {
  const headers = [
    "Numero da proposta",
    "Data",
    "Responsavel",
    "Cliente",
    "Solicitacao vinculada",
    "Tipo",
    "Filial",
    "Status",
    "Valor",
    "Origem"
  ];

  const lines = rows.map((row) => ([
    row.proposalNumberDisplay,
    row.issueDate,
    row.manager || "-",
    row.clientName || "-",
    row.requestNumber || "-",
    row.documentType || "-",
    row.branchName || "-",
    row.status || "-",
    row.proposalValue || "-",
    row.importedFromLegacy ? "Historico" : "Plataforma"
  ].map(escapeCsv).join(";")));

  return [headers.join(";"), ...lines].join("\r\n");
}

async function saveProposalRegistryServiceLines(client, proposalRegistryId, serviceLines = []) {
  await client.query(
    "DELETE FROM proposal_registry_service_lines WHERE proposal_registry_id = $1",
    [proposalRegistryId]
  );

  for (const item of serviceLines) {
    await client.query(
      `INSERT INTO proposal_registry_service_lines (
         proposal_registry_id, service_type, proposal_value, bdi
       ) VALUES ($1, $2, $3, $4)`,
      [
        proposalRegistryId,
        item.serviceType,
        item.proposalValue,
        item.bdi
      ]
    );
  }
}

async function createProposalNumberRecord(client, payload, session) {
  const issueDate = payload.issueDate || getSaoPauloIsoDate();
  const requestId = payload.requestId ? Number(payload.requestId) : null;
  const totals = deriveProposalTotals(payload);
  if (!payload.clientName && !requestId) {
    throw new Error("Informe o cliente ou vincule a uma solicitacao.");
  }

  let resolvedClientName = toUpperOrNull(payload.clientName);
  let resolvedBranch = payload.branchName || null;
  let resolvedSellerUserId = session?.userId || null;

  if (requestId) {
    const requestResult = await client.query(
      `SELECT
         r.id,
         r.request_number AS "requestNumber",
         r.branch_name AS "branchName",
         r.seller_user_id AS "sellerUserId",
         UPPER(c.legal_name) AS "clientName"
       FROM requests r
       JOIN clients c ON c.id = r.client_id
       WHERE r.id = $1`,
      [requestId]
    );

    if (!requestResult.rows[0]) {
      throw new Error("Solicitacao vinculada nao encontrada.");
    }

    resolvedClientName = resolvedClientName || requestResult.rows[0].clientName;
    resolvedBranch = resolvedBranch || requestResult.rows[0].branchName;
    resolvedSellerUserId = requestResult.rows[0].sellerUserId || resolvedSellerUserId;
  }

  const nextResult = await client.query(
    "SELECT COALESCE(MAX(proposal_sequence), 0)::int + 1 AS next_sequence FROM proposal_registry"
  );
  const proposalSequence = nextResult.rows[0].next_sequence;
  const proposalNumberDisplay = formatProposalNumberDisplay(proposalSequence, issueDate);
  const proposalYear = Number(String(issueDate).slice(0, 4)) || new Date().getFullYear();
  const managerName = payload.managerName || session?.name || null;
  const uploadedStoragePath = saveModuleFile("proposal-registry", "proposta", payload.uploadedFile);

  const insertResult = await client.query(
    `INSERT INTO proposal_registry (
      proposal_sequence, proposal_year, proposal_number_display, issue_date,
      manager_name, service_scope, document_type, client_name, contact_name,
      phone, industry_segment, proposal_value, bdi, negotiation_status, notes,
      request_id, crm_request_number, seller_user_id, branch_name, lead_source,
      uploaded_file_name, uploaded_storage_path, uploaded_mime_type, uploaded_file_size,
      imported_from_legacy, legacy_source_file
    ) VALUES (
      $1, $2, $3, $4::date,
      $5, $6, $7, $8, $9,
      $10, $11, $12, $13, $14, $15,
      $16, $17, $18, $19, $20,
      $21, $22, $23, $24,
      FALSE, NULL
    )
    RETURNING id, proposal_number_display AS "proposalNumberDisplay", proposal_sequence AS "proposalSequence"`,
    [
      proposalSequence,
      proposalYear,
      proposalNumberDisplay,
      issueDate,
      managerName,
      payload.serviceScope || null,
      payload.documentType || "PROPOSTA",
      resolvedClientName,
      payload.contactName || null,
      payload.phone || null,
      payload.industrySegment || null,
      totals.proposalValue,
      totals.bdi,
      payload.status || "Gerado",
      payload.notes || null,
      requestId,
      requestId ? null : await generateProposalCrmRequestNumber(client, issueDate),
      resolvedSellerUserId,
      resolvedBranch,
      payload.leadSource || null,
      payload.uploadedFile?.fileName || null,
      uploadedStoragePath,
      payload.uploadedFile?.mimeType || null,
      payload.uploadedFile?.fileSize || null
    ]
  );

  await saveProposalRegistryServiceLines(client, insertResult.rows[0].id, totals.serviceLines);

  await logAuditEntry(client, {
    actor: session,
    actionType: "proposal_number_created",
    entityType: "proposal_registry",
    entityId: insertResult.rows[0].id,
    requestId: requestId || null,
    description: `Proposta ${insertResult.rows[0].proposalNumberDisplay} gerado.`,
    metadata: {
      proposalSequence,
      requestId: requestId || null,
      clientName: resolvedClientName
    }
  });

  await createNegotiationValueHistoryEntry(client, {
    proposalValue: totals.proposalValue,
    bdi: totals.bdi,
    notes: payload.notes || "Proposta inicial registrada."
  }, session, {
    requestId: requestId || null,
    proposalRegistryId: insertResult.rows[0].id,
    stageCode: "proposta_finalizada",
    entryType: "proposta_inicial"
  });

  return {
    id: insertResult.rows[0].id,
    proposalNumberDisplay: insertResult.rows[0].proposalNumberDisplay,
    proposalSequence: insertResult.rows[0].proposalSequence
  };
}

async function createProposalNumber(payload, session) {
  return withTransaction(async (client) => createProposalNumberRecord(client, payload, session));
}

async function getProposalRegistryFile(proposalId, session) {
  const values = [proposalId];
  const accessClause = buildProposalNumberAccessClause(session, values);
  const result = await query(
    `SELECT
       pr.id,
       pr.uploaded_file_name AS "fileName",
       pr.uploaded_storage_path AS "storagePath",
       pr.uploaded_mime_type AS "mimeType"
     FROM proposal_registry pr
     WHERE pr.id = $1
       AND ${accessClause}`,
    values
  );

  return result.rows[0] || null;
}

async function getProposalNumberDetail(proposalId, session) {
  const values = [proposalId];
  const accessClause = buildProposalNumberAccessClause(session, values);
  const result = await query(
    `SELECT
       pr.id,
       pr.request_id AS "requestId",
       pr.proposal_number_display AS "proposalNumberDisplay",
       TO_CHAR(pr.issue_date, 'DD/MM/YYYY') AS "issueDate",
       TO_CHAR(pr.issue_date, 'YYYY-MM-DD') AS "issueDateIso",
       pr.manager_name AS manager,
       UPPER(pr.client_name) AS "clientName",
       COALESCE(req.request_number, pr.crm_request_number, '-') AS "requestNumber",
       pr.id AS "proposalRegistryId",
       pr.proposal_number_display AS "proposalNumber",
       pr.document_type AS "documentType",
       pr.branch_name AS "branchName",
       pr.negotiation_status AS status,
       pr.proposal_value AS "proposalValueRaw",
       pr.bdi AS "bdiRaw",
       pr.service_scope AS "serviceScope",
       pr.contact_name AS "contactName",
       pr.phone,
       pr.industry_segment AS "industrySegment",
       pr.notes,
       pr.lead_source AS "leadSource",
       pr.uploaded_file_name AS "uploadedFileName",
       seller_user.email AS "sellerEmail",
       COALESCE(pr.manager_name, seller_user.name) AS seller,
       ${buildProposalStageCodeSql("pr")} AS "stageCode",
       ${buildProposalStageLabelSql("pr")} AS stage,
       ${buildProposalCommercialStageCodeSql("pr")} AS "commercialStageCode",
       ${buildProposalCommercialStageLabelSql("pr")} AS "commercialStageLabel",
       TO_CHAR(pr.sent_to_seller_at, 'YYYY-MM-DD') AS "sentToSellerAt",
       COALESCE(pr.seller_receipt_confirmed, FALSE) AS "commercialSellerReceiptConfirmed",
       pr.negotiation_status AS "commercialNegotiationStatus",
       TO_CHAR(pr.sent_to_seller_at, 'YYYY-MM-DD') AS "commercialSentToSellerAt",
       TO_CHAR(pr.last_contact_at, 'YYYY-MM-DD') AS "lastContactAt",
       TO_CHAR(pr.last_contact_at, 'YYYY-MM-DD') AS "commercialLastContactAt",
       TO_CHAR(pr.expected_close_date, 'YYYY-MM-DD') AS "expectedCloseDate",
       TO_CHAR(pr.expected_close_date, 'YYYY-MM-DD') AS "commercialExpectedCloseDate",
       pr.next_action AS "nextAction",
       pr.next_action AS "commercialNextAction",
       pr.notes AS "commercialNotes",
       pr.requested_adjustments AS "requestedAdjustments",
       pr.requested_adjustments AS "commercialRequestedAdjustments",
       pr.probability_level AS "probabilityLevel",
       pr.probability_level AS "commercialProbabilityLevel",
       pr.probability_reason AS "probabilityReason",
       pr.probability_reason AS "commercialProbabilityReason",
       TO_CHAR(pr.accepted_at, 'YYYY-MM-DD') AS "commercialAcceptedAt",
       pr.accepted_scope AS "commercialAcceptedScope",
       pr.accepted_conditions AS "commercialAcceptedConditions",
       pr.accepted_note AS "commercialAcceptedNote",
       TO_CHAR(pr.contract_started_at, 'YYYY-MM-DD') AS "contractStartedAt",
       pr.draft_version AS "draftVersion",
       TO_CHAR(pr.clause_round_date, 'YYYY-MM-DD') AS "clauseRoundDate",
       pr.notes AS "contractNotes",
       pr.document_pending_notes AS "documentPendingNotes",
       TO_CHAR(pr.operation_start_date, 'YYYY-MM-DD') AS "operationStartDate"
     FROM proposal_registry pr
     LEFT JOIN requests req ON req.id = pr.request_id
     LEFT JOIN users seller_user ON seller_user.id = pr.seller_user_id
     WHERE pr.id = $1
       AND ${accessClause}`,
    values
  );

  const detail = result.rows[0] || null;
  if (!detail) return null;

  const serviceLineResult = await query(
    `SELECT
       service_type AS "serviceType",
       proposal_value AS "proposalValueRaw",
       bdi AS "bdiRaw"
     FROM proposal_registry_service_lines
     WHERE proposal_registry_id = $1
     ORDER BY id ASC`,
    [proposalId]
  );

  detail.serviceLines = serviceLineResult.rows;
  const negotiationDiaryEntries = await listNegotiationDiaryEntries({
    requestId: detail.requestId || null,
    proposalRegistryId: proposalId
  });
  detail.revisionHistory = await listNegotiationValueHistoryEntries({
    requestId: detail.requestId || null,
    proposalRegistryId: proposalId
  });
  if (!detail.revisionHistory.length && (detail.proposalValueRaw !== null || detail.bdiRaw !== null)) {
    detail.revisionHistory = [{
      createdAtLabel: detail.issueDate || "-",
      entryTypeLabel: "Proposta inicial",
      stageLabel: detail.stage || "-",
      actorLabel: detail.manager || detail.seller || "Sistema",
      proposalValueLabel: detail.proposalValueRaw === null || detail.proposalValueRaw === undefined
        ? "-"
        : Number(detail.proposalValueRaw).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      bdiLabel: detail.bdiRaw === null || detail.bdiRaw === undefined
        ? "-"
        : `${Number(detail.bdiRaw).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`,
      notes: "Valor e margem atuais da proposta."
    }];
  }
  detail.history = negotiationDiaryEntries.map((entry) => ({
    title: "Diario de negociacao",
    meta: `${entry.contactDateLabel} - ${buildHistoryActorLabel(entry.actorName, entry.actorEmail)}`,
    note: composeNegotiationDiaryNote(entry),
    type: "negotiation"
  }));
  return detail;
}

async function updateProposalNumber(proposalId, payload, session) {
  return withTransaction(async (client) => {
    const current = await getProposalNumberDetail(proposalId, session);
    const totals = deriveProposalTotals(payload);
    if (!current) {
      const error = new Error("Proposta nao encontrada.");
      error.statusCode = 404;
      throw error;
    }

    const requestId = payload.requestId ? Number(payload.requestId) : null;
    let resolvedClientName = toUpperOrNull(payload.clientName) || current.clientName || null;
    let resolvedBranch = payload.branchName || current.branchName || null;
    let resolvedSellerUserId = session?.userId || null;

    if (requestId) {
      const requestResult = await client.query(
        `SELECT
           r.id,
           r.request_number AS "requestNumber",
           r.branch_name AS "branchName",
           r.seller_user_id AS "sellerUserId",
           UPPER(c.legal_name) AS "clientName"
         FROM requests r
         JOIN clients c ON c.id = r.client_id
         WHERE r.id = $1`,
        [requestId]
      );

      if (!requestResult.rows[0]) {
        throw new Error("Solicitacao vinculada nao encontrada.");
      }

      resolvedClientName = toUpperOrNull(payload.clientName) || requestResult.rows[0].clientName;
      resolvedBranch = payload.branchName || requestResult.rows[0].branchName;
      resolvedSellerUserId = requestResult.rows[0].sellerUserId || resolvedSellerUserId;
    }

    let uploadedStoragePath = null;
    let uploadedFileName = current.uploadedFileName || null;
    let uploadedMimeType = null;
    let uploadedFileSize = null;

    if (payload.uploadedFile?.contentBase64) {
      uploadedStoragePath = saveModuleFile("proposal-registry", "proposta", payload.uploadedFile);
      uploadedFileName = payload.uploadedFile.fileName || uploadedFileName;
      uploadedMimeType = payload.uploadedFile.mimeType || null;
      uploadedFileSize = payload.uploadedFile.fileSize || null;
    }

    const result = await client.query(
      `UPDATE proposal_registry
       SET issue_date = $2::date,
           manager_name = $3,
           client_name = $4,
           document_type = $5,
           branch_name = $6,
           lead_source = $7,
           negotiation_status = $8,
           service_scope = $9,
           contact_name = $10,
           phone = $11,
           industry_segment = $12,
           proposal_value = $13,
           bdi = $14,
           notes = $15,
           request_id = $16,
           seller_user_id = $17,
           uploaded_file_name = COALESCE($18, uploaded_file_name),
           uploaded_storage_path = COALESCE($19, uploaded_storage_path),
           uploaded_mime_type = COALESCE($20, uploaded_mime_type),
           uploaded_file_size = COALESCE($21, uploaded_file_size),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, proposal_number_display AS "proposalNumberDisplay"`,
      [
        proposalId,
        payload.issueDate || current.issueDateIso,
        payload.managerName || current.manager,
        resolvedClientName,
        payload.documentType || current.documentType,
        resolvedBranch,
        payload.leadSource || current.leadSource || null,
        payload.status || current.status || "Gerado",
        payload.serviceScope || current.serviceScope || null,
        payload.contactName || current.contactName || null,
        payload.phone || current.phone || null,
        payload.industrySegment || current.industrySegment || null,
        totals.proposalValue !== null ? totals.proposalValue : toNullableNumber(current.proposalValueRaw),
        totals.bdi !== null ? totals.bdi : toNullableNumber(current.bdiRaw),
        payload.notes || null,
        requestId,
        resolvedSellerUserId,
        uploadedFileName,
        uploadedStoragePath,
        uploadedMimeType,
        uploadedFileSize
      ]
    );

    await saveProposalRegistryServiceLines(
      client,
      proposalId,
      totals.serviceLines.length ? totals.serviceLines : (current.serviceLines || [])
    );

    await logAuditEntry(client, {
      actor: session,
      actionType: "proposal_number_updated",
      entityType: "proposal_registry",
      entityId: proposalId,
      requestId: requestId || current.requestId || null,
      description: `Proposta ${result.rows[0].proposalNumberDisplay} atualizado.`,
      metadata: {
        requestId: requestId || current.requestId || null,
        clientName: resolvedClientName
      }
    });

    return result.rows[0];
  });
}

async function deleteProposalNumber(proposalId, session) {
  return withTransaction(async (client) => {
    const current = await getProposalNumberDetail(proposalId, session);
    if (!current) {
      const error = new Error("Proposta nao encontrada.");
      error.statusCode = 404;
      throw error;
    }

    await client.query("DELETE FROM proposal_registry WHERE id = $1", [proposalId]);

    await logAuditEntry(client, {
      actor: session,
      actionType: "proposal_number_deleted",
      entityType: "proposal_registry",
      entityId: proposalId,
      requestId: current.requestId || null,
      description: `Proposta ${current.proposalNumberDisplay} excluido.`,
      metadata: {
        requestId: current.requestId || null,
        clientName: current.clientName
      }
    });

    return current;
  });
}

async function listSessionUsers() {
  const result = await query(
    `SELECT
       u.id,
       u.name,
       u.email,
       u.module_access AS "moduleAccess",
       COALESCE(array_remove(array_agg(r.name ORDER BY r.name), NULL), ARRAY[]::varchar[]) AS roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     WHERE u.is_active = TRUE
     GROUP BY u.id, u.name, u.email, u.module_access
     HAVING COUNT(r.id) > 0 OR u.email IS NOT NULL
     ORDER BY u.name ASC, u.email ASC`,
    []
  );

  if (!result.rows.length) {
    return [{ name: "Andre", email: "andre@empresa.com.br", roles: ["vendedor"] }];
  }

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    roles: row.roles?.length ? row.roles : ["vendedor"]
  }));
}

async function authenticateUser(email, password) {
  const result = await query(
    `SELECT
       u.id,
       u.name,
       u.email,
       u.module_access AS "moduleAccess",
       u.workflow_stage_access AS "stageAccess",
       u.must_change_password AS "mustChangePassword",
       u.password_hash AS "passwordHash",
       COALESCE(array_remove(array_agg(r.name ORDER BY r.name), NULL), ARRAY[]::varchar[]) AS roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     WHERE u.is_active = TRUE
       AND LOWER(u.email) = LOWER($1)
     GROUP BY u.id, u.name, u.email, u.password_hash, u.module_access, u.workflow_stage_access, u.must_change_password`,
    [email]
  );

  const row = result.rows[0];
  if (!row || !verifyPassword(password, row.passwordHash)) {
    const error = new Error("Email ou senha invalidos.");
    error.statusCode = 401;
    throw error;
  }

  return buildAuthUser(row);
}

async function getCurrentUser(session) {
  assertAuthenticated(session);
  const result = await query(
    `SELECT
       u.id,
       u.name,
       u.email,
       u.module_access AS "moduleAccess",
       u.workflow_stage_access AS "stageAccess",
       u.must_change_password AS "mustChangePassword",
       COALESCE(array_remove(array_agg(r.name ORDER BY r.name), NULL), ARRAY[]::varchar[]) AS roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     WHERE u.id = $1
       AND u.is_active = TRUE
     GROUP BY u.id, u.name, u.email, u.module_access, u.workflow_stage_access, u.must_change_password`,
    [session.userId]
  );

  if (!result.rows[0]) {
    const error = new Error("Usuario autenticado nao encontrado.");
    error.statusCode = 401;
    throw error;
  }

  return buildAuthUser(result.rows[0]);
}

async function changeOwnPassword(session, payload) {
  assertAuthenticated(session);

  const currentPassword = String(payload.currentPassword || "");
  const newPassword = String(payload.newPassword || "");
  const confirmPassword = String(payload.confirmPassword || "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new Error("Preencha senha atual, nova senha e confirmacao.");
  }

  if (newPassword.length < 6) {
    throw new Error("A nova senha deve ter pelo menos 6 caracteres.");
  }

  if (newPassword !== confirmPassword) {
    throw new Error("A confirmacao da nova senha nao confere.");
  }

  const result = await query(
    `SELECT id, name, email, password_hash AS "passwordHash"
     FROM users
     WHERE id = $1
       AND is_active = TRUE`,
    [session.userId]
  );

  const user = result.rows[0];
  if (!user) {
    const error = new Error("Usuario autenticado nao encontrado.");
    error.statusCode = 404;
    throw error;
  }

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    const error = new Error("A senha atual esta incorreta.");
    error.statusCode = 401;
    throw error;
  }

  await query(
    `UPDATE users
     SET password_hash = $2,
         must_change_password = FALSE,
         updated_at = NOW()
     WHERE id = $1`,
    [session.userId, hashPassword(newPassword)]
  );

  if (session.token && sessions.has(session.token)) {
    const currentSession = sessions.get(session.token);
    sessions.set(session.token, {
      ...currentSession,
      mustChangePassword: false
    });
  }

  await logAuditEntry(null, {
    actor: session,
    actionType: "password_changed",
    entityType: "user",
    entityId: session.userId,
    targetUserId: session.userId,
    description: `Senha alterada por ${user.email}.`,
    metadata: {
      email: user.email
    }
  });
}

async function listRoles() {
  const result = await query(
    `SELECT id, name, description
     FROM roles
     ORDER BY name ASC`
  );

  return result.rows;
}

async function listManagedUsers() {
  const result = await query(
    `SELECT
       u.id,
       u.name,
       u.email,
       u.department,
       u.is_active AS "isActive",
       u.module_access AS "moduleAccess",
       u.workflow_stage_access AS "stageAccess",
       u.must_change_password AS "mustChangePassword",
       COALESCE(array_remove(array_agg(r.name ORDER BY r.name), NULL), ARRAY[]::varchar[]) AS roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     GROUP BY u.id, u.name, u.email, u.department, u.is_active, u.module_access, u.workflow_stage_access, u.must_change_password
     ORDER BY u.name ASC, u.email ASC`
  );

  return result.rows.map((row) => ({
    ...row,
    primaryRole: row.roles?.[0] || "vendedor",
    moduleAccess: normalizeModuleAccess(row.moduleAccess, row.roles?.[0] || "vendedor"),
    stageAccess: normalizeStageAccess(row.stageAccess, row.roles?.[0] || "vendedor")
  }));
}

async function createManagedUser(payload, session) {
  if (!payload.name || !payload.email || !payload.role) {
    throw new Error("Nome, email e perfil sao obrigatorios.");
  }

  return withTransaction(async (client) => {
    const normalizedEmail = String(payload.email || "").trim().toLowerCase();
    const temporaryPassword = String(payload.password || "").trim() || generateTemporaryPassword();
    let userResult;
    try {
      userResult = await client.query(
      `INSERT INTO users (name, email, department, is_active, password_hash, module_access, workflow_stage_access, must_change_password)
         VALUES ($1, $2, $3, $4, $5, $6::text[], $7::text[], TRUE)
         RETURNING id`,
        [
          payload.name,
          normalizedEmail,
          payload.department || null,
          payload.isActive !== false,
          hashPassword(temporaryPassword),
          normalizeModuleAccess(payload.moduleAccess, payload.role),
          normalizeStageAccess(payload.stageAccess, payload.role)
        ]
        );
      } catch (error) {
        if (error?.code === "23505") {
          const existingResult = await client.query(
            `SELECT
               id,
               name,
               email,
               is_active AS "isActive"
               FROM users
              WHERE LOWER(email) = LOWER($1)
              LIMIT 1`,
            [normalizedEmail]
          );
          const existing = existingResult.rows[0];
          if (existing && existing.isActive === false) {
            throw new Error(
              `Ja existe um usuario inativo com este e-mail: ${existing.name || existing.email}. Reative ou edite o cadastro existente.`
            );
          }
          if (existing) {
            throw new Error(
              `Ja existe um usuario ativo com este e-mail: ${existing.name || existing.email}. Edite o cadastro existente em vez de criar outro.`
            );
          }
          throw new Error("Ja existe um usuario cadastrado com este e-mail.");
        }
        throw error;
      }

    const roleResult = await client.query("SELECT id FROM roles WHERE name = $1", [payload.role]);
    if (!roleResult.rows[0]) {
      throw new Error("Perfil informado nao encontrado.");
    }

    await client.query("DELETE FROM user_roles WHERE user_id = $1", [userResult.rows[0].id]);
    await ensureUserRole(client, userResult.rows[0].id, roleResult.rows[0].id);
    await logAuditEntry(client, {
      actor: session,
      actionType: "user_created",
      entityType: "user",
      entityId: userResult.rows[0].id,
      targetUserId: userResult.rows[0].id,
      description: `Usuário ${payload.email} criado com perfil ${payload.role}.`,
      metadata: {
        email: normalizedEmail,
        role: payload.role,
        department: payload.department || null,
        isActive: payload.isActive !== false,
        moduleAccess: normalizeModuleAccess(payload.moduleAccess, payload.role),
        stageAccess: normalizeStageAccess(payload.stageAccess, payload.role),
        mustChangePassword: true
      }
    });
    return {
      ...userResult.rows[0],
      temporaryPassword
    };
  });
}

async function updateManagedUser(userId, payload, session) {
  if (!payload.name || !payload.email || !payload.role) {
    throw new Error("Nome, email e perfil sao obrigatorios.");
  }

  return withTransaction(async (client) => {
    const normalizedEmail = String(payload.email || "").trim().toLowerCase();
    const roleResult = await client.query("SELECT id FROM roles WHERE name = $1", [payload.role]);
    if (!roleResult.rows[0]) {
      throw new Error("Perfil informado nao encontrado.");
    }

    try {
      await client.query(
        `UPDATE users
         SET name = $2,
             email = $3,
             department = $4,
             is_active = $5,
             password_hash = COALESCE($6, password_hash),
             module_access = $7::text[],
             workflow_stage_access = $8::text[],
             must_change_password = CASE WHEN $6 IS NOT NULL THEN TRUE ELSE must_change_password END,
             updated_at = NOW()
         WHERE id = $1`,
        [
          userId,
          payload.name,
          normalizedEmail,
          payload.department || null,
          payload.isActive !== false,
          payload.password ? hashPassword(payload.password) : null,
          normalizeModuleAccess(payload.moduleAccess, payload.role),
          normalizeStageAccess(payload.stageAccess, payload.role)
        ]
      );
    } catch (error) {
      if (error?.code === "23505") {
        throw new Error("Ja existe outro usuario cadastrado com este e-mail.");
      }
      throw error;
    }

    await client.query("DELETE FROM user_roles WHERE user_id = $1", [userId]);
    await ensureUserRole(client, userId, roleResult.rows[0].id);
    await logAuditEntry(client, {
      actor: session,
      actionType: "user_updated",
      entityType: "user",
      entityId: userId,
      targetUserId: userId,
      description: `Usuário ${payload.email} atualizado para o perfil ${payload.role}.`,
      metadata: {
        email: normalizedEmail,
        role: payload.role,
        department: payload.department || null,
        isActive: payload.isActive !== false,
        passwordChanged: Boolean(payload.password),
        moduleAccess: normalizeModuleAccess(payload.moduleAccess, payload.role),
        stageAccess: normalizeStageAccess(payload.stageAccess, payload.role)
      }
    });
  });
}

async function deactivateManagedUser(userId, session) {
  return withTransaction(async (client) => {
    const result = await client.query(
      `UPDATE users
       SET is_active = FALSE,
           updated_at = NOW()
       WHERE id = $1
       RETURNING email`,
      [userId]
    );

    await logAuditEntry(client, {
      actor: session,
      actionType: "user_deactivated",
      entityType: "user",
      entityId: userId,
      targetUserId: userId,
      description: `Usuário ${result.rows[0]?.email || userId} desativado.`,
      metadata: {
        email: result.rows[0]?.email || null
      }
    });
  });
}

function buildReportCsv(rows) {
  const headers = [
    "Numero",
    "Numero da proposta",
    "Empresa",
    "Vendedor",
    "Etapa",
    "SLA",
    "Responsavel",
    "Data da solicitacao",
    "Prazo",
    "Status final",
    "Ultima atualizacao"
  ];

  const lines = rows.map((row) => ([
    row.requestNumber,
    row.proposalNumber || "",
    row.company,
    row.seller,
    row.currentStage,
    row.slaStatus,
    row.currentOwner,
    row.requestDate,
    row.deadlineDate,
    row.finalStatus,
    row.updatedAt
  ].map(escapeCsv).join(";")));

  return [headers.join(";"), ...lines].join("\r\n");
}

function buildSalesFunnelCsv(data) {
  const sections = [];

  const addSection = (title, headers, rows) => {
    sections.push(title);
    sections.push(headers.map(escapeCsv).join(";"));
    rows.forEach((row) => sections.push(row.map(escapeCsv).join(";")));
    sections.push("");
  };

  addSection("Indicadores", ["Indicador", "Valor", "Observacao"], (data.metrics || []).map((item) => [
    item.label,
    item.value,
    item.note
  ]));

  addSection("Probabilidade", ["Faixa", "Quantidade", "Valor total"], (data.byProbability || []).map((item) => [
    item.label,
    item.value,
    Number(item.totalValue || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  ]));

  addSection("Carteira por vendedor", ["Vendedor", "Quantidade", "Valor total"], (data.bySeller || []).map((item) => [
    item.label,
    item.value,
    Number(item.totalValue || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  ]));

  addSection("Perdas por motivo", ["Motivo", "Quantidade", "Valor perdido"], (data.lossByReason || []).map((item) => [
    item.label,
    item.value,
    Number(item.totalValue || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  ]));

  addSection("Cancelamentos por motivo", ["Motivo", "Quantidade", "Valor cancelado"], (data.cancelByReason || []).map((item) => [
    item.label,
    item.value,
    Number(item.totalValue || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  ]));

  addSection("Ticket médio por vendedor", ["Vendedor", "Quantidade", "Ticket médio"], (data.ticketBySeller || []).map((item) => [
    item.label,
    item.value,
    Number(item.averageValue || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  ]));

  addSection("Conversão por vendedor", ["Vendedor", "Entradas", "Ganhas", "Fechadas", "Conversão final"], (data.conversionBySeller || []).map((item) => [
    item.label,
    item.entries,
    item.accepted,
    item.signed,
    item.conversionRate
  ]));

  addSection("O que está para fechar", ["Solicitação", "Número da proposta", "Cliente", "Vendedor", "Tipo de serviço", "Probabilidade", "Previsão", "Valor", "Margem"], (data.closingSoon || []).map((item) => [
    item.requestNumber,
    item.proposalNumber,
    item.company,
    item.seller,
    item.serviceScope,
    item.probability,
    item.expectedCloseDate,
    item.value,
    item.margin
  ]));

  return sections.join("\r\n");
}

async function getRequestDetailFromDb(requestId, session) {
  const slaStatusCase = buildSlaStatusCase();
  const detailResult = await query(
    `WITH latest AS (
       SELECT DISTINCT ON (request_id)
         request_id,
         entered_at,
         note
       FROM request_stage_history
       ORDER BY request_id, entered_at DESC, id DESC
     )
     SELECT
       r.id,
       c.id AS "clientId",
       r.request_number AS "requestNumber",
       UPPER(c.legal_name) AS company,
       UPPER(c.legal_name) AS "legalName",
       UPPER(COALESCE(c.trade_name, '')) AS "tradeName",
       c.cnpj,
       c.industry_segment AS "industrySegment",
       c.main_email AS "mainEmail",
       c.address,
       c.address_number AS "addressNumber",
       c.address_complement AS "addressComplement",
       c.district,
       c.city,
       c.state,
       c.zip_code AS "zipCode",
       ws.code AS "stageCode",
       seller_user.email AS "sellerEmail",
       ws.name AS stage,
       ${slaStatusCase} AS "slaStatus",
       COALESCE(owner_user.name, seller_user.name) AS "currentOwner",
       seller_user.name AS seller,
       r.branch_name AS "branchName",
       r.lead_source AS "leadSource",
       r.initial_note AS "initialNote",
       r.general_notes AS "generalNotes",
       TO_CHAR(r.request_date, 'DD/MM/YYYY') AS "requestDate",
       TO_CHAR(r.request_date, 'YYYY-MM-DD') AS "requestDateIso",
       TO_CHAR(r.deadline_date, 'DD/MM/YYYY') AS "deadlineDate",
       TO_CHAR(r.deadline_date, 'YYYY-MM-DD') AS "deadlineDateIso",
       COALESCE(contract_records.next_action, commercial_records.next_action, latest.note, r.initial_note, 'Solicitacao em andamento') AS "nextAction",
       linked_proposal.id AS "proposalRegistryId",
       linked_proposal.proposal_number_display AS "proposalNumber",
       TO_CHAR(linked_proposal.issue_date, 'DD/MM/YYYY') AS "proposalIssueDate",
       linked_proposal.negotiation_status AS "proposalStatus",
       ${buildProposalStageCodeSql("linked_proposal")} AS "proposalWorkflowStageCode",
       ${buildProposalStageLabelSql("linked_proposal")} AS "proposalWorkflowStageLabel",
       ${buildProposalCommercialStageCodeSql("linked_proposal")} AS "proposalCommercialStageCode",
       ${buildProposalCommercialStageLabelSql("linked_proposal")} AS "proposalCommercialStageLabel",
       linked_proposal.manager_name AS "proposalManager",
       linked_proposal.proposal_value AS "proposalValue",
       linked_proposal.bdi AS "proposalBdi",
       triage_user.name AS "triageOwnerName",
       triage_user.email AS "triageOwnerEmail",
       proposal_user.name AS "proposalOwnerName",
       proposal_user.email AS "proposalOwnerEmail",
       proposal_records.triage_status AS "proposalTriageStatus",
       proposal_records.triage_note AS "proposalTriageNote",
       proposal_records.internal_notes AS "proposalInternalNotes",
       proposal_records.commercial_assumptions AS "proposalCommercialAssumptions",
       proposal_records.operational_assumptions AS "proposalOperationalAssumptions",
       TO_CHAR(proposal_records.expected_completion_date, 'YYYY-MM-DD') AS "proposalExpectedCompletionDate",
       proposal_records.proposal_version AS "proposalVersion",
       COALESCE(commercial_seller_user.name, seller_user.name) AS "commercialSellerName",
       COALESCE(commercial_seller_user.email, seller_user.email) AS "commercialSellerEmail",
       TO_CHAR(commercial_records.sent_to_seller_at, 'YYYY-MM-DD') AS "commercialSentToSellerAt",
       COALESCE(commercial_records.seller_receipt_confirmed, FALSE) AS "commercialSellerReceiptConfirmed",
       commercial_records.negotiation_status AS "commercialNegotiationStatus",
       TO_CHAR(commercial_records.last_contact_at, 'YYYY-MM-DD') AS "commercialLastContactAt",
       TO_CHAR(commercial_records.expected_close_date, 'YYYY-MM-DD') AS "commercialExpectedCloseDate",
       commercial_records.next_action AS "commercialNextAction",
       commercial_records.commercial_notes AS "commercialNotes",
       commercial_records.requested_adjustments AS "commercialRequestedAdjustments",
       TO_CHAR(commercial_records.accepted_at, 'YYYY-MM-DD') AS "commercialAcceptedAt",
       commercial_records.accepted_scope AS "commercialAcceptedScope",
       commercial_records.accepted_conditions AS "commercialAcceptedConditions",
       commercial_records.accepted_note AS "commercialAcceptedNote",
       loss_reasons.name AS "commercialLossReason",
       cancel_reasons.name AS "commercialCancelReason",
       commercial_records.probability_level AS "commercialProbabilityLevel",
       commercial_records.probability_reason AS "commercialProbabilityReason",
       contract_owner_user.name AS "contractOwnerName",
       contract_owner_user.email AS "contractOwnerEmail",
       TO_CHAR(contract_records.contract_started_at, 'YYYY-MM-DD') AS "contractStartedAt",
       contract_records.contract_notes AS "contractNotes",
       contract_records.document_pending_notes AS "documentPendingNotes",
       TO_CHAR(contract_records.clause_round_date, 'YYYY-MM-DD') AS "clauseRoundDate",
       contract_records.draft_version AS "draftVersion",
       contract_records.clauses_under_discussion AS "clausesUnderDiscussion",
       contract_records.legal_notes AS "legalNotes",
       contract_records.next_action AS "contractNextAction",
       TO_CHAR(contract_records.signed_at, 'YYYY-MM-DD') AS "signedAt",
       TO_CHAR(contract_records.operation_start_date, 'YYYY-MM-DD') AS "operationStartDate"
     FROM requests r
     JOIN clients c ON c.id = r.client_id
     JOIN workflow_stages ws ON ws.id = r.current_stage_id
     JOIN users seller_user ON seller_user.id = r.seller_user_id
     LEFT JOIN users owner_user ON owner_user.id = r.current_owner_user_id
     LEFT JOIN commercial_records ON commercial_records.request_id = r.id
     LEFT JOIN users commercial_seller_user ON commercial_seller_user.id = commercial_records.seller_user_id
     LEFT JOIN contract_records ON contract_records.request_id = r.id
     LEFT JOIN users contract_owner_user ON contract_owner_user.id = contract_records.contract_owner_user_id
     LEFT JOIN proposal_records ON proposal_records.request_id = r.id
     LEFT JOIN users triage_user ON triage_user.id = proposal_records.triage_owner_user_id
     LEFT JOIN users proposal_user ON proposal_user.id = proposal_records.proposal_owner_user_id
     LEFT JOIN loss_reasons ON loss_reasons.id = r.lost_reason_id
     LEFT JOIN cancel_reasons ON cancel_reasons.id = r.cancel_reason_id
     LEFT JOIN LATERAL (
       SELECT id, proposal_number_display, issue_date, negotiation_status, manager_name, proposal_value, bdi
       FROM proposal_registry
       WHERE request_id = r.id
       ORDER BY id DESC
       LIMIT 1
     ) linked_proposal ON TRUE
     LEFT JOIN latest ON latest.request_id = r.id
     WHERE r.id = $1`,
    [requestId]
  );

  if (!detailResult.rows[0]) {
    throw new Error("Solicitacao nao encontrada.");
  }

  if (session?.role === "vendedor" && session.email) {
    const ownerEmail = String(detailResult.rows[0].sellerEmail || "").toLowerCase();
    if (ownerEmail !== session.email) {
      throw new Error("Acesso negado a esta solicitacao.");
    }
  }

  if (session?.role !== "vendedor") {
    assertStageAccess(session, detailResult.rows[0].stageCode, "Seu usuário não tem acesso a esta etapa.");
  }

  const historyResult = await query(
    `SELECT
       ws.name AS title,
       rsh.entered_at AS "sortAt",
       TO_CHAR(rsh.entered_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') || ' - ' || COALESCE(changed_user.name, 'Sistema') AS meta,
       COALESCE(rsh.note, 'Sem observacao registrada.') AS note
     FROM request_stage_history rsh
     JOIN workflow_stages ws ON ws.id = rsh.to_stage_id
     LEFT JOIN users changed_user ON changed_user.id = rsh.changed_by_user_id
     WHERE rsh.request_id = $1
     ORDER BY rsh.entered_at DESC`,
    [requestId]
  );

  const negotiationDiaryEntries = await listNegotiationDiaryEntries({
    requestId,
    proposalRegistryId: detailResult.rows[0].proposalRegistryId || null
  });
  let negotiationValueHistory = await listNegotiationValueHistoryEntries({
    requestId,
    proposalRegistryId: detailResult.rows[0].proposalRegistryId || null
  });
  if (!negotiationValueHistory.length && detailResult.rows[0].proposalRegistryId && (detailResult.rows[0].proposalValue !== null || detailResult.rows[0].proposalBdi !== null)) {
    negotiationValueHistory = [{
      createdAtLabel: detailResult.rows[0].proposalIssueDate || "-",
      entryTypeLabel: "Proposta inicial",
      stageLabel: detailResult.rows[0].proposalWorkflowStageLabel || "-",
      actorLabel: detailResult.rows[0].proposalManager || "Sistema",
      proposalValueLabel: detailResult.rows[0].proposalValue === null || detailResult.rows[0].proposalValue === undefined
        ? "-"
        : Number(detailResult.rows[0].proposalValue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      bdiLabel: detailResult.rows[0].proposalBdi === null || detailResult.rows[0].proposalBdi === undefined
        ? "-"
        : `${Number(detailResult.rows[0].proposalBdi).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`,
      notes: "Valor e margem atuais da proposta vinculada."
    }];
  }

  const servicesResult = await query(
    `SELECT service_type AS "serviceType"
     FROM request_services
     WHERE request_id = $1
     ORDER BY id`,
    [requestId]
  );

  const benefitsResult = await query(
    `SELECT
       benefit_type AS "benefitType",
       option_label AS "optionLabel",
       region_value AS "regionValue",
       notes
     FROM request_benefits
     WHERE request_id = $1
     ORDER BY id`,
    [requestId]
  );

  const postsResult = await query(
    `SELECT
       post_type AS "postType",
       qty_posts AS "qtyPosts",
       qty_workers AS "qtyWorkers",
       function_name AS "functionName",
       work_scale AS "workScale",
       start_time AS "startTime",
       end_time AS "endTime",
       saturday_time AS "saturdayTime",
       saturday_end_time AS "saturdayEndTime",
       holiday_flag AS "holidayFlag",
       additional_type AS "additionalType",
       gratification_percentage AS "gratificationPercentage",
       indemnified_flag AS "indemnifiedFlag",
       uniform_text AS "uniformText",
       cost_allowance_value AS "costAllowanceValue"
     FROM request_posts
     WHERE request_id = $1
     ORDER BY id`,
    [requestId]
  );

  const equipmentsResult = await query(
    `SELECT
       category,
       equipment_name AS "equipmentName",
       quantity,
       notes
     FROM request_equipments
     WHERE request_id = $1
     ORDER BY id`,
    [requestId]
  );

  const contactsResult = await query(
    `SELECT
       name,
       job_title AS "jobTitle",
       email,
       phone,
       is_primary AS "isPrimary"
     FROM client_contacts
     WHERE client_id = $1
     ORDER BY is_primary DESC, id`,
    [detailResult.rows[0].clientId]
  );

  const pendingInfoResult = await query(
    `SELECT
       pending_reason AS "pendingReason",
       pending_description AS "pendingDescription",
       TO_CHAR(due_date, 'YYYY-MM-DD') AS "pendingDueDate",
       responsible_user.name AS "pendingOwnerName",
       responsible_user.email AS "pendingOwnerEmail",
       response_note AS "responseNote",
       TO_CHAR(responded_at, 'YYYY-MM-DD') AS "respondedAt"
     FROM request_pending_info rpi
     LEFT JOIN users responsible_user ON responsible_user.id = rpi.responsible_user_id
     WHERE rpi.request_id = $1
     ORDER BY rpi.id DESC
     LIMIT 1`,
    [requestId]
  );

  const primaryContact = contactsResult.rows.find((row) => row.isPrimary) || {};
  const secondaryContact = contactsResult.rows.find((row) => !row.isPrimary) || {};

  return {
    ...detailResult.rows[0],
    primaryContactName: primaryContact.name || "",
    primaryContactRole: primaryContact.jobTitle || "",
    primaryContactEmail: primaryContact.email || "",
    primaryContactPhone: primaryContact.phone || "",
    secondaryContactName: secondaryContact.name || "",
    secondaryContactRole: secondaryContact.jobTitle || "",
    secondaryContactEmail: secondaryContact.email || "",
    secondaryContactPhone: secondaryContact.phone || "",
    pendingInfo: pendingInfoResult.rows[0] || null,
    services: servicesResult.rows,
    benefits: benefitsResult.rows,
    posts: postsResult.rows,
    equipments: equipmentsResult.rows,
    revisionHistory: negotiationValueHistory,
    history: [...historyResult.rows.map((row) => ({
      title: row.title,
      meta: row.meta,
      note: row.note,
      sortAt: row.sortAt,
      type: "stage"
    })), ...negotiationDiaryEntries.map((entry) => ({
      title: "Diario de negociacao",
      meta: `${entry.contactDateLabel} - ${buildHistoryActorLabel(entry.actorName, entry.actorEmail)}`,
      note: composeNegotiationDiaryNote(entry),
      sortAt: entry.contactDate,
      type: "negotiation"
    }))]
      .sort((left, right) => new Date(right.sortAt).getTime() - new Date(left.sortAt).getTime())
      .map((row) => ({
        title: row.title,
        meta: row.meta,
        note: row.note,
        type: row.type || "stage"
      }))
  };
}

async function getDashboardFromDb(filters = {}, session = null) {
  const overviewResult = await query(buildRequestOverviewQuery());
  const items = session ? filterRowsBySession(overviewResult.rows, session) : overviewResult.rows;

  const openItems = items.filter((item) => item.slaStatus !== "Encerrado");
  const countByStatus = (status) => items.filter((item) => item.slaStatus === status).length;
  const countByStage = new Map();

  for (const item of items) {
    countByStage.set(item.currentStage, (countByStage.get(item.currentStage) || 0) + 1);
  }

  const maxStageCount = Math.max(...countByStage.values(), 1);
  const funnel = [...countByStage.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([stage, value]) => ({
      stage,
      value,
      percent: Math.max(10, Math.round((value / maxStageCount) * 100))
    }));

  const urgent = items
    .filter((item) => ["Vencido", "Em risco"].includes(item.slaStatus))
    .slice(0, 5)
    .map((item) => ({
      requestNumber: item.requestNumber,
      company: item.company,
      stage: item.currentStage,
      owner: item.currentOwner,
      sla: item.slaStatus
    }));

  const acceptedCountResult = await query(
    "SELECT COUNT(*)::int AS total FROM requests WHERE current_stage_id = (SELECT id FROM workflow_stages WHERE code = 'proposta_aceita')"
  );
  const signedCountResult = await query(
    "SELECT COUNT(*)::int AS total FROM requests WHERE current_stage_id = (SELECT id FROM workflow_stages WHERE code = 'contrato_assinado')"
  );

  const salesClauses = [];
  const salesValues = [];
  let salesIndex = 1;

  if (filters.dateStart) {
    salesClauses.push(`r.request_date >= $${salesIndex++}`);
    salesValues.push(filters.dateStart);
  }

  if (filters.dateEnd) {
    salesClauses.push(`r.request_date <= $${salesIndex++}`);
    salesValues.push(filters.dateEnd);
  }

  if (filters.seller) {
    salesClauses.push(`seller_user.name ILIKE $${salesIndex++}`);
    salesValues.push(`%${filters.seller}%`);
  }

  if (filters.branch) {
    salesClauses.push(`COALESCE(r.branch_name, '') = $${salesIndex++}`);
    salesValues.push(filters.branch);
  }

  if (filters.probability) {
    salesClauses.push(`COALESCE(commercial_records.probability_level, '') = $${salesIndex++}`);
    salesValues.push(filters.probability);
  }

  const proposalSalesClauses = ["pr.request_id IS NULL"];
  const proposalSalesValues = [];
  let proposalSalesIndex = 1;

  if (filters.dateStart) {
    proposalSalesClauses.push(`pr.issue_date >= $${proposalSalesIndex++}`);
    proposalSalesValues.push(filters.dateStart);
  }

  if (filters.dateEnd) {
    proposalSalesClauses.push(`pr.issue_date <= $${proposalSalesIndex++}`);
    proposalSalesValues.push(filters.dateEnd);
  }

  if (filters.seller) {
    proposalSalesClauses.push(`COALESCE(pr.manager_name, seller_user.name, '') ILIKE $${proposalSalesIndex++}`);
    proposalSalesValues.push(`%${filters.seller}%`);
  }

  if (filters.branch) {
    proposalSalesClauses.push(`COALESCE(pr.branch_name, '') = $${proposalSalesIndex++}`);
    proposalSalesValues.push(filters.branch);
  }

  if (filters.probability) {
    proposalSalesClauses.push(`COALESCE(pr.probability_level, '') = $${proposalSalesIndex++}`);
    proposalSalesValues.push(filters.probability);
  }

  const salesResult = await query(
    `SELECT
       r.id,
       r.request_number AS "requestNumber",
       c.legal_name AS company,
       seller_user.name AS seller,
       seller_user.email AS "sellerEmail",
       ws.code AS "stageCode",
       ws.name AS "stageName",
       commercial_records.probability_level AS "probabilityLevel",
       commercial_records.expected_close_date AS "expectedCloseDate",
       r.request_date AS "requestDate",
       r.closed_at AS "closedAt",
       loss_reasons.name AS "lossReason",
       cancel_reasons.name AS "cancelReason",
       linked_proposal.id AS "proposalRegistryId",
       linked_proposal.proposal_number_display AS "proposalNumber",
       linked_proposal.proposal_value AS "proposalValue",
       linked_proposal.service_scope AS "serviceScope",
       linked_proposal.bdi AS "bdi"
     FROM requests r
     JOIN clients c ON c.id = r.client_id
     JOIN users seller_user ON seller_user.id = r.seller_user_id
     JOIN workflow_stages ws ON ws.id = r.current_stage_id
     LEFT JOIN commercial_records ON commercial_records.request_id = r.id
     LEFT JOIN loss_reasons ON loss_reasons.id = r.lost_reason_id
     LEFT JOIN cancel_reasons ON cancel_reasons.id = r.cancel_reason_id
     LEFT JOIN LATERAL (
        SELECT id, proposal_number_display, proposal_value, service_scope, bdi
        FROM proposal_registry
        WHERE request_id = r.id
       ORDER BY id DESC
       LIMIT 1
     ) linked_proposal ON TRUE
     WHERE ${salesClauses.length ? salesClauses.join(" AND ") : "TRUE"}`,
    salesValues
  );

  const proposalOnlySalesResult = await query(
    `SELECT
       NULL::bigint AS id,
       COALESCE(pr.crm_request_number, '-') AS "requestNumber",
        UPPER(COALESCE(pr.client_name, '-')) AS company,
       COALESCE(pr.manager_name, seller_user.name, '-') AS seller,
       seller_user.email AS "sellerEmail",
       ${buildProposalStageCodeSql("pr")} AS "stageCode",
       ${buildProposalStageLabelSql("pr")} AS "stageName",
       pr.probability_level AS "probabilityLevel",
       NULL::date AS "expectedCloseDate",
       pr.issue_date AS "requestDate",
       CASE
         WHEN LOWER(COALESCE(pr.negotiation_status, '')) IN ('ganho', 'pedido') THEN pr.updated_at
         ELSE NULL
       END AS "closedAt",
       NULL::text AS "lossReason",
       NULL::text AS "cancelReason",
       pr.id AS "proposalRegistryId",
       pr.proposal_number_display AS "proposalNumber",
       pr.proposal_value AS "proposalValue",
       pr.service_scope AS "serviceScope",
       pr.bdi AS "bdi"
     FROM proposal_registry pr
     LEFT JOIN users seller_user ON seller_user.id = pr.seller_user_id
     WHERE ${proposalSalesClauses.join(" AND ")}`,
    proposalSalesValues
  );

  const salesRows = session
    ? filterRowsBySession([...salesResult.rows, ...proposalOnlySalesResult.rows], session)
    : [...salesResult.rows, ...proposalOnlySalesResult.rows];
  const salesPipelineRows = salesRows.filter((row) => !["perdida", "cancelada", "contrato_assinado"].includes(row.stageCode));
  const salesClosingRows = salesRows.filter((row) => (
    row.probabilityLevel === "Alta"
    && !["perdida", "cancelada", "contrato_assinado"].includes(row.stageCode)
  ));

  const pipelineValue = salesPipelineRows.reduce((sum, row) => sum + Number(row.proposalValue || 0), 0);
  const highProbabilityCount = salesRows.filter((row) => row.probabilityLevel === "Alta").length;
  const closingThisMonthCount = salesClosingRows.filter((row) => {
    const expected = new Date(row.expectedCloseDate);
    const today = new Date();
    return expected.getFullYear() === today.getFullYear() && expected.getMonth() === today.getMonth();
  }).length;
  const wonCount = salesRows.filter((row) => row.stageCode === "contrato_assinado").length;
  const wonValue = salesRows
    .filter((row) => row.stageCode === "contrato_assinado")
    .reduce((sum, row) => sum + Number(row.proposalValue || 0), 0);

  const buildBarItems = (entries, valueKey = "value") => {
    const values = entries.map((entry) => Number(entry[valueKey] || 0));
    const max = Math.max(...values, 1);
    return entries.map((entry) => ({
      ...entry,
      percent: Math.max(12, Math.round((Number(entry[valueKey] || 0) / max) * 100))
    }));
  };

  const summarizeBy = (rows, labels) => buildBarItems(
    labels.map(([key, label]) => {
      const matches = rows.filter((row) => key(row));
      return {
        label,
        value: matches.length,
        totalValue: matches.reduce((sum, row) => sum + Number(row.proposalValue || 0), 0)
      };
    })
  );

  const probabilityOrder = ["Alta", "Media", "Baixa", "Ganho"];
  const byProbability = buildBarItems(
    probabilityOrder.map((label) => {
      const matches = salesRows.filter((row) => row.probabilityLevel === label);
      return {
        label,
        value: matches.length,
        totalValue: matches.reduce((sum, row) => sum + Number(row.proposalValue || 0), 0)
      };
    })
  );

  const sellerMap = new Map();
  const sellerValueMap = new Map();
  for (const row of salesPipelineRows) {
    sellerMap.set(row.seller, (sellerMap.get(row.seller) || 0) + 1);
    sellerValueMap.set(row.seller, (sellerValueMap.get(row.seller) || 0) + Number(row.proposalValue || 0));
  }
  const bySeller = buildBarItems(
    [...sellerMap.entries()]
      .map(([label, value]) => ({ label, value, totalValue: sellerValueMap.get(label) || 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  );

  const monthFormatter = (date) => {
    const ref = new Date(date);
    return ref.toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" });
  };

  const monthKeys = [];
  for (let index = 5; index >= 0; index -= 1) {
    const ref = new Date();
    ref.setMonth(ref.getMonth() - index);
    monthKeys.push(monthFormatter(ref));
  }

  const entriesByMonth = new Map(monthKeys.map((key) => [key, 0]));
  for (const row of salesRows) {
    const key = monthFormatter(row.requestDate);
    if (entriesByMonth.has(key)) {
      entriesByMonth.set(key, entriesByMonth.get(key) + 1);
    }
  }
  const byMonthEntries = buildBarItems(
    [...entriesByMonth.entries()].map(([label, value]) => {
      const matches = salesRows.filter((row) => monthFormatter(row.requestDate) === label);
      return {
        label,
        value,
        totalValue: matches.reduce((sum, row) => sum + Number(row.proposalValue || 0), 0)
      };
    })
  );

  const winsByMonth = new Map(monthKeys.map((key) => [key, 0]));
  for (const row of salesRows.filter((entry) => entry.stageCode === "contrato_assinado" && entry.closedAt)) {
    const key = monthFormatter(row.closedAt);
    if (winsByMonth.has(key)) {
      winsByMonth.set(key, winsByMonth.get(key) + 1);
    }
  }
  const byMonthWins = buildBarItems(
    [...winsByMonth.entries()].map(([label, value]) => {
      const matches = salesRows.filter((row) => row.stageCode === "contrato_assinado" && row.closedAt && monthFormatter(row.closedAt) === label);
      return {
        label,
        value,
        totalValue: matches.reduce((sum, row) => sum + Number(row.proposalValue || 0), 0)
      };
    })
  );

  const stageLabels = [
    [(row) => row.stageCode === "solicitacao_criada", "Entrada"],
    [(row) => row.stageCode === "em_preparacao_da_proposta", "Em elaboracao"],
    [(row) => row.stageCode === "enviada_ao_vendedor", "Recebimento"],
    [(row) => row.stageCode === "em_negociacao", "Em negociacao"],
    [(row) => row.stageCode === "proposta_aceita", "Ganhas"],
    [(row) => row.stageCode === "contrato_assinado", "Fechadas"]
  ];
  const byStage = summarizeBy(salesRows, stageLabels);

  const lossReasonMap = new Map();
  const lossValueMap = new Map();
  for (const row of salesRows.filter((entry) => entry.stageCode === "perdida")) {
    const label = row.lossReason || "Sem motivo";
    lossReasonMap.set(label, (lossReasonMap.get(label) || 0) + 1);
    lossValueMap.set(label, (lossValueMap.get(label) || 0) + Number(row.proposalValue || 0));
  }
  const lossByReason = buildBarItems(
    [...lossReasonMap.entries()]
      .map(([label, value]) => ({ label, value, totalValue: lossValueMap.get(label) || 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  );

  const cancelReasonMap = new Map();
  const cancelValueMap = new Map();
  for (const row of salesRows.filter((entry) => entry.stageCode === "cancelada")) {
    const label = row.cancelReason || "Sem motivo";
    cancelReasonMap.set(label, (cancelReasonMap.get(label) || 0) + 1);
    cancelValueMap.set(label, (cancelValueMap.get(label) || 0) + Number(row.proposalValue || 0));
  }
  const cancelByReason = buildBarItems(
    [...cancelReasonMap.entries()]
      .map(([label, value]) => ({ label, value, totalValue: cancelValueMap.get(label) || 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  );

  const ticketBySeller = buildBarItems(
    [...sellerMap.entries()]
      .map(([label, value]) => ({
        label,
        value,
        averageValue: value ? (sellerValueMap.get(label) || 0) / value : 0,
        totalValue: sellerValueMap.get(label) || 0
      }))
      .sort((a, b) => b.averageValue - a.averageValue)
      .slice(0, 6),
    "averageValue"
  );

  const conversionSellerMap = new Map();
  for (const row of salesRows) {
    if (!conversionSellerMap.has(row.seller)) {
      conversionSellerMap.set(row.seller, { label: row.seller, entries: 0, accepted: 0, signed: 0 });
    }
    const current = conversionSellerMap.get(row.seller);
    current.entries += 1;
    if (["proposta_aceita", "elaboracao_de_contrato", "negociacao_de_clausulas", "contrato_assinado"].includes(row.stageCode)) {
      current.accepted += 1;
    }
    if (row.stageCode === "contrato_assinado") {
      current.signed += 1;
    }
  }
  const conversionBySeller = [...conversionSellerMap.values()]
    .map((item) => ({
      ...item,
      conversionRate: item.entries ? `${Math.round((item.signed / item.entries) * 100)}%` : "0%"
    }))
    .sort((a, b) => b.entries - a.entries)
    .slice(0, 6);

  const closingSoon = salesClosingRows
    .sort((a, b) => {
      const aDate = a.expectedCloseDate ? new Date(a.expectedCloseDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bDate = b.expectedCloseDate ? new Date(b.expectedCloseDate).getTime() : Number.MAX_SAFE_INTEGER;
      if (aDate !== bDate) return aDate - bDate;
      return new Date(b.requestDate) - new Date(a.requestDate);
    })
    .slice(0, 5)
    .map((row) => ({
      requestId: row.id || null,
      proposalRegistryId: row.proposalRegistryId || null,
      requestNumber: row.requestNumber,
      proposalNumber: row.proposalNumber || "",
      company: row.company,
      seller: row.seller,
      serviceScope: row.serviceScope || "-",
      probability: row.probabilityLevel || "Sem definicao",
      expectedCloseDate: row.expectedCloseDate
        ? new Date(row.expectedCloseDate).toLocaleDateString("pt-BR")
        : "-",
      value: row.proposalValue
        ? Number(row.proposalValue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
        : "-",
      margin: row.bdi !== null && row.bdi !== undefined
        ? `${Number(row.bdi).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`
        : "-"
    }));

  return {
    metrics: [
      { label: "Solicitações abertas", value: openItems.length, tone: "info", note: "Carteira atual" },
      { label: "No prazo", value: countByStatus("No prazo"), tone: "ok", note: "Dentro do SLA" },
      { label: "Em risco", value: countByStatus("Em risco"), tone: "warn", note: "Atencao imediata" },
      { label: "Vencidas", value: countByStatus("Vencido"), tone: "danger", note: "Fora do SLA" },
      { label: "Propostas aceitas", value: acceptedCountResult.rows[0].total, tone: "info", note: "Etapa comercial" },
      { label: "Contratos assinados", value: signedCountResult.rows[0].total, tone: "ok", note: "Fechamento real" }
    ],
    funnel,
    urgent,
    salesFunnel: {
      metrics: [
        { label: "Pipeline ativo", value: salesPipelineRows.length, tone: "info", note: "Oportunidades em andamento" },
        { label: "Alta probabilidade", value: highProbabilityCount, tone: "warn", note: "Mais proximas de fechar" },
        { label: "Fechamento no mes", value: closingThisMonthCount, tone: "ok", note: "Previsao comercial" },
        { label: "Volume pipeline", value: Number(pipelineValue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), tone: "info", note: "Valor em carteira" },
        { label: "Propostas ganhas", value: wonCount, tone: "ok", note: "Contratos assinados" },
        { label: "Volume ganho", value: Number(wonValue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), tone: "ok", note: "Receita fechada" }
      ],
      byProbability,
      bySeller,
      byMonthEntries,
      byMonthWins,
      byStage,
      closingSoon,
      lossByReason,
      cancelByReason,
      ticketBySeller,
      conversionBySeller
    }
  };
}

function attachmentLabel(type) {
  const labels = {
    anexo_inicial: "Anexo inicial",
    documento_tecnico_cliente: "Documento tecnico do cliente",
    proposta_final_pdf: "PDF da proposta",
    anexo_proposta_complementar: "Arquivo complementar da proposta",
    planilha_aberta_proposta: "Planilha aberta",
    proposta_tecnica: "Proposta tecnica",
    anexo_aceite: "Anexo do aceite",
    minuta_inicial: "Minuta inicial",
    contrato_assinado: "Contrato assinado"
  };

  return labels[type] || type;
}

async function listRequestAttachments(requestId) {
  const result = await query(
    `SELECT
       id,
       attachment_type AS "attachmentType",
       file_name AS "fileName",
       mime_type AS "mimeType",
       storage_path AS "storagePath",
       description,
       TO_CHAR(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS "createdAt"
     FROM attachments
     WHERE request_id = $1
     ORDER BY created_at DESC, id DESC`,
    [requestId]
  );

  return result.rows.map((row) => ({
    ...row,
    attachmentLabel: attachmentLabel(row.attachmentType)
  }));
}

async function assertRequestAccess(requestId, session) {
  if (hasPermission(session, "readAllRequests")) return;
  if (!session.email) {
    throw new Error("Usuario vendedor sem identificacao.");
  }

  const result = await query(
    `SELECT seller_user.email AS "sellerEmail"
     FROM requests r
     JOIN users seller_user ON seller_user.id = r.seller_user_id
     WHERE r.id = $1`,
    [requestId]
  );

  if (!result.rows[0]) {
    throw new Error("Solicitacao nao encontrada.");
  }

  if (String(result.rows[0].sellerEmail || "").toLowerCase() !== session.email) {
    throw new Error("Acesso negado a esta solicitacao.");
  }
}

async function assertRequestAccessByClient(client, requestId, session) {
  if (hasPermission(session, "readAllRequests")) return;
  if (!session.email) {
    throw new Error("Usuario vendedor sem identificacao.");
  }

  const result = await client.query(
    `SELECT seller_user.email AS "sellerEmail"
     FROM requests r
     JOIN users seller_user ON seller_user.id = r.seller_user_id
     WHERE r.id = $1`,
    [requestId]
  );

  if (!result.rows[0]) {
    throw new Error("Solicitacao nao encontrada.");
  }

  if (String(result.rows[0].sellerEmail || "").toLowerCase() !== session.email) {
    throw new Error("Acesso negado a esta solicitacao.");
  }
}

async function getAttachmentById(attachmentId) {
  const result = await query(
    `SELECT id, request_id AS "requestId", file_name AS "fileName", storage_path AS "storagePath",
            mime_type AS "mimeType", attachment_type AS "attachmentType"
     FROM attachments
     WHERE id = $1`,
    [attachmentId]
  );

  return result.rows[0] || null;
}

async function saveProposalRecord(payload, session) {
  return withTransaction(async (client) => {
    const requestId = Number(payload.requestId);
    if (!Number.isFinite(requestId)) {
      throw new Error("Solicitacao invalida para triagem.");
    }

    if (!payload.nextStageCode) {
      throw new Error("Etapa de destino nao informada.");
    }

    const triageOwnerId = payload.triageOwnerEmail
      ? await ensureUser(client, payload.triageOwnerName, payload.triageOwnerEmail)
      : null;

    const proposalOwnerId = payload.proposalOwnerEmail
      ? await ensureUser(client, payload.proposalOwnerName || payload.proposalOwnerEmail, payload.proposalOwnerEmail)
      : null;
    const nextStageId = await getStageId(client, payload.nextStageCode);

    const requestResult = await client.query(
      `SELECT
         r.request_number,
         r.current_stage_id,
         r.current_owner_user_id,
         r.seller_user_id,
         ws.code AS current_stage_code,
         linked_proposal.id AS "proposalRegistryId",
         linked_proposal.proposal_number_display AS "proposalNumber"
       FROM requests r
       JOIN workflow_stages ws ON ws.id = r.current_stage_id
       LEFT JOIN LATERAL (
         SELECT id, proposal_number_display
         FROM proposal_registry
         WHERE request_id = r.id
         ORDER BY id DESC
         LIMIT 1
       ) linked_proposal ON TRUE
       WHERE r.id = $1`,
      [requestId]
    );

    if (!requestResult.rows[0]) {
      throw new Error("Solicitacao nao encontrada para triagem.");
    }

    const currentStageId = requestResult.rows[0].current_stage_id;
    const currentStageCode = requestResult.rows[0].current_stage_code;
    let linkedProposalRegistryId = requestResult.rows[0].proposalRegistryId || null;
    let linkedProposalNumber = requestResult.rows[0].proposalNumber || null;
    const nextOwnerId = payload.nextStageCode === "enviada_ao_vendedor"
      ? requestResult.rows[0].seller_user_id
      : (proposalOwnerId || triageOwnerId || requestResult.rows[0].current_owner_user_id);
    const stageChanged = Number(nextStageId) !== Number(currentStageId);
    assertStageAccess(session, currentStageCode, "Seu usuário não tem acesso à etapa atual da proposta.");
    assertStageAccess(session, payload.nextStageCode, "Seu usuário não pode mover para a etapa informada.");
    const allowedTransitions = {
      em_triagem: ["em_triagem", "aguardando_informacoes", "em_preparacao_da_proposta"],
      aguardando_informacoes: ["aguardando_informacoes", "em_triagem", "em_preparacao_da_proposta"],
      em_preparacao_da_proposta: ["em_preparacao_da_proposta", "aguardando_informacoes", "proposta_finalizada"],
      proposta_finalizada: ["proposta_finalizada", "enviada_ao_vendedor"]
    };

    if (allowedTransitions[currentStageCode] && !allowedTransitions[currentStageCode].includes(payload.nextStageCode)) {
      throw new Error("Fluxo invalido para a etapa atual da proposta.");
    }

    const existing = await client.query(
      "SELECT id, final_pdf_attachment_id FROM proposal_records WHERE request_id = $1",
      [requestId]
    );

    if ((payload.nextStageCode === "proposta_finalizada" || payload.nextStageCode === "enviada_ao_vendedor") && !linkedProposalRegistryId) {
      const generatedProposal = await createProposalNumberRecord(client, {
        requestId,
        issueDate: payload.expectedCompletionDate || getSaoPauloIsoDate(),
        managerName: payload.proposalOwnerName || payload.triageOwnerName || session?.name || null,
        clientName: null,
        documentType: "PROPOSTA",
        branchName: null,
        leadSource: null,
        status: mapProposalStageCodeToStatus(payload.nextStageCode, "Proposta finalizada"),
        serviceScope: await getRequestServiceScope(client, requestId),
        contactName: null,
        phone: null,
        industrySegment: null,
        proposalValue: null,
        bdi: null,
        serviceLines: [],
        notes: payload.internalNotes || payload.triageNote || "Numero gerado automaticamente na finalizacao da proposta.",
        uploadedFile: null
      }, session);
      linkedProposalRegistryId = generatedProposal.id;
      linkedProposalNumber = generatedProposal.proposalNumberDisplay;
    }

    const finalPdfAttachmentIds = await createAttachmentRecords(client, {
      requestId,
      uploadedByUserId: triageOwnerId || proposalOwnerId,
      attachmentType: "proposta_final_pdf",
      files: payload.proposalFinalPdfFiles || [],
      description: "Arquivo final da proposta"
    });
    const finalPdfAttachmentId = finalPdfAttachmentIds[0] || await createAttachmentRecord(client, {
      requestId,
      uploadedByUserId: triageOwnerId || proposalOwnerId,
      attachmentType: "proposta_final_pdf",
      file: payload.proposalFinalPdf,
      description: "Arquivo final da proposta"
    });
    const hasExistingFinalPdf = Boolean(existing.rows[0]?.final_pdf_attachment_id);
    const hasNewFinalPdf = Boolean(finalPdfAttachmentId);

    if (payload.nextStageCode === "enviada_ao_vendedor" && !hasExistingFinalPdf && !hasNewFinalPdf) {
      throw new Error("Anexe pelo menos um arquivo da proposta final em PDF antes de enviar para Recebimento de Proposta.");
    }
    await createAttachmentRecords(client, {
      requestId,
      uploadedByUserId: triageOwnerId || proposalOwnerId,
      attachmentType: "anexo_proposta_complementar",
      files: payload.proposalSupportingFiles,
      description: "Arquivo complementar da proposta"
    });
    await createAttachmentRecord(client, {
      requestId,
      uploadedByUserId: triageOwnerId || proposalOwnerId,
      attachmentType: "planilha_aberta_proposta",
      file: payload.proposalOpenSpreadsheet,
      description: "Planilha aberta da proposta"
    });
    await createAttachmentRecord(client, {
      requestId,
      uploadedByUserId: triageOwnerId || proposalOwnerId,
      attachmentType: "proposta_tecnica",
      file: payload.proposalTechnicalFile,
      description: "Proposta tecnica"
    });

    if (existing.rows[0]) {
      await client.query(
        `UPDATE proposal_records
         SET triage_owner_user_id = $2,
             proposal_owner_user_id = $3,
             triage_status = $4,
             triage_note = $5,
             internal_notes = $6,
             commercial_assumptions = $7,
             operational_assumptions = $8,
             expected_completion_date = $9,
             proposal_version = $10,
             final_pdf_attachment_id = COALESCE($11, final_pdf_attachment_id),
             updated_at = NOW()
         WHERE request_id = $1`,
        [
          requestId,
          triageOwnerId,
          proposalOwnerId,
          payload.triageStatus || null,
          payload.triageNote || null,
          payload.internalNotes || null,
          payload.commercialAssumptions || null,
          payload.operationalAssumptions || null,
          payload.expectedCompletionDate || null,
          payload.proposalVersion || null,
          finalPdfAttachmentId
        ]
      );
    } else {
      await client.query(
        `INSERT INTO proposal_records (
          request_id, triage_owner_user_id, proposal_owner_user_id, triage_status, triage_note,
          internal_notes, commercial_assumptions, operational_assumptions,
          expected_completion_date, proposal_version, final_pdf_attachment_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          requestId,
          triageOwnerId,
          proposalOwnerId,
          payload.triageStatus || null,
          payload.triageNote || null,
          payload.internalNotes || null,
          payload.commercialAssumptions || null,
          payload.operationalAssumptions || null,
          payload.expectedCompletionDate || null,
          payload.proposalVersion || null,
          finalPdfAttachmentId
        ]
      );
    }

    if (linkedProposalRegistryId) {
      await client.query(
        `UPDATE proposal_registry
         SET manager_name = COALESCE($2, manager_name),
             negotiation_status = $3,
             updated_at = NOW()
         WHERE id = $1`,
        [
          linkedProposalRegistryId,
          payload.proposalOwnerName || payload.triageOwnerName || null,
          mapProposalStageCodeToStatus(payload.nextStageCode, "Proposta finalizada")
        ]
      );
    }

    await client.query(
      `UPDATE requests
       SET current_stage_id = $2,
           current_owner_user_id = $3,
           updated_at = NOW()
       WHERE id = $1`,
      [requestId, nextStageId, nextOwnerId]
    );

    if (payload.pendingReason) {
      const pendingOwnerId = payload.pendingOwnerEmail
        ? await ensureUser(
            client,
            payload.pendingOwnerName || payload.pendingOwnerEmail,
            payload.pendingOwnerEmail
          )
        : null;

      await client.query(
        `INSERT INTO request_pending_info (
          request_id, requested_by_user_id, responsible_user_id, pending_reason,
          pending_description, due_date
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          requestId,
          triageOwnerId,
          pendingOwnerId,
          payload.pendingReason,
          payload.pendingDescription || null,
          payload.pendingDueDate || null
        ]
      );
    }

    await client.query(
      `INSERT INTO request_stage_history (
        request_id, from_stage_id, to_stage_id, changed_by_user_id,
        owner_user_id, entered_at, sla_deadline_at, sla_status, note
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6, $7)`,
      [
        requestId,
        currentStageId,
        nextStageId,
        triageOwnerId,
        nextOwnerId,
        "ok",
        payload.triageNote || "Triagem atualizada."
      ]
    );

    if (stageChanged) {
      const notificationRecipients = await collectRequestNotificationRecipientIds(client, requestId, [
        triageOwnerId,
        proposalOwnerId,
        nextOwnerId,
        requestResult.rows[0].seller_user_id
      ]);
      await createStatusChangeNotifications(client, {
        recipientUserIds: notificationRecipients,
        actor: {
          userId: session?.userId || triageOwnerId,
          name: session?.name || payload.triageOwnerName,
          email: session?.email || payload.triageOwnerEmail
        },
        requestId,
        proposalRegistryId: linkedProposalRegistryId,
        fromStageCode: currentStageCode,
        toStageCode: payload.nextStageCode,
        requestNumber: requestResult.rows[0].request_number,
        proposalNumber: linkedProposalNumber,
        company: payload.clientName || null,
        note: payload.triageNote || "Triagem atualizada."
      });
    }

    await logAuditEntry(client, {
      actor: {
        userId: session?.userId || triageOwnerId,
        name: session?.name || payload.triageOwnerName,
        email: session?.email || payload.triageOwnerEmail,
        role: session?.role || "propostas"
      },
      actionType: "proposal_stage_updated",
      entityType: "request",
      entityId: requestId,
      requestId,
      description: `Triagem/proposta movida para ${payload.nextStageCode}.`,
      metadata: {
        fromStageId: currentStageId,
        toStageId: nextStageId,
        triageStatus: payload.triageStatus || null,
        proposalVersion: payload.proposalVersion || null
      }
    });

    return { requestId };
  });
}

async function saveCommercialRecord(payload, session) {
  return withTransaction(async (client) => {
    const requestId = parsePositiveInteger(payload.requestId);
    const proposalRegistryId = parsePositiveInteger(payload.proposalRegistryId);
    const hasValidRequestId = Number.isInteger(requestId);
    const hasValidProposalRegistryId = Number.isInteger(proposalRegistryId);

    if (!payload.nextStageCode) {
      throw new Error("Etapa de destino nao informada.");
    }

    if (payload.nextStageCode === "perdida" && !payload.lossReason) {
      throw new Error("Informe o motivo padronizado da perda.");
    }

    if (payload.nextStageCode === "cancelada" && !payload.cancelReason) {
      throw new Error("Informe o motivo padronizado do cancelamento.");
    }

    if (!hasValidRequestId && !hasValidProposalRegistryId) {
      throw new Error("Solicitacao invalida para negociacao.");
    }

    const sellerUserId = await ensureUser(client, payload.sellerName, payload.sellerEmail);

    let requestExists = false;
    if (hasValidRequestId) {
      const requestExistsResult = await client.query(
        "SELECT 1 FROM requests WHERE id = $1",
        [requestId]
      );
      requestExists = Boolean(requestExistsResult.rows[0]);
    }

	    if (hasValidProposalRegistryId && !requestExists) {
	      await assertProposalRegistryAccessBySession(client, proposalRegistryId, session);
	      const proposalStageResult = await client.query(
	        `SELECT
	           ${buildProposalStageCodeSql("pr")} AS current_stage_code,
	           pr.proposal_number_display AS "proposalNumber",
	           pr.client_name AS "clientName",
             pr.proposal_value AS "proposalValue",
             pr.bdi AS "bdi"
	         FROM proposal_registry pr
	         WHERE pr.id = $1`,
	        [proposalRegistryId]
	      );
	      const currentStageCode = proposalStageResult.rows[0]?.current_stage_code || "em_negociacao";
      const revisedProposalValue = toNullableNumber(payload.revisedProposalValue);
      const revisedBdi = toNullableNumber(payload.revisedBdi);
      const resolvedProposalValue = revisedProposalValue !== null
        ? revisedProposalValue
        : toNullableNumber(proposalStageResult.rows[0]?.proposalValue);
      const resolvedBdi = revisedBdi !== null
        ? revisedBdi
        : toNullableNumber(proposalStageResult.rows[0]?.bdi);
      assertStageAccess(session, currentStageCode, "Seu usuário não tem acesso à etapa atual da negociação.");
      assertStageAccess(session, payload.nextStageCode, "Seu usuário não pode mover para a etapa informada.");
      const allowedTransitions = {
        enviada_ao_vendedor: ["enviada_ao_vendedor", "em_negociacao", "proposta_aceita", "perdida", "cancelada"],
        em_negociacao: ["em_negociacao", "proposta_aceita", "perdida", "cancelada"],
        proposta_aceita: ["proposta_aceita", "em_negociacao"],
        perdida: ["perdida", "em_negociacao"],
        cancelada: ["cancelada", "em_negociacao"]
      };
      if (allowedTransitions[currentStageCode] && !allowedTransitions[currentStageCode].includes(payload.nextStageCode)) {
        throw new Error("Fluxo invalido para a etapa atual da negociacao.");
      }
      await client.query(
         `UPDATE proposal_registry
         SET manager_name = $2,
              negotiation_status = $3,
              notes = $4,
              probability_level = $5,
              probability_reason = $6,
              next_action = $7,
              expected_close_date = $8::date,
              last_contact_at = $9::timestamptz,
              sent_to_seller_at = $10::timestamptz,
              seller_receipt_confirmed = $11,
              requested_adjustments = $12,
              seller_user_id = $13,
              accepted_at = $14::timestamptz,
              accepted_scope = $15,
              accepted_conditions = $16,
              accepted_note = $17,
              proposal_value = COALESCE($18, proposal_value),
              bdi = COALESCE($19, bdi),
              updated_at = NOW()
          WHERE id = $1`,
        [
          proposalRegistryId,
          payload.sellerName || null,
          mapProposalStageCodeToStatus(payload.nextStageCode, payload.negotiationStatus || null),
          payload.commercialNotes || null,
          payload.probabilityLevel || null,
          payload.probabilityReason || null,
          payload.nextAction || null,
          payload.expectedCloseDate || null,
          payload.lastContactAt || null,
          payload.sentToSellerAt || null,
          payload.sellerReceiptConfirmed === "true",
          payload.requestedAdjustments || null,
          sellerUserId,
          payload.acceptedAt || null,
          payload.acceptedScope || null,
          payload.acceptedConditions || null,
          payload.acceptedNote || null,
          resolvedProposalValue,
          resolvedBdi
        ]
      );

      await createNegotiationDiaryEntry(client, payload, session, {
        proposalRegistryId,
        actorUserId: sellerUserId,
        stageCode: payload.nextStageCode || currentStageCode
      });

      await createNegotiationValueHistoryEntry(client, {
        proposalValue: revisedProposalValue,
        bdi: revisedBdi,
        notes: payload.negotiationSummary || payload.commercialNotes || payload.nextAction || null
      }, session, {
        proposalRegistryId,
        actorUserId: sellerUserId,
        stageCode: payload.nextStageCode || currentStageCode,
        entryType: "revisao_negociacao"
      });

	      await logAuditEntry(client, {
        actor: {
          userId: session?.userId || sellerUserId,
          name: session?.name || payload.sellerName,
          email: session?.email || payload.sellerEmail,
          role: session?.role || "vendedor"
        },
        actionType: "proposal_only_negotiation_updated",
        entityType: "proposal_registry",
        entityId: proposalRegistryId,
        description: `Negociacao da proposta ${proposalRegistryId} atualizada sem requisicao CRM.`,
        metadata: {
          negotiationStatus: payload.negotiationStatus || null,
          probabilityLevel: payload.probabilityLevel || null
        }
	      });

	      await createStatusChangeNotifications(client, {
	        recipientUserIds: await collectProposalNotificationRecipientIds(client, proposalRegistryId, [sellerUserId]),
	        actor: {
	          userId: session?.userId || sellerUserId,
	          name: session?.name || payload.sellerName,
	          email: session?.email || payload.sellerEmail
	        },
	        proposalRegistryId,
	        fromStageCode: currentStageCode,
	        toStageCode: payload.nextStageCode,
	        proposalNumber: proposalStageResult.rows[0]?.proposalNumber || null,
	        company: proposalStageResult.rows[0]?.clientName || null,
	        note: payload.nextAction || payload.acceptedNote || payload.commercialNotes || "Negociacao atualizada."
	      });

	      return { proposalRegistryId };
	    }

    if (!requestExists) {
      throw new Error("Solicitacao nao encontrada para negociacao.");
    }

    await assertRequestAccessByClient(client, requestId, session);

    const nextStageId = await getStageId(client, payload.nextStageCode);
    const lostReasonId = await getReasonId(client, "loss_reasons", payload.lossReason);
    const cancelReasonId = await getReasonId(client, "cancel_reasons", payload.cancelReason);

	    const requestResult = await client.query(
	      `SELECT
	         r.request_number,
	         r.current_stage_id,
	         r.current_owner_user_id,
           r.seller_user_id,
	         ws.code AS current_stage_code,
         linked_proposal.id AS "proposalRegistryId",
         linked_proposal.proposal_value AS "proposalValue",
         linked_proposal.bdi AS "proposalBdi"
       FROM requests r
       JOIN workflow_stages ws ON ws.id = r.current_stage_id
       LEFT JOIN LATERAL (
         SELECT id, proposal_value, bdi
         FROM proposal_registry
         WHERE request_id = r.id
         ORDER BY id DESC
         LIMIT 1
       ) linked_proposal ON TRUE
       WHERE r.id = $1`,
      [requestId]
    );

    const currentStageId = requestResult.rows[0].current_stage_id;
    const currentStageCode = requestResult.rows[0].current_stage_code;
    const linkedProposalRegistryId = requestResult.rows[0].proposalRegistryId || null;
    const revisedProposalValue = toNullableNumber(payload.revisedProposalValue);
    const revisedBdi = toNullableNumber(payload.revisedBdi);
    assertStageAccess(session, currentStageCode, "Seu usuário não tem acesso à etapa atual da negociação.");
    assertStageAccess(session, payload.nextStageCode, "Seu usuário não pode mover para a etapa informada.");
    const allowedTransitions = {
      enviada_ao_vendedor: ["enviada_ao_vendedor", "em_negociacao", "proposta_aceita", "perdida", "cancelada", "em_triagem"],
      em_negociacao: ["em_negociacao", "proposta_aceita", "perdida", "cancelada", "em_triagem"],
      proposta_aceita: ["proposta_aceita", "em_negociacao", "em_triagem"],
      perdida: ["perdida", "em_negociacao", "em_triagem"],
      cancelada: ["cancelada", "em_negociacao", "em_triagem"]
    };
    if (allowedTransitions[currentStageCode] && !allowedTransitions[currentStageCode].includes(payload.nextStageCode)) {
      throw new Error("Fluxo invalido para a etapa atual da negociacao.");
    }

    if (stageRequiresProposalRegistry(payload.nextStageCode) && !linkedProposalRegistryId) {
      throw new Error("Gere e vincule o numero da proposta antes de enviar a solicitacao para recebimento ou negociacao.");
    }

    const existing = await client.query(
      "SELECT id FROM commercial_records WHERE request_id = $1",
      [requestId]
    );

    const commercialValues = [
      requestId,
      sellerUserId,
      payload.sentToSellerAt || null,
      payload.sellerReceiptConfirmed === "true",
      payload.negotiationStatus || null,
      payload.lastContactAt || null,
      payload.nextAction || null,
      payload.expectedCloseDate || null,
      payload.commercialNotes || null,
      payload.requestedAdjustments || null,
      payload.acceptedAt || null,
      payload.acceptedScope || null,
      payload.acceptedConditions || null,
      payload.acceptedNote || null,
      payload.probabilityLevel || null,
      payload.probabilityReason || null
    ];
    const acceptanceAttachmentId = await createAttachmentRecord(client, {
      requestId,
      uploadedByUserId: sellerUserId,
      attachmentType: "anexo_aceite",
      file: payload.acceptanceAttachment,
      description: "Anexo do aceite comercial"
    });

    if (existing.rows[0]) {
      await client.query(
        `UPDATE commercial_records
         SET seller_user_id = $2,
             sent_to_seller_at = $3::timestamptz,
             seller_receipt_confirmed = $4,
             negotiation_status = $5::varchar,
             last_contact_at = $6::timestamptz,
             next_action = $7,
             expected_close_date = $8::date,
             commercial_notes = $9,
             requested_adjustments = $10,
             accepted_at = $11::timestamptz,
             accepted_scope = $12,
             accepted_conditions = $13,
             accepted_note = $14,
             probability_level = $15,
             probability_reason = $16,
             acceptance_attachment_id = COALESCE($17, acceptance_attachment_id),
             lost_at = CASE WHEN $5::varchar = 'Perdida' THEN NOW() ELSE NULL END,
             cancelled_at = CASE WHEN $5::varchar = 'Cancelada' THEN NOW() ELSE NULL END,
             updated_at = NOW()
         WHERE request_id = $1`,
        [...commercialValues, acceptanceAttachmentId]
      );
    } else {
      await client.query(
        `INSERT INTO commercial_records (
          request_id, seller_user_id, sent_to_seller_at, seller_receipt_confirmed, negotiation_status,
          last_contact_at, next_action, expected_close_date, commercial_notes, requested_adjustments,
          accepted_at, accepted_scope, accepted_conditions, accepted_note, probability_level, probability_reason,
          acceptance_attachment_id, lost_at, cancelled_at
        ) VALUES (
          $1, $2, $3::timestamptz, $4, $5::varchar,
          $6::timestamptz, $7, $8::date, $9, $10,
          $11::timestamptz, $12, $13, $14, $15, $16, $17,
          CASE WHEN $5::varchar = 'Perdida' THEN NOW() ELSE NULL END,
          CASE WHEN $5::varchar = 'Cancelada' THEN NOW() ELSE NULL END
        )`,
        [...commercialValues, acceptanceAttachmentId]
      );
    }

    if (linkedProposalRegistryId) {
      await client.query(
        `UPDATE proposal_registry
         SET manager_name = COALESCE($2, manager_name),
             negotiation_status = $3,
             notes = $4,
             probability_level = $5,
             probability_reason = $6,
             next_action = $7,
             expected_close_date = $8::date,
             last_contact_at = $9::timestamptz,
             sent_to_seller_at = $10::timestamptz,
             seller_receipt_confirmed = $11,
             requested_adjustments = $12,
             seller_user_id = $13,
             accepted_at = $14::timestamptz,
             accepted_scope = $15,
             accepted_conditions = $16,
             accepted_note = $17,
             proposal_value = COALESCE($18, proposal_value),
             bdi = COALESCE($19, bdi),
             updated_at = NOW()
         WHERE id = $1`,
        [
          linkedProposalRegistryId,
          payload.sellerName || null,
          mapProposalStageCodeToStatus(payload.nextStageCode, payload.negotiationStatus || null),
          payload.commercialNotes || null,
          payload.probabilityLevel || null,
          payload.probabilityReason || null,
          payload.nextAction || null,
          payload.expectedCloseDate || null,
          payload.lastContactAt || null,
          payload.sentToSellerAt || null,
          payload.sellerReceiptConfirmed === "true",
          payload.requestedAdjustments || null,
          sellerUserId,
          payload.acceptedAt || null,
          payload.acceptedScope || null,
          payload.acceptedConditions || null,
          payload.acceptedNote || null,
          revisedProposalValue !== null ? revisedProposalValue : toNullableNumber(requestResult.rows[0].proposalValue),
          revisedBdi !== null ? revisedBdi : toNullableNumber(requestResult.rows[0].proposalBdi)
        ]
      );
    }

    const triageOwnerResult = await client.query(
      `SELECT triage_owner_user_id
       FROM proposal_records
       WHERE request_id = $1
       LIMIT 1`,
      [requestId]
    );
    const triageOwnerId = triageOwnerResult.rows[0]?.triage_owner_user_id || null;
    const nextOwnerId = payload.nextStageCode === "em_triagem"
      ? (triageOwnerId || requestResult.rows[0].current_owner_user_id || requestResult.rows[0].seller_user_id)
      : sellerUserId;
    const stageChanged = Number(nextStageId) !== Number(currentStageId);

    await client.query(
      `UPDATE requests
       SET current_stage_id = CASE WHEN $7 THEN $2 ELSE current_stage_id END,
           current_owner_user_id = CASE WHEN $7 THEN $3 ELSE current_owner_user_id END,
           updated_at = NOW(),
           lost_reason_id = CASE WHEN $4 = 'perdida' THEN $5 ELSE lost_reason_id END,
           cancel_reason_id = CASE WHEN $4 = 'cancelada' THEN $6 ELSE cancel_reason_id END,
           status_final = CASE
             WHEN $4 = 'perdida' THEN 'Perdida'
             WHEN $4 = 'cancelada' THEN 'Cancelada'
             WHEN $4 IN ('em_triagem', 'enviada_ao_vendedor', 'em_negociacao', 'proposta_aceita') THEN NULL
             ELSE status_final
           END,
           closed_at = CASE
              WHEN $4 IN ('perdida', 'cancelada') THEN NOW()
              WHEN $4 IN ('em_triagem', 'em_negociacao', 'proposta_aceita', 'enviada_ao_vendedor') THEN NULL
              ELSE closed_at
           END
       WHERE id = $1`,
      [requestId, nextStageId, nextOwnerId, payload.nextStageCode, lostReasonId, cancelReasonId, stageChanged]
    );

    if (stageChanged) {
      await client.query(
        `INSERT INTO request_stage_history (
          request_id, from_stage_id, to_stage_id, changed_by_user_id,
          owner_user_id, entered_at, sla_deadline_at, sla_status, note
        )
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6, $7)`,
        [
          requestId,
          currentStageId,
          nextStageId,
          sellerUserId,
          nextOwnerId,
          "ok",
          payload.nextAction || payload.acceptedNote || payload.commercialNotes || "Negociacao atualizada."
        ]
      );

      await createStatusChangeNotifications(client, {
        recipientUserIds: await collectRequestNotificationRecipientIds(client, requestId, [sellerUserId]),
        actor: {
          userId: session?.userId || sellerUserId,
          name: session?.name || payload.sellerName,
          email: session?.email || payload.sellerEmail
        },
        requestId,
        proposalRegistryId: linkedProposalRegistryId,
        fromStageCode: currentStageCode,
        toStageCode: payload.nextStageCode,
        requestNumber: requestResult.rows[0].request_number,
        company: payload.clientName || null,
        note: payload.nextAction || payload.acceptedNote || payload.commercialNotes || "Negociacao atualizada."
      });
    }

    await createNegotiationDiaryEntry(client, payload, session, {
      requestId,
      proposalRegistryId: linkedProposalRegistryId,
      actorUserId: sellerUserId,
      stageCode: payload.nextStageCode || currentStageCode
    });

    await createNegotiationValueHistoryEntry(client, {
      proposalValue: revisedProposalValue,
      bdi: revisedBdi,
      notes: payload.negotiationSummary || payload.commercialNotes || payload.nextAction || null
    }, session, {
      requestId,
      proposalRegistryId: linkedProposalRegistryId,
      actorUserId: sellerUserId,
      stageCode: payload.nextStageCode || currentStageCode,
      entryType: "revisao_negociacao"
    });

    await logAuditEntry(client, {
      actor: {
        userId: session?.userId || sellerUserId,
        name: session?.name || payload.sellerName,
        email: session?.email || payload.sellerEmail,
        role: session?.role || "vendedor"
      },
      actionType: "commercial_stage_updated",
      entityType: "request",
      entityId: requestId,
      requestId,
      description: `Negociacao movida para ${payload.nextStageCode}.`,
      metadata: {
        fromStageId: currentStageId,
        toStageId: nextStageId,
        negotiationStatus: payload.negotiationStatus || null,
        probabilityLevel: payload.probabilityLevel || null,
        lossReason: payload.lossReason || null,
        cancelReason: payload.cancelReason || null
      }
    });

    return { requestId };
  });
}

async function saveContractRecord(payload, session) {
  return withTransaction(async (client) => {
    const requestId = parsePositiveInteger(payload.requestId);
    const proposalRegistryId = parsePositiveInteger(payload.proposalRegistryId);
    const hasValidRequestId = Number.isInteger(requestId);
    const hasValidProposalRegistryId = Number.isInteger(proposalRegistryId);
    if (!hasValidRequestId && !hasValidProposalRegistryId) {
      throw new Error("Solicitacao invalida para contratual.");
    }

    if (!payload.nextStageCode) {
      throw new Error("Etapa de destino nao informada.");
    }

    const contractOwnerId = await ensureUser(client, payload.contractOwnerName, payload.contractOwnerEmail);

	    if (hasValidProposalRegistryId && !hasValidRequestId) {
	      await assertProposalRegistryAccessBySession(client, proposalRegistryId, session);
	      const proposalStageResult = await client.query(
	        `SELECT
	           ${buildProposalStageCodeSql("pr")} AS current_stage_code,
	           pr.proposal_number_display AS "proposalNumber",
	           pr.client_name AS "clientName"
	         FROM proposal_registry pr
	         WHERE pr.id = $1`,
	        [proposalRegistryId]
	      );
	      const currentStageCode = proposalStageResult.rows[0]?.current_stage_code || "elaboracao_de_contrato";
	      const stageChanged = String(currentStageCode) !== String(payload.nextStageCode);
      assertStageAccess(session, currentStageCode, "Seu usuário não tem acesso à etapa atual do contratual.");
      assertStageAccess(session, payload.nextStageCode, "Seu usuário não pode mover para a etapa informada.");
      const allowedTransitions = {
        proposta_aceita: ["elaboracao_de_contrato"],
        elaboracao_de_contrato: ["elaboracao_de_contrato", "negociacao_de_clausulas"],
        negociacao_de_clausulas: ["elaboracao_de_contrato", "negociacao_de_clausulas", "contrato_assinado"],
        contrato_assinado: ["contrato_assinado"]
      };
      if (allowedTransitions[currentStageCode] && !allowedTransitions[currentStageCode].includes(payload.nextStageCode)) {
        throw new Error("Fluxo invalido para a etapa atual do contratual.");
      }
      await client.query(
        `UPDATE proposal_registry
         SET manager_name = COALESCE($2, manager_name),
             negotiation_status = $3,
             contract_started_at = $4::timestamptz,
             draft_version = $5,
             clause_round_date = $6::timestamptz,
             notes = COALESCE($7, notes),
             document_pending_notes = $8,
             operation_start_date = $9::date,
             updated_at = NOW()
         WHERE id = $1`,
        [
          proposalRegistryId,
          payload.contractOwnerName || null,
          mapProposalStageCodeToStatus(payload.nextStageCode, null),
          payload.contractStartedAt || null,
          payload.draftVersion || null,
          payload.clauseRoundDate || null,
          payload.contractNotes || null,
          payload.documentPendingNotes || null,
          payload.operationStartDate || null
        ]
      );

	      await logAuditEntry(client, {
        actor: {
          userId: session?.userId || contractOwnerId,
          name: session?.name || payload.contractOwnerName,
          email: session?.email || payload.contractOwnerEmail,
          role: session?.role || "juridico"
        },
        actionType: "proposal_only_contract_updated",
        entityType: "proposal_registry",
        entityId: proposalRegistryId,
        description: `Contratual da proposta ${proposalRegistryId} movido para ${payload.nextStageCode}.`,
        metadata: {
          nextStageCode: payload.nextStageCode || null,
          draftVersion: payload.draftVersion || null
        }
	      });

	      if (stageChanged) {
	        await createStatusChangeNotifications(client, {
	          recipientUserIds: await collectProposalNotificationRecipientIds(client, proposalRegistryId, [contractOwnerId]),
	          actor: {
	            userId: session?.userId || contractOwnerId,
	            name: session?.name || payload.contractOwnerName,
	            email: session?.email || payload.contractOwnerEmail
	          },
	          proposalRegistryId,
	          fromStageCode: currentStageCode,
	          toStageCode: payload.nextStageCode,
	          proposalNumber: proposalStageResult.rows[0]?.proposalNumber || null,
	          company: proposalStageResult.rows[0]?.clientName || null,
	          note: payload.nextAction || payload.contractNotes || payload.documentPendingNotes || "Contratual atualizado."
	        });
	      }

	      return { proposalRegistryId };
	    }

    const requestResult = await client.query(
      `SELECT
         r.request_number,
         r.current_stage_id,
         ws.code AS current_stage_code,
         linked_proposal.id AS proposal_registry_id,
         ${buildProposalStageCodeSql("linked_proposal")} AS proposal_stage_code
       FROM requests r
       JOIN workflow_stages ws ON ws.id = r.current_stage_id
       LEFT JOIN LATERAL (
         SELECT *
         FROM proposal_registry
         WHERE request_id = r.id
         ORDER BY id DESC
         LIMIT 1
       ) linked_proposal ON TRUE
       WHERE r.id = $1`,
      [requestId]
    );

    if (!requestResult.rows[0]) {
      throw new Error("Solicitacao nao encontrada para contratual.");
    }

	    const currentStageId = requestResult.rows[0].current_stage_id;
	    const currentStageCode = requestResult.rows[0].proposal_stage_code || requestResult.rows[0].current_stage_code || "proposta_aceita";
	    const linkedProposalRegistryId = requestResult.rows[0].proposal_registry_id;
	    const nextStageId = await getStageId(client, payload.nextStageCode);
	    const stageChanged = String(currentStageCode) !== String(payload.nextStageCode);
	    assertStageAccess(session, currentStageCode, "Seu usuário não tem acesso à etapa atual do contratual.");
    assertStageAccess(session, payload.nextStageCode, "Seu usuário não pode mover para a etapa informada.");
    const allowedTransitions = {
      proposta_aceita: ["elaboracao_de_contrato"],
      elaboracao_de_contrato: ["elaboracao_de_contrato", "negociacao_de_clausulas"],
      negociacao_de_clausulas: ["elaboracao_de_contrato", "negociacao_de_clausulas", "contrato_assinado"],
      contrato_assinado: ["contrato_assinado"]
    };
    if (allowedTransitions[currentStageCode] && !allowedTransitions[currentStageCode].includes(payload.nextStageCode)) {
      throw new Error("Fluxo invalido para a etapa atual do contratual.");
    }

    if (stageRequiresProposalRegistry(payload.nextStageCode) && !linkedProposalRegistryId) {
      throw new Error("Gere e vincule o numero da proposta antes de iniciar o fluxo contratual.");
    }

    const values = [
      requestId,
      contractOwnerId,
      payload.contractStartedAt || null,
      payload.contractNotes || null,
      payload.documentPendingNotes || null,
      payload.clauseRoundDate || null,
      payload.draftVersion || null,
      payload.clausesUnderDiscussion || null,
      payload.legalNotes || null,
      payload.nextAction || null,
      payload.signedAt || null,
      payload.operationStartDate || null
    ];
    const initialDraftAttachmentId = await createAttachmentRecord(client, {
      requestId,
      uploadedByUserId: contractOwnerId,
      attachmentType: "minuta_inicial",
      file: payload.initialDraftFile,
      description: "Minuta inicial do contrato"
    });
    const signedContractAttachmentId = await createAttachmentRecord(client, {
      requestId,
      uploadedByUserId: contractOwnerId,
      attachmentType: "contrato_assinado",
      file: payload.signedContractFile,
      description: "Contrato assinado"
    });

    const existing = await client.query(
      "SELECT id FROM contract_records WHERE request_id = $1",
      [requestId]
    );

    if (existing.rows[0]) {
	    await client.query(
        `UPDATE contract_records
         SET contract_owner_user_id = $2,
             contract_started_at = $3::timestamptz,
             contract_notes = $4,
             document_pending_notes = $5,
             clause_round_date = $6::timestamptz,
             draft_version = $7,
             clauses_under_discussion = $8,
             legal_notes = $9,
             next_action = $10,
             signed_at = $11::timestamptz,
             operation_start_date = $12::date,
             initial_draft_attachment_id = COALESCE($13, initial_draft_attachment_id),
             signed_contract_attachment_id = COALESCE($14, signed_contract_attachment_id),
             updated_at = NOW()
         WHERE request_id = $1`,
        [...values, initialDraftAttachmentId, signedContractAttachmentId]
      );
    } else {
      await client.query(
        `INSERT INTO contract_records (
          request_id, contract_owner_user_id, contract_started_at, contract_notes,
          document_pending_notes, clause_round_date, draft_version,
          clauses_under_discussion, legal_notes, next_action, signed_at, operation_start_date,
          initial_draft_attachment_id, signed_contract_attachment_id
        ) VALUES (
          $1, $2, $3::timestamptz, $4,
          $5, $6::timestamptz, $7,
          $8, $9, $10, $11::timestamptz, $12::date, $13, $14
        )`,
        [...values, initialDraftAttachmentId, signedContractAttachmentId]
      );
    }

    if (linkedProposalRegistryId) {
      await client.query(
        `UPDATE proposal_registry
         SET manager_name = COALESCE($2, manager_name),
             negotiation_status = $3,
             contract_started_at = $4::timestamptz,
             draft_version = $5,
             clause_round_date = $6::timestamptz,
             notes = COALESCE($7, notes),
             document_pending_notes = $8,
             operation_start_date = $9::date,
             updated_at = NOW()
         WHERE id = $1`,
        [
          linkedProposalRegistryId,
          payload.contractOwnerName || null,
          mapProposalStageCodeToStatus(payload.nextStageCode, null),
          payload.contractStartedAt || null,
          payload.draftVersion || null,
          payload.clauseRoundDate || null,
          payload.contractNotes || null,
          payload.documentPendingNotes || null,
          payload.operationStartDate || null
        ]
      );
    }

    await client.query(
      `UPDATE requests
       SET current_stage_id = current_stage_id,
           current_owner_user_id = current_owner_user_id,
           updated_at = NOW(),
           status_final = CASE WHEN $4 = 'contrato_assinado' THEN 'Contrato assinado' ELSE status_final END,
           closed_at = CASE WHEN $4 = 'contrato_assinado' THEN NOW() ELSE closed_at END
       WHERE id = $1`,
	      [requestId, currentStageId, contractOwnerId, payload.nextStageCode]
	    );

	    if (stageChanged) {
	      await createStatusChangeNotifications(client, {
	        recipientUserIds: await collectRequestNotificationRecipientIds(client, requestId, [contractOwnerId]),
	        actor: {
	          userId: session?.userId || contractOwnerId,
	          name: session?.name || payload.contractOwnerName,
	          email: session?.email || payload.contractOwnerEmail
	        },
	        requestId,
	        proposalRegistryId: linkedProposalRegistryId || null,
	        fromStageCode: currentStageCode,
	        toStageCode: payload.nextStageCode,
	        requestNumber: requestResult.rows[0].request_number,
	        note: payload.nextAction || payload.contractNotes || payload.documentPendingNotes || "Contratual atualizado."
	      });
	    }

	    await logAuditEntry(client, {
      actor: {
        userId: session?.userId || contractOwnerId,
        name: session?.name || payload.contractOwnerName,
        email: session?.email || payload.contractOwnerEmail,
        role: session?.role || "juridico"
      },
      actionType: "contract_stage_updated",
      entityType: "request",
      entityId: requestId,
      requestId,
      description: `Contratual movido para ${payload.nextStageCode}.`,
      metadata: {
        fromStageId: currentStageId,
        toStageId: nextStageId,
        draftVersion: payload.draftVersion || null,
        signedAt: payload.signedAt || null
      }
    });

    return { requestId };
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const session = getSessionContext(request, url);

  try {
    if (request.method === "GET" && (url.pathname === "/health" || url.pathname === "/api/health")) {
      sendJson(response, 200, {
        status: "ok",
        environment: NODE_ENV,
        uptimeSeconds: Math.round(process.uptime()),
        uploadsDir: UPLOADS_DIR,
        baseUrl: APP_BASE_URL || null,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/login") {
      const body = await readBody(request);
      const payload = JSON.parse(body || "{}");
      const user = await authenticateUser(payload.email, payload.password);
      const token = createSession(user);
      await logAuditEntry(null, {
        actor: {
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.primaryRole
        },
        actionType: "auth_login",
        entityType: "session",
        entityId: user.id,
        targetUserId: user.id,
        description: `Login realizado por ${user.email}.`,
        metadata: {
          email: user.email,
          role: user.primaryRole
        }
      });
      sendJson(response, 200, { token, user });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/auth/me") {
      const user = await getCurrentUser(session);
      sendJson(response, 200, { user });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/notifications") {
      assertAuthenticated(session);
      const limit = parsePositiveInteger(url.searchParams.get("limit")) || 20;
      const payload = await listUserNotifications(session.userId, limit);
      sendJson(response, 200, payload);
      return;
    }

    if (request.method === "POST" && /^\/api\/notifications\/\d+\/read$/.test(url.pathname)) {
      assertAuthenticated(session);
      const notificationId = Number(url.pathname.split("/")[3]);
      await markUserNotificationAsRead(notificationId, session.userId);
      sendJson(response, 200, { message: "Notificacao marcada como lida." });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/notifications/read-all") {
      assertAuthenticated(session);
      await markAllUserNotificationsAsRead(session.userId);
      sendJson(response, 200, { message: "Todas as notificacoes foram marcadas como lidas." });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/logout") {
      if (session.authenticated) {
        await logAuditEntry(null, {
          actor: session,
          actionType: "auth_logout",
          entityType: "session",
          entityId: session.userId,
          targetUserId: session.userId,
          description: `Logout realizado por ${session.email || session.name || "usuario"}.`,
          metadata: {
            email: session.email || null
          }
        });
      }
      if (session.token) {
        sessions.delete(session.token);
      }
      sendJson(response, 200, { message: "Sessao encerrada." });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/change-password") {
      assertAuthenticated(session);
      const body = await readBody(request);
      const payload = JSON.parse(body || "{}");
      await changeOwnPassword(session, payload);
      sendJson(response, 200, { message: "Senha alterada com sucesso." });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/session/options") {
      assertAuthenticated(session);
      const users = await listSessionUsers();
      sendJson(response, 200, { users });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/lookups") {
      assertAuthenticated(session);
      const lookups = await getLookups(session);
      sendJson(response, 200, lookups);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/proposal-numbers") {
      assertAuthenticated(session);
      assertModuleAccess(session, "proposta", "Seu usuario nao tem acesso ao modulo proposta.");
      const items = await listProposalNumbers({
        search: url.searchParams.get("search"),
        manager: url.searchParams.get("manager"),
        status: url.searchParams.get("status"),
        branch: url.searchParams.get("branch"),
        stage: url.searchParams.get("stage")
      }, session);
      sendJson(response, 200, items);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/proposal-numbers/crm-requests") {
        assertAuthenticated(session);
        assertModuleAccess(session, "proposta", "Seu usuario nao tem acesso ao modulo proposta.");
        const items = await listCrmRequestsWithoutProposal({
          dateStart: url.searchParams.get("dateStart"),
          dateEnd: url.searchParams.get("dateEnd"),
          client: url.searchParams.get("client"),
          seller: url.searchParams.get("seller")
        }, session);
        sendJson(response, 200, items);
        return;
      }

    if (request.method === "GET" && /\/api\/proposal-numbers\/\d+$/.test(url.pathname)) {
      assertAuthenticated(session);
      assertModuleAccess(session, "proposta", "Seu usuario nao tem acesso ao modulo proposta.");
      const proposalId = Number(url.pathname.split("/").pop());
      const detail = await getProposalNumberDetail(proposalId, session);
      if (!detail) {
        sendJson(response, 404, { error: "Proposta nao encontrada." });
        return;
      }
      sendJson(response, 200, detail);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/proposal-numbers/export.csv") {
      assertAuthenticated(session);
      assertModuleAccess(session, "proposta", "Seu usuario nao tem acesso ao modulo proposta.");
      const rows = await listProposalNumbers({
        search: url.searchParams.get("search"),
        manager: url.searchParams.get("manager"),
        status: url.searchParams.get("status"),
        branch: url.searchParams.get("branch"),
        stage: url.searchParams.get("stage")
      }, session);
      sendCsv(response, "numeros-de-proposta.csv", buildProposalRegistryCsv(rows));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/proposal-numbers/generate") {
      assertAuthenticated(session);
      assertModuleAccess(session, "proposta", "Seu usuario nao tem acesso ao modulo proposta.");
      assertPermission(session, "createProposalNumber", "Seu perfil nao pode gerar proposta.");
      const body = await readBody(request);
      const payload = JSON.parse(body || "{}");
      const created = await createProposalNumber(payload, session);
      sendJson(response, 201, {
        message: "Proposta gerada com sucesso.",
        proposalNumber: created
      });
      return;
    }

    if (request.method === "PUT" && /\/api\/proposal-numbers\/\d+$/.test(url.pathname)) {
      assertAuthenticated(session);
      assertModuleAccess(session, "proposta", "Seu usuario nao tem acesso ao modulo proposta.");
      assertPermission(session, "createProposalNumber", "Seu perfil nao pode alterar proposta.");
      const proposalId = Number(url.pathname.split("/").pop());
      const body = await readBody(request);
      const payload = JSON.parse(body || "{}");
      const updated = await updateProposalNumber(proposalId, payload, session);
      sendJson(response, 200, {
        message: "Proposta atualizada com sucesso.",
        proposalNumber: updated
      });
      return;
    }

    if (request.method === "DELETE" && /\/api\/proposal-numbers\/\d+$/.test(url.pathname)) {
      assertAuthenticated(session);
      assertModuleAccess(session, "proposta", "Seu usuario nao tem acesso ao modulo proposta.");
      assertPermission(session, "createProposalNumber", "Seu perfil nao pode excluir proposta.");
      const proposalId = Number(url.pathname.split("/").pop());
      const removed = await deleteProposalNumber(proposalId, session);
      sendJson(response, 200, {
        message: `Numero ${removed.proposalNumberDisplay} excluido com sucesso.`
      });
      return;
    }

    if (request.method === "GET" && /\/api\/proposal-numbers\/\d+\/download$/.test(url.pathname)) {
      assertAuthenticated(session);
      assertModuleAccess(session, "proposta", "Seu usuario nao tem acesso ao modulo proposta.");
      const proposalId = Number(url.pathname.split("/")[3]);
      const file = await getProposalRegistryFile(proposalId, session);
      if (!file || !file.storagePath) {
        sendJson(response, 404, { error: "Arquivo da proposta nao encontrado." });
        return;
      }
      serveDownload(response, file.storagePath, file.fileName, file.mimeType);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/admin/roles") {
      assertAuthenticated(session);
      assertModuleAccess(session, "admin", "Seu usuario nao tem acesso ao modulo administrador.");
      assertPermission(session, "manageUsers", "Acesso permitido apenas para Administrador.");
      const roles = await listRoles();
      sendJson(response, 200, roles);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/admin/users") {
      assertAuthenticated(session);
      assertModuleAccess(session, "admin", "Seu usuario nao tem acesso ao modulo administrador.");
      assertPermission(session, "manageUsers", "Acesso permitido apenas para Administrador.");
      const users = await listManagedUsers();
      sendJson(response, 200, users);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/admin/audit-logs") {
      assertAuthenticated(session);
      assertModuleAccess(session, "admin", "Seu usuario nao tem acesso ao modulo administrador.");
      assertPermission(session, "manageUsers", "Acesso permitido apenas para Administrador.");
      const logs = await listAuditLogs();
      sendJson(response, 200, logs);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/admin/lookups-config") {
      assertAuthenticated(session);
      assertModuleAccess(session, "admin", "Seu usuario nao tem acesso ao modulo administrador.");
      assertPermission(session, "manageUsers", "Acesso permitido apenas para Administrador.");
      const config = await listLookupConfigurations();
      sendJson(response, 200, config);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/admin/workflow-stages-config") {
      assertAuthenticated(session);
      assertModuleAccess(session, "admin", "Seu usuario nao tem acesso ao modulo administrador.");
      assertPermission(session, "manageUsers", "Acesso permitido apenas para Administrador.");
      const items = await listWorkflowStageConfigurations();
      sendJson(response, 200, items);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/admin/proposal-numbers/backfill-advanced-requests") {
      assertAuthenticated(session);
      assertModuleAccess(session, "admin", "Seu usuario nao tem acesso ao modulo administrador.");
      assertPermission(session, "manageUsers", "Acesso permitido apenas para Administrador.");
      const items = await withTransaction(async (client) => (
        backfillMissingProposalRegistryForAdvancedRequests(client, session)
      ));
      sendJson(response, 200, {
        message: items.length
          ? `${items.length} proposta(s) foram geradas para regularizar solicitacoes sem numero.`
          : "Nenhuma solicitacao pendente de regularizacao foi encontrada.",
        items
      });
      return;
    }

    if (request.method === "POST" && /^\/api\/admin\/lookups-config\/[a-zA-Z0-9_]+$/.test(url.pathname)) {
      assertAuthenticated(session);
      assertModuleAccess(session, "admin", "Seu usuario nao tem acesso ao modulo administrador.");
      assertPermission(session, "manageUsers", "Acesso permitido apenas para Administrador.");
      const categoryKey = url.pathname.split("/").pop();
      const body = await readBody(request);
      const payload = JSON.parse(body || "{}");
      const item = await createLookupConfigurationItem(categoryKey, payload, session);
      sendJson(response, 201, { message: "Item de configuração salvo com sucesso.", item });
      return;
    }

    if (request.method === "PUT" && /^\/api\/admin\/lookups-config\/[a-zA-Z0-9_]+\/\d+$/.test(url.pathname)) {
      assertAuthenticated(session);
      assertModuleAccess(session, "admin", "Seu usuario nao tem acesso ao modulo administrador.");
      assertPermission(session, "manageUsers", "Acesso permitido apenas para Administrador.");
      const pathParts = url.pathname.split("/");
      const categoryKey = pathParts[pathParts.length - 2];
      const itemId = Number(pathParts[pathParts.length - 1]);
      const body = await readBody(request);
      const payload = JSON.parse(body || "{}");
      const item = await updateLookupConfigurationItem(categoryKey, itemId, payload, session);
      sendJson(response, 200, { message: "Item de configuração atualizado com sucesso.", item });
      return;
    }

    if (request.method === "DELETE" && /^\/api\/admin\/lookups-config\/[a-zA-Z0-9_]+\/\d+$/.test(url.pathname)) {
      assertAuthenticated(session);
      assertModuleAccess(session, "admin", "Seu usuario nao tem acesso ao modulo administrador.");
      assertPermission(session, "manageUsers", "Acesso permitido apenas para Administrador.");
      const pathParts = url.pathname.split("/");
      const categoryKey = pathParts[pathParts.length - 2];
      const itemId = Number(pathParts[pathParts.length - 1]);
      const body = await readBody(request);
      const payload = JSON.parse(body || "{}");
      await deactivateLookupConfigurationItem(categoryKey, itemId, session, payload);
      sendJson(response, 200, { message: "Item retirado da lista com sucesso." });
      return;
    }

    if (request.method === "PUT" && /^\/api\/admin\/workflow-stages-config\/\d+$/.test(url.pathname)) {
      assertAuthenticated(session);
      assertModuleAccess(session, "admin", "Seu usuario nao tem acesso ao modulo administrador.");
      assertPermission(session, "manageUsers", "Acesso permitido apenas para Administrador.");
      const stageId = Number(url.pathname.split("/").pop());
      const body = await readBody(request);
      const payload = JSON.parse(body || "{}");
      const item = await updateWorkflowStageConfiguration(stageId, payload, session);
      sendJson(response, 200, { message: "SLA da etapa atualizado com sucesso.", item });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/admin/users") {
      assertAuthenticated(session);
      assertModuleAccess(session, "admin", "Seu usuario nao tem acesso ao modulo administrador.");
      assertPermission(session, "manageUsers", "Acesso permitido apenas para Administrador.");
      const body = await readBody(request);
      const payload = JSON.parse(body || "{}");
      const created = await createManagedUser(payload, session);
      sendJson(response, 201, { message: "Usuario criado com sucesso.", user: created });
      return;
    }

    if (request.method === "PUT" && /\/api\/admin\/users\/\d+$/.test(url.pathname)) {
      assertAuthenticated(session);
      assertModuleAccess(session, "admin", "Seu usuario nao tem acesso ao modulo administrador.");
      assertPermission(session, "manageUsers", "Acesso permitido apenas para Administrador.");
      const userId = Number(url.pathname.split("/").pop());
      const body = await readBody(request);
      const payload = JSON.parse(body || "{}");
      await updateManagedUser(userId, payload, session);
      sendJson(response, 200, { message: "Usuario atualizado com sucesso." });
      return;
    }

    if (request.method === "DELETE" && /\/api\/admin\/users\/\d+$/.test(url.pathname)) {
      assertAuthenticated(session);
      assertModuleAccess(session, "admin", "Seu usuario nao tem acesso ao modulo administrador.");
      assertPermission(session, "manageUsers", "Acesso permitido apenas para Administrador.");
      const userId = Number(url.pathname.split("/").pop());
      await deactivateManagedUser(userId, session);
      sendJson(response, 200, { message: "Usuario desativado com sucesso." });
      return;
    }

    if (url.pathname === "/api/dashboard") {
      assertAuthenticated(session);
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso aos modulos operacionais.");
      try {
        const dashboardData = await getDashboardFromDb({
          dateStart: url.searchParams.get("dateStart"),
          dateEnd: url.searchParams.get("dateEnd"),
          seller: url.searchParams.get("seller"),
          branch: url.searchParams.get("branch"),
          probability: url.searchParams.get("probability")
        }, session);
        if (session.role === "vendedor") {
          const filteredRows = filterRowsBySession(await listRequests(), session);
          const countByStatus = (status) => filteredRows.filter((item) => item.slaStatus === status).length;
          dashboardData.metrics[0].value = filteredRows.filter((item) => item.slaStatus !== "Encerrado").length;
          dashboardData.metrics[1].value = countByStatus("No prazo");
          dashboardData.metrics[2].value = countByStatus("Em risco");
          dashboardData.metrics[3].value = countByStatus("Vencido");
          dashboardData.metrics[4].value = filteredRows.filter((item) => item.stageCode === "proposta_aceita").length;
          dashboardData.metrics[5].value = filteredRows.filter((item) => item.stageCode === "contrato_assinado").length;
          const grouped = new Map();
          filteredRows.forEach((item) => grouped.set(item.currentStage, (grouped.get(item.currentStage) || 0) + 1));
          const max = Math.max(...grouped.values(), 1);
          dashboardData.funnel = [...grouped.entries()].map(([stage, value]) => ({
            stage,
            value,
            percent: Math.max(10, Math.round((value / max) * 100))
          }));
          dashboardData.urgent = filteredRows
            .filter((item) => ["Vencido", "Em risco"].includes(item.slaStatus))
            .slice(0, 5)
            .map((item) => ({
              requestNumber: item.requestNumber,
              company: item.company,
              stage: item.currentStage,
              owner: item.currentOwner,
              sla: item.slaStatus
            }));
        }
        sendJson(response, 200, dashboardData);
      } catch (error) {
        sendJson(response, 200, dashboard);
      }
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/requests") {
      assertAuthenticated(session);
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso aos modulos operacionais.");
      assertPermission(session, "createRequest", "Seu perfil nao pode criar solicitacoes.");
      const body = await readBody(request);
      const payload = JSON.parse(body || "{}");
      const created = await createRequest(payload, session);
      sendJson(response, 201, {
        message: "Solicitacao salva com sucesso.",
        request: created,
        requestNumber: created.requestNumber
      });
      return;
    }

    if (request.method === "PUT" && /^\/api\/requests\/\d+$/.test(url.pathname)) {
      assertAuthenticated(session);
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso aos modulos operacionais.");
      assertPermission(session, "createRequest", "Seu perfil nao pode atualizar solicitacoes.");
      const requestId = Number(url.pathname.split("/").pop());
      if (!Number.isFinite(requestId)) {
        sendJson(response, 400, { error: "Identificador da solicitacao invalido." });
        return;
      }
      const body = await readBody(request);
      const payload = JSON.parse(body || "{}");
      const updated = await updateRequest(payload, requestId, session);
      sendJson(response, 200, {
        message: updated.returnedToTriage
          ? "Solicitação atualizada e devolvida para triagem."
          : "Solicitação atualizada com sucesso.",
        request: updated,
        returnedToTriage: updated.returnedToTriage
      });
      return;
    }

    if (request.method === "DELETE" && /^\/api\/requests\/\d+$/.test(url.pathname)) {
      assertAuthenticated(session);
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso aos modulos operacionais.");
      assertPermission(session, "deleteRequest", "Seu perfil nao pode excluir solicitacoes.");
      const requestId = Number(url.pathname.split("/").pop());
      const removed = await deleteRequest(requestId, session);
      for (const storagePath of removed.attachmentPaths) {
        try {
          const resolvedPath = path.isAbsolute(storagePath)
            ? storagePath
            : path.resolve(storagePath);
          if (fs.existsSync(resolvedPath)) {
            fs.unlinkSync(resolvedPath);
          }
        } catch (error) {
          console.warn("Nao foi possivel remover anexo da solicitacao excluida:", error.message);
        }
      }
      sendJson(response, 200, {
        message: `Solicitacao ${removed.requestNumber} excluida com sucesso.`
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/reports") {
      assertAuthenticated(session);
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso aos modulos operacionais.");
      const items = await getReports({
        dateStart: url.searchParams.get("dateStart"),
        dateEnd: url.searchParams.get("dateEnd"),
        seller: url.searchParams.get("seller"),
        stageCode: url.searchParams.get("stageCode"),
        slaStatus: url.searchParams.get("slaStatus"),
        search: url.searchParams.get("search")
      });
      sendJson(response, 200, filterRowsBySession(items, session));
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/reports/export.csv") {
      assertAuthenticated(session);
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso aos modulos operacionais.");
      const rows = await getReports({
        dateStart: url.searchParams.get("dateStart"),
        dateEnd: url.searchParams.get("dateEnd"),
        seller: url.searchParams.get("seller"),
        stageCode: url.searchParams.get("stageCode"),
        slaStatus: url.searchParams.get("slaStatus"),
        search: url.searchParams.get("search")
      });
      sendCsv(response, "relatorio-crm-propostas.csv", buildReportCsv(filterRowsBySession(rows, session)));
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/requests") {
      assertAuthenticated(session);
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso aos modulos operacionais.");
      try {
        const items = await listRequests();
        sendJson(response, 200, filterRowsBySession(items, session));
      } catch (error) {
        sendJson(response, 200, requests);
      }
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/dashboard/export.csv") {
      assertAuthenticated(session);
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso aos modulos operacionais.");
      const dashboardData = await getDashboardFromDb({
        dateStart: url.searchParams.get("dateStart"),
        dateEnd: url.searchParams.get("dateEnd"),
        seller: url.searchParams.get("seller"),
        branch: url.searchParams.get("branch"),
        probability: url.searchParams.get("probability")
      }, session);
      sendCsv(response, "funil-vendas-executivo.csv", buildSalesFunnelCsv(dashboardData.salesFunnel || {}));
      return;
    }

    if (request.method === "POST" && /\/api\/requests\/\d+\/proposal-record$/.test(url.pathname)) {
      assertAuthenticated(session);
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso aos modulos operacionais.");
      assertPermission(session, "saveProposal", "Seu perfil nao pode alterar a fila de propostas.");
      const body = await readBody(request);
      const payload = JSON.parse(body || "{}");
      await saveProposalRecord(payload, session);
      sendJson(response, 200, { message: "Triagem salva com sucesso." });
      return;
    }

    if (request.method === "POST" && /\/api\/requests\/\d+\/commercial-record$/.test(url.pathname)) {
      assertAuthenticated(session);
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso aos modulos operacionais.");
      assertPermission(session, "saveCommercial", "Seu perfil nao pode alterar negociacoes.");
      const body = await readBody(request);
      const payload = JSON.parse(body || "{}");
      await saveCommercialRecord(payload, session);
      sendJson(response, 200, { message: "Negociacao salva com sucesso." });
      return;
    }

    if (request.method === "POST" && /\/api\/proposal-numbers\/\d+\/commercial-record$/.test(url.pathname)) {
      assertAuthenticated(session);
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso aos modulos operacionais.");
      assertPermission(session, "saveCommercial", "Seu perfil nao pode alterar negociacoes.");
      const proposalRegistryId = Number(url.pathname.split("/")[3]);
      const body = await readBody(request);
      const payload = JSON.parse(body || "{}");
      payload.proposalRegistryId = proposalRegistryId;
      await saveCommercialRecord(payload, session);
      sendJson(response, 200, { message: "Negociacao salva com sucesso." });
      return;
    }

    if (request.method === "POST" && /\/api\/requests\/\d+\/contract-record$/.test(url.pathname)) {
      assertAuthenticated(session);
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso aos modulos operacionais.");
      assertPermission(session, "saveContract", "Seu perfil nao pode alterar o contratual.");
      const body = await readBody(request);
      const payload = JSON.parse(body || "{}");
      await saveContractRecord(payload, session);
      sendJson(response, 200, { message: "Contratual salvo com sucesso." });
      return;
    }

    if (request.method === "POST" && /\/api\/proposal-numbers\/\d+\/contract-record$/.test(url.pathname)) {
      assertAuthenticated(session);
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso aos modulos operacionais.");
      assertPermission(session, "saveContract", "Seu perfil nao pode alterar o contratual.");
      const proposalRegistryId = Number(url.pathname.split("/")[3]);
      const body = await readBody(request);
      const payload = JSON.parse(body || "{}");
      payload.proposalRegistryId = proposalRegistryId;
      await saveContractRecord(payload, session);
      sendJson(response, 200, { message: "Contratual salvo com sucesso." });
      return;
    }

    if (request.method === "GET" && /\/api\/attachments\/\d+\/download$/.test(url.pathname)) {
      assertAuthenticated(session);
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso aos modulos operacionais.");
      const attachmentId = Number(url.pathname.split("/")[3]);
      if (!Number.isFinite(attachmentId)) {
        sendJson(response, 400, { error: "Identificador do anexo invalido." });
        return;
      }

      const attachment = await getAttachmentById(attachmentId);
      if (!attachment) {
        sendJson(response, 404, { error: "Anexo nao encontrado." });
        return;
      }

      await assertRequestAccess(attachment.requestId, session);
      if (!canDownloadAttachment(session, attachment.attachmentType)) {
        sendJson(response, 403, { error: "Seu perfil nao pode baixar este tipo de anexo." });
        return;
      }
      serveDownload(response, attachment.storagePath, attachment.fileName, attachment.mimeType);
      return;
    }

    if (request.method === "GET" && /\/api\/requests\/\d+\/attachments$/.test(url.pathname)) {
      assertAuthenticated(session);
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso aos modulos operacionais.");
      const requestId = Number(url.pathname.split("/")[3]);
      if (!Number.isFinite(requestId)) {
        sendJson(response, 400, { error: "Identificador da solicitacao invalido." });
        return;
      }

      await assertRequestAccess(requestId, session);
      const items = (await listRequestAttachments(requestId))
        .filter((item) => canDownloadAttachment(session, item.attachmentType));
      sendJson(response, 200, items);
      return;
    }

    if (url.pathname.startsWith("/api/requests/")) {
      assertAuthenticated(session);
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso aos modulos operacionais.");
      const requestId = Number(url.pathname.split("/").pop());

      if (!Number.isFinite(requestId)) {
        sendJson(response, 400, { error: "Identificador da solicitacao invalido." });
        return;
      }

      try {
        const detail = await getRequestDetailFromDb(requestId, session);
        sendJson(response, 200, detail);
      } catch (error) {
        sendJson(response, 403, { error: error.message });
      }
      return;
    }

    const filePath = path.join(PUBLIC_DIR, url.pathname === "/" ? "index.html" : url.pathname);
    if (!filePath.startsWith(PUBLIC_DIR)) {
      sendJson(response, 403, { error: "Acesso negado." });
      return;
    }

    serveFile(response, filePath);
  } catch (error) {
    sendJson(response, error.statusCode || 500, { error: error.message });
  }
});

ensurePasswordColumn()
  .then(() => ensureMustChangePasswordColumn())
  .then(() => ensureModuleAccessColumn())
  .then(() => ensureWorkflowStageAccessColumn())
  .then(() => ensureRequestSubmissionKeyColumn())
  .then(() => ensureWorkflowStageColumns())
  .then(() => ensureWorkflowStageNames())
  .then(() => ensureAppLookupOptionsTable())
  .then(() => ensureCanonicalServiceLabels())
  .then(() => ensureProposalRegistryColumns())
  .then(() => ensureUppercaseClientNames())
  .then(() => ensureCanonicalSellerNames())
  .then(() => ensureProposalRegistryRequestNumbers())
  .then(() => ensureNegotiationProposalBranches())
  .then(() => ensureCommercialRecordColumns())
  .then(() => ensureRequestPendingResponseColumns())
  .then(() => ensureRequestPostColumns())
  .then(() => ensureRequestStructureDeduplication())
  .then(() => ensureAuditLogTable())
  .then(() => ensureNegotiationDiaryTable())
  .then(() => ensureNegotiationValueHistoryTable())
  .then(() => ensureNotificationTable())
  .then(() => ensureBaseAccessData())
  .then(() => {
    server.listen(PORT, HOST, () => {
      console.log(`Sistema de Gestão Comercial disponível em http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Falha ao preparar usuários e perfis iniciais:", error);
    process.exit(1);
  });





