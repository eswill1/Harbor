from fastapi import FastAPI

app = FastAPI(
    title="Harbor ML Service",
    description="Satisfaction model, arousal classifier, and embedding service. Phase 2.",
    version="0.1.0",
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "harbor-ml", "version": "0.1.0"}


@app.get("/api/v1/ping")
def ping():
    return {"pong": True}
