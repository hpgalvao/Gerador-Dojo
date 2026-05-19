# Dojô Landing Page Generator 🥋

Sistema de criação de Landing Pages e Chat Flows para Artes Marciais, com integração Firebase e IA.

## 🚀 Como Executar (Docker Compose + Traefik)

Se você deseja realizar o deploy em seu próprio servidor utilizando Docker, aqui está a configuração recomendada.

### `docker-compose.yml`

```yaml
services:
  app:
    build: .
    container_name: dojo-app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - VITE_ADMIN_PATH=/seu-admin-secreto
      # Adicione as variáveis do Firebase aqui se desejar buildar em tempo de execução
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dojo.rule=Host(`seu-dominio.com.br`)"
      - "traefik.http.routers.dojo.entrypoints=websecure"
      - "traefik.http.routers.dojo.tls.certresolver=myresolver"
      - "traefik.http.services.dojo.loadbalancer.server.port=3000"

networks:
  default:
    external:
      name: web # Rede onde o Traefik está rodando
```

### Configurações Importantes

1.  **VITE_ADMIN_PATH**: Altere esta variável no `.env` antes do build para proteger seu painel.
2.  **Firebase**: Certifique-se de preencher todas as chaves no arquivo `.env`.
3.  **Traefik**: Esta configuração assume que você já possui um Traefik rodando na rede `web` com um `certresolver` chamado `myresolver`.

## 🛠 Desenvolvimento

```bash
npm install
npm run dev
```

## 📦 Build para Produção

```bash
npm run build
```
