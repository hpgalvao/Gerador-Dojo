
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
      const text = response.text();
      
      // Extract JSON from response (handling potential markdown blocks)
      const jsonStr = text.replace(/```json|```/g, "").trim();
      res.json(JSON.parse(jsonStr));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao gerar texto com IA." });
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
