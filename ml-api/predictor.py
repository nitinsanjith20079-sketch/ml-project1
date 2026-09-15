import numpy as np

def predict_churn_from_features(features):
    """
    Standalone prediction function.
    Use this to load your trained XGBoost model.
    """
    import joblib
    model = joblib.load('models/xgboost.pkl')
    scaler = joblib.load('models/scaler.pkl')
    X = np.array([list(features.values())])
    X_scaled = scaler.transform(X)
    prob = model.predict_proba(X_scaled)[0][1]
    return float(prob)
