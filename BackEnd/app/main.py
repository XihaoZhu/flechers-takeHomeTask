from fastapi import FastAPI

app = FastAPI(title="Document Processing Pipeline")


@app.get("/health")
def health_check():
    return {"status": "ok"}