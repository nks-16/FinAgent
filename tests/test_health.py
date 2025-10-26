import sys
import os
from fastapi.testclient import TestClient

# Ensure project root is on sys.path so tests can import `app` when run from pytest
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app


def test_health():
    # Call the endpoint handler directly (avoids TestClient/httpx compatibility issues in this environment)
    from app.main import health as health_fn
    res = health_fn()
    assert isinstance(res, dict)
    assert res.get("status") == "ok"
