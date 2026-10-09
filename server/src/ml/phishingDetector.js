// src/ml/phishingDetector.js
const path = require('path');
const { execFile } = require('child_process');

/**
 * Analyze a message for phishing using your Python ML model
 * @param {string} message - The message to scan
 * @param {string} type - 'email' or 'sms'
 * @param {string} sender - Optional sender info
 * @returns {Promise<Object>} detection result
 */
function analyze(message, type, sender) {
  return new Promise((resolve, reject) => {
    const pythonBin = process.env.PYTHON_EXECUTABLE || 'python';
    const scriptPath = path.resolve(__dirname, 'predict.py');
    const args = [scriptPath, message, type, sender || 'Unknown'];

    execFile(pythonBin, args, { timeout: 15000, windowsHide: true }, (err, stdout, stderr) => {
      if (err) {
        return reject(
          new Error(
            `Python prediction failed: ${err.message}${stderr ? ` | ${stderr.toString().trim()}` : ''}`,
          ),
        );
      }
      try {
        const raw = String(stdout || '').trim();
        const parsed = JSON.parse(raw || '{}');
        resolve({
          isPhishing: Boolean(parsed.isPhishing),
          confidence: Number(parsed.confidence || 0),
          riskLevel: parsed.riskLevel || (parsed.isPhishing ? 'high' : 'low'),
          features: parsed.features || {},
          explainability: parsed.explainability || { reasoning: 'Model assessment completed.' },
          processingTime: Number(parsed.processingTime || 0),
        });
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

// Export the function (CommonJS)
module.exports = { analyze };
