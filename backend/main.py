from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import anthropic
import os

app = FastAPI(title="Epilepsy Diagnostic API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

class DiagnosticRequest(BaseModel):
    prompt: str

class FileAnalysisRequest(BaseModel):
    base64_data: str
    media_type: str
    label: str

@app.get("/")
def root():
    return {"status": "ok", "service": "Epilepsy Diagnostic API"}

@app.post("/api/analyze")
async def analyze(req: DiagnosticRequest):
    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            messages=[{"role": "user", "content": req.prompt}]
        )
        return {"result": response.content[0].text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze-file")
async def analyze_file(req: FileAnalysisRequest):
    try:
        is_pdf = req.media_type == "application/pdf"
        content = (
            [
                {"type": "document", "source": {"type": "base64", "media_type": req.media_type, "data": req.base64_data}},
                {"type": "text", "text": f"Bu {req.label} xulosasi. Undagi klinik ma'lumotlarni o'zbek tilida qisqacha chiqar."}
            ] if is_pdf else [
                {"type": "image", "source": {"type": "base64", "media_type": req.media_type, "data": req.base64_data}},
                {"type": "text", "text": f"Bu {req.label} tasviri. Undagi klinik topilmalarni o'zbek tilida qisqacha tavsifla."}
            ]
        )
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            messages=[{"role": "user", "content": content}]
        )
        return {"result": response.content[0].text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
