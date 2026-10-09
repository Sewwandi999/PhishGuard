# PhishGuard Chatbot Service

This folder contains the Python chatbot microservice used by both web and mobile apps.

## Run locally

1. Open a terminal in `server/chatbot`
2. Create and activate a virtual environment
3. Install dependencies:
   - `pip install -r requirements.txt`
4. Start the chatbot API:
   - `uvicorn main:app --host 127.0.0.1 --port 8000 --reload`

## API

- `GET /` - Health check
- `POST /chat` - Chat endpoint
  - Body: `{ "text": "message here" }`
  - Response: `{ "reply": "..." }`

## Node server proxy

The Node API proxies requests from:

- `POST /api/chatbot/chat`

Configure chatbot URL with:

- `CHATBOT_API_URL=http://127.0.0.1:8000`
