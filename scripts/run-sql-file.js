const fs = require("fs");
const path = require("path");
const { query } = require("../db");

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    throw new Error("Informe o caminho do arquivo SQL.");
  }

  const filePath = path.resolve(fileArg);
  const sql = fs.readFileSync(filePath, "utf8");
  if (!sql.trim()) {
    throw new Error(`Arquivo SQL vazio: ${filePath}`);
  }

  await query(sql);
  console.log(`SQL aplicado com sucesso: ${filePath}`);
}

main().catch((error) => {
  console.error("Falha ao aplicar SQL:", error.message);
  process.exit(1);
});
