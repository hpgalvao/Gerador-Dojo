# Gerador Dojô 🥋

Este projeto é uma ferramenta completa para gerar landing pages de alta conversão para Dojôs e Academias. Ele permite criar múltiplas rotas (ex: `/sao-paulo/jiu-jitsu`) a partir de um único painel administrativo.

## 👤 Sobre o Autor

Desenvolvido por **Helio P. Galvão**, professor de Jiu-Jitsu e Defesa Pessoal, além de Programador Fullstack com experiência desde 1998 (Clipper 5, Object Pascal, PHP, Python). 

Atualmente focado em soluções tecnológicas para nichos específicos como Academias e Restaurantes. 
- 🏢 Empresa: [SelectOne](https://selectone.com.br)
- 🥋 Equipe: [Golden Fight](https://goldenfight.com.br)

## 📥 Como Clonar do GitHub

Este projeto oficial está hospedado em:
**[https://github.com/hpgalvao/Gerador-Dojo](https://github.com/hpgalvao/Gerador-Dojo)**

Para utilizar em seu computador:

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/hpgalvao/Gerador-Dojo.git
   cd Gerador-Dojo
   ```
2. **Instale as dependências**:
   ```bash
   npm install
   ```
3. **Configure as variáveis de ambiente**:
   Crie um arquivo `.env` baseado no `.env.example` e adicione sua `GEMINI_API_KEY`.
4. **Rode o projeto**:
   ```bash
   npm run dev
   ```

## 🛠️ Instalação Local (Manual)

Para rodar este projeto no seu computador:

1. **Abra o terminal** na pasta do projeto.
2. **Instale as dependências**: `npm install`
3. **Inicie o servidor**: `npm run dev`
4. Acesse `http://localhost:3000/admin`.

## 🗄️ Sobre o Banco de Dados (Firebase)

Diferente de sistemas antigos que salvam dados em um arquivo no seu PC, este projeto usa o **Firebase Firestore (Google)**:

*   **Vantagem**: Se o seu PC quebrar, os dados das páginas e os leads continuam seguros na nuvem.
*   **Acesso de qualquer lugar**: Você pode abrir o painel `/admin` de qualquer lugar do mundo e configurar suas páginas.
*   **Persistência**: Mesmo que você baixe o projeto no seu computador, ele continuará lendo os dados do seu projeto Firebase configurado. Se você quiser que o banco de dados seja "só seu", você deve criar um projeto no console do Firebase e substituir o arquivo `firebase-applet-config.json` e as chaves em `src/lib/firebase.ts`.

## 🔗 Integração com CRM (Webhooks)

Você pode enviar os leads capturados para sistemas como **RD Station, Komo CRM, Bitrix24 ou Zapier**:

1. No Painel Administrativo, vá na configuração da sua Landing Page.
2. No campo **Webhook CRM**, cole a URL fornecida pelo seu sistema de CRM.
3. Toda vez que um lead preencher o formulário, enviaremos um **POST JSON** para essa URL com:
    *   Nome, E-mail e Telefone.
    *   Cidade e Modalidade.
    *   Código da Campanha.
    *   Data e Hora da submissão.

## 🖼️ Branding e Logos

Agora cada landing page pode ter sua própria identidade:
- **Nome da Academia**: Aparece no topo da página e nos metadados (SEO).
- **URL da Logo**: Você pode colar o link direto da sua logo (.png ou .svg). Se a sua logo já contiver o símbolo e o nome, sugerimos deixar o campo "Nome da Academia" vazio se preferir apenas a imagem.

## 🌐 Como Hospedar (Deploy)

Este app utiliza **React (Vite)** e **Express**.

### Opção A: Hospedagem Estática (HTML/CSS/JS)
1. Rode: `npm run build`
2. Suba o conteúdo da pasta `dist` para o seu servidor.
3. *Atenção: O assistente de IA exige um servidor rodando Node.js. Se usar hospedagem estática pura, o botão de "Gerar com IA" não funcionará.*

### Opção B: Deploy via SSH (Linux)
Use o comando sugerido no painel "SSH Settings" para enviar via linha de comando.

## 🧠 Assistente de IA
O painel administrativo possui um botão "Mágica". Ele utiliza o modelo Gemini da Google para sugerir títulos e textos de venda persuasivos baseados na cidade e modalidade informadas. 
