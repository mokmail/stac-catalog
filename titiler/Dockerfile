FROM ghcr.io/developmentseed/titiler:latest

# TiTiler default is port 8000; expose it
EXPOSE 8000

# Run with a single worker for local use
CMD ["uvicorn", "titiler.application.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
