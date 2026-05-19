# Dojô Landing Page Generator 🥋

Este projeto é uma ferramenta completa para gerar landing pages de alta conversão para Dojôs e Academias. Ele permite criar múltiplas rotas (ex: `/sao-paulo/jiu-jitsu`) a partir de um único painel administrativo.

## 🛠️ Instalação Local (Windows/Linux/Mac)

Para rodar este projeto no seu computador, você precisará do [Node.js](https://nodejs.org/) instalado.

1. **Extraia os arquivos** do projeto em uma pasta.
2. **Abra o terminal** (CMD ou terminal do Linux) na pasta do projeto.
3. **Instale as dependências**:
   ```bash
   npm install
   ```
4. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```
5. Acesse `http://localhost:3000/admin` no seu navegador.

## 🌐 Como Hospedar

Este app utiliza **React (Vite)** e **Firebase**.

### Opção A: Hospedagem Estática (HTML/CSS/JS)
1. No seu terminal, rode:
   ```bash
   npm run build
   ```
2. O comando vai gerar uma pasta chamada `dist`.
3. **Suba o conteúdo** desta pasta `dist` para o seu servidor via FTP ou SSH.
   * *Nota: Como as rotas são dinâmicas (SPA), seu servidor (Nginx/Apache) deve estar configurado para redirecionar todas as rotas para o `index.html`.*

### Opção B: Deploy via SSH (Linux)
Se você tiver acesso SSH, pode automatizar o envio:
```bash
scp -r dist/* usuario@seu-ip:/caminho/da/pasta/site
```

## 🧠 Assistente de IA
O painel administrativo possui um botão "Gerar com IA". Ele utiliza o modelo Gemini da Google para sugerir textos de venda baseados na cidade e modalidade informadas. 

## 🔍 SEO e Analytics
- O **Google Tag Manager** já está configurado no arquivo `index.html`. 
- Certifique-se de alterar as variáveis no Firebase (`src/lib/firebase.ts`) se quiser usar seu próprio banco de dados.
