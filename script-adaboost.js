// Interactive AdaBoost Algorithm with Real Titanic Data
class InteractiveAdaBoost {
    constructor() {
        this.startButton = document.getElementById('startButton');
    this.nextStepButton = document.getElementById('nextStepButton');
    this.nLearnersSelect = document.getElementById('nLearners');
        this.stepControls = document.getElementById('stepControls');
        this.algorithmSteps = document.getElementById('algorithmSteps');
        this.algorithmDetails = document.getElementById('algorithmDetails');
        this.loading = document.getElementById('loading');
        this.loadingText = document.getElementById('loadingText');
        this.results = document.getElementById('results');
        this.messages = document.getElementById('messages');
        
        // Algorithm state
        this.rawData = null;
        this.processedData = null;
        this.trainData = null;
        this.testData = null;
    this.currentStep = -1;
    this.weights = null;
    this.weakLearners = [];
    this.learnerWeights = [];
    this.maxLearners = 10; // default, will be read from UI
        
        this.init();
    }
    
    init() {
        this.startButton.addEventListener('click', () => this.startTraining());
        this.nextStepButton.addEventListener('click', () => this.nextStep());
        if (this.nLearnersSelect) {
            this.nLearnersSelect.addEventListener('change', () => {
                this.maxLearners = parseInt(this.nLearnersSelect.value, 10);
            });
            // initialize from select
            this.maxLearners = parseInt(this.nLearnersSelect.value, 10);
        }
    }
    
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = type;
        messageDiv.textContent = message;
        this.messages.innerHTML = '';
        this.messages.appendChild(messageDiv);
    }
    
    updateStepStatus(stepIndex, status) {
        const stepElement = document.getElementById(`step-${stepIndex}`);
        if (stepElement) {
            const statusElement = stepElement.querySelector('.step-status');
            switch (status) {
                case 'active':
                    stepElement.className = 'step-item active';
                    statusElement.textContent = '🔄';
                    break;
                case 'completed':
                    stepElement.className = 'step-item completed';
                    statusElement.textContent = '✅';
                    break;
                case 'pending':
                    stepElement.className = 'step-item';
                    statusElement.textContent = '⏳';
                    break;
            }
        }
    }
    
    updateStepDetails(title, content, learnerInfo = null) {
        document.getElementById('currentStepTitle').textContent = title;
        document.getElementById('stepDetailsContent').innerHTML = content;
        
        const learnerInfoDiv = document.getElementById('learnerInfo');
        if (learnerInfo) {
            learnerInfoDiv.innerHTML = learnerInfo;
            learnerInfoDiv.style.display = 'grid';
        } else {
            learnerInfoDiv.style.display = 'none';
        }
    }
    
    async startTraining() {
        this.startButton.disabled = true;
        this.loading.style.display = 'block';
        this.algorithmSteps.style.display = 'block';
        this.algorithmDetails.style.display = 'block';
        
        try {
            this.showMessage('Starting AdaBoost algorithm with real Titanic data...', 'success');
            await this.loadData();
            this.currentStep = -1;
            // Read UI-selected number of learners
            if (this.nLearnersSelect) this.maxLearners = parseInt(this.nLearnersSelect.value, 10);
            this.stepControls.style.display = 'flex';
            this.nextStep();
        } catch (error) {
            this.showMessage(`Error: ${error.message}`, 'error');
        } finally {
            this.loading.style.display = 'none';
        }
    }
    
    async loadData() {
        this.loadingText.textContent = 'Downloading real Titanic dataset...';
        
        const response = await fetch('https://raw.githubusercontent.com/datasciencedojo/datasets/refs/heads/master/titanic.csv');
        if (!response.ok) throw new Error('Failed to load dataset');
        
        const csvText = await response.text();
        this.rawData = this.parseCSV(csvText);
        
        this.loadingText.textContent = 'Processing and cleaning data...';
        await new Promise(resolve => setTimeout(resolve, 500));
        
        this.processData();
        this.splitData();
    }
    
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',');
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header.trim()] = values[index].trim();
                });
                data.push(row);
            }
        }
        return data;
    }
    
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }
    
    processData() {
        this.processedData = this.rawData.filter(row => {
            return row.Survived !== '' && row.Pclass !== '' && row.Sex !== '';
        }).map(row => {
            return {
                survived: parseInt(row.Survived) || 0,
                pclass: parseInt(row.Pclass) || 3,
                sex: row.Sex === 'male' ? 1 : 0,
                age: parseFloat(row.Age) || 29.7,
                sibsp: parseInt(row.SibSp) || 0,
                parch: parseInt(row.Parch) || 0,
                fare: parseFloat(row.Fare) || 32.2,
                embarked: this.encodeEmbarked(row.Embarked || 'S')
            };
        });
    }
    
    encodeEmbarked(embarked) {
        switch (embarked.trim().toUpperCase()) {
            case 'C': return 0;
            case 'Q': return 1;
            case 'S': return 2;
            default: return 2;
        }
    }
    
    splitData() {
        const shuffled = [...this.processedData].sort(() => Math.random() - 0.5);
        const trainSize = Math.floor(shuffled.length * 0.8);
        this.trainData = shuffled.slice(0, trainSize);
        this.testData = shuffled.slice(trainSize);
    }
    
    async nextStep() {
    // Advance to next algorithm step
        
        this.currentStep++;
        
        // Mark previous step as completed
        if (this.currentStep > 0) {
            this.updateStepStatus(this.currentStep - 1, 'completed');
        }
        
        // Mark current step as active
        this.updateStepStatus(this.currentStep, 'active');
        
        switch (this.currentStep) {
            case 0:
                await this.step1_LoadData();
                break;
            case 1:
                await this.step2_InitializeWeights();
                break;
            case 2:
                await this.step3_TrainWeakLearner();
                break;
            case 3:
                await this.step4_CalculateError();
                break;
            case 4:
                await this.step5_CalculateAlpha();
                break;
            case 5:
                await this.step6_UpdateWeights();
                break;
            case 6:
                await this.step7_RepeatOrFinish();
                break;
            case 7:
                await this.step8_CombineLearners();
                break;
            default:
                this.finishTraining();
                return;
        }
        
        // No auto-run behavior: user advances with "Next Step"
    }
    
    async step1_LoadData() {
        this.updateStepDetails(
            'Step 1: Load and Preprocess Dataset',
            `
            <p><strong>Real Titanic Dataset Loaded Successfully!</strong></p>
            <p>• Original records: ${this.rawData.length}</p>
            <p>• Valid records after cleaning: ${this.processedData.length}</p>
            <p>• Training samples: ${this.trainData.length}</p>
            <p>• Test samples: ${this.testData.length}</p>
            <p><strong>Features:</strong> Passenger Class, Sex, Age, Siblings/Spouses, Parents/Children, Fare, Embarked Port</p>
            <p><strong>Target:</strong> Survived (0 = No, 1 = Yes)</p>
            `
        );
    }
    
    async step2_InitializeWeights() {
        // Initialize uniform weights
        const n = this.trainData.length;
        this.weights = new Array(n).fill(1.0 / n);
        
        this.updateStepDetails(
            'Step 2: Initialize Sample Weights',
            `
            <p><strong>AdaBoost starts by giving equal importance to all training samples.</strong></p>
            <p>• Number of training samples: ${n}</p>
            <p>• Initial weight for each sample: ${(1.0 / n).toFixed(6)}</p>
            <p>• Sum of all weights: ${this.weights.reduce((a, b) => a + b, 0).toFixed(6)}</p>
            <p><strong>Key Insight:</strong> Initially, all samples are equally likely to be selected for training the first weak learner.</p>
            `,
            `
            <div class="learner-card">
                <h5>Weight Distribution</h5>
                <div class="value">Uniform: ${(1.0 / n).toFixed(6)} each</div>
            </div>
            <div class="learner-card">
                <h5>Total Samples</h5>
                <div class="value">${n}</div>
            </div>
            `
        );
    }
    
    async step3_TrainWeakLearner() {
        // Train a decision stump (weak learner)
        const weakLearner = this.trainDecisionStump();
        this.weakLearners.push(weakLearner);
        
        const learnerIndex = this.weakLearners.length;
        
        this.updateStepDetails(
            `Step 3: Train Weak Learner #${learnerIndex}`,
            `
            <p><strong>Training a Decision Stump (simple decision tree with one split)</strong></p>
            <p>• Feature used for split: <strong>${weakLearner.feature}</strong></p>
            <p>• Threshold value: <strong>${weakLearner.threshold.toFixed(3)}</strong></p>
            <p>• Split condition: If ${weakLearner.feature} ${weakLearner.operator} ${weakLearner.threshold.toFixed(3)}, predict ${weakLearner.prediction}</p>
            <p>• Training accuracy: <strong>${(weakLearner.accuracy * 100).toFixed(1)}%</strong></p>
            <p><strong>How it works:</strong> The algorithm tests different features and thresholds to find the split that minimizes weighted error.</p>
            `,
            `
            <div class="learner-card">
                <h5>Best Feature</h5>
                <div class="value">${weakLearner.feature}</div>
            </div>
            <div class="learner-card">
                <h5>Threshold</h5>
                <div class="value">${weakLearner.threshold.toFixed(3)}</div>
            </div>
            <div class="learner-card">
                <h5>Accuracy</h5>
                <div class="value">${(weakLearner.accuracy * 100).toFixed(1)}%</div>
            </div>
            `
        );
    }
    
    async step4_CalculateError() {
        const currentLearner = this.weakLearners[this.weakLearners.length - 1];
        const weightedError = this.calculateWeightedError(currentLearner);
        currentLearner.error = weightedError;
        
        this.updateStepDetails(
            'Step 4: Calculate Weighted Error Rate',
            `
            <p><strong>Computing how well the weak learner performed on weighted training data</strong></p>
            <p>• Weighted error rate: <strong>${(weightedError * 100).toFixed(2)}%</strong></p>
            <p>• Formula: ε = Σ(weight_i × error_i) / Σ(weight_i)</p>
            <p><strong>Key Insight:</strong> Weighted error emphasizes mistakes on samples that previous learners got wrong.</p>
            <p>• If error > 50%, the learner is worse than random guessing</p>
            <p>• If error ≈ 0%, the learner is perfect (rare in practice)</p>
            `,
            `
            <div class="learner-card">
                <h5>Weighted Error</h5>
                <div class="value">${(weightedError * 100).toFixed(2)}%</div>
            </div>
            <div class="learner-card">
                <h5>Performance</h5>
                <div class="value">${weightedError < 0.5 ? 'Good' : 'Poor'}</div>
            </div>
            `
        );
    }
    
    async step5_CalculateAlpha() {
        const currentLearner = this.weakLearners[this.weakLearners.length - 1];
        const alpha = this.calculateAlpha(currentLearner.error);
        this.learnerWeights.push(alpha);
        
        this.updateStepDetails(
            'Step 5: Calculate Learner Weight (α)',
            `
            <p><strong>Determining how much to trust this weak learner in the final prediction</strong></p>
            <p>• Learner weight (α): <strong>${alpha.toFixed(4)}</strong></p>
            <p>• Formula: α = 0.5 × ln((1 - ε) / ε)</p>
            <p>• Where ε = ${(currentLearner.error * 100).toFixed(2)}%</p>
            <p><strong>Key Insight:</strong> Better learners (lower error) get higher weights in the final ensemble.</p>
            <p>• High α: This learner is very reliable</p>
            <p>• Low α: This learner is less reliable</p>
            `,
            `
            <div class="learner-card">
                <h5>Alpha (α)</h5>
                <div class="value">${alpha.toFixed(4)}</div>
            </div>
            <div class="learner-card">
                <h5>Reliability</h5>
                <div class="value">${alpha > 0.5 ? 'High' : alpha > 0.2 ? 'Medium' : 'Low'}</div>
            </div>
            `
        );
    }
    
    async step6_UpdateWeights() {
        const currentLearner = this.weakLearners[this.weakLearners.length - 1];
        const alpha = this.learnerWeights[this.learnerWeights.length - 1];
        
        const oldWeightSum = this.weights.reduce((a, b) => a + b, 0);
        this.updateSampleWeights(currentLearner, alpha);
        const newWeightSum = this.weights.reduce((a, b) => a + b, 0);
        
        // Count how many weights increased/decreased
        let increased = 0, decreased = 0;
        for (let i = 0; i < this.trainData.length; i++) {
            const prediction = this.predictSample(currentLearner, this.trainData[i]);
            if (prediction !== this.trainData[i].survived) {
                increased++;
            } else {
                decreased++;
            }
        }
        
        this.updateStepDetails(
            'Step 6: Update Sample Weights',
            `
            <p><strong>Increasing weights for misclassified samples, decreasing for correct ones</strong></p>
            <p>• Samples with increased weight: <strong>${increased}</strong> (misclassified)</p>
            <p>• Samples with decreased weight: <strong>${decreased}</strong> (correctly classified)</p>
            <p>• Weight normalization: Sum = ${newWeightSum.toFixed(6)}</p>
            <p><strong>Formula:</strong> w_i = w_i × exp(α × y_i × h_i) / Z</p>
            <p><strong>Key Insight:</strong> Next learner will focus more on the currently misclassified samples.</p>
            `,
            `
            <div class="learner-card">
                <h5>Misclassified</h5>
                <div class="value">${increased}</div>
            </div>
            <div class="learner-card">
                <h5>Correct</h5>
                <div class="value">${decreased}</div>
            </div>
            <div class="learner-card">
                <h5>Weight Sum</h5>
                <div class="value">${newWeightSum.toFixed(3)}</div>
            </div>
            `
        );
    }
    
    async step7_RepeatOrFinish() {
    const totalLearners = this.weakLearners.length;
    const maxLearners = this.maxLearners; // controlled by UI
        
    if (totalLearners < maxLearners) {
            this.updateStepDetails(
                `Step 7: Repeat for Next Learner (${totalLearners}/${maxLearners})`,
                `
                <p><strong>AdaBoost will now train another weak learner on the re-weighted data</strong></p>
                <p>• Current number of weak learners: <strong>${totalLearners}</strong></p>
                <p>• Target number of learners: <strong>${maxLearners}</strong></p>
                <p>• The process will repeat steps 3-6 with updated sample weights</p>
                <p><strong>Key Insight:</strong> Each new learner focuses on the mistakes of previous learners.</p>
                <p><em>Click "Next Step" to train the next weak learner, or continue with current ensemble.</em></p>
                `,
                `
                <div class="learner-card">
                    <h5>Progress</h5>
                    <div class="value">${totalLearners}/${maxLearners}</div>
                </div>
                <div class="learner-card">
                    <h5>Next Action</h5>
                    <div class="value">Train Learner ${totalLearners + 1}</div>
                </div>
                `
            );
            
            // Reset to step 2 for next iteration
            this.currentStep = 1;
            
        } else {
            // Move to final step
            this.currentStep = 6;
            this.nextStep();
        }
    }
    
    async step8_CombineLearners() {
        const finalAccuracy = this.evaluateEnsemble();
        
        this.updateStepDetails(
            'Step 8: Combine All Weak Learners',
            `
            <p><strong>Final AdaBoost Model: Weighted Combination of ${this.weakLearners.length} Weak Learners</strong></p>
            <p>• Final ensemble accuracy: <strong>${(finalAccuracy * 100).toFixed(1)}%</strong></p>
            <p>• Prediction formula: sign(Σ(α_i × h_i(x)))</p>
            <p>• Each prediction is weighted by its learner's α value</p>
            <p><strong>Key Insight:</strong> The ensemble is typically much stronger than any individual weak learner!</p>
            <p><em>Ready to see detailed results and visualizations.</em></p>
            `,
            `
            <div class="learner-card">
                <h5>Total Learners</h5>
                <div class="value">${this.weakLearners.length}</div>
            </div>
            <div class="learner-card">
                <h5>Final Accuracy</h5>
                <div class="value">${(finalAccuracy * 100).toFixed(1)}%</div>
            </div>
            <div class="learner-card">
                <h5>Improvement</h5>
                <div class="value">${((finalAccuracy - this.weakLearners[0].accuracy) * 100).toFixed(1)}%</div>
            </div>
            `
        );
        
        this.updateStepStatus(this.currentStep, 'completed');
        this.showFinalResults();
    }
    
    trainDecisionStump() {
        const features = ['pclass', 'sex', 'age', 'sibsp', 'parch', 'fare', 'embarked'];
        const featureNames = ['Pclass', 'Sex', 'Age', 'SibSp', 'Parch', 'Fare', 'Embarked'];
        
        let bestFeature = null;
        let bestThreshold = 0;
        let bestError = Infinity;
        let bestPrediction = 0;
        let bestOperator = '<=';
        
        for (let f = 0; f < features.length; f++) {
            const feature = features[f];
            const values = this.trainData.map(sample => sample[feature]);
            const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
            
            for (let i = 0; i < uniqueValues.length - 1; i++) {
                const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;
                
                // Try both directions
                for (const operator of ['<=', '>']) {
                    for (const prediction of [0, 1]) {
                        let weightedError = 0;
                        
                        for (let j = 0; j < this.trainData.length; j++) {
                            const sample = this.trainData[j];
                            const featureValue = sample[feature];
                            
                            let pred = 0;
                            if (operator === '<=' && featureValue <= threshold) {
                                pred = prediction;
                            } else if (operator === '>' && featureValue > threshold) {
                                pred = prediction;
                            } else {
                                pred = 1 - prediction;
                            }
                            
                            if (pred !== sample.survived) {
                                weightedError += this.weights[j];
                            }
                        }
                        
                        if (weightedError < bestError) {
                            bestError = weightedError;
                            bestFeature = featureNames[f];
                            bestThreshold = threshold;
                            bestPrediction = prediction;
                            bestOperator = operator;
                        }
                    }
                }
            }
        }
        
        // Calculate accuracy
        let correct = 0;
        for (let i = 0; i < this.trainData.length; i++) {
            const prediction = this.predictSampleByParams(this.trainData[i], bestFeature, bestThreshold, bestOperator, bestPrediction);
            if (prediction === this.trainData[i].survived) {
                correct++;
            }
        }
        
        return {
            feature: bestFeature,
            threshold: bestThreshold,
            operator: bestOperator,
            prediction: bestPrediction,
            error: bestError,
            accuracy: correct / this.trainData.length
        };
    }
    
    predictSample(learner, sample) {
        return this.predictSampleByParams(sample, learner.feature, learner.threshold, learner.operator, learner.prediction);
    }
    
    predictSampleByParams(sample, feature, threshold, operator, prediction) {
        const featureMap = {
            'Pclass': 'pclass',
            'Sex': 'sex', 
            'Age': 'age',
            'SibSp': 'sibsp',
            'Parch': 'parch',
            'Fare': 'fare',
            'Embarked': 'embarked'
        };
        
        const featureValue = sample[featureMap[feature]];
        
        if (operator === '<=' && featureValue <= threshold) {
            return prediction;
        } else if (operator === '>' && featureValue > threshold) {
            return prediction;
        } else {
            return 1 - prediction;
        }
    }
    
    calculateWeightedError(learner) {
        let weightedError = 0;
        let totalWeight = 0;
        
        for (let i = 0; i < this.trainData.length; i++) {
            const prediction = this.predictSample(learner, this.trainData[i]);
            totalWeight += this.weights[i];
            
            if (prediction !== this.trainData[i].survived) {
                weightedError += this.weights[i];
            }
        }
        
        return weightedError / totalWeight;
    }
    
    calculateAlpha(error) {
        if (error === 0) error = 1e-10; // Avoid log(0)
        if (error >= 0.5) error = 0.499; // Avoid negative alpha
        
        return 0.5 * Math.log((1 - error) / error);
    }
    
    updateSampleWeights(learner, alpha) {
        let normalizationFactor = 0;
        
        // Update weights
        for (let i = 0; i < this.trainData.length; i++) {
            const prediction = this.predictSample(learner, this.trainData[i]);
            const actual = this.trainData[i].survived;
            
            // If prediction is wrong, increase weight, otherwise decrease
            const exponent = alpha * (prediction === actual ? -1 : 1);
            this.weights[i] *= Math.exp(exponent);
            normalizationFactor += this.weights[i];
        }
        
        // Normalize weights to sum to 1
        for (let i = 0; i < this.weights.length; i++) {
            this.weights[i] /= normalizationFactor;
        }
    }
    
    evaluateEnsemble() {
        let correct = 0;
        
        for (const sample of this.testData) {
            let weightedVote = 0;
            
            for (let i = 0; i < this.weakLearners.length; i++) {
                const prediction = this.predictSample(this.weakLearners[i], sample);
                const vote = prediction === 1 ? 1 : -1;
                weightedVote += this.learnerWeights[i] * vote;
            }
            
            const finalPrediction = weightedVote > 0 ? 1 : 0;
            if (finalPrediction === sample.survived) {
                correct++;
            }
        }
        
        return correct / this.testData.length;
    }
    
    toggleAutoRun() {
        this.isAutoRunning = !this.isAutoRunning;
        this.autoRunButton.textContent = this.isAutoRunning ? 'Stop Auto' : 'Auto Run';
        
        if (this.isAutoRunning) {
            this.nextStep();
        }
    }
    
    finishTraining() {
        this.stepControls.style.display = 'none';
        this.showMessage('AdaBoost training completed! View results below.', 'success');
        this.results.style.display = 'block';
        this.createFinalVisualizations();
    }
    
    showFinalResults() {
        const accuracy = this.evaluateEnsemble();
        
        // Update metrics
        document.getElementById('accuracy').textContent = `${(accuracy * 100).toFixed(1)}%`;
        document.getElementById('dataSize').textContent = this.processedData.length;
        document.getElementById('trainSize').textContent = this.trainData.length;
        document.getElementById('testSize').textContent = this.testData.length;
    }
    
    createFinalVisualizations() {
        this.createLearnerProgression();
        this.createFeatureImportance();
        this.createConfusionMatrix();
    }
    
    createLearnerProgression() {
        const learnerNumbers = this.weakLearners.map((_, i) => i + 1);
        const learnerAccuracies = this.weakLearners.map(l => l.accuracy * 100);
        const learnerWeights = this.learnerWeights.map(w => w);
        
        const trace1 = {
            x: learnerNumbers,
            y: learnerAccuracies,
            name: 'Individual Accuracy',
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: '#007bff' }
        };
        
        const trace2 = {
            x: learnerNumbers,
            y: learnerWeights,
            name: 'Learner Weight (α)',
            type: 'scatter',
            mode: 'lines+markers',
            yaxis: 'y2',
            line: { color: '#28a745' }
        };
        
        const layout = {
            title: 'AdaBoost Learner Progression',
            xaxis: { title: 'Weak Learner Number' },
            yaxis: { 
                title: 'Individual Accuracy (%)',
                side: 'left'
            },
            yaxis2: {
                title: 'Learner Weight (α)',
                side: 'right',
                overlaying: 'y'
            },
            margin: { t: 50, r: 80, b: 60, l: 80 },
            height: 320
        };
        
        Plotly.newPlot('confusionMatrix', [trace1, trace2], layout, {responsive: true});
    }
    
    createFeatureImportance() {
        // Calculate feature usage frequency
        const featureCount = {};
        this.weakLearners.forEach(learner => {
            featureCount[learner.feature] = (featureCount[learner.feature] || 0) + 1;
        });
        
        const features = Object.keys(featureCount);
        const counts = Object.values(featureCount);
        
        const data = [{
            x: counts,
            y: features,
            type: 'bar',
            orientation: 'h',
            marker: {
                color: counts,
                colorscale: 'Viridis',
                colorbar: { title: 'Usage Count' }
            }
        }];
        
        const layout = {
            title: 'Feature Usage in Weak Learners',
            margin: { t: 50, r: 40, b: 40, l: 120 },
            font: { size: 11 },
            height: 320,
            xaxis: { 
                title: 'Times Used as Split Feature',
                titlefont: { size: 12 }
            },
            yaxis: {
                tickfont: { size: 11 },
                automargin: true
            }
        };
        
        Plotly.newPlot('featureImportance', data, layout, {responsive: true});
    }
    
    createConfusionMatrix() {
        // Generate confusion matrix
        let tp = 0, tn = 0, fp = 0, fn = 0;
        
        for (const sample of this.testData) {
            let weightedVote = 0;
            
            for (let i = 0; i < this.weakLearners.length; i++) {
                const prediction = this.predictSample(this.weakLearners[i], sample);
                const vote = prediction === 1 ? 1 : -1;
                weightedVote += this.learnerWeights[i] * vote;
            }
            
            const finalPrediction = weightedVote > 0 ? 1 : 0;
            const actual = sample.survived;
            
            if (actual === 1 && finalPrediction === 1) tp++;
            else if (actual === 0 && finalPrediction === 0) tn++;
            else if (actual === 0 && finalPrediction === 1) fp++;
            else if (actual === 1 && finalPrediction === 0) fn++;
        }
        
        const confusionMatrix = [[tn, fp], [fn, tp]];
        
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
            title: 'AdaBoost Confusion Matrix',
            margin: { t: 50, r: 30, b: 60, l: 100 },
            font: { size: 12 },
            height: 300
        };
        
        Plotly.newPlot('predictionAccuracy', data, layout, {responsive: true});
    }
}

// Initialize the interactive AdaBoost application
document.addEventListener('DOMContentLoaded', () => {
    new InteractiveAdaBoost();
});