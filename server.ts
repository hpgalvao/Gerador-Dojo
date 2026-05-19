
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for AI Content Generation
  app.post("/api/generate-copy", async (req, res) => {
    const { city, modality } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY não configurada no servidor." });
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Gere um texto de venda curto e impactante para uma landing page de um dojô. 
      Cidade: ${city}
      Modalidade: ${modality}
      O texto deve ter um título chamativo e um parágrafo persuasivo que destaque os benefícios como disciplina e saúde.
      Responda no formato JSON: {"title": "...", "description": "..."}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Não foi possível encontrar JSON na resposta da IA.");
      }
      
      const jsonStr = jsonMatch[0];
      res.json(JSON.parse(jsonStr));
    } catch (error) {
      console.error("AI Copy Generation Error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Erro desconhecido ao gerar copy." });
    }
  });

  app.post("/api/generate-chat", async (req, res) => {
    const { city, modality } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY não configurada no servidor." });
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Gere um script de chatbot persuasivo para um dojô em ${city} focado em ${modality}.
      O objetivo é capturar o nome e whatsapp para agendar aula experimental.
      Use uma mistura de perguntas de texto, botões e listas.
      Tipos permitidos: "text", "buttons", "image_options", "listbox", "media".
      Formato JSON para o campo 'steps':
      [
        {"id": "1", "type": "text", "message": "Olá... qual seu nome?"},
        {"id": "2", "type": "buttons", "message": "...", "options": [{"label": "Sim", "value": "sim", "nextStepId": "3"}]},
        ...
      ]
      Responda APENAS o JSON com os campos: 
      {
        "contactName": "Mestre Helio",
        "contactPhotoUrl": "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=200&h=200&fit=crop",
        "steps": [...]
      }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Extract JSON using a more robust method
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Não foi possível encontrar JSON na resposta da IA.");
      }
      
      const jsonStr = jsonMatch[0];
      res.json(JSON.parse(jsonStr));
    } catch (error) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Erro desconhecido ao gerar chat." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production build logic logic
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
