const express = require('express');

const router = express.Router();
const phishingDetector = require('../ml/phishingDetector');

function chatbotBaseUrl() {
  const raw = process.env.CHATBOT_API_URL || 'http://127.0.0.1:8000';
  return raw.replace(/\/$/, '');
}

function looksLikeScanRequest(text) {
  const lowered = text.toLowerCase();
  const hasUrl = /https?:\/\//i.test(lowered) || /\bbit\.ly\b/i.test(lowered);
  const asksSecret = /\b(otp|password|pin|credential)\b/i.test(lowered);
  return hasUrl && asksSecret;
}

function formatScanReply(result) {
  const verdict = result.isPhishing ? 'phishing' : 'legitimate';
  const reasons = result.explainability?.reasoning || result.reasoning || 'No extra reasons were returned.';
  return [
    `Scan-based verdict: this looks ${result.isPhishing ? 'like a phishing message' : 'legitimate'}.`,
    `Risk level: ${result.riskLevel || 'unknown'}. Confidence: ${result.confidence ?? 'n/a'}.`,
    `Reasons: ${reasons}`,
  ].join('\n');
}

function chatbotBaseUrl() {
  const raw = process.env.CHATBOT_API_URL || 'http://127.0.0.1:8000';
  return raw.replace(/\/$/, '');
}

router.get('/health', async (req, res) => {
  try {
    const response = await fetch(`${chatbotBaseUrl()}/`);
    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message: `Chatbot service returned status ${response.status}`,
      });
    }
    const data = await response.json();
    return res.json({
      success: true,
      chatbot: data,
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: 'Chatbot service is unavailable',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

router.post('/chat', async (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!text) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a message text.',
    });
  }

  if (looksLikeScanRequest(text)) {
    try {
      const detectionResult = await phishingDetector.analyze(text, 'sms', 'chatbot');
      return res.json({
        success: true,
        reply: formatScanReply(detectionResult),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error scanning the message.',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  try {
    const response = await fetch(`${chatbotBaseUrl()}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message: data.message || data.detail || 'Chatbot service request failed',
      });
    }

    return res.json({
      success: true,
      reply: typeof data.reply === 'string' ? data.reply : 'No response received.',
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: 'Cannot connect to chatbot service.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

module.exports = router;
