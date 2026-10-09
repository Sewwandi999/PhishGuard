import json
import os
from pathlib import Path
from typing import Any, Dict, Optional
from urllib.error import URLError
from urllib.request import Request, urlopen

import requests
import truststore
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

truststore.inject_into_ssl()

SCAN_API_URL = os.getenv("SCAN_API_URL", "http://127.0.0.1:5000/api/scan/scan-analyze")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

CASUAL_CHAT_TRIGGERS = (
    "hello",
    "hi",
    "hey",
    "how are you",
    "good morning",
    "good evening",
    "joke",
    "thank you",
    "thanks",
    "who are you",
    "what can you do",
)

PHISHING_ANALYSIS_HINTS = (
    "http://",
    "https://",
    "otp",
    "password",
    "bank",
    "verify",
    "suspended",
    "urgent",
    "click",
    "claim",
    "is this phishing",
    "check this message",
    "analyze this",
)


def _call_scan_model(text: str) -> Optional[Dict[str, Any]]:
    payload = json.dumps(
        {
            "message": text,
            "type": "sms",
            "sender": "Chatbot",
        }
    ).encode("utf-8")
    req = Request(
        SCAN_API_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(req, timeout=12) as res:
            data = json.loads(res.read().decode("utf-8"))
            if not data.get("success"):
                return None
            result = data.get("result") or {}
            return {
                "isPhishing": bool(result.get("isPhishing", False)),
                "confidence": float(result.get("confidence", 0)),
                "reasoning": str(result.get("reasoning") or ""),
            }
    except (URLError, TimeoutError, ValueError, KeyError, json.JSONDecodeError):
        return None


def _gemini_reply(user_text: str) -> Optional[str]:
    if not GEMINI_API_KEY:
        return None
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    )
    prompt = (
        "You are PhishGuard assistant. Reply in a short, friendly, helpful way. "
        "If the user asks general chat, be conversational. "
        "Avoid unsafe cybersecurity instructions.\n\n"
        f"User: {user_text}"
    )
    try:
        response = requests.post(
            url,
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=30,
        )
        data = response.json()
        if not response.ok:
            if response.status_code in (429, 403):
                return None
            return None
        parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
        text = " ".join(part.get("text", "") for part in parts).strip()
        return text or None
    except requests.RequestException:
        return None


def _looks_like_casual_chat(text: str) -> bool:
    lowered = text.lower()
    return any(trigger in lowered for trigger in CASUAL_CHAT_TRIGGERS)


def _looks_like_analysis_request(text: str) -> bool:
    lowered = text.lower()
    return any(trigger in lowered for trigger in PHISHING_ANALYSIS_HINTS)


def predict_message(message: str) -> str:
    text = message.strip()
    if not text:
        return "Please provide a message."

    # Friendly normal conversations are answered by Gemini when configured.
    if _looks_like_casual_chat(text) and not _looks_like_analysis_request(text):
        friendly = _gemini_reply(text)
        if friendly:
            return friendly
        return "Hi! I am here to help with phishing checks and safe online behavior."

    # For potential suspicious content, use the same website scan model verdict.
    scan = _call_scan_model(text)
    if scan is not None:
        verdict = "phishing" if scan["isPhishing"] else "legitimate"
        confidence = max(0.0, min(scan["confidence"], 100.0))
        base = (
            f"Verdict: {verdict.upper()} ({confidence:.1f}% confidence)\n"
            f"Reason: {scan['reasoning'] or 'Model-based assessment from website scanner.'}"
        )
        follow_up = _gemini_reply(
            f"User message: {text}\nModel verdict: {verdict} ({confidence:.1f}%). "
            "Give a short, friendly explanation and practical next step."
        )
        if follow_up:
            return f"{base}\n\n{follow_up}"
        return f"{base}\n\nTip: Avoid clicking links or sharing OTP/passwords before verifying the sender."

    # Fallback when scan model is unavailable: still provide friendly answer via Gemini.
    friendly = _gemini_reply(text)
    if friendly:
        return friendly
    return "I could not reach the phishing scanner right now. Please try again in a moment."
