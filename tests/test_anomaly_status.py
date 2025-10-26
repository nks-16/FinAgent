import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import anomaly_status


def test_anomaly_status_shape(monkeypatch):
    # Ensure no model path is set for this basic test
    monkeypatch.delenv("ANOMALY_MODEL_PATH", raising=False)
    res = anomaly_status()
    assert isinstance(res, dict)
    assert "loaded" in res
    assert "path" in res
