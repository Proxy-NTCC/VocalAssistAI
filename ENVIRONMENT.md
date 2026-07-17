# Environment-Specific Configuration Management

This document provides setup instructions, a list of required variables, and sample `.env` files to configure **VocalAssistAI** across **Development**, **Staging**, and **Production** environments.

---

## 1. Overview of Environments

| Environment | Purpose | Target Services | Host/Endpoints |
| :--- | :--- | :--- | :--- |
| **Development** | Local coding, testing, and debugging. | Local MongoDB, Mock API servers, Local n8n instance. | `localhost` / `http` |
| **Staging** | Pre-production testing with simulated workloads. | MongoDB Staging Atlas Cluster, Staging Pinecone/Airtable. | Private Staging subdomains / `https` |
| **Production** | Live system handling customer support tickets. | Production MongoDB Cluster, Production Pinecone index, Live Airtable base. | Public Production domains / `https` |

---

## 2. Required Variables

The system consists of three main modules that require configuration:
1. **Backend Service** (Express API + MongoDB)
2. **Frontend Service** (React / Vite)
3. **n8n Workflow Engine** (incorporating the custom Location Extractor node)

### 2.1. Backend Variables
* `PORT` (Optional): Port number for the Express server (default: `3000`).
* `MONGO_URI` (Required): Connection URI for the MongoDB database instance.

### 2.2. Frontend Variables
* `VITE_API_URL` (Required): The URL of the backend Express API.

### 2.3. n8n / Custom Node Variables
* `OPENAI_API_KEY` (Required): Credentials to connect to the OpenAI or LLM Gateway.
* `OPENAI_API_PROTOCOL` (Optional): Protocol to communicate with the OpenAI API (`https` or `http`, default: `https`).
* `OPENAI_API_HOST` (Optional): Host address for the OpenAI API (default: `api.openai.com`).
* `OPENAI_API_PORT` (Optional): Port for the OpenAI API (default: `443` or `80`).
* `OPENAI_API_PATH` (Optional): Path to chat completion endpoint (default: `/v1/chat/completions`).
* `AIRTABLE_BASE_ID` (Required): Airtable Base ID containing the CRM ticket sync tables.
* `AIRTABLE_TABLE_NAME` (Required): Name of the Table in the Airtable base.
* `AIRTABLE_PAT` (Required): Personal Access Token to authenticate against the Airtable API.
* `PINECONE_API_KEY` (Required): API Key for the Pinecone vector database.
* `PINECONE_INDEX` (Required): Index name for similarity searches in Pinecone.

---

## 3. Sample `.env` Templates

### 3.1. Development Environment (Local)

#### Backend (`Backend/backend-26/backend-26/.env.development`)
```ini
PORT=3000
MONGO_URI=mongodb://localhost:27017/vocal_assist_dev
```

#### Frontend (`Frontend/Frontend/Frontend-Demo/.env.development`)
```ini
VITE_API_URL=http://localhost:3000
```

#### n8n Node / Process Configuration
```bash
OPENAI_API_KEY=your-local-development-openai-key
OPENAI_API_PROTOCOL=http
OPENAI_API_HOST=localhost
OPENAI_API_PORT=8080
OPENAI_API_PATH=/v1/chat/completions
```

> [!NOTE]
> In local development, you can point `OPENAI_API_HOST` to a local Mock server or LLM endpoint (like LocalAI or Ollama) running on `http://localhost:8080` to save credits and support offline development.

---

### 3.2. Staging Environment

#### Backend (`.env.staging`)
```ini
PORT=3000
MONGO_URI=mongodb+srv://staging_user:secure_pwd@cluster-staging.mongodb.net/vocal_assist_staging?retryWrites=true&w=majority
```

#### Frontend (`.env.staging`)
```ini
VITE_API_URL=https://api-staging.vocalassist.internal
```

#### n8n Node / Process Configuration
```bash
OPENAI_API_KEY=sk-proj-stagingOpenAiKey1029384756
OPENAI_API_PROTOCOL=https
OPENAI_API_HOST=api.openai.com
OPENAI_API_PORT=443
OPENAI_API_PATH=/v1/chat/completions
```

---

### 3.3. Production Environment

#### Backend (`.env.production`)
```ini
PORT=80
MONGO_URI=mongodb+srv://prod_user:ultra_secure_pwd@cluster-prod.mongodb.net/vocal_assist_prod?retryWrites=true&w=majority
```

#### Frontend (`.env.production`)
```ini
VITE_API_URL=https://api.vocalassistai.com
```

#### n8n Node / Process Configuration
```bash
OPENAI_API_KEY=sk-proj-prodOpenAiKey998877665544332211
OPENAI_API_PROTOCOL=https
OPENAI_API_HOST=api.openai.com
OPENAI_API_PORT=443
OPENAI_API_PATH=/v1/chat/completions
```

---

## 4. Setup Instructions

### Step 1: Copy Configuration Files
For each of your subprojects, duplicate the configuration template and create your target `.env` file:
* **Backend**: Copy `Backend/backend-26/backend-26/.env` (or create it if it doesn't exist) and populate with your credentials.
* **Frontend**: Create `Frontend/Frontend/Frontend-Demo/.env` and set `VITE_API_URL`.

### Step 2: Inject Variables into the n8n Container / Process
When launching the n8n automation server (for instance, via Docker Compose), inject the environment variables:

```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - N8N_PORT=5678
      - OPENAI_API_KEY=sk-proj-your-openai-api-key
      - OPENAI_API_PROTOCOL=https
      - OPENAI_API_HOST=api.openai.com
      - OPENAI_API_PORT=443
      - OPENAI_API_PATH=/v1/chat/completions
    restart: always
```

### Step 3: Verify Variable Ingestion
1. Launch n8n.
2. Add the custom **Location Extractor** node to a workflow.
3. Observe that the **OpenAI API Key** field defaults to `={{ $env.OPENAI_API_KEY }}`.
4. Execute the node. It will automatically query the designated host using the key set in the Docker environment.
