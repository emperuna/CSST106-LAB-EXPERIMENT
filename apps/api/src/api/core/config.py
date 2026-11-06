"""Settings shared across API modules."""
import os

# Origins allowed to call the API from a browser; the default is Astro's dev server.
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:4321").split(",")
