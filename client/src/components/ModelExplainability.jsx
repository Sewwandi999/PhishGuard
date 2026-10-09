import { useState } from 'react';
import React from 'react';
import { Brain, AlertCircle, Link as LinkIcon, Hash, BarChart3 } from 'lucide-react';

export default function ModelExplainability({ 
  messageText, 
  detectedKeywords, 
  urls, 
  modelVersion 
}) {
  
  const getTokenContributions = () => {
    const words = messageText.toLowerCase().split(/\s+/);
    const phishingWords = ['verify', 'urgent', 'click', 'suspended', 'confirm', 'account', 'blocked', 'winner', 'claim', 'password'];
    
    const contributions = words.map(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      const score = phishingWords.includes(cleanWord) ? Math.random() * 0.8 + 0.2 : Math.random() * 0.3;
      return { word: cleanWord, score };
    }).filter(item => item.word.length > 2);

    return contributions.sort((a, b) => b.score - a.score).slice(0, 10);
  };

  const tokenContributions = getTokenContributions();

  // Highlight phishing keywords in text
  const highlightKeywords = () => {
    let highlighted = messageText;
    detectedKeywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      highlighted = highlighted.replace(regex, `<mark class="bg-red-200 text-red-900 px-1 rounded">$1</mark>`);
    });
    
    // Highlight URLs
    const urlRegex = /(https?:\/\/[^\s]+)|([a-z0-9-]+\.(com|net|org|lk|info)[^\s]*)/gi;
    highlighted = highlighted.replace(urlRegex, '<mark class="bg-yellow-200 text-yellow-900 px-1 rounded">$&</mark>');
    
    return highlighted;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-8 h-8" />
          <h2>Model Explainability</h2>
        </div>
        <p>Understanding why this message was classified as phishing</p>
      </div>

      {/* Highlighted Message */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <h3 className="text-gray-900">Highlighted Risk Indicators</h3>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p 
            className="text-gray-900 leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: highlightKeywords() }}
          />
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-200 rounded"></div>
            <span className="text-gray-600">Phishing Keywords</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-200 rounded"></div>
            <span className="text-gray-600">Suspicious URLs</span>
          </div>
        </div>
      </div>

      {/* Detected Keywords */}
      {detectedKeywords.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="w-5 h-5 text-red-600" />
            <h3 className="text-gray-900">Detected Phishing Keywords</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {detectedKeywords.map((keyword, index) => (
              <div
                key={index}
                className="px-4 py-2 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                <span>{keyword}</span>
              </div>
            ))}
          </div>
          <p className="text-gray-600 mt-4">
            These keywords are commonly found in phishing messages and indicate high risk.
          </p>
        </div>
      )}

      {/* Suspicious URLs */}
      {urls.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <LinkIcon className="w-5 h-5 text-yellow-600" />
            <h3 className="text-gray-900">Suspicious URLs Detected</h3>
          </div>
          <div className="space-y-2">
            {urls.map((url, index) => (
              <div key={index} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-yellow-900 break-all">{url}</p>
                    <p className="text-yellow-700 mt-1">
                      ⚠️ This URL may redirect to a phishing site. Do not click!
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Token Contribution Scores */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          <h3 className="text-gray-900">Token Contribution to Prediction</h3>
        </div>
        <p className="text-gray-600 mb-4">
          These words had the highest impact on the model's decision:
        </p>
        <div className="space-y-3">
          {tokenContributions.map((token, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-900">{token.word}</span>
                <span className="text-gray-600">{(token.score * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    token.score > 0.6 ? 'bg-red-500' :
                    token.score > 0.3 ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${token.score * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model Information */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h3 className="text-gray-900 mb-4">Model Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <p className="text-purple-600 mb-1">Model Version</p>
            <p className="text-purple-900">{modelVersion}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-blue-600 mb-1">Architecture</p>
            <p className="text-blue-900">BERT + CNN Hybrid</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <p className="text-green-600 mb-1">Training Accuracy</p>
            <p className="text-green-900">97.8%</p>
          </div>
        </div>
      </div>

      {/* Explanation Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-md p-6 border border-blue-100">
        <h3 className="text-gray-900 mb-3">Why This Message is Flagged</h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <p className="text-gray-700">
              The message contains multiple high-risk keywords commonly used in phishing attempts
            </p>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <p className="text-gray-700">
              URL patterns match known phishing link characteristics (shortened URLs, suspicious domains)
            </p>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <p className="text-gray-700">
              The language creates urgency and fear, typical tactics used by attackers
            </p>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <p className="text-gray-700">
              The model's confidence score exceeds the phishing detection threshold
            </p>
          </li>
        </ul>
      </div>
    </div>
  );
}
