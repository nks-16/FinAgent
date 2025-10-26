import io
import csv
from typing import List, Dict, Any, Optional, Tuple

import numpy as np

# Optional heavy deps guarded
try:
    from sklearn.ensemble import IsolationForest  # type: ignore
except Exception:  # pragma: no cover
    IsolationForest = None  # type: ignore

try:  # SHAP is optional
    import shap  # type: ignore
except Exception:  # pragma: no cover
    shap = None  # type: ignore

try:  # joblib optional, used for persisted models
    import joblib  # type: ignore
except Exception:  # pragma: no cover
    joblib = None  # type: ignore


def _to_float(val: Any) -> Optional[float]:
    try:
        if val is None:
            return None
        if isinstance(val, (int, float)):
            return float(val)
        s = str(val).strip()
        if s == "":
            return None
        # remove common formatting like commas and currency symbols
        s = s.replace(",", "").replace("$", "")
        return float(s)
    except Exception:
        return None


def _rows_to_matrix(rows: List[Dict[str, Any]]) -> Tuple[np.ndarray, List[str], List[Dict[str, Any]]]:
    """Convert records to numeric matrix X and keep original rows.
    Returns X (n x d), feature_names, original_rows
    """
    # Collect numeric features only
    keys = set()
    for r in rows:
        keys.update(r.keys())
    # Preserve column order as appeared
    feature_names: List[str] = [k for k in rows[0].keys() if k in keys]

    # Detect numeric columns
    numeric_cols: List[str] = []
    for k in feature_names:
        vals = [_to_float(r.get(k)) for r in rows[:20]]  # sample
        if any(v is not None for v in vals):
            # if at least one value parses as float, keep column
            numeric_cols.append(k)

    if not numeric_cols:
        raise ValueError("No numeric columns found to run anomaly detection")

    X_list: List[List[float]] = []
    cleaned_rows: List[Dict[str, Any]] = []
    for r in rows:
        row_vec: List[float] = []
        for k in numeric_cols:
            v = _to_float(r.get(k))
            row_vec.append(float(v) if v is not None else 0.0)
        X_list.append(row_vec)
        cleaned_rows.append(r)

    X = np.array(X_list, dtype=float)
    return X, numeric_cols, cleaned_rows


def detect_anomalies_from_records(records: List[Dict[str, Any]], contamination: float = 0.05,
                                  top_k: int = 10, explain: bool = False,
                                  model: Optional[Any] = None) -> Dict[str, Any]:
    if IsolationForest is None and model is None:
        raise RuntimeError("scikit-learn is not installed. Install from requirements-ml.txt")

    if not records:
        return {"count": 0, "anomalies": []}

    X, feature_names, original_rows = _rows_to_matrix(records)

    if model is None:
        model = IsolationForest(contamination=contamination, random_state=42)
        model.fit(X)
    scores = -model.score_samples(X)  # higher means more anomalous

    # Rank by score desc
    idx_scores = sorted([(i, float(scores[i])) for i in range(len(scores))], key=lambda t: t[1], reverse=True)
    top_idx = [i for i, _ in idx_scores[:top_k]]

    explanations: Dict[int, Dict[str, float]] = {}
    if explain and shap is not None:
        try:
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(X)  # shape (n, d)
            for i in top_idx:
                contribs = {feature_names[j]: float(shap_values[i][j]) for j in range(len(feature_names))}
                explanations[i] = contribs
        except Exception:
            pass

    anomalies: List[Dict[str, Any]] = []
    for i in top_idx:
        item = {
            "index": i,
            "score": float(scores[i]),
            "row": original_rows[i],
        }
        if i in explanations:
            item["shap"] = explanations[i]
        anomalies.append(item)

    return {"count": len(records), "anomalies": anomalies, "features": feature_names}


def load_isoforest_model(path: str):
    """Load a persisted IsolationForest model with joblib. Returns None if unavailable."""
    if not path or joblib is None:
        return None
    try:
        return joblib.load(path)
    except Exception:
        return None


def parse_csv_bytes(data: bytes) -> List[Dict[str, Any]]:
    text = data.decode("utf-8", errors="ignore")
    reader = csv.DictReader(io.StringIO(text))
    rows: List[Dict[str, Any]] = []
    for row in reader:
        rows.append(dict(row))
    return rows
