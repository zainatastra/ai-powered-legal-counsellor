const path = require('path');
const express = require('express');
const OpenAI = require('openai');
const dotenv = require('dotenv');

// Keep using the existing chatbot-ui/.env so the project does not need
// a second copy of the OpenAI credential.
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.REACT_APP_OPENAI_API_KEY;

app.use(express.json({ limit: '32kb' }));

const systemInstructions = `You are an AI-powered legal advisor with expertise in Pakistan Penal Code 1860, Constitution of Pakistan 1973, PECA Act (Cybercrime Laws), Family & Inheritance Laws. Refer to exact sections or articles when possible. Avoid making up laws. If unsure, say "Please consult a qualified lawyer." Do not give any answer to a prompt other than legal query or Pakistan laws.`;

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    openaiConfigured: Boolean(OPENAI_API_KEY),
    model: MODEL
  });
});

app.post('/api/legal-chat', async (req, res) => {
  const message = typeof req.body?.message === 'string'
    ? req.body.message.trim()
    : '';

  if (!message) {
    return res.status(400).json({
      message: 'Please enter a legal question.'
    });
  }

  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not configured.');
    return res.status(503).json({
      message: 'The AI service is not configured on the server.'
    });
  }

  try {
    const client = new OpenAI({
      apiKey: OPENAI_API_KEY
    });

    const response = await client.responses.create({
      model: MODEL,
      instructions: systemInstructions,
      input: message,
      store: false
    });

    const text = response.output_text?.trim();

    if (!text) {
      return res.status(502).json({
        message: 'The AI service returned an empty response.'
      });
    }

    return res.json({ text });
  } catch (error) {
    console.error('OpenAI request failed:', {
      status: error?.status,
      code: error?.code,
      message: error?.message
    });

    const status = Number.isInteger(error?.status) ? error.status : 500;

    if (status === 401) {
      return res.status(502).json({
        message: 'The AI service authentication failed. Check the OpenAI API key.'
      });
    }

    if (status === 429) {
      return res.status(429).json({
        message: 'The AI service is currently busy or rate-limited. Please try again shortly.'
      });
    }

    return res.status(502).json({
      message: 'The AI service could not process the request right now.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Legal AI backend running on http://localhost:${PORT}`);
  console.log(`OpenAI model: ${MODEL}`);
});
