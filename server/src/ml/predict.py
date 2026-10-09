import json
import sys
import time


PHISHING_SIGNALS = [
    "verify",
    "urgent",
    "suspended",
    "password",
    "otp",
    "bank",
    "click",
    "claim",
    "prize",
    "reset",
    "http://",
    "https://",
    "bit.ly",
]


def analyze_text(message: str) -> dict:
    lowered = message.lower()
    matched = [kw for kw in PHISHING_SIGNALS if kw in lowered]
    score = min(1.0, 0.2 + (len(matched) * 0.15)) if matched else 0.12
    is_phishing = score >= 0.5
    confidence = round(score * 100, 2) if is_phishing else round((1 - score) * 100, 2)
    risk_level = "high" if score >= 0.75 else "medium" if score >= 0.5 else "low"

    if matched:
        reasoning = f"Matched suspicious patterns: {', '.join(matched[:5])}."
    else:
        reasoning = "No strong phishing indicators were detected."

    return {
        "isPhishing": is_phishing,
        "confidence": confidence,
        "riskLevel": risk_level,
        "features": {
            "hasUrl": ("http://" in lowered) or ("https://" in lowered),
            "hasUrgency": any(word in lowered for word in ["urgent", "immediately", "now"]),
            "requestsCredentials": any(word in lowered for word in ["password", "otp", "pin", "verify"]),
        },
        "explainability": {
            "reasoning": reasoning,
        },
        "processingTime": 0,
    }


def main() -> None:
    started = time.time()
    message = sys.argv[1] if len(sys.argv) > 1 else ""
    result = analyze_text(message)
    result["processingTime"] = int((time.time() - started) * 1000)
    print(json.dumps(result))


if __name__ == "__main__":
    main()
