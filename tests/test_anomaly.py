import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest

from app.anomaly import detect_anomalies_from_records


@pytest.mark.parametrize("explain", [False])
def test_anomaly_detect_synthetic(explain):
    # Simple dataset with one outlier
    records = [
        {"revenue": 100, "cogs": 40, "opex": 30, "net_income": 20},
        {"revenue": 110, "cogs": 45, "opex": 32, "net_income": 22},
        {"revenue": 95, "cogs": 38, "opex": 29, "net_income": 18},
        {"revenue": 5000, "cogs": 10, "opex": 10, "net_income": 10},  # outlier
    ]

    try:
        res = detect_anomalies_from_records(records, contamination=0.25, top_k=2, explain=explain)
    except RuntimeError as e:
        # scikit-learn not installed in minimal env; skip gracefully
        pytest.skip(str(e))

    assert res["count"] == 4
    assert len(res["anomalies"]) >= 1
    # Ensure the high-revenue point is considered anomalous
    top_rows = [a["row"] for a in res["anomalies"]]
    assert any(r.get("revenue") == 5000 for r in top_rows)
