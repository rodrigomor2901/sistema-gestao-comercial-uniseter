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
const BRANCH_OPTIONS = ["Matriz - Campinas", "Filial Minas"];
const RESPONSIBLE_OPTIONS = ["Andre", "Lana", "Rodrigo", "Guilherme", "Kleyton", "Maccari", "Supervisao", "Coordenacao"];
const LEAD_SOURCE_OPTIONS = ["Prospeccao", "Indicacao Diretoria", "Indicacao Seter", "Cliente Ativo", "Campseg", "Marcondes"];
const PROPOSAL_STATUS_OPTIONS = ["Gerado", "Em uso", "Vinculado ao CRM", "Em Negociacao", "Ganho", "Pedido", "Perdido", "Cancelado"];
const DOCUMENT_TYPE_OPTIONS = ["PROPOSTA", "ORCAMENTO", "ADITIVO", "NOVA PROPOSTA", "REVISAO", "AUMENTO", "REDUCAO"];
const INDUSTRY_OPTIONS = [
  "AGROPECUARIA",
  "ASSOCIACOES DIVERSAS",
  "BANCOS / FINANCEIRAS",
  "BARES E RESTAURANTES",
  "COMERCIO VAREJISTA",
  "CONCESSIONARIAS",
  "CONDOMINIO RESIDENCIAL",
  "CONDOMINIOS COMERCIAL",
  "CONSULTORIOS MEDICO/ODONTOLOGICO",
  "DISTRIBUIDORES/ COMERCIO ATACADISTA",
  "ESCRITORIOS DE ADVOCACIA",
  "GERADORAS/ DISTRIB. DE ENERGIA",
  "HOSPITAIS",
  "HOTEIS",
  "INCORPORADORAS E ADM IMOBILIARIAS",
  "INDUSTRIAS",
  "INSTITUICOES DE ENSINO",
  "LABORATORIOS DE ANALISE CLINICA",
  "METALURGICAS E FUNDICOES"
];
const SERVICE_TYPE_OPTIONS = [
  "Seguranca",
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
const MODULE_OPTIONS = ["proposta", "crm", "admin"];

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
    const error = new Error(message || "Acesso negado para esta acao.");
    error.statusCode = 403;
    throw error;
  }
}

function hasModuleAccess(session, moduleName) {
  const modules = session?.moduleAccess || [];
  return modules.includes(moduleName);
}

function assertModuleAccess(session, moduleName, message) {
  if (!hasModuleAccess(session, moduleName)) {
    const error = new Error(message || "Seu usuário não tem acesso a este módulo.");
    error.statusCode = 403;
    throw error;
  }
}

function canDownloadAttachment(session, attachmentType) {
  const role = session?.role || "vendedor";
  const sensitiveContract = ["minuta_inicial", "contrato_assinado"];
  const sellerDocs = ["anexo_inicial", "documento_tecnico_cliente", "proposta_final_pdf", "anexo_aceite"];

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
    moduleAccess: user.moduleAccess || ["crm"],
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
    vendedor: ["proposta", "crm"],
    comercial_interno: ["proposta", "crm"],
    propostas: ["proposta", "crm"],
    juridico: ["crm"],
    gestor: ["proposta", "crm"],
    diretoria: ["proposta", "crm"],
    administrador: ["proposta", "crm", "admin"]
  };

  return defaults[roleName] || ["crm"];
}

function normalizeModuleAccess(moduleAccess, roleName) {
  const base = Array.isArray(moduleAccess)
    ? moduleAccess
    : String(moduleAccess || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  const normalized = [...new Set(base.filter((item) => MODULE_OPTIONS.includes(item)))];
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
  const weightedMarginBase = serviceLines.reduce((sum, item) => {
    if (item.proposalValue === null || item.bdi === null) return sum;
    return sum + (Number(item.proposalValue) * Number(item.bdi));
  }, 0);
  const weightedValue = serviceLines.reduce((sum, item) => {
    if (item.proposalValue === null || item.bdi === null) return sum;
    return sum + Number(item.proposalValue);
  }, 0);

  return {
    serviceLines,
    proposalValue: explicitValue !== null ? explicitValue : (derivedValue > 0 ? derivedValue : null),
    bdi: explicitBdi !== null ? explicitBdi : (weightedValue > 0 ? (weightedMarginBase / weightedValue) : null)
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

function formatProposalNumberDisplay(sequence, issueDate) {
  const year = issueDate ? new Date(issueDate).getFullYear() : new Date().getFullYear();
  return `${sequence}/${year}`;
}

function buildProposalStageCodeSql(alias = "pr") {
  return `CASE
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) IN ('ganho', 'pedido', 'proposta aceita') THEN 'proposta_aceita'
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
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) IN ('ganho', 'pedido', 'proposta aceita') THEN 'Proposta aceita'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'elaboracao de contrato' THEN 'Elaboração de contrato'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'negociacao de clausulas' THEN 'Negociação de cláusulas'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'contrato assinado' THEN 'Contrato assinado'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'perdido' THEN 'Perdida'
    WHEN LOWER(COALESCE(${alias}.negotiation_status, '')) = 'cancelado' THEN 'Cancelada'
    ELSE 'Em negociacao'
  END`;
}

function mapProposalStageCodeToStatus(nextStageCode, fallbackStatus = null) {
  const mapping = {
    em_negociacao: "Em negociacao",
    proposta_aceita: "Proposta aceita",
    elaboracao_de_contrato: "Elaboracao de contrato",
    negociacao_de_clausulas: "Negociacao de clausulas",
    contrato_assinado: "Contrato assinado",
    perdida: "Perdido",
    cancelada: "Cancelado"
  };

  return mapping[nextStageCode] || fallbackStatus || "Em negociacao";
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
      TO_CHAR(r.updated_at, 'DD/MM/YYYY HH24:MI') AS "updatedAt",
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
      WHEN notes ILIKE '%Probabilidade: MÃ©dia%' THEN 'Media'
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

async function ensureCommercialRecordColumns() {
  await query(`
    ALTER TABLE commercial_records
    ADD COLUMN IF NOT EXISTS probability_level VARCHAR(20),
    ADD COLUMN IF NOT EXISTS probability_reason TEXT
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
          `SELECT id, module_access
             FROM users
            WHERE email = $1`,
          [user.email]
        );
        userId = existingUser.rows[0]?.id || null;

        // Preserve customized access for existing users and only fill modules if blank.
        const moduleAccess = existingUser.rows[0]?.module_access;
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
      } else {
        await client.query(
          `UPDATE users
              SET module_access = $2::text[],
                  must_change_password = FALSE
            WHERE id = $1`,
          [userId, defaultModulesForRole(user.role)]
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
  });
}

async function getLookups() {
  const [lossReasons, cancelReasons, sellers] = await Promise.all([
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
    )
  ]);

  return {
    branches: BRANCH_OPTIONS,
    responsibles: RESPONSIBLE_OPTIONS,
    leadSources: LEAD_SOURCE_OPTIONS,
    proposalStatuses: PROPOSAL_STATUS_OPTIONS,
    documentTypes: DOCUMENT_TYPE_OPTIONS,
    industries: INDUSTRY_OPTIONS,
    serviceTypes: SERVICE_TYPE_OPTIONS,
    lossReasons: lossReasons.rows,
    cancelReasons: cancelReasons.rows,
    sellers: sellers.rows
  };
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

async function createRequest(payload, session) {
  const missing = validateRequestPayload(payload);
  if (missing.length) {
    throw new Error(`Campos obrigatorios nao preenchidos: ${missing.join(", ")}`);
  }

  return withTransaction(async (client) => {
    const sellerUserId = await ensureUser(client, payload.sellerName, payload.sellerEmail);
    const stageId = await getStageId(client, "solicitacao_criada");

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

    const requestNumber = await generateRequestNumber(client);

    const requestResult = await client.query(
      `INSERT INTO requests (
        request_number, client_id, seller_user_id, current_stage_id, current_owner_user_id,
        request_date, deadline_date, branch_name, lead_source, initial_note, general_notes
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11
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
        payload.generalNotes || null
      ]
    );

    const requestId = requestResult.rows[0].id;

    for (const serviceType of payload.serviceTypes || []) {
      await client.query(
        "INSERT INTO request_services (request_id, service_type) VALUES ($1, $2)",
        [requestId, slugify(serviceType)]
      );
    }

    for (const benefit of mapBenefits(payload)) {
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

    for (const post of payload.posts || []) {
      await client.query(
        `INSERT INTO request_posts (
          request_id, post_type, qty_posts, qty_workers, function_name, work_scale,
          start_time, end_time, saturday_time, holiday_flag, indemnified_flag,
          uniform_text, cost_allowance_value
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          requestId,
          slugify(post.postType),
          toNullableNumber(post.postQty),
          toNullableNumber(post.workerQty),
          post.functionName || null,
          post.workScale || null,
          post.startTime || null,
          post.endTime || null,
          post.saturdayTime || null,
          post.holidayFlag === "" ? null : post.holidayFlag === "Sim",
          post.indemnifiedFlag === "" ? null : post.indemnifiedFlag === "Sim",
          post.uniformText || null,
          toNullableNumber(post.costAllowance)
        ]
      );
    }

    for (const equipment of payload.equipments || []) {
      await client.query(
        `INSERT INTO request_equipments (
          request_id, category, equipment_name, quantity, notes
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          requestId,
          slugify(equipment.category || ""),
          equipment.equipmentName,
          toNullableNumber(equipment.equipmentQty),
          equipment.equipmentNotes || null
        ]
      );
    }

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
        payload.initialNote || "Solicitacao criada pelo vendedor."
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

async function listRequests() {
  const result = await query(
    `${buildRequestOverviewQuery()}
     ORDER BY "stageEnteredAt" DESC NULLS LAST, id DESC
     LIMIT 50`
  );

  return result.rows;
}

function filterRowsBySession(rows, session) {
  if (session.role !== "vendedor") return rows;
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
  const clauses = [];
  const values = [];

  clauses.push(buildProposalNumberAccessClause(session, values));

  if (filters.search) {
    const index = values.push(`%${filters.search}%`);
    clauses.push(`(
      pr.proposal_number_display ILIKE $${index}
      OR COALESCE(c.legal_name, pr.client_name, '') ILIKE $${index}
      OR COALESCE(req.request_number, pr.crm_request_number, '') ILIKE $${index}
    )`);
  }

  if (filters.manager) {
    const index = values.push(`%${filters.manager}%`);
    clauses.push(`COALESCE(pr.manager_name, '') ILIKE $${index}`);
  }

  if (filters.status) {
    const index = values.push(filters.status);
    clauses.push(`COALESCE(pr.negotiation_status, '') = $${index}`);
  }

  if (filters.branch) {
    const index = values.push(filters.branch);
    clauses.push(`COALESCE(pr.branch_name, '') = $${index}`);
  }

  const result = await query(
    `SELECT
       pr.id,
       pr.proposal_sequence AS "proposalSequence",
       pr.proposal_number_display AS "proposalNumberDisplay",
       TO_CHAR(pr.issue_date, 'DD/MM/YYYY') AS "issueDate",
       pr.manager_name AS manager,
       UPPER(COALESCE(c.legal_name, pr.client_name)) AS "clientName",
       COALESCE(req.request_number, pr.crm_request_number, '-') AS "requestNumber",
       ${buildProposalStageCodeSql("pr")} AS "stageCode",
       ${buildProposalStageLabelSql("pr")} AS "stageLabel",
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
     WHERE ${clauses.join(" AND ")}
     ORDER BY pr.proposal_sequence DESC, pr.id DESC`,
    values
  );

  return result.rows.map((row) => ({
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
}

async function listCrmRequestsWithoutProposal(filters = {}, session) {
  const values = [];
  const clauses = ["pr.id IS NULL"];

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

async function createProposalNumber(payload, session) {
  return withTransaction(async (client) => {
    const issueDate = payload.issueDate || new Date().toISOString().slice(0, 10);
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
      description: `Numero de proposta ${insertResult.rows[0].proposalNumberDisplay} gerado.`,
      metadata: {
        proposalSequence,
        requestId: requestId || null,
        clientName: resolvedClientName
      }
    });

    return {
      id: insertResult.rows[0].id,
      proposalNumberDisplay: insertResult.rows[0].proposalNumberDisplay,
      proposalSequence: insertResult.rows[0].proposalSequence
    };
  });
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
       ${buildProposalStageLabelSql("pr")} AS stage,
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
  return detail;
}

async function updateProposalNumber(proposalId, payload, session) {
  return withTransaction(async (client) => {
    const current = await getProposalNumberDetail(proposalId, session);
    const totals = deriveProposalTotals(payload);
    if (!current) {
      const error = new Error("Numero de proposta nao encontrado.");
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
      description: `Numero de proposta ${result.rows[0].proposalNumberDisplay} atualizado.`,
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
      const error = new Error("Numero de proposta nao encontrado.");
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
      description: `Numero de proposta ${current.proposalNumberDisplay} excluido.`,
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
       u.must_change_password AS "mustChangePassword",
       u.password_hash AS "passwordHash",
       COALESCE(array_remove(array_agg(r.name ORDER BY r.name), NULL), ARRAY[]::varchar[]) AS roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     WHERE u.is_active = TRUE
       AND LOWER(u.email) = LOWER($1)
     GROUP BY u.id, u.name, u.email, u.password_hash, u.module_access, u.must_change_password`,
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
       u.must_change_password AS "mustChangePassword",
       COALESCE(array_remove(array_agg(r.name ORDER BY r.name), NULL), ARRAY[]::varchar[]) AS roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     WHERE u.id = $1
       AND u.is_active = TRUE
     GROUP BY u.id, u.name, u.email, u.module_access, u.must_change_password`,
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
       u.must_change_password AS "mustChangePassword",
       COALESCE(array_remove(array_agg(r.name ORDER BY r.name), NULL), ARRAY[]::varchar[]) AS roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     GROUP BY u.id, u.name, u.email, u.department, u.is_active, u.module_access, u.must_change_password
     ORDER BY u.name ASC, u.email ASC`
  );

  return result.rows.map((row) => ({
    ...row,
    primaryRole: row.roles?.[0] || "vendedor",
    moduleAccess: normalizeModuleAccess(row.moduleAccess, row.roles?.[0] || "vendedor")
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
        `INSERT INTO users (name, email, department, is_active, password_hash, module_access, must_change_password)
         VALUES ($1, $2, $3, $4, $5, $6::text[], TRUE)
         RETURNING id`,
        [
          payload.name,
          normalizedEmail,
          payload.department || null,
          payload.isActive !== false,
          hashPassword(temporaryPassword),
          normalizeModuleAccess(payload.moduleAccess, payload.role)
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
          normalizeModuleAccess(payload.moduleAccess, payload.role)
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
        moduleAccess: normalizeModuleAccess(payload.moduleAccess, payload.role)
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

  addSection("Ticket medio por vendedor", ["Vendedor", "Quantidade", "Ticket medio"], (data.ticketBySeller || []).map((item) => [
    item.label,
    item.value,
    Number(item.averageValue || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  ]));

  addSection("Conversao por vendedor", ["Vendedor", "Entradas", "Aceitas", "Fechadas", "Conversao final"], (data.conversionBySeller || []).map((item) => [
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
       r.request_number AS "requestNumber",
        UPPER(c.legal_name) AS company,
       seller_user.email AS "sellerEmail",
       ws.name AS stage,
       ${slaStatusCase} AS "slaStatus",
       COALESCE(owner_user.name, seller_user.name) AS "currentOwner",
       seller_user.name AS seller,
       TO_CHAR(r.request_date, 'DD/MM/YYYY') AS "requestDate",
       TO_CHAR(r.deadline_date, 'DD/MM/YYYY') AS "deadlineDate",
       COALESCE(contract_records.next_action, commercial_records.next_action, latest.note, r.initial_note, 'Solicitacao em andamento') AS "nextAction",
       linked_proposal.id AS "proposalRegistryId",
       linked_proposal.proposal_number_display AS "proposalNumber",
       TO_CHAR(linked_proposal.issue_date, 'DD/MM/YYYY') AS "proposalIssueDate",
       linked_proposal.negotiation_status AS "proposalStatus",
       linked_proposal.manager_name AS "proposalManager",
       linked_proposal.proposal_value AS "proposalValue",
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
       commercial_records.probability_reason AS "commercialProbabilityReason"
     FROM requests r
     JOIN clients c ON c.id = r.client_id
     JOIN workflow_stages ws ON ws.id = r.current_stage_id
     JOIN users seller_user ON seller_user.id = r.seller_user_id
     LEFT JOIN users owner_user ON owner_user.id = r.current_owner_user_id
     LEFT JOIN commercial_records ON commercial_records.request_id = r.id
     LEFT JOIN users commercial_seller_user ON commercial_seller_user.id = commercial_records.seller_user_id
     LEFT JOIN contract_records ON contract_records.request_id = r.id
     LEFT JOIN loss_reasons ON loss_reasons.id = r.lost_reason_id
     LEFT JOIN cancel_reasons ON cancel_reasons.id = r.cancel_reason_id
     LEFT JOIN LATERAL (
       SELECT id, proposal_number_display, issue_date, negotiation_status, manager_name, proposal_value
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

  const historyResult = await query(
    `SELECT
       ws.name AS title,
       TO_CHAR(rsh.entered_at, 'DD/MM/YYYY HH24:MI') || ' - ' || COALESCE(changed_user.name, 'Sistema') AS meta,
       COALESCE(rsh.note, 'Sem observacao registrada.') AS note
     FROM request_stage_history rsh
     JOIN workflow_stages ws ON ws.id = rsh.to_stage_id
     LEFT JOIN users changed_user ON changed_user.id = rsh.changed_by_user_id
     WHERE rsh.request_id = $1
     ORDER BY rsh.entered_at DESC`,
    [requestId]
  );

  return {
    ...detailResult.rows[0],
    history: historyResult.rows.map((row) => ({
      title: row.title,
      meta: row.meta,
      note: row.note
    }))
  };
}

async function getDashboardFromDb(filters = {}) {
  const overviewResult = await query(buildRequestOverviewQuery());
  const items = overviewResult.rows;

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

  const salesRows = [...salesResult.rows, ...proposalOnlySalesResult.rows];
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

  const probabilityOrder = ["Alta", "Media", "Baixa"];
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
    [(row) => row.stageCode === "em_preparacao_da_proposta", "Em preparo"],
    [(row) => row.stageCode === "enviada_ao_vendedor", "Enviadas"],
    [(row) => row.stageCode === "em_negociacao", "Em negociacao"],
    [(row) => row.stageCode === "proposta_aceita", "Aceitas"],
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
      { label: "Solicitacoes abertas", value: openItems.length, tone: "info", note: "Carteira atual" },
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
       TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS "createdAt"
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
      "SELECT current_stage_id, current_owner_user_id FROM requests WHERE id = $1",
      [requestId]
    );

    if (!requestResult.rows[0]) {
      throw new Error("Solicitacao nao encontrada para triagem.");
    }

    const currentStageId = requestResult.rows[0].current_stage_id;
    const nextOwnerId = proposalOwnerId || triageOwnerId || requestResult.rows[0].current_owner_user_id;

    const existing = await client.query(
      "SELECT id FROM proposal_records WHERE request_id = $1",
      [requestId]
    );
    const finalPdfAttachmentId = await createAttachmentRecord(client, {
      requestId,
      uploadedByUserId: triageOwnerId || proposalOwnerId,
      attachmentType: "proposta_final_pdf",
      file: payload.proposalFinalPdf,
      description: "PDF final da proposta"
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
          payload.acceptedNote || null
        ]
      );

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

      return { proposalRegistryId };
    }

    if (!requestExists) {
      throw new Error("Solicitacao nao encontrada para negociacao.");
    }

    const nextStageId = await getStageId(client, payload.nextStageCode);
    const lostReasonId = await getReasonId(client, "loss_reasons", payload.lossReason);
    const cancelReasonId = await getReasonId(client, "cancel_reasons", payload.cancelReason);

    const requestResult = await client.query(
      "SELECT current_stage_id, current_owner_user_id FROM requests WHERE id = $1",
      [requestId]
    );

    const currentStageId = requestResult.rows[0].current_stage_id;

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

    await client.query(
      `UPDATE requests
       SET current_stage_id = $2,
           current_owner_user_id = $3,
           updated_at = NOW(),
           lost_reason_id = CASE WHEN $4 = 'perdida' THEN $5 ELSE lost_reason_id END,
           cancel_reason_id = CASE WHEN $4 = 'cancelada' THEN $6 ELSE cancel_reason_id END,
           status_final = CASE
             WHEN $4 = 'perdida' THEN 'Perdida'
             WHEN $4 = 'cancelada' THEN 'Cancelada'
             ELSE status_final
           END,
           closed_at = CASE
             WHEN $4 IN ('perdida', 'cancelada') THEN NOW()
             ELSE closed_at
           END
       WHERE id = $1`,
      [requestId, nextStageId, sellerUserId, payload.nextStageCode, lostReasonId, cancelReasonId]
    );

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
        sellerUserId,
        "ok",
        payload.nextAction || payload.acceptedNote || payload.commercialNotes || "Negociacao atualizada."
      ]
    );

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

      return { proposalRegistryId };
    }

    const nextStageId = await getStageId(client, payload.nextStageCode);

    const requestResult = await client.query(
      "SELECT current_stage_id FROM requests WHERE id = $1",
      [requestId]
    );

    if (!requestResult.rows[0]) {
      throw new Error("Solicitacao nao encontrada para contratual.");
    }

    const currentStageId = requestResult.rows[0].current_stage_id;

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

    await client.query(
      `UPDATE requests
       SET current_stage_id = $2,
           current_owner_user_id = $3,
           updated_at = NOW(),
           status_final = CASE WHEN $4 = 'contrato_assinado' THEN 'Contrato assinado' ELSE status_final END,
           closed_at = CASE WHEN $4 = 'contrato_assinado' THEN NOW() ELSE closed_at END
       WHERE id = $1`,
      [requestId, nextStageId, contractOwnerId, payload.nextStageCode]
    );

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
        contractOwnerId,
        contractOwnerId,
        "ok",
        payload.nextAction || payload.legalNotes || payload.contractNotes || "Contratual atualizado."
      ]
    );

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
      const lookups = await getLookups();
      sendJson(response, 200, lookups);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/proposal-numbers") {
      assertAuthenticated(session);
      assertModuleAccess(session, "proposta", "Seu usuario nao tem acesso ao modulo numero de proposta.");
      const items = await listProposalNumbers({
        search: url.searchParams.get("search"),
        manager: url.searchParams.get("manager"),
        status: url.searchParams.get("status"),
        branch: url.searchParams.get("branch")
      }, session);
      sendJson(response, 200, items);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/proposal-numbers/crm-requests") {
        assertAuthenticated(session);
        assertModuleAccess(session, "proposta", "Seu usuario nao tem acesso ao modulo numero de proposta.");
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
      assertModuleAccess(session, "proposta", "Seu usuario nao tem acesso ao modulo numero de proposta.");
      const proposalId = Number(url.pathname.split("/").pop());
      const detail = await getProposalNumberDetail(proposalId, session);
      if (!detail) {
        sendJson(response, 404, { error: "Numero de proposta nao encontrado." });
        return;
      }
      sendJson(response, 200, detail);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/proposal-numbers/export.csv") {
      assertAuthenticated(session);
      assertModuleAccess(session, "proposta", "Seu usuario nao tem acesso ao modulo numero de proposta.");
      const rows = await listProposalNumbers({
        search: url.searchParams.get("search"),
        manager: url.searchParams.get("manager"),
        status: url.searchParams.get("status"),
        branch: url.searchParams.get("branch")
      }, session);
      sendCsv(response, "numeros-de-proposta.csv", buildProposalRegistryCsv(rows));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/proposal-numbers/generate") {
      assertAuthenticated(session);
      assertModuleAccess(session, "proposta", "Seu usuario nao tem acesso ao modulo numero de proposta.");
      assertPermission(session, "createProposalNumber", "Seu perfil nao pode gerar numero de proposta.");
      const body = await readBody(request);
      const payload = JSON.parse(body || "{}");
      const created = await createProposalNumber(payload, session);
      sendJson(response, 201, {
        message: "Numero de proposta gerado com sucesso.",
        proposalNumber: created
      });
      return;
    }

    if (request.method === "PUT" && /\/api\/proposal-numbers\/\d+$/.test(url.pathname)) {
      assertAuthenticated(session);
      assertModuleAccess(session, "proposta", "Seu usuario nao tem acesso ao modulo numero de proposta.");
      assertPermission(session, "createProposalNumber", "Seu perfil nao pode alterar numero de proposta.");
      const proposalId = Number(url.pathname.split("/").pop());
      const body = await readBody(request);
      const payload = JSON.parse(body || "{}");
      const updated = await updateProposalNumber(proposalId, payload, session);
      sendJson(response, 200, {
        message: "Numero de proposta atualizado com sucesso.",
        proposalNumber: updated
      });
      return;
    }

    if (request.method === "DELETE" && /\/api\/proposal-numbers\/\d+$/.test(url.pathname)) {
      assertAuthenticated(session);
      assertModuleAccess(session, "proposta", "Seu usuario nao tem acesso ao modulo numero de proposta.");
      assertPermission(session, "createProposalNumber", "Seu perfil nao pode excluir numero de proposta.");
      const proposalId = Number(url.pathname.split("/").pop());
      const removed = await deleteProposalNumber(proposalId, session);
      sendJson(response, 200, {
        message: `Numero ${removed.proposalNumberDisplay} excluido com sucesso.`
      });
      return;
    }

    if (request.method === "GET" && /\/api\/proposal-numbers\/\d+\/download$/.test(url.pathname)) {
      assertAuthenticated(session);
      assertModuleAccess(session, "proposta", "Seu usuario nao tem acesso ao modulo numero de proposta.");
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
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso ao modulo CRM.");
      try {
        const dashboardData = await getDashboardFromDb({
          dateStart: url.searchParams.get("dateStart"),
          dateEnd: url.searchParams.get("dateEnd"),
          seller: url.searchParams.get("seller"),
          branch: url.searchParams.get("branch"),
          probability: url.searchParams.get("probability")
        });
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
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso ao modulo CRM.");
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

    if (request.method === "GET" && url.pathname === "/api/reports") {
      assertAuthenticated(session);
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso ao modulo CRM.");
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
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso ao modulo CRM.");
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
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso ao modulo CRM.");
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
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso ao modulo CRM.");
      const dashboardData = await getDashboardFromDb({
        dateStart: url.searchParams.get("dateStart"),
        dateEnd: url.searchParams.get("dateEnd"),
        seller: url.searchParams.get("seller"),
        branch: url.searchParams.get("branch"),
        probability: url.searchParams.get("probability")
      });
      sendCsv(response, "funil-vendas-executivo.csv", buildSalesFunnelCsv(dashboardData.salesFunnel || {}));
      return;
    }

    if (request.method === "POST" && /\/api\/requests\/\d+\/proposal-record$/.test(url.pathname)) {
      assertAuthenticated(session);
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso ao modulo CRM.");
      assertPermission(session, "saveProposal", "Seu perfil nao pode alterar a fila de propostas.");
      const body = await readBody(request);
      const payload = JSON.parse(body || "{}");
      await saveProposalRecord(payload, session);
      sendJson(response, 200, { message: "Triagem salva com sucesso." });
      return;
    }

    if (request.method === "POST" && /\/api\/requests\/\d+\/commercial-record$/.test(url.pathname)) {
      assertAuthenticated(session);
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso ao modulo CRM.");
      assertPermission(session, "saveCommercial", "Seu perfil nao pode alterar negociacoes.");
      const body = await readBody(request);
      const payload = JSON.parse(body || "{}");
      await saveCommercialRecord(payload, session);
      sendJson(response, 200, { message: "Negociacao salva com sucesso." });
      return;
    }

    if (request.method === "POST" && /\/api\/proposal-numbers\/\d+\/commercial-record$/.test(url.pathname)) {
      assertAuthenticated(session);
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso ao modulo CRM.");
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
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso ao modulo CRM.");
      assertPermission(session, "saveContract", "Seu perfil nao pode alterar o contratual.");
      const body = await readBody(request);
      const payload = JSON.parse(body || "{}");
      await saveContractRecord(payload, session);
      sendJson(response, 200, { message: "Contratual salvo com sucesso." });
      return;
    }

    if (request.method === "POST" && /\/api\/proposal-numbers\/\d+\/contract-record$/.test(url.pathname)) {
      assertAuthenticated(session);
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso ao modulo CRM.");
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
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso ao modulo CRM.");
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
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso ao modulo CRM.");
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
      assertModuleAccess(session, "crm", "Seu usuario nao tem acesso ao modulo CRM.");
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
  .then(() => ensureProposalRegistryColumns())
  .then(() => ensureUppercaseClientNames())
  .then(() => ensureCanonicalSellerNames())
  .then(() => ensureProposalRegistryRequestNumbers())
  .then(() => ensureNegotiationProposalBranches())
  .then(() => ensureCommercialRecordColumns())
  .then(() => ensureAuditLogTable())
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
