import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        limit_concurrency=20,
        timeout_keep_alive=300,
        limit_max_requests=None,
        # Konfigurasi untuk file upload besar (200MB)
        workers=2,
    )
