# Gerador Dojô 🥋

Este projeto é uma ferramenta completa para gerar landing pages de alta conversão para Dojôs e Academias. Ele permite criar múltiplas rotas (ex: `/sao-paulo/jiu-jitsu`) a partir de um único painel administrativo.

## 👤 Sobre o Autor

Desenvolvido por **Helio P. Galvão**, professor de Jiu-Jitsu e Defesa Pessoal, além de Programador Fullstack com experiência desde 1998 (Clipper 5, Object Pascal, PHP, Python, Lua, Node, etc...). 

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

## 🔐 Segurança e Acesso Admin

Para proteger seus dados e as configurações das suas páginas:

1.  **Autenticação**: O painel `/admin` agora é protegido por login.
2.  **Criando seu Usuário**:
    -   No [Firebase Console](https://console.firebase.google.com/), vá em **Authentication**.
    -   Ative o método **E-mail/Senha**.
    -   Clique em **Add User** e crie seu e-mail e senha de acesso.
3.  **Regras do Banco**: As regras no arquivo `firestore.rules` garantem que apenas você (autenticado) possa ler os leads e editar as páginas. As landing pages continuam públicas para os seus alunos.

## 🗄️ Sobre o Banco de Dados (Firebase)

Diferente de sistemas antigos que salvam dados em um arquivo no seu PC, este projeto usa o **Firebase Firestore (Google)**:

*   **Segurança e Privacidade**: O arquivo `firebase-applet-config.json` (que contém as chaves para o banco de dados oficial) está no `.gitignore`. Isso significa que **quem clonar o seu projeto NÃO terá acesso aos seus dados**, a menos que você forneça as chaves manualmente.
*   **Vantagem**: Se o seu PC quebrar, os dados das páginas e os leads continuam seguros na nuvem do Google.
*   **Configuração para novos usuários**: Se você clonou este projeto e quer usar seu próprio banco:
    1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
    2. Ative o **Firestore Database** e o **Authentication** (método E-mail/Senha).
    3. No console, vá em **Configurações do Projeto** (ícone de engrenagem) > **Geral**.
    4. Role até "Seus aplicativos" e adicione um novo **Web App** (ícone `</>`).
    5. Copie os valores do objeto `firebaseConfig` que aparecerão na tela.
    6. Crie um arquivo `.env` na raiz do projeto e preencha as variáveis `VITE_FIREBASE_*` conforme os exemplos no arquivo `.env.example`.

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

## ⚖️ Licença e Créditos

Este projeto está sob a licença MIT com uma cláusula de atribuição:
- Você é livre para usar, clonar e modificar.
- **Deve manter os créditos** e o link para o repositório original de **Helio P. Galvão**.
- Uma barra de créditos discreta é mantida no rodapé para fortalecer a comunidade de desenvolvedores de artes marciais.
