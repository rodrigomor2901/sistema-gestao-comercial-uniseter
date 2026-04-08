const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { withTransaction } = require("../db");

const TARGET_SHEETS = ["PIPELINE 2026", "PIPELINE 2025"];

function detectDelimiter(line) {
  return line.includes(";") ? ";" : ",";
}

function parseCsvLine(line, delimiter = ",") {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function parsePtDate(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const parsed = new Date(excelEpoch.getTime() + (value * 86400000));
    const yyyy = parsed.getUTCFullYear();
    const mm = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(parsed.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  const text = String(value || "").trim();
  if (!text) return null;
  const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const text = String(value || "")
    .replace(/\u00A0/g, " ")
    .replace(/R\$/gi, "")
    .replace(/%/g, "")
    .trim();
  if (!text || text === "-") return null;
  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text.replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function readWorkbookRows(filePath) {
  const tempPath = path.join(os.tmpdir(), `pipeline-import-${Date.now()}.json`);
  const escapedFile = filePath.replace(/'/g, "''");
  const escapedOut = tempPath.replace(/'/g, "''");
  const sheetList = TARGET_SHEETS.map((name) => `'${name.replace(/'/g, "''")}'`).join(",");
  const script = `
$ErrorActionPreference = 'Stop'
$path = '${escapedFile}'
$outPath = '${escapedOut}'
$targetSheets = @(${sheetList})
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$wb = $excel.Workbooks.Open($path)
$result = @()
foreach ($sheetName in $targetSheets) {
  try {
    $ws = $wb.Worksheets.Item($sheetName)
  } catch {
    continue
  }
  $used = $ws.UsedRange
  $matrix = $used.Value2
  if (-not $matrix) { continue }
  $rowCount = $used.Rows.Count
  $colCount = $used.Columns.Count
  $headers = @()
  for ($c = 1; $c -le $colCount; $c++) {
    $headers += [string]$matrix.GetValue(1, $c)
  }
  $rows = @()
  for ($r = 2; $r -le $rowCount; $r++) {
    $obj = [ordered]@{}
    $hasValue = $false
    for ($c = 1; $c -le $colCount; $c++) {
      $header = [string]$headers[$c - 1]
      if (-not $header) { continue }
      $value = $matrix.GetValue($r, $c)
      if ($null -ne $value -and [string]::IsNullOrWhiteSpace([string]$value) -eq $false) { $hasValue = $true }
      $obj[$header] = $value
    }
    if ($hasValue) {
      $rows += [pscustomobject]$obj
    }
  }
  $result += [pscustomobject]@{ Sheet = $sheetName; Rows = $rows }
}
$wb.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($wb) | Out-Null
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
[GC]::Collect()
[GC]::WaitForPendingFinalizers()
$result | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $outPath -Encoding UTF8
`;

  const run = spawnSync("powershell", ["-NoProfile", "-Command", script], {
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024
  });

  if (run.status !== 0) {
    throw new Error(run.stderr || run.stdout || "Falha ao ler o workbook do pipeline.");
  }

  if (!fs.existsSync(tempPath)) {
    throw new Error(run.stderr || run.stdout || "Falha ao gerar o arquivo temporario de leitura do pipeline.");
  }

  const raw = fs.readFileSync(tempPath, "utf8").replace(/^\uFEFF/, "");
  fs.unlinkSync(tempPath);
  return JSON.parse(raw);
}

function normalizeProposalNumber(rawValue) {
  const text = String(rawValue || "").trim();
  if (!text) return null;
  const match = text.match(/(\d+)\s*\/\s*(\d{4})/);
  if (!match) return null;
  const sequence = Number(match[1]);
  const year = Number(match[2]);
  if (!sequence || !year) return null;
  return {
    sequence,
    year,
    display: `${sequence}/${year}`,
    raw: text
  };
}

function normalizeServiceType(rawValue) {
  const text = String(rawValue || "").trim().toUpperCase();
  const mapping = {
    VIGILANCIA: "Vigilancia",
    PORTARIA: "Portaria",
    LIMPEZA: "Limpeza",
    JARDINAGEM: "Jardinagem",
    MONITORAMENTO: "Monitoramento",
    BOMBEIRO: "Bombeiro",
    MANUTENCAO: "Manutencao",
    "MANUTENÇÃO": "Manutencao"
  };
  return mapping[text] || toTitleCase(String(rawValue || "").trim());
}

function toTitleCase(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeStatus(rawValue) {
  const text = String(rawValue || "").trim().toUpperCase();
  if (!text) return "Gerado";
  const mapping = {
    "EM NEGOCIACAO": "Em Negociacao",
    "EM NEGOCIAÇÃO": "Em Negociacao",
    GANHO: "Ganho",
    PEDIDO: "Pedido",
    PERDIDO: "Perdido",
    CANCELADO: "Cancelado"
  };
  return mapping[text] || toTitleCase(String(rawValue || "").trim());
}

function normalizeProbability(rawValue) {
  const text = String(rawValue || "").trim().toUpperCase();
  if (!text) return null;
  const mapping = {
    ALTA: "Alta",
    "MÉDIA": "Media",
    MEDIA: "Media",
    BAIXA: "Baixa",
    GANHO: "Ganho"
  };
  return mapping[text] || toTitleCase(String(rawValue || "").trim());
}

function weightedMargin(lines) {
  const eligible = lines.filter((line) => line.proposalValue !== null && line.bdi !== null);
  const totalValue = eligible.reduce((sum, line) => sum + Number(line.proposalValue), 0);
  if (!totalValue) return null;
  const base = eligible.reduce((sum, line) => sum + (Number(line.proposalValue) * Number(line.bdi)), 0);
  return base / totalValue;
}

function groupPipelineRows(workbookData, sourceFile) {
  const groups = new Map();

  for (const sheet of workbookData) {
    for (const row of sheet.Rows || []) {
      const number = normalizeProposalNumber(row[" Nº PROPOSTA "] || row["Nº PROPOSTA"] || row["PROPOSTA"]);
      if (!number) continue;

      const key = `${number.sequence}/${number.year}`;
      const serviceType = normalizeServiceType(row[" SERVIÇO "] || row["SERVIÇO"] || row["SERVICO"]);
      const proposalValue =
        toNumber(row[" FATURAMENTO REVISÃO "]) ??
        toNumber(row[" FATURAMENTO REVISÃO"]) ??
        toNumber(row[" FATURAMENTO  "]) ??
        toNumber(row["FATURAMENTO"]);
      const bdi =
        toNumber(row["MARGEM REVISÃO %"]) ??
        toNumber(row[" MARGEM REVISÃO %"]) ??
        toNumber(row[" MARGEM INICIAL %"]) ??
        toNumber(row["BDI"]);

      if (!groups.has(key)) {
        groups.set(key, {
          proposalSequence: number.sequence,
          proposalYear: number.year,
          proposalNumberDisplay: number.display,
          rawProposalText: number.raw,
          issueDate: parsePtDate(row["DATA SOLICIT PROPOSTA"]) || null,
          managerName: String(row.CONSULTOR || "").trim() || null,
          clientName: String(row.CLIENTE || "").trim() || null,
          documentType: "PROPOSTA",
          leadSource: String(row.ORIGEM || "").trim() || null,
          industrySegment: String(row.RAMO || "").trim() || String(row.RAMO1 || "").trim() || null,
          city: String(row.CIDADE || "").trim() || null,
          status: normalizeStatus(row.STATUS),
          probability: normalizeProbability(row.PROBABILIDADE),
          serviceLines: [],
          requestDate: parsePtDate(row["DATA SOLICIT PROPOSTA"]) || null,
          sourceSheets: new Set([sheet.Sheet]),
          notes: []
        });
      }

      const group = groups.get(key);
      group.sourceSheets.add(sheet.Sheet);
      if (!group.issueDate) group.issueDate = parsePtDate(row["DATA SOLICIT PROPOSTA"]) || null;
      if (!group.managerName) group.managerName = String(row.CONSULTOR || "").trim() || null;
      if (!group.clientName) group.clientName = String(row.CLIENTE || "").trim() || null;
      if (!group.leadSource) group.leadSource = String(row.ORIGEM || "").trim() || null;
      if (!group.industrySegment) group.industrySegment = String(row.RAMO || "").trim() || String(row.RAMO1 || "").trim() || null;
      if (!group.city) group.city = String(row.CIDADE || "").trim() || null;
      if (!group.probability) group.probability = normalizeProbability(row.PROBABILIDADE);
      if (group.status === "Gerado" && row.STATUS) group.status = normalizeStatus(row.STATUS);

      if (serviceType && (proposalValue !== null || bdi !== null)) {
        group.serviceLines.push({
          serviceType,
          proposalValue,
          bdi
        });
      }
    }
  }

  return Array.from(groups.values()).map((group) => {
    const lineMap = new Map();
    for (const line of group.serviceLines) {
      const current = lineMap.get(line.serviceType) || { serviceType: line.serviceType, proposalValue: 0, bdiValues: [] };
      current.proposalValue += Number(line.proposalValue || 0);
      if (line.bdi !== null && line.proposalValue !== null) {
        current.bdiValues.push({ value: Number(line.proposalValue), bdi: Number(line.bdi) });
      }
      lineMap.set(line.serviceType, current);
    }

    const serviceLines = Array.from(lineMap.values()).map((line) => {
      const weighted = line.bdiValues.reduce((sum, item) => sum + (item.value * item.bdi), 0);
      const weight = line.bdiValues.reduce((sum, item) => sum + item.value, 0);
      return {
        serviceType: line.serviceType,
        proposalValue: line.proposalValue || null,
        bdi: weight ? (weighted / weight) : null
      };
    });

    const proposalValue = serviceLines.reduce((sum, line) => sum + Number(line.proposalValue || 0), 0) || null;
    const bdi = weightedMargin(serviceLines);
    const notes = [
      `Importado do pipeline (${Array.from(group.sourceSheets).join(", ")})`,
      group.city ? `Cidade: ${group.city}` : null,
      group.probability ? `Probabilidade: ${group.probability}` : null,
      group.rawProposalText && group.rawProposalText !== group.proposalNumberDisplay ? `Origem: ${group.rawProposalText}` : null
    ].filter(Boolean).join(" | ");

    return {
      proposalSequence: group.proposalSequence,
      proposalYear: group.proposalYear,
      proposalNumberDisplay: group.proposalNumberDisplay,
      issueDate: group.issueDate,
      managerName: group.managerName,
      clientName: group.clientName,
      documentType: group.documentType,
      leadSource: group.leadSource,
      industrySegment: group.industrySegment,
      status: group.status,
      probability: group.probability,
      proposalValue,
      bdi,
      serviceScope: serviceLines.map((line) => line.serviceType).join(", ") || null,
      notes,
      serviceLines,
      sourceFile
    };
  });
}

async function ensureImportStructures(client) {
  await client.query(`
    ALTER TABLE proposal_registry
    ADD COLUMN IF NOT EXISTS probability_level VARCHAR(20),
    ADD COLUMN IF NOT EXISTS uploaded_file_name TEXT,
    ADD COLUMN IF NOT EXISTS uploaded_storage_path TEXT,
    ADD COLUMN IF NOT EXISTS uploaded_mime_type TEXT,
    ADD COLUMN IF NOT EXISTS uploaded_file_size BIGINT
  `);

  await client.query(`
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

  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_proposal_registry_service_line
    ON proposal_registry_service_lines(proposal_registry_id, service_type)
  `);
}

async function saveServiceLines(client, proposalRegistryId, serviceLines) {
  await client.query(
    "DELETE FROM proposal_registry_service_lines WHERE proposal_registry_id = $1",
    [proposalRegistryId]
  );

  for (const line of serviceLines) {
    await client.query(
      `INSERT INTO proposal_registry_service_lines (
         proposal_registry_id, service_type, proposal_value, bdi
       ) VALUES ($1, $2, $3, $4)`,
      [proposalRegistryId, line.serviceType, line.proposalValue, line.bdi]
    );
  }
}

async function resolveSellerUserId(client, managerName) {
  if (!managerName) return null;
  const result = await client.query(
    `SELECT id
     FROM users
     WHERE LOWER(name) = LOWER($1)
     ORDER BY id
     LIMIT 1`,
    [managerName]
  );
  return result.rows[0]?.id || null;
}

async function importPipelineGroups(groups, sourceFile) {
  return withTransaction(async (client) => {
    await ensureImportStructures(client);

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let serviceLineCount = 0;

    for (const group of groups) {
      if (!group.proposalSequence || !group.clientName || !group.issueDate) {
        skipped += 1;
        continue;
      }

      const sellerUserId = await resolveSellerUserId(client, group.managerName);
      const existingResult = await client.query(
        `SELECT id, request_id, seller_user_id, branch_name, notes
         FROM proposal_registry
         WHERE proposal_sequence = $1
         LIMIT 1`,
        [group.proposalSequence]
      );
      const existing = existingResult.rows[0];

      if (existing) {
        await client.query(
          `UPDATE proposal_registry
           SET proposal_year = $2,
               proposal_number_display = $3,
               issue_date = $4::date,
               manager_name = COALESCE($5, manager_name),
               service_scope = COALESCE($6, service_scope),
               document_type = COALESCE($7, document_type),
               client_name = COALESCE($8, client_name),
               industry_segment = COALESCE($9, industry_segment),
               proposal_value = COALESCE($10, proposal_value),
               bdi = COALESCE($11, bdi),
               negotiation_status = COALESCE($12, negotiation_status),
               notes = COALESCE($13, notes),
               seller_user_id = COALESCE(seller_user_id, $14),
               lead_source = COALESCE($15, lead_source),
               probability_level = COALESCE($16, probability_level),
               imported_from_legacy = TRUE,
               legacy_source_file = $17,
               updated_at = NOW()
           WHERE id = $1`,
          [
            existing.id,
            group.proposalYear,
            group.proposalNumberDisplay,
            group.issueDate,
            group.managerName,
            group.serviceScope,
            group.documentType,
            group.clientName,
            group.industrySegment,
            group.proposalValue,
            group.bdi,
            group.status,
            group.notes || existing.notes || null,
            sellerUserId,
            group.leadSource,
            group.probability,
            sourceFile
          ]
        );

        await saveServiceLines(client, existing.id, group.serviceLines);
        updated += 1;
        serviceLineCount += group.serviceLines.length;
        continue;
      }

      const insertResult = await client.query(
        `INSERT INTO proposal_registry (
           proposal_sequence, proposal_year, proposal_number_display, issue_date,
           manager_name, service_scope, document_type, client_name, industry_segment,
           proposal_value, bdi, negotiation_status, notes,
           request_id, seller_user_id, branch_name, lead_source, probability_level,
           imported_from_legacy, legacy_source_file
         ) VALUES (
           $1, $2, $3, $4::date,
           $5, $6, $7, $8, $9,
           $10, $11, $12, $13,
           NULL, $14, NULL, $15, $16,
           TRUE, $17
         )
         RETURNING id`,
        [
          group.proposalSequence,
          group.proposalYear,
          group.proposalNumberDisplay,
          group.issueDate,
          group.managerName,
          group.serviceScope,
          group.documentType,
          group.clientName,
          group.industrySegment,
          group.proposalValue,
          group.bdi,
          group.status,
          group.notes,
          sellerUserId,
          group.leadSource,
          group.probability,
          sourceFile
        ]
      );

      await saveServiceLines(client, insertResult.rows[0].id, group.serviceLines);
      created += 1;
      serviceLineCount += group.serviceLines.length;
    }

    return { created, updated, skipped, serviceLineCount };
  });
}

async function main() {
  const sourceFile = process.argv[2] || "C:\\Users\\USER\\Desktop\\PIPILINE 2026 - 07.04.xlsx";
  const absolutePath = path.resolve(sourceFile);
  const workbookData = readWorkbookRows(absolutePath);
  const groups = groupPipelineRows(workbookData, path.basename(absolutePath));
  const result = await importPipelineGroups(groups, path.basename(absolutePath));
  console.log(`Pipeline processado: ${groups.length} proposta(s) consolidadas.`);
  console.log(`Criadas: ${result.created}`);
  console.log(`Atualizadas: ${result.updated}`);
  console.log(`Ignoradas: ${result.skipped}`);
  console.log(`Linhas de servico gravadas: ${result.serviceLineCount}`);
}

main().catch((error) => {
  console.error("Falha ao importar pipeline:", error.message);
  process.exit(1);
});
