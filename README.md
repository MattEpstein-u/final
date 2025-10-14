# Titanic Survival Prediction Web App

A web application that uses machine learning to predict passenger survival on the Titanic using a Stacking Algorithm.

## Features

- 🚢 **Titanic Dataset**: Uses the famous Titanic dataset from Kaggle
- 🤖 **Stacking Algorithm**: Combines multiple base models (Random Forest, Gradient Boosting, SVM) with a meta-learner (Logistic Regression)
- 📊 **Interactive Visualizations**: Real-time charts showing model performance
- 🎯 **80/20 Split**: Trains on 80% of data and tests on remaining 20%
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Algorithm Details

### Stacking Ensemble Method
The application uses a sophisticated stacking approach:

**Base Models:**
- Random Forest Classifier (100 estimators)
- Gradient Boosting Classifier (100 estimators)  
- Support Vector Machine (with probability estimation)

**Meta-Model:**
- Logistic Regression (combines predictions from base models)

**Cross-Validation:**
- 5-fold cross-validation for robust training

## Installation and Setup

1. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Application:**
   ```bash
   python app.py
   ```

3. **Access the Web App:**
   Open your browser and go to `http://localhost:5000`

## Usage

1. Click the "Train Stacking Model" button
2. The app will automatically:
   - Download the Titanic dataset
   - Preprocess the data (handle missing values, encode categorical variables)
   - Split data into 80% training and 20% testing
   - Train the stacking ensemble model
   - Display results and visualizations

## Visualizations

The app provides three main visualizations:

1. **Confusion Matrix**: Shows prediction accuracy breakdown
2. **Feature Importance**: Displays which features are most important for predictions
3. **Prediction Accuracy Distribution**: Shows correct vs incorrect predictions across test samples

## Data Preprocessing

- Drops unnecessary columns (PassengerId, Name, Ticket, Cabin)
- Fills missing age values with median
- Fills missing embarked values with mode
- Encodes categorical variables (Sex, Embarked)
- Standardizes numerical features

## Model Performance Metrics

- **Accuracy Score**: Overall prediction accuracy
- **Confusion Matrix**: Detailed breakdown of predictions
- **Feature Importance**: Relative importance of each feature
- **Classification Report**: Precision, recall, and F1-scores

## Technology Stack

- **Backend**: Flask (Python)
- **Machine Learning**: scikit-learn
- **Data Processing**: pandas, numpy
- **Visualizations**: Plotly.js
- **Frontend**: HTML5, CSS3, JavaScript
- **Styling**: Custom CSS with gradient backgrounds and responsive design

## Project Structure

```
final/
├── app.py              # Flask backend with ML model
├── requirements.txt    # Python dependencies
├── README.md          # Project documentation
├── templates/
│   └── index.html     # Main web interface
└── static/            # Static files (if needed)
```

## Dataset Source

The Titanic dataset is automatically downloaded from:
`https://raw.githubusercontent.com/datasciencedojo/datasets/refs/heads/master/titanic.csv`

## Features Used for Prediction

- **Pclass**: Passenger class (1st, 2nd, 3rd)
- **Sex**: Gender (encoded as 0/1)
- **Age**: Passenger age
- **SibSp**: Number of siblings/spouses aboard
- **Parch**: Number of parents/children aboard
- **Fare**: Passenger fare
- **Embarked**: Port of embarkation (encoded as 0/1/2)

## Model Workflow

1. **Data Loading**: Fetch dataset from remote URL
2. **Preprocessing**: Clean and encode data
3. **Feature Scaling**: Standardize numerical features
4. **Model Training**: Train stacking ensemble with cross-validation
5. **Evaluation**: Test on holdout set and generate metrics
6. **Visualization**: Create interactive charts for results

## Contributing

Feel free to contribute to this project by:
- Improving the machine learning pipeline
- Adding new visualization features
- Enhancing the user interface
- Optimizing model performance

## License

This project is open source and available under the MIT License.