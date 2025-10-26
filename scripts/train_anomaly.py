import argparse
import os

# Avoid heavy imports unless needed
from app.anomaly import parse_csv_bytes, _rows_to_matrix  # type: ignore

try:
    from sklearn.ensemble import IsolationForest  # type: ignore
except Exception as e:
    raise SystemExit("scikit-learn is required. Install with `pip install -r requirements-ml.txt`.")

try:
    import joblib  # type: ignore
except Exception:
    raise SystemExit("joblib is required to save models. `pip install joblib`. ")


def main():
    ap = argparse.ArgumentParser(description="Train an IsolationForest anomaly model on a CSV file")
    ap.add_argument("csv", help="Path to CSV file")
    ap.add_argument("--out", default="models/anomaly_isoforest.joblib", help="Output model path")
    ap.add_argument("--contamination", type=float, default=0.05, help="Contamination rate")
    args = ap.parse_args()

    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)

    with open(args.csv, "rb") as f:
        data = f.read()
    records = parse_csv_bytes(data)
    if not records:
        raise SystemExit("No records parsed from CSV")

    X, feature_names, _ = _rows_to_matrix(records)

    model = IsolationForest(contamination=args.contamination, random_state=42)
    model.fit(X)

    # Save model and metadata
    joblib.dump({"model": model, "features": feature_names}, args.out)
    print(f"Saved model to {args.out} with features: {feature_names}")


if __name__ == "__main__":
    main()
