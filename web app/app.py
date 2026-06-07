from flask import Flask, render_template, request, jsonify
import pickle
import json
import numpy as np
import pandas as pd
import os

app = Flask(__name__)

# Load all artifacts once at startup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "model")

with open(os.path.join(MODEL_DIR, "model.pkl"), "rb") as f:
    model = pickle.load(f)

with open(os.path.join(MODEL_DIR, "scaler.pkl"), "rb") as f:
    scaler = pickle.load(f)

with open(os.path.join(MODEL_DIR, "school_encoder.pkl"), "rb") as f:
    school_encoder = pickle.load(f)

with open(os.path.join(MODEL_DIR, "gender_encoder.pkl"), "rb") as f:
    gender_encoder = pickle.load(f)

with open(os.path.join(MODEL_DIR, "feature_columns.pkl"), "rb") as f:
    feature_columns = pickle.load(f)

with open(os.path.join(MODEL_DIR, "label_map.json"), "r") as f:
    label_map = json.load(f)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        # Ordinal mapping
        ordinal_map = {
            "Low": 1, "Medium": 2, "High": 3,
            "Yes": 1, "No": 0,
            "Positive": 1, "Neutral": 0, "Negative": -1,
            "Uneducated": 0, "High School": 1, "College": 2, "Postgraduate": 3,
            "Near": 1, "Moderate": 2, "Far": 3,
        }

        def enc(val):
            return ordinal_map.get(val, val)

        # Build raw feature dict matching train.py pipeline
        hours_studied      = float(data["hours_studied"])
        attendance         = float(data["attendance"])
        parental_inv       = enc(data["parental_involvement"])
        access_resources   = enc(data["access_to_resources"])
        extracurricular    = enc(data["extracurricular_activities"])
        sleep_hours        = float(data["sleep_hours"])
        previous_scores    = float(data["previous_scores"])
        motivation         = enc(data["motivation_level"])
        internet_access    = enc(data["internet_access"])
        tutoring_sessions  = float(data["tutoring_sessions"])
        family_income      = enc(data["family_income"])
        teacher_quality    = enc(data["teacher_quality"])
        peer_influence     = enc(data["peer_influence"])
        physical_activity  = float(data["physical_activity"])
        learning_dis       = enc(data["learning_disabilities"])
        parental_edu       = enc(data["parental_education_level"])
        distance           = enc(data["distance_from_home"])

        # OHE for School_Type
        school_type = data["school_type"]   # "Public" or "Private"
        school_arr  = school_encoder.transform([[school_type]]).toarray()[0]
        private_val = school_arr[list(school_encoder.categories_[0]).index("Private")] if "Private" in school_encoder.categories_[0] else 0
        public_val  = school_arr[list(school_encoder.categories_[0]).index("Public")]  if "Public"  in school_encoder.categories_[0] else 0

        # OHE for Gender
        gender = data["gender"]   # "Male" or "Female"
        gender_arr  = gender_encoder.transform([[gender]]).toarray()[0]
        female_val  = gender_arr[list(gender_encoder.categories_[0]).index("Female")] if "Female" in gender_encoder.categories_[0] else 0
        male_val    = gender_arr[list(gender_encoder.categories_[0]).index("Male")]   if "Male"   in gender_encoder.categories_[0] else 0

        # Assemble in exact feature_columns order
        row = {
            "Hours_Studied":            hours_studied,
            "Attendance":               attendance,
            "Parental_Involvement":     parental_inv,
            "Access_to_Resources":      access_resources,
            "Extracurricular_Activities": extracurricular,
            "Sleep_Hours":              sleep_hours,
            "Previous_Scores":          previous_scores,
            "Motivation_Level":         motivation,
            "Internet_Access":          internet_access,
            "Tutoring_Sessions":        tutoring_sessions,
            "Family_Income":            family_income,
            "Teacher_Quality":          teacher_quality,
            "Peer_Influence":           peer_influence,
            "Physical_Activity":        physical_activity,
            "Learning_Disabilities":    learning_dis,
            "Parental_Education_Level": parental_edu,
            "Distance_from_Home":       distance,
            "Private":                  private_val,
            "Public":                   public_val,
            "Female":                   female_val,
            "Male":                     male_val,
        }

        df_input = pd.DataFrame([row])[feature_columns]

        # Scale numeric columns
        num_cols = ["Hours_Studied", "Attendance", "Sleep_Hours", "Previous_Scores", "Physical_Activity"]
        df_input[num_cols] = scaler.transform(df_input[num_cols])

        prediction = model.predict(df_input)[0]
        score = round(float(prediction), 1)
        score = max(0, min(100, score))

        return jsonify({"success": True, "score": score})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)