from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

# Load model if available
model = None
scaler = None
try:
    if os.path.exists('models/xgboost.pkl'):
        model = joblib.load('models/xgboost.pkl')
        scaler = joblib.load('models/scaler.pkl')
        print("✅ ML model loaded")
    else:
        print("⚠️ ML model not found. Using rule-based prediction.")
except Exception as e:
    print(f"⚠️ Model load error: {e}")

def prepare_features(data):
    total_sessions = data.get('totalRounds', 0)
    return {
        'sum_gamerounds': total_sessions,
        'log_gamerounds': np.log1p(total_sessions),
        'retention_1': 1 if data.get('retention_1', False) else 0,
        'retention_7': 1 if data.get('retention_7', False) else 0,
        'retention_score': (1 if data.get('retention_1') else 0) + (1 if data.get('retention_7') else 0),
        'version_encoded': 0 if data.get('version') == 'gate_30' else 1,
        'engagement_encoded': get_engagement(total_sessions),
        'player_type_encoded': get_player_type(data)
    }

def get_engagement(sessions):
    if sessions == 0: return 3
    elif sessions <= 5: return 1
    elif sessions <= 20: return 2
    elif sessions <= 50: return 0
    else: return 4

def get_player_type(data):
    if data.get('retention_1') and data.get('retention_7'): return 3
    elif data.get('retention_1'): return 1
    elif data.get('retention_7'): return 2
    else: return 0

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.json
    features = prepare_features(data)

    if model and scaler:
        feature_order = ['sum_gamerounds', 'log_gamerounds', 'retention_1',
                         'retention_7', 'retention_score', 'version_encoded',
                         'engagement_encoded', 'player_type_encoded']
        X = np.array([[features[f] for f in feature_order]])
        X_scaled = scaler.transform(X)
        probability = float(model.predict_proba(X_scaled)[0][1])
    else:
        # Rule-based fallback
        probability = 0.0
        if data.get('totalRounds', 0) <= 2: probability += 0.4
        if data.get('duration', 0) < 120: probability += 0.2
        if data.get('distance', 0) < 500: probability += 0.2
        if data.get('loginStreak', 1) == 1: probability += 0.2

    if probability > 0.7:
        risk, action = 'High', 'Send retention offer immediately'
    elif probability > 0.4:
        risk, action = 'Medium', 'Show engagement nudge'
    else:
        risk, action = 'Low', 'Continue normal experience'

    return jsonify({
        'churn_probability': probability,
        'risk_level': risk,
        'recommended_action': action
    })

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model_loaded': model is not None})

if __name__ == '__main__':
    app.run(port=5000, debug=True)
