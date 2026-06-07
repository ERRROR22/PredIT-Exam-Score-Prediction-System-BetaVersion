import pandas as pd
import numpy as np
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
import os
import json
import pickle
import warnings

warnings.filterwarnings("ignore")

# Load the dataset
print("Loading dataset...")
df = pd.read_csv(r"C:\Users\vedan\PycharmProjects\PredIT\data\StudentPerformanceFactors.csv")
print(f"Dataset shape: {df.shape}")


# Handle missing values
df_copy = df.copy()

# Teacher_Quality has some nulls, filling with the most frequent value
df_copy["Teacher_Quality"] = df_copy["Teacher_Quality"].fillna(df_copy["Teacher_Quality"].mode()[0])

# Parental_Education_Level nulls treated as 'Uneducated'
df_copy["Parental_Education_Level"] = df_copy["Parental_Education_Level"].fillna("Uneducated")

# Distance_from_Home - going with mode here as well
df_copy["Distance_from_Home"] = df_copy["Distance_from_Home"].fillna(df_copy["Distance_from_Home"].mode()[0])

print(f"Missing values after imputation: {df_copy.isnull().sum().sum()}")


# Ordinal encoding for categorical columns
label_map = {
    "Low": 1, "Medium": 2, "High": 3,
    "Yes": 1, "No": 0,
    "Positive": 1, "Neutral": 0, "Negative": -1,
    "Uneducated": 0, "High School": 1, "College": 2, "Postgraduate": 3,
    "Near": 1, "Moderate": 2, "Far": 3,
}

df_copy = df_copy.replace(label_map)

# One-Hot Encoding for School_Type and Gender

# School_Type
school_encoder = OneHotEncoder()
school_encoded = school_encoder.fit_transform(pd.DataFrame(df_copy["School_Type"]))
school_df = pd.DataFrame(school_encoded.toarray(), columns=["Private", "Public"])
df_copy = pd.concat([df_copy.reset_index(drop=True), school_df], axis=1)
df_copy = df_copy.drop("School_Type", axis=1)

# Gender
gender_encoder = OneHotEncoder()
gender_encoded = gender_encoder.fit_transform(pd.DataFrame(df_copy["Gender"]))
gender_df = pd.DataFrame(gender_encoded.toarray(), columns=["Female", "Male"])
df_copy = pd.concat([df_copy.reset_index(drop=True), gender_df], axis=1)
df_copy = df_copy.drop("Gender", axis=1)

# Some columns still hold numeric values as object dtype after replace - convert them
for col in df_copy.select_dtypes(include="object").columns:
    df_copy[col] = pd.to_numeric(df_copy[col], errors="coerce")

print(f"Shape after encoding: {df_copy.shape}")


# Split features and target
x = df_copy.drop("Exam_Score", axis=1)
y = df_copy["Exam_Score"]

feature_columns = list(x.columns)
print(f"Number of features: {len(feature_columns)}")


# Train / test split
x_train, x_test, y_train, y_test = train_test_split(
    x, y, test_size=0.2, random_state=42
)
print(f"Train size: {x_train.shape[0]} | Test size: {x_test.shape[0]}")


# Feature scaling (only on continuous numeric columns)
num_cols = ["Hours_Studied", "Attendance", "Sleep_Hours", "Previous_Scores", "Physical_Activity"]

scaler = StandardScaler()
x_train = x_train.copy()
x_test = x_test.copy()

x_train[num_cols] = scaler.fit_transform(x_train[num_cols])
x_test[num_cols] = scaler.transform(x_test[num_cols])


# Train Linear Regression model
print("\nTraining Linear Regression model...")

model = LinearRegression()
model.fit(x_train, y_train)

y_pred = model.predict(x_test)

r2   = r2_score(y_test, y_pred)
mae  = mean_absolute_error(y_test, y_pred)
rmse = mean_squared_error(y_test, y_pred) ** 0.5
cv_scores = cross_val_score(model, x, y, cv=5, scoring="r2")

print("\nModel Evaluation: ")
print(f"R2 Score    : {r2:.4f}")
print(f"MAE         : {mae:.4f}")
print(f"RMSE        : {rmse:.4f}")
print(f"CV Mean R2  : {cv_scores.mean():.4f}")


# Save model and all preprocessing artifacts
os.makedirs("model", exist_ok=True)

with open("model/model.pkl", "wb") as f:
    pickle.dump(model, f)

with open("model/scaler.pkl", "wb") as f:
    pickle.dump(scaler, f)

with open("model/school_encoder.pkl", "wb") as f:
    pickle.dump(school_encoder, f)

with open("model/gender_encoder.pkl", "wb") as f:
    pickle.dump(gender_encoder, f)

with open("model/feature_columns.pkl", "wb") as f:
    pickle.dump(feature_columns, f)

with open("model/label_map.json", "w") as f:
    json.dump(label_map, f, indent=2)

print("\nAll artifacts saved to ./model/")
print("Done.")
