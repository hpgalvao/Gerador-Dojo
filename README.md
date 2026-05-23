# ChatFlow & Dojo Landing Page Generator 🥋

Sistema profissional para criação e gestão de Landing Pages, funis de atendimento e Chat Flows para Academias de Artes Marciais, integrado ao Firebase e inteligência artificial.

Este repositório fornece todas as ferramentas necessárias para rodar o projeto localmente ou em produção do início ao fim.

---

## 🛠️ Pré-requisitos: Instalação Rápida (Git e Node.js)

Se você ainda não possui o **Git** e o **Node.js (versão 18 ou superior)** instalados no seu computador ou servidor, utilize os comandos rápidos de terminal abaixo:

### No Windows (PowerShell como Administrador)
Abra o PowerShell como Administrador e rode o comando abaixo para instalar o Node.js LTS e o Git automaticamente:
```powershell
winget install -e --id OpenJS.NodeJS.LTS ; winget install -e --id Git.Git
```
*(Após a instalação, reinicie o terminal para atualizar as variáveis de ambiente).*

### No Linux (Ubuntu/Debian)
Execute o comando abaixo no terminal para atualizar o gerenciador de pacotes e instalar as versões mais recentes do Git e do Node.js:
```bash
sudo apt update && sudo apt install -y git curl && curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
```

---

## 📂 Como Clonar o Projeto e Preparar o Código

Depois de ter o Git e Node.js instalados, abra o terminal na pasta onde deseja hospedar seu projeto e rode:

```bash
# 1. Clonar o repositório
git clone https://github.com/hpgalvao/Gerador-Dojo chatflow-app

# 2. Entrar na pasta do projeto
cd chatflow-app

# 3. Criar o arquivo de configuração de ambiente (.env) a partir do exemplo
cp .env.example .env
```

---

## 🔐 Configurando suas Credenciais e Variáveis (.env)

Abra o arquivo `.env` recém-criado em seu editor de código e configure os seguintes prâmetros:

| Variável | Descrição | Exemplo / Sugestão |
| :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Chave de API única obtida no console Firebase. | `AIzaSyA1...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domínio de autenticação do seu app Firebase. | `meu-app.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Identificador único do seu projeto. | `meu-app-1234` |
| `VITE_FIREBASE_STORAGE_BUCKET`| Link do repositório Firebase Storage. | `meu-app.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Identificador para envio de mensagens push. | `98765432101` |
| `VITE_FIREBASE_APP_ID` | Código de identificação interna do aplicativo web. | `1:98765:web:abcd` |
| `VITE_ADMIN_PATH` | Rota secreta de acesso para acessar o painel administrativo. | `/painel-exclusivo` |
| `VITE_UPLOAD_PATH` | Pasta de destino para uploads e galeria de imagens. | `/uploads` |
| `VITE_PIX_KEY` | Chave PIX da academia para cobranças de planos/matrículas. | `financeiro@seu-dominio.com.br` |
| `VITE_PIX_QR_CODE` | API de geração automática de QR Code PIX dinâmico. | `https://api.qrserver.com/...` |

---

## 🔑 Onde e Como pegar suas Credenciais do Firebase & Google

Siga o passo a passo abaixo para criar e adquirir as chaves necessárias no console do Google e do Firebase de graça:

1. **Acesse o Firebase Console:**
   Entre em [console.firebase.google.com](https://console.firebase.google.com/) com sua conta Google.

2. **Crie um Novo Projeto:**
   * Clique em **"Adicionar projeto"** (ou "Criar projeto").
   * Insira um nome descritivo (ex: `ChatFlow Dojo`) e siga as instruções na tela.
   * Recomendamos manter o Google Analytics ativado caso deseje métricas futuras.

3. **Adicione um Aplicativo Web ao Projeto:**
   * Na página inicial do seu novo projeto, clique no ícone de tag web **`</>`** (Web App).
   * Registre o aplicativo dando um nome (ex: `Web App Dojo`).
   * O console do Firebase irá exibir um código JavaScript contendo o objeto `firebaseConfig`.
   * ** Copie esses campos** e cole-os nas respectivas variáveis no seu arquivo `.env` (conforme detalhado na seção acima).

4. **Ative a Autenticação e o Firestore Database:**
   * No menu esquerdo, vá em **Build > Authentication** e clique em **Começar (Get Started)**. Escolha o método de login por e-mail/senha.
   * No menu esquerdo, clique em **Build > Firestore Database** e clique em **Criar banco de dados**. Inicie no modo de teste ou de produção e selecione a região mais próxima ao seu servidor.

---

## 🐋 Executando em Produção com Docker Compose & Volume Persistente

Caso queira hospedar a aplicação continuamente utilizando **Docker**, disponibilizamos a configuração otimizada abaixo para o seu arquivo `docker-compose.yml`. 

Esta configuração inclui a persistência da pasta `public` (essencial para que as mídias, imagens e uploads enviados pela galeria administrativa sobrevivam aos reinícios do container) e configura o proxy reverso **Traefik**:

### `docker-compose.yml`

```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: chatflow
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - VITE_ADMIN_PATH=/seu-admin-secreto
      # Adicione as variáveis do Firebase aqui se desejar injetar em tempo de build
      - VITE_FIREBASE_API_KEY=sua-chave-aqui
      - VITE_FIREBASE_AUTH_DOMAIN=seu-auth-domain
      - VITE_FIREBASE_PROJECT_ID=seu-project-id
      - VITE_FIREBASE_STORAGE_BUCKET=seu-bucket
      - VITE_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
      - VITE_FIREBASE_APP_ID=seu-app-id
      - VITE_PIX_KEY=sua-chave-pix
    volumes:
      # Pasta public persistente para garantir integridade dos uploads de imagens e mídias do usuário
      - ./public:/app/public
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.chatflow.rule=Host(`seu-dominio.com.br`)"
      - "traefik.http.routers.chatflow.entrypoints=websecure"
      - "traefik.http.routers.chatflow.tls.certresolver=myresolver"
      - "traefik.http.services.chatflow.loadbalancer.server.port=3000"

networks:
  default:
    external:
      name: web # Rede onde o Traefik está rodando
```

Para subir o container em segundo plano:
```bash
docker compose up -d --build
```

---

## 🚀 Desenvolvimento Local (Sem Docker)

Se preferir rodar localmente no seu computador tradicional para desenvolvimento ou testes rápidos:

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   A aplicação estará rodando no endereço exibido no terminal (geralmente `http://localhost:3000`).

3. **Gerar Versão de Produção estática:**
   ```bash
   npm run build
   ```
   Isso compilará os arquivos otimizados gerando a pasta `/dist`.
