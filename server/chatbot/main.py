from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from model import predict_message

app = FastAPI(title="PhishGuard Chatbot Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Message(BaseModel):
    text: str


@app.get("/")
def health():
    return {"message": "PhishGuard chatbot API running"}


@app.post("/chat")
def chat(msg: Message):
    return {"reply": predict_message(msg.text)}
