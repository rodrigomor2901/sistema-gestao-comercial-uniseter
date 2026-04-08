const path = require("path");
const fs = require("fs");
const { spawnSync } = require("child_process");
const { withTransaction } = require("../db");

function readExcelRows(filePath) {
  const escapedPath = filePath.replace(/'/g, "''");
  const tempDir = path.join(__dirname, "..", ".tmp");
  fs.mkdirSync(tempDir, { recursive: true });
  const tempCsvPath = path.join(tempDir, `proposal-history-${Date.now()}.csv`);
  const escapedCsvPath = tempCsvPath.replace(/'/g, "''");
  const script = `
$ErrorActionPreference = 'Stop'
$path = '${escapedPath}'
$csvPath = '${escapedCsvPath}'
$connString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$path;Extended Properties='Excel 12.0 Xml;HDR=YES;IMEX=1';"
$conn = New-Object System.Data.OleDb.OleDbConnection($connString)
$conn.Open()
$schema = $conn.GetOleDbSchemaTable([System.Data.OleDb.OleDbSchemaGuid]::Tables, $null)
$sheet = $schema.Rows[0]["TABLE_NAME"]
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT * FROM [$sheet]"
$adapter = New-Object System.Data.OleDb.OleDbDataAdapter($cmd)
$table = New-Object System.Data.DataTable
[void]$adapter.Fill($table)
$conn.Close()
$table | Export-Csv -LiteralPath $csvPath -NoTypeInformation -Encoding UTF8
`;

  const result = spawnSync(
    "powershell",
    ["-NoProfile", "-Command", script],
    { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "Falha ao ler a planilha do Excel.");
  }

  if (!fs.existsSync(tempCsvPath)) {
    throw new Error("Falha ao gerar o CSV temporario da planilha.");
  }

  const csvPath = tempCsvPath;
  const csvContent = fs.readFileSync(csvPath, "utf8");
  fs.unlinkSync(csvPath);

  const [headerLine, ...dataLines] = csvContent.split(/\r?\n/).filter(Boolean);
  if (!headerLine) return [];

  const delimiter = detectDelimiter(headerLine);
  const headers = parseCsvLine(headerLine, delimiter);
  return dataLines.map((line) => {
    const values = parseCsvLine(line, delimiter);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    return row;
  });
}

function readCsvRows(filePath) {
  const csvContent = fs.readFileSync(filePath, "utf8");
  const [headerLine, ...dataLines] = csvContent
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (!headerLine) return [];

  const delimiter = detectDelimiter(headerLine);
  const headers = parseCsvLine(headerLine, delimiter).map((header) =>
    String(header || "").replace(/^\uFEFF/, "").trim()
  );

  return dataLines.map((line) => {
    const values = parseCsvLine(line, delimiter);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    return row;
  });
}

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
  const text = String(value || "").trim();
  if (!text) return null;

  const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

function toNumber(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text.replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeLegacyRow(row, sourceFile) {
  const proposalSequence = Number(String(row.Numero || "").trim());
  const issueDate = parsePtDate(row.Data);
  const proposalYear = issueDate ? Number(issueDate.slice(0, 4)) : new Date().getFullYear();
  const display = String(row.Formato || `${proposalSequence}/${proposalYear}`).trim();

  return {
    proposalSequence,
    proposalYear,
    proposalNumberDisplay: display,
    issueDate,
    managerName: String(row.Gestor || "").trim() || null,
    serviceScope: String(row.Empresa || "").trim() || null,
    documentType: String(row.Tipo || "").trim() || null,
    clientName: String(row.Cliente || "").trim() || null,
    contactName: String(row.Contato || "").trim() || null,
    phone: String(row.Telefone || "").trim() || null,
    industrySegment: String(row.Ramo || "").trim() || null,
    proposalValue: toNumber(row.Valor),
    bdi: toNumber(row.BDI),
    negotiationStatus: String(row.Status || "").trim() || null,
    notes: String(row.Observacao || "").trim() || null,
    importedFromLegacy: true,
    legacySourceFile: sourceFile
  };
}

async function importRows(rows, sourceFile) {
  return withTransaction(async (client) => {
    let imported = 0;

    for (const rawRow of rows) {
      const row = normalizeLegacyRow(rawRow, sourceFile);
      if (!row.proposalSequence || !row.issueDate || !row.clientName) {
        continue;
      }

      await client.query(
        `INSERT INTO proposal_registry (
          proposal_sequence, proposal_year, proposal_number_display, issue_date,
          manager_name, service_scope, document_type, client_name, contact_name,
          phone, industry_segment, proposal_value, bdi, negotiation_status, notes,
          imported_from_legacy, legacy_source_file
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15,
          $16, $17
        )
        ON CONFLICT (proposal_sequence) DO UPDATE SET
          proposal_year = EXCLUDED.proposal_year,
          proposal_number_display = EXCLUDED.proposal_number_display,
          issue_date = EXCLUDED.issue_date,
          manager_name = EXCLUDED.manager_name,
          service_scope = EXCLUDED.service_scope,
          document_type = EXCLUDED.document_type,
          client_name = EXCLUDED.client_name,
          contact_name = EXCLUDED.contact_name,
          phone = EXCLUDED.phone,
          industry_segment = EXCLUDED.industry_segment,
          proposal_value = EXCLUDED.proposal_value,
          bdi = EXCLUDED.bdi,
          negotiation_status = EXCLUDED.negotiation_status,
          notes = EXCLUDED.notes,
          imported_from_legacy = TRUE,
          legacy_source_file = EXCLUDED.legacy_source_file,
          updated_at = NOW()`,
        [
          row.proposalSequence,
          row.proposalYear,
          row.proposalNumberDisplay,
          row.issueDate,
          row.managerName,
          row.serviceScope,
          row.documentType,
          row.clientName,
          row.contactName,
          row.phone,
          row.industrySegment,
          row.proposalValue,
          row.bdi,
          row.negotiationStatus,
          row.notes,
          row.importedFromLegacy,
          row.legacySourceFile
        ]
      );

      imported += 1;
    }

    return imported;
  });
}

async function main() {
  const sourceFile = process.argv[2] || "C:\\Users\\USER\\Downloads\\propostas_uniseter_2026-04-07.xlsx";
  const absolutePath = path.resolve(sourceFile);
  const extension = path.extname(absolutePath).toLowerCase();
  const rows = extension === ".csv" ? readCsvRows(absolutePath) : readExcelRows(absolutePath);
  const imported = await importRows(rows, path.basename(absolutePath));
  console.log(`Importacao concluida. ${imported} registro(s) processado(s) de ${absolutePath}.`);
}

main().catch((error) => {
  console.error("Falha na importacao do historico:", error.message);
  process.exit(1);
});
