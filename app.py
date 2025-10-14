from flask import Flask, render_template, jsonify, send_from_directory
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder, StandardScaler
import plotly.graph_objs as go
import plotly.utils
import json
import requests
import io

app = Flask(__name__)

class TitanicStackingModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_names = []
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        self.y_pred = None
        self.accuracy = 0
        self.confusion_mat = None
        
    def load_and_preprocess_data(self):
        # Load data from URL
        url = 'https://raw.githubusercontent.com/datasciencedojo/datasets/refs/heads/master/titanic.csv'
        response = requests.get(url)
        data = pd.read_csv(io.StringIO(response.text))
        
        # Basic preprocessing
        # Drop unnecessary columns
        data = data.drop(['PassengerId', 'Name', 'Ticket', 'Cabin'], axis=1)
        
        # Handle missing values
        data['Age'].fillna(data['Age'].median(), inplace=True)
        data['Embarked'].fillna(data['Embarked'].mode()[0], inplace=True)
        data.dropna(inplace=True)
        
        # Encode categorical variables
        categorical_columns = ['Sex', 'Embarked']
        for col in categorical_columns:
            le = LabelEncoder()
            data[col] = le.fit_transform(data[col])
            self.label_encoders[col] = le
        
        # Separate features and target
        X = data.drop('Survived', axis=1)
        y = data['Survived']
        
        self.feature_names = X.columns.tolist()
        
        # Split the data (80% train, 20% test)
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale the features
        self.X_train_scaled = self.scaler.fit_transform(self.X_train)
        self.X_test_scaled = self.scaler.transform(self.X_test)
        
        return data.shape[0]
    
    def train_stacking_model(self):
        # Define base models
        base_models = [
            ('rf', RandomForestClassifier(n_estimators=100, random_state=42)),
            ('gb', GradientBoostingClassifier(n_estimators=100, random_state=42)),
            ('svm', SVC(probability=True, random_state=42))
        ]
        
        # Define meta-model
        meta_model = LogisticRegression(random_state=42)
        
        # Create stacking classifier
        self.model = StackingClassifier(
            estimators=base_models,
            final_estimator=meta_model,
            cv=5,
            random_state=42
        )
        
        # Train the model
        self.model.fit(self.X_train_scaled, self.y_train)
        
        # Make predictions
        self.y_pred = self.model.predict(self.X_test_scaled)
        
        # Calculate accuracy
        self.accuracy = accuracy_score(self.y_test, self.y_pred)
        
        # Get confusion matrix
        self.confusion_mat = confusion_matrix(self.y_test, self.y_pred)
        
        return self.accuracy
    
    def get_feature_importance(self):
        # Get feature importance from Random Forest base model
        rf_model = self.model.named_estimators_['rf']
        importance = rf_model.feature_importances_
        
        feature_importance = []
        for i, feat in enumerate(self.feature_names):
            feature_importance.append({
                'feature': feat,
                'importance': float(importance[i])
            })
        
        return sorted(feature_importance, key=lambda x: x['importance'], reverse=True)
    
    def get_model_performance(self):
        return {
            'accuracy': float(self.accuracy),
            'confusion_matrix': self.confusion_mat.tolist(),
            'classification_report': classification_report(self.y_test, self.y_pred, output_dict=True)
        }

# Global model instance
titanic_model = TitanicStackingModel()

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

@app.route('/train_model')
def train_model():
    try:
        # Load and preprocess data
        data_size = titanic_model.load_and_preprocess_data()
        
        # Train stacking model
        accuracy = titanic_model.train_stacking_model()
        
        # Get feature importance
        feature_importance = titanic_model.get_feature_importance()
        
        # Get model performance
        performance = titanic_model.get_model_performance()
        
        return jsonify({
            'success': True,
            'data_size': data_size,
            'train_size': len(titanic_model.X_train),
            'test_size': len(titanic_model.X_test),
            'accuracy': accuracy,
            'feature_importance': feature_importance,
            'performance': performance
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/get_visualization_data')
def get_visualization_data():
    try:
        if titanic_model.model is None:
            return jsonify({'error': 'Model not trained yet'})
        
        # Create confusion matrix visualization data
        cm = titanic_model.confusion_mat
        
        # Feature importance data
        feature_importance = titanic_model.get_feature_importance()
        
        # Actual vs Predicted comparison
        comparison_data = {
            'actual': titanic_model.y_test.tolist(),
            'predicted': titanic_model.y_pred.tolist()
        }
        
        return jsonify({
            'confusion_matrix': cm.tolist(),
            'feature_importance': feature_importance,
            'comparison': comparison_data,
            'accuracy': float(titanic_model.accuracy)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)