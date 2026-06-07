# :large_blue_diamond:PredIT — Student Exam Score Predictor

> An end-to-end Machine Learning web application that predicts a student's exam score based on 20 key academic and lifestyle factors.

---

## :white_medium_square: Overview

PredIT is a full-stack machine learning web application designed to predict a student's exam performance based on their academic habits, personal lifestyle, and home environment. The project covers the complete data science workflow — starting from raw data exploration and preprocessing, to model training and evaluation, all the way to a deployed and publicly accessible web application.

The goal is simple: a student answers 20 questions across 4 easy steps, and the app instantly predicts their expected exam score out of 100, along with a grade label and personalised feedback to help them understand where they stand and what they can improve.

---

## Visit app on :arrow_down:

🔗 **[predit.onrender.com](https://predit.onrender.com)**

> Note: The app is hosted on Render's free tier and may take ~30 seconds to wake up on the first visit after inactivity.

---

## :white_medium_square: Dataset

The project is built on the **Student Performance Factors** dataset, which contains detailed records of students across 20 features covering their academic behaviour, personal attributes, and surrounding environment. The target variable is `Exam_Score` — a numeric score out of 100.

The dataset includes features such as hours studied, attendance percentage, sleep hours, previous exam scores, parental involvement, access to resources, peer influence, motivation level, teacher quality, family income, and more. Together, these features paint a comprehensive picture of the factors that influence a student's academic performance.

---

## :white_medium_square: Data Preprocessing

Raw data rarely comes clean, and this dataset was no exception. Before training any model, several preprocessing steps were applied to make the data suitable for machine learning.

**Handling Missing Values**
Three columns had missing entries. `Teacher_Quality` and `Distance_from_Home` were filled using the mode (most frequent value), since these are categorical columns where the most common category is a reasonable estimate. `Parental_Education_Level` nulls were treated as `Uneducated` — a meaningful category rather than a random imputation.

**Ordinal Encoding**
Many features in the dataset are categorical but carry an inherent order — for example, Low, Medium, and High clearly have a ranking. These were encoded using a custom mapping dictionary:

- Low → 1, Medium → 2, High → 3
- Yes → 1, No → 0
- Positive → 1, Neutral → 0, Negative → -1
- Near → 1, Moderate → 2, Far → 3
- Uneducated → 0, High School → 1, College → 2, Postgraduate → 3

This approach preserves the ordinal relationship between categories rather than treating them as unrelated labels.

**One-Hot Encoding**
Two columns — `School_Type` (Public/Private) and `Gender` (Male/Female) — do not have any ordinal relationship, so they were encoded using One-Hot Encoding via scikit-learn's `OneHotEncoder`. This creates separate binary columns for each category, avoiding any implied ranking.

**Feature Scaling**
Five continuous numeric features — `Hours_Studied`, `Attendance`, `Sleep_Hours`, `Previous_Scores`, and `Physical_Activity` — were standardised using `StandardScaler`. Scaling ensures that features with larger numeric ranges (like attendance percentage) do not dominate the model over features with smaller ranges (like sleep hours). The scaler was fit only on the training data and then applied to the test data to prevent data leakage.

After all preprocessing steps, the dataset had 21 final features ready for model training.

---

## :white_medium_square:Model Training & Evaluation

The dataset was split into 80% training and 20% testing using a fixed `random_state=42` to ensure reproducibility.

Three regression models were trained and evaluated on the same split:

| Model | R² Score |
|---|---|
| **Linear Regression** | **0.77** ✅ |
| XGBoost Regressor | 0.73 |
| Random Forest Regressor | 0.67 |

**Linear Regression** emerged as the best performing model with an **R² score of 0.77**, meaning it explains 77% of the variance in student exam scores. This was a strong and consistent result, also validated through 5-fold cross-validation which confirmed the model generalises well and is not overfitting to the training data.

Linear Regression also has the advantage of being highly interpretable — each feature's coefficient directly shows how much it contributes to the predicted score, making it a practical choice for this kind of educational prediction task.

The final trained model along with all preprocessing artifacts (scaler, encoders, feature column order, and label mapping) were saved as pickle files so the web application can reproduce the exact same preprocessing pipeline at inference time without retraining.

---

## :white_medium_square:Web Application

The web application is built with **Flask** on the backend and plain **HTML, CSS, and JavaScript** on the frontend — no heavy frameworks, keeping things lightweight and fast.

**Backend — Flask**
The Flask app loads all saved pickle artifacts once at startup. When a user submits the form, the `/predict` endpoint receives the raw input as JSON, applies the same preprocessing steps as training (ordinal encoding, one-hot encoding, standard scaling), assembles the feature vector in the exact same column order used during training, runs it through the Linear Regression model, and returns the predicted score.

**Frontend — 4-Step Guided Form**
Rather than dumping all 20 questions on one page, the UI breaks the experience into 4 focused steps:

- **Step 1 — About You:** Gender, school type, distance from home, family income
- **Step 2 — Study Habits:** Hours studied, attendance, sleep hours, tutoring sessions, extracurricular activities, internet access
- **Step 3 — Academics & Health:** Previous scores, physical activity, learning disabilities, motivation level, peer influence
- **Step 4 — Home Environment:** Parental involvement, parental education, teacher quality, access to resources

Each step uses pill-style buttons for categorical choices and smooth interactive sliders for numeric inputs, making the experience intuitive and engaging. Validation ensures every question is answered before moving to the next step.

**Result Modal**
After submission, a modal appears showing the predicted score with an animated counter that counts up to the result, a progress bar that fills proportionally, a grade label (A+ through D), and personalised feedback tailored to the score range — giving the student actionable context alongside the number.

**Design**
The UI uses a warm, editorial colour palette — deep plum (`#452B30`), mauve (`#74404C`), warm cream (`#F3ECD8`), and sage green (`#C7C79E`) — with Playfair Display for headings and DM Sans for body text, creating an aesthetic that feels refined and approachable.

---

## :white_medium_square:Tech Stack

| Layer | Technology |
|---|---|
| Data Processing | Python, Pandas, NumPy |
| Machine Learning | Scikit-learn |
| Backend | Flask |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Fonts | Google Fonts (Playfair Display, DM Sans) |
| Deployment | Render |
| Version Control | GitHub |

---

## :white_medium_square:How to Run Locally

**1. Clone the repository**
```bash
git clone https://yourusername/PredIT.git
cd PredIT
```

**2. Add the dataset**

Place `StudentPerformanceFactors.csv` inside the `data/` folder.

**3. Train the model**
```bash
cd "model training"
python train.py
```
This generates the `model/` folder with all 6 pickle artifacts.

**4. Copy model artifacts to the web app**
```bash
cp -r model/ "../web app/model/"
```

**5. Install dependencies and start the app**
```bash
cd "../web app"
pip install -r requirements.txt
python app.py
```

**6. Open in browser**
```
http://127.0.0.1:5000
```

---

## :white_medium_square:Deployment

The app is deployed on **Render** as a Python web service. Render was chosen because it natively supports Flask applications with minimal configuration, offers a free tier, and auto-deploys on every GitHub push.

The key deployment settings on Render are:
- **Root Directory:** `web app`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `python app.py`

---

## Author

**Ritik Sharma**
[GitHub](https://github.com/ERRROR22)

---

---
## Disclaimer
 
**This is Beta Version Of my Project**

---