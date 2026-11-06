"""Write the API's OpenAPI schema for the frontend's type generator (pnpm gen:api)."""
import json
from pathlib import Path

from api.main import app

target = Path(__file__).resolve().parent.parent / "packages" / "api-client" / "openapi.json"
target.write_text(json.dumps(app.openapi(), indent=2) + "\n")
print(f"Wrote {target}")
