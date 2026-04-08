# Sistema de Gestão Comercial

## Visão geral

Aplicação web interna da Uniseter para:
- CRM comercial de propostas
- workflow de solicitação, triagem, negociação e contrato
- módulo de número de proposta
- relatórios e funil de vendas

## Estrutura principal

- `server.js`: servidor HTTP e regras de negócio
- `db.js`: conexão com PostgreSQL
- `public/index.html`: interface principal
- `public/styles.css`: estilos
- `public/app.js`: frontend da aplicação
- `scripts/`: importações e utilitários

## Como rodar localmente

```powershell
cd "C:\Users\USER\Documents\Rodrigo\Requisição de Proposta\crm-app"
. .\db-config.example.ps1
npm start
```

Depois abra:

```text
http://localhost:3100
```

## Como rodar com Docker

### Subida local com Docker Desktop

Na pasta da aplicação:

```powershell
cd "C:\Users\USER\Documents\Rodrigo\Requisição de Proposta\crm-app"
docker compose up --build
```

Depois abra:

```text
http://localhost:3100
```

O `docker-compose.yml` já sobe:
- aplicação Node.js
- PostgreSQL
- volume persistente do banco
- volume persistente dos uploads

### Parar os containers

```powershell
docker compose down
```

### Parar mantendo os dados

```powershell
docker compose down
```

### Parar e apagar volumes

```powershell
docker compose down -v
```

Use `-v` apenas se quiser apagar banco e uploads do ambiente Docker local.

## Preparação do banco

1. Crie o banco `crm_propostas`
2. Rode [C:\Users\USER\Documents\Rodrigo\Requisição de Proposta\schema-crm-propostas.sql](C:\Users\USER\Documents\Rodrigo\Requisição de Proposta\schema-crm-propostas.sql)
3. Configure as variáveis de ambiente

## Configuração para produção

Use o arquivo:

- [C:\Users\USER\Documents\Rodrigo\Requisição de Proposta\crm-app\production-config.example.ps1](C:\Users\USER\Documents\Rodrigo\Requisição de Proposta\crm-app\production-config.example.ps1)

Ele já traz os principais parâmetros:
- `NODE_ENV`
- `HOST`
- `PORT`
- `APP_BASE_URL`
- `APP_UPLOADS_DIR`
- `SESSION_TTL_HOURS`
- `PGHOST`
- `PGPORT`
- `PGDATABASE`
- `PGUSER`
- `PGPASSWORD`
- `PGSSLMODE` opcional

## Publicação simples em plano Hobby

Uma forma prática para começar sem servidor físico é usar:
- app em container Docker
- PostgreSQL gerenciado
- volume/persistência para uploads

### Estrutura recomendada

- aplicar o `Dockerfile` deste projeto
- usar variáveis de ambiente da plataforma
- apontar para um PostgreSQL online
- definir `APP_UPLOADS_DIR` para um caminho persistente da plataforma

### Variáveis mínimas

- `NODE_ENV=production`
- `HOST=0.0.0.0`
- `PORT`
- `APP_BASE_URL`
- `APP_UPLOADS_DIR`
- `SESSION_TTL_HOURS`
- `PGHOST`
- `PGPORT`
- `PGDATABASE`
- `PGUSER`
- `PGPASSWORD`

### Healthcheck

Depois de subir, valide:

```text
/health
```

Se estiver correto, retorna:
- `status: ok`
- ambiente
- diretório de uploads
- timestamp

## Subida em servidor da empresa

### 1. Pré-requisitos

- Node.js instalado
- PostgreSQL instalado ou acesso a banco corporativo
- pasta para uploads com permissão de escrita

### 2. Configurar ambiente

Edite [C:\Users\USER\Documents\Rodrigo\Requisição de Proposta\crm-app\production-config.example.ps1](C:\Users\USER\Documents\Rodrigo\Requisição de Proposta\crm-app\production-config.example.ps1) com:
- endereço do banco
- senha do banco
- URL interna da aplicação
- pasta definitiva de uploads

### 3. Subir a aplicação

```powershell
cd "C:\Users\USER\Documents\Rodrigo\Requisição de Proposta\crm-app"
. .\production-config.example.ps1
npm start
```

### 4. Testar saúde do servidor

Abra:

```text
http://SERVIDOR-EMPRESA:3100/health
```

Se estiver correto, a aplicação retorna:
- `status: ok`
- ambiente
- diretório de uploads
- timestamp

## Banco com SSL

Se o PostgreSQL corporativo exigir SSL:

```powershell
$env:PGSSLMODE="require"
```

ou

```powershell
$env:DB_SSL="true"
```

## Boas práticas antes de colocar em uso

- definir backup diário do PostgreSQL
- definir backup da pasta de uploads
- validar com 1 usuário de cada perfil:
  - vendedor
  - propostas
  - diretoria
  - administrador
- revisar acesso por rede interna ou VPN

## Próximo passo recomendado

Depois da homologação interna:
- configurar a aplicação para iniciar automaticamente no servidor
- publicar um atalho/URL oficial para os usuários
- fazer uma rodada curta de validação com a operação
