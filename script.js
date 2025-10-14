class TitanicML {
    constructor() {
        this.trainButton = document.getElementById('trainButton');
        this.loading = document.getElementById('loading');
        this.results = document.getElementById('results');
        this.messages = document.getElementById('messages');
        this.isFlaskAvailable = false; // Default to demo mode
        
        this.init();
    }
    
    async checkFlaskServer() {
        try {
            // Quick check if we're on Flask's typical port
            if (window.location.port !== '5000') {
                return false;
            }
            
            // Try a very quick ping to Flask
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 500);
            
            const response = await fetch('/train_model', {
                method: 'HEAD',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    init() {
        this.trainButton.addEventListener('click', () => this.trainModel());
        
        // Always show demo mode indicator initially
        const indicator = document.getElementById('modeIndicator');
        if (indicator) {
            indicator.style.display = 'block';
        }
    }
    
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = type;
        messageDiv.textContent = message;
        this.messages.innerHTML = '';
        this.messages.appendChild(messageDiv);
    }
    
    async trainModel() {
        try {
            this.trainButton.disabled = true;
            this.loading.style.display = 'block';
            this.results.style.display = 'none';
            
            // Check if Flask is available only once per session
            if (!this.isFlaskAvailable) {
                this.isFlaskAvailable = await this.checkFlaskServer();
            }
            
            let data;
            if (this.isFlaskAvailable) {
                // Try Flask API first
                try {
                    this.showMessage('Loading dataset and training model...', 'success');
                    const response = await fetch('/train_model');
                    
                    // Check if response is JSON
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        data = await response.json();
                        
                        // Hide demo indicator since Flask is working
                        const indicator = document.getElementById('modeIndicator');
                        if (indicator) {
                            indicator.style.display = 'none';
                        }
                    } else {
                        throw new Error('Non-JSON response from server');
                    }
                } catch (fetchError) {
                    console.log('Flask API failed, falling back to demo mode:', fetchError);
                    this.isFlaskAvailable = false;
                    data = await this.getMockTrainingData();
                }
            } 
            
            if (!this.isFlaskAvailable) {
                // Use mock data
                this.showMessage('Loading sample dataset and training demo model...', 'success');
                data = await this.getMockTrainingData();
            }
            
            if (data && data.success) {
                this.updateMetrics(data);
                await this.createVisualizations();
                this.results.style.display = 'block';
                const modeText = !this.isFlaskAvailable ? ' (Demo Mode)' : '';
                this.showMessage(`Model trained successfully!${modeText}`, 'success');
            } else {
                this.showMessage(`Error: ${data ? data.error : 'Unknown error'}`, 'error');
            }
        } catch (error) {
            console.error('Training error:', error);
            this.showMessage(`Error: ${error.message}`, 'error');
        } finally {
            this.trainButton.disabled = false;
            this.loading.style.display = 'none';
        }
    }
    
    async getMockTrainingData() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
            success: true,
            data_size: 891,
            train_size: 712,
            test_size: 179,
            accuracy: 0.8324,
            feature_importance: [
                { feature: 'Fare', importance: 0.2845 },
                { feature: 'Age', importance: 0.2156 },
                { feature: 'Sex', importance: 0.1923 },
                { feature: 'Pclass', importance: 0.1634 },
                { feature: 'SibSp', importance: 0.0834 },
                { feature: 'Parch', importance: 0.0423 },
                { feature: 'Embarked', importance: 0.0185 }
            ],
            performance: {
                accuracy: 0.8324,
                confusion_matrix: [[98, 13], [17, 51]],
                classification_report: {}
            }
        };
    }
    
    async getMockVisualizationData() {
        return {
            confusion_matrix: [[98, 13], [17, 51]],
            feature_importance: [
                { feature: 'Fare', importance: 0.2845 },
                { feature: 'Age', importance: 0.2156 },
                { feature: 'Sex', importance: 0.1923 },
                { feature: 'Pclass', importance: 0.1634 },
                { feature: 'SibSp', importance: 0.0834 },
                { feature: 'Parch', importance: 0.0423 },
                { feature: 'Embarked', importance: 0.0185 }
            ],
            comparison: {
                actual: this.generateRandomData(179, [0, 1]),
                predicted: this.generateRandomPredictions(179)
            },
            accuracy: 0.8324
        };
    }
    
    generateRandomData(length, values) {
        return Array.from({length}, () => values[Math.floor(Math.random() * values.length)]);
    }
    
    generateRandomPredictions(length) {
        const actual = this.generateRandomData(length, [0, 1]);
        // Make 83% of predictions correct to match our accuracy
        return actual.map(val => Math.random() < 0.83 ? val : 1 - val);
    }
    
    updateMetrics(data) {
        document.getElementById('accuracy').textContent = `${(data.accuracy * 100).toFixed(1)}%`;
        document.getElementById('dataSize').textContent = data.data_size;
        document.getElementById('trainSize').textContent = data.train_size;
        document.getElementById('testSize').textContent = data.test_size;
    }
    
    async createVisualizations() {
        try {
            let data;
            
            if (this.isFlaskAvailable) {
                try {
                    const response = await fetch('/get_visualization_data');
                    const contentType = response.headers.get('content-type');
                    
                    if (contentType && contentType.includes('application/json')) {
                        data = await response.json();
                        
                        if (data.error) {
                            throw new Error(data.error);
                        }
                    } else {
                        throw new Error('Non-JSON response');
                    }
                } catch (fetchError) {
                    console.log('Visualization API failed, using mock data:', fetchError);
                    data = await this.getMockVisualizationData();
                }
            } else {
                data = await this.getMockVisualizationData();
            }
            
            this.createConfusionMatrix(data.confusion_matrix);
            this.createFeatureImportance(data.feature_importance);
            this.createPredictionAccuracy(data.comparison);
        } catch (error) {
            console.error('Error creating visualizations:', error);
            // Always fallback to mock data
            const data = await this.getMockVisualizationData();
            this.createConfusionMatrix(data.confusion_matrix);
            this.createFeatureImportance(data.feature_importance);
            this.createPredictionAccuracy(data.comparison);
        }
    }
    
    createConfusionMatrix(confusionMatrix) {
        const data = [{
            z: confusionMatrix,
            x: ['Predicted: Not Survived', 'Predicted: Survived'],
            y: ['Actual: Survived', 'Actual: Not Survived'],
            type: 'heatmap',
            colorscale: 'Blues',
            showscale: true,
            text: confusionMatrix.map(row => row.map(val => val.toString())),
            texttemplate: '%{text}',
            textfont: { size: 16, color: 'white' }
        }];
        
        const layout = {
            margin: { t: 20, r: 30, b: 60, l: 100 }, // Increased margins
            font: { size: 12 },
            height: 300
        };
        
        Plotly.newPlot('confusionMatrix', data, layout, {responsive: true});
    }
    
            createFeatureImportance(featureImportance) {
                const features = featureImportance.map(item => item.feature);
                const importance = featureImportance.map(item => item.importance);
                
                const data = [{
                    x: importance,
                    y: features,
                    type: 'bar',
                    orientation: 'h',
                    marker: {
                        color: importance,
                        colorscale: 'Viridis',
                        colorbar: {title: 'Importance'}
                    }
                }];
                
                const layout = {
                    margin: { t: 20, r: 40, b: 40, l: 120 }, // Increased left margin
                    font: { size: 11 },
                    height: 320, // Slightly increased height
                    xaxis: { 
                        title: 'Importance',
                        titlefont: { size: 12 }
                    },
                    yaxis: {
                        tickfont: { size: 11 },
                        automargin: true // Let Plotly auto-adjust for labels
                    }
                };
                
                Plotly.newPlot('featureImportance', data, layout, {responsive: true});
            }    createPredictionAccuracy(comparison) {
        const correct = [];
        const incorrect = [];
        
        comparison.actual.forEach((actual, index) => {
            const predicted = comparison.predicted[index];
            if (actual === predicted) {
                correct.push(index);
            } else {
                incorrect.push(index);
            }
        });
        
        const data = [
            {
                x: correct,
                y: correct.map(() => 1),
                name: 'Correct Predictions',
                type: 'scatter',
                mode: 'markers',
                marker: { color: '#28a745', size: 8 }
            },
            {
                x: incorrect,
                y: incorrect.map(() => 0),
                name: 'Incorrect Predictions',
                type: 'scatter',
                mode: 'markers',
                marker: { color: '#dc3545', size: 8 }
            }
        ];
        
        const layout = {
            margin: { t: 20, r: 20, b: 60, l: 60 },
            font: { size: 12 },
            height: 300,
            xaxis: { title: 'Test Sample Index' },
            yaxis: { 
                title: 'Prediction Result',
                tickvals: [0, 1],
                ticktext: ['Incorrect', 'Correct']
            },
            showlegend: true
        };
        
        Plotly.newPlot('predictionAccuracy', data, layout, {responsive: true});
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TitanicML();
});