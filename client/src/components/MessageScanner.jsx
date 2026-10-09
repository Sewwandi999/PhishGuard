import { useState } from 'react';
import React from 'react';
import { ScanSearch, Upload, AlertTriangle, CheckCircle, Loader2, Link as LinkIcon, MessageSquare } from 'lucide-react';
import ModelExplainability from './ModelExplainability';
import { notifyPhishing } from '../utils/notifyPhishing.js';

export default function MessageScanner() {
  const [messageText, setMessageText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');

  // Mock ML inference
  const performScan = async () => {
    setError('');
    
    if (!messageText.trim()) {
      setError('Please enter a message to scan');
      return;
    }

    if (messageText.length > 5000) {
      setError('Message is too long. Maximum 5000 characters allowed.');
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    // Simulate API call
    setTimeout(() => {
      const phishingKeywords = ['verify', 'urgent', 'click here', 'suspended', 'confirm', 'account blocked', 'winner', 'claim'];
      const hasPhishingKeywords = phishingKeywords.some(keyword => 
        messageText.toLowerCase().includes(keyword)
      );
      
      const hasUrl = /https?:\/\/[^\s]+/.test(messageText) || /bit\.ly|tinyurl/.test(messageText);
      
      let probability = Math.random() * 0.3; // Base probability
      
      if (hasPhishingKeywords) probability += 0.4;
      if (hasUrl) probability += 0.25;
      if (messageText.toLowerCase().includes('password')) probability += 0.15;
      
      probability = Math.min(0.99, probability);
      
      const isPhishing = probability > 0.5;
      
      // Extract URLs
      const urlRegex = /(https?:\/\/[^\s]+)|([a-z0-9-]+\.(com|net|org|lk|info)[^\s]*)/gi;
      const urls = messageText.match(urlRegex) || [];
      
      // Highlight keywords
      const detectedKeywords = phishingKeywords.filter(keyword =>
        messageText.toLowerCase().includes(keyword)
      );

      setScanResult({
        label: isPhishing ? 'Phishing' : 'Legitimate',
        probability: probability,
        confidence: isPhishing ? 'High' : 'Medium',
        modelVersion: 'v1.3',
        detectedKeywords,
        urls,
        explanation: isPhishing
          ? 'This message contains suspicious patterns commonly found in phishing attacks.'
          : 'This message appears to be legitimate based on content analysis.',
        riskFactors: [
          ...(hasPhishingKeywords ? ['Contains phishing-related keywords'] : []),
          ...(hasUrl ? ['Contains external URLs'] : []),
          ...(messageText.toLowerCase().includes('password') ? ['Requests sensitive information'] : []),
        ],
      });

      if (isPhishing) {
        void notifyPhishing({
          title: "Phishing email/SMS detected",
          body: "Do not click links or share OTP, passwords, or bank details.",
          preview: messageText.slice(0, 120),
        });
      }
      
      setIsScanning(false);
    }, 2000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setMessageText(event.target?.result);
      };
      reader.readAsText(file);
    }
  };

  const sampleMessages = [
    'Your account has been suspended. Click here to verify: bit.ly/verify123',
    'Your transaction of Rs. 5,000 was successful. Reference: TXN123456',
    'URGENT: Confirm your identity within 24 hours or account will be blocked',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-gray-900">Real-Time Message Scanner</h1>
        <p className="text-gray-600">Scan SMS and emails for phishing attempts using AI</p>
      </div>

      {/* Scanner Card */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-gray-900 mb-6">Enter Message to Scan</h2>

        {/* Text Input */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Message Content</label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Paste your SMS or email content here..."
              rows={6}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-gray-500">
              {messageText.length} / 5000 characters
            </p>
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Or Upload File</label>
          <div className="relative">
            <input
              type="file"
              accept=".txt,.eml"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
            >
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">Upload .txt or .eml file</span>
            </label>
          </div>
        </div>

        {/* Sample Messages */}
        <div className="mb-6">
          <p className="text-gray-700 mb-2">Try Sample Messages:</p>
          <div className="flex flex-wrap gap-2">
            {sampleMessages.map((sample, index) => (
              <button
                key={index}
                onClick={() => setMessageText(sample)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-left"
              >
                Sample {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Scan Button */}
        <button
          onClick={performScan}
          disabled={isScanning || !messageText.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Scanning Message...
            </>
          ) : (
            <>
              <ScanSearch className="w-5 h-5" />
              Scan Now
            </>
          )}
        </button>
      </div>

      {/* Loading Animation */}
      {isScanning && (
        <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-900 mb-2">Analyzing Message...</p>
            <p className="text-gray-600">Running ML model inference</p>
          </div>
        </div>
      )}

      {/* Results */}
      {scanResult && !isScanning && (
        <div className={`bg-white rounded-xl shadow-md p-6 border-2 ${
          scanResult.label === 'Phishing' ? 'border-red-500' : 'border-green-500'
        }`}>
          <div className="flex items-center gap-4 mb-6">
            {scanResult.label === 'Phishing' ? (
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            )}
            <div>
              <h2 className={`${
                scanResult.label === 'Phishing' ? 'text-red-900' : 'text-green-900'
              }`}>
                {scanResult.label} Detected
              </h2>
              <p className="text-gray-600">Confidence: {scanResult.confidence}</p>
            </div>
          </div>

          {/* Probability Score */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700">Phishing Probability</span>
              <span className="text-gray-900">{(scanResult.probability * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  scanResult.probability > 0.7 ? 'bg-red-500' :
                  scanResult.probability > 0.4 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${scanResult.probability * 100}%` }}
              />
            </div>
          </div>

          {/* Explanation */}
          <div className="p-4 bg-gray-50 rounded-lg mb-4">
            <p className="text-gray-900 mb-2">Analysis Summary:</p>
            <p className="text-gray-700">{scanResult.explanation}</p>
          </div>

          {/* Risk Factors */}
          {scanResult.riskFactors.length > 0 && (
            <div className="mb-4">
              <p className="text-gray-900 mb-2">Risk Factors:</p>
              <ul className="space-y-2">
                {scanResult.riskFactors.map((factor, index) => (
                  <li key={index} className="flex items-center gap-2 text-red-700">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Model Info */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
              Model {scanResult.modelVersion}
            </div>
            <span className="text-gray-600">Scanned at {new Date().toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Model Explainability */}
      {scanResult && !isScanning && (
        <ModelExplainability
          messageText={messageText}
          detectedKeywords={scanResult.detectedKeywords}
          urls={scanResult.urls}
          modelVersion={scanResult.modelVersion}
        />
      )}
    </div>
  );
}
