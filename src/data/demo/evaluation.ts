import type { NodeSpec } from './types';

export const evaluationSpecs: NodeSpec[] = [
  {
    id: 'model-evaluation',
    title: 'Model Evaluation',
    parentId: 'ml-root',
    type: 'subject',
    difficulty: 'intermediate',
    summary: 'Measuring whether a model actually works: splits, metrics, and the traps in between.',
    minutes: 16,
    objectives: [
      'Design a train/validation/test protocol',
      'Select metrics aligned with the real objective',
      'Recognise and avoid the most common evaluation mistakes',
    ],
    theory: [
      [
        'Three splits',
        'Training fits parameters. Validation selects hyperparameters and models. Test estimates final performance, used once. Reusing test data turns it into a validation set.',
      ],
      [
        'Metric selection',
        'Accuracy for balanced classes. Precision/recall/F1 for imbalance. PR-AUC for rare positives. ROC-AUC for ranking quality across thresholds. RMSE/MAE for regression.',
      ],
      [
        'The cost of optimism',
        'Every decision made using a dataset inflates its apparent performance. With enough hyperparameter search on validation data, even validation becomes optimistic — nested cross-validation addresses this.',
      ],
      [
        'Baselines',
        'Always compare against the trivial predictor: majority class, mean target, or the previous production model. A model that cannot beat the baseline is not adding value.',
      ],
    ],
    definitions: [
      ['Validation set', 'Held-out data used for model selection.'],
      ['Test set', 'Held-out data used once for the final estimate.'],
      ['Baseline', 'The simplest reasonable predictor used as a comparison point.'],
      ['Data leakage', 'Information from outside training contaminating the fit.'],
    ],
    principles: [
      'Report uncertainty, not just a single number',
      'Choose metrics before looking at results',
      'A model is only validated on data it has never influenced',
    ],
    visuals: [
      {
        kind: 'flow',
        title: 'Evaluation protocol',
        steps: ['Collect all data', 'Split train / validation / test', 'Fit on train', 'Select on validation', 'Refit on train+validation', 'Report on test once'],
      },
    ],
    examples: [
      {
        level: 'beginner',
        title: 'Baseline first',
        problem: 'A churn model reaches 88% accuracy. Is it good?',
        solution:
          'Only if the churn rate is far from 12%. If 12% churn, predicting "no churn" always gives 88% accuracy — the model must beat that meaningfully on recall and PR-AUC.',
      },
      {
        level: 'practical',
        title: 'Nested cross-validation',
        problem: 'When is a single validation split insufficient?',
        solution:
          'With small datasets or extensive hyperparameter search. Nested CV uses an inner loop for selection and an outer loop for estimation, giving an unbiased estimate of the whole procedure.',
      },
      {
        level: 'advanced',
        title: 'Temporal leakage',
        problem: 'You randomly split time-series data. What breaks?',
        solution:
          'Future information leaks into training, so validation performance is unattainable in production. Use forward-chaining splits where training data always precedes validation data.',
      },
    ],
    applications: [
      { title: 'Model release gating', description: 'Evaluation thresholds determine whether a model ships.', industry: 'MLOps' },
      { title: 'Regulatory reporting', description: 'Documented validation protocols are required for audited models.', industry: 'Finance' },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'The test set should be used:',
        options: ['For every hyperparameter decision', 'Once, for the final estimate', 'Never', 'Only for feature selection'],
        answer: '1',
        explanation: 'Any repeated use converts it into a validation set and inflates the estimate.',
        difficulty: 'beginner',
      },
      {
        type: 'truefalse',
        prompt: 'Random splitting is appropriate for time-series data.',
        answer: false,
        explanation: 'Random splits leak future information into training. Time-ordered or forward-chaining splits are required.',
        difficulty: 'intermediate',
      },
      {
        type: 'short',
        prompt: 'Why is a baseline model necessary?',
        answer: 'trivial|majority|mean|comparison|value|beats',
        explanation: 'Without a baseline there is no evidence the model adds value; a high-looking metric may be achievable by a trivial predictor.',
        difficulty: 'intermediate',
      },
    ],
    prerequisites: ['ml-intro', 'statistics'],
    related: ['accuracy', 'precision-recall', 'confusion-matrix', 'cross-validation', 'overfitting'],
  },
  {
    id: 'confusion-matrix',
    title: 'Confusion Matrix',
    parentId: 'model-evaluation',
    type: 'concept',
    difficulty: 'beginner',
    summary: 'The four-cell table of predictions versus reality that every classification metric derives from.',
    minutes: 10,
    objectives: ['Read a confusion matrix', 'Compute precision and recall from it', 'Explain why the matrix matters more than a single score'],
    theory: [
      [
        'The four cells',
        'True positives (correctly predicted positive), true negatives, false positives (type I error), and false negatives (type II error). Every classification metric is a function of these four numbers.',
      ],
      [
        'Reading the shape',
        'A strong diagonal means good performance. Off-diagonal mass tells you which error type dominates, which is what actually matters operationally.',
      ],
      [
        'Multi-class',
        'For K classes the matrix is K×K. Per-class precision and recall come from treating each class as positive in turn.',
      ],
    ],
    definitions: [
      ['False positive', 'Predicted positive but actually negative — a false alarm.'],
      ['False negative', 'Predicted negative but actually positive — a miss.'],
      ['Type I / Type II error', 'Statistical names for false positive and false negative.'],
    ],
    principles: [
      'The matrix is the ground truth; metrics are summaries',
      'Error asymmetry should drive metric choice',
      'Report per-class results for multi-class problems',
    ],
    visuals: [
      {
        kind: 'matrix',
        title: 'Binary confusion matrix',
        matrix: { rows: ['Actual positive', 'Actual negative'], cols: ['Predicted positive', 'Predicted negative'], values: [[80, 20], [10, 890]] },
        caption: 'TP=80, FN=20, FP=10, TN=890. Accuracy 97%, recall 80%, precision 88.9%.',
      },
    ],
    examples: [
      {
        level: 'beginner',
        title: 'From cells to metrics',
        problem: 'TP=40, FP=10, FN=20, TN=930. Compute precision and recall.',
        solution: 'Precision = 40/50 = 0.80. Recall = 40/60 = 0.667. F1 ≈ 0.727.',
      },
      {
        level: 'practical',
        title: 'Cost asymmetry',
        problem: 'Missing a fraud costs 100× a false alarm. Which cell do you minimise?',
        solution: 'False negatives. Lower the threshold to increase recall, accepting more false positives.',
      },
    ],
    questions: [
      {
        type: 'numeric',
        prompt: 'TP=30, FP=20, FN=10, TN=940. What is precision? (2 decimals)',
        answer: 0.6,
        tolerance: 0.01,
        explanation: 'Precision = TP/(TP+FP) = 30/50 = 0.6.',
        difficulty: 'intermediate',
      },
      {
        type: 'mcq',
        prompt: 'A false negative is:',
        options: ['Predicted positive, actually negative', 'Predicted negative, actually positive', 'Predicted correctly', 'A missing value'],
        answer: '1',
        explanation: 'The model said negative but the truth was positive — a miss.',
        difficulty: 'beginner',
      },
    ],
    prerequisites: ['model-evaluation'],
    related: ['accuracy', 'precision-recall', 'f1-score'],
  },
  {
    id: 'accuracy',
    title: 'Accuracy',
    parentId: 'model-evaluation',
    type: 'concept',
    difficulty: 'beginner',
    summary: 'The fraction of correct predictions — intuitive, and dangerously misleading under imbalance.',
    minutes: 8,
    objectives: ['Compute accuracy', 'Explain the accuracy paradox', 'Know when accuracy is acceptable'],
    theory: [
      [
        'Definition',
        'Accuracy = (TP + TN) / total. It weights every prediction equally, which assumes every error has equal cost.',
      ],
      [
        'The accuracy paradox',
        'With 1% positives, predicting "negative" always gives 99% accuracy and zero utility. Accuracy rewards ignoring the minority class.',
      ],
      [
        'When it is fine',
        'Balanced classes and symmetric error costs. Otherwise report precision, recall, and PR-AUC alongside it.',
      ],
    ],
    formulas: [
      {
        name: 'Accuracy',
        expression: 'Accuracy = (TP + TN) / (TP + TN + FP + FN)',
        variables: [
          ['TP', 'true positives'],
          ['TN', 'true negatives'],
          ['FP', 'false positives'],
          ['FN', 'false negatives'],
        ],
        example: 'TP=80, TN=890, FP=10, FN=20 → 970/1000 = 0.97.',
        whenToUse: 'Balanced classes with symmetric costs.',
        mistakes: ['Using it as the only metric for imbalanced data', 'Comparing accuracy across datasets with different class balance'],
      },
    ],
    examples: [
      {
        level: 'practical',
        title: 'Accuracy paradox',
        problem: 'A dataset has 995 negatives and 5 positives. What accuracy does an all-negative predictor achieve?',
        solution: '99.5% — while detecting nothing. This is why accuracy alone cannot validate a rare-event model.',
      },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'Accuracy is most misleading when:',
        options: ['Classes are balanced', 'Classes are heavily imbalanced', 'The dataset is large', 'Features are scaled'],
        answer: '1',
        explanation: 'Under severe imbalance, a trivial majority predictor scores highly while being useless.',
        difficulty: 'beginner',
      },
    ],
    prerequisites: ['model-evaluation'],
    related: ['precision-recall', 'confusion-matrix', 'f1-score'],
  },
  {
    id: 'precision-recall',
    title: 'Precision & Recall',
    parentId: 'model-evaluation',
    type: 'concept',
    difficulty: 'intermediate',
    summary: 'The two error-focused metrics: how often positives are correct, and how many positives are found.',
    minutes: 14,
    objectives: [
      'Define precision and recall',
      'Explain the tradeoff and how thresholds move it',
      'Choose the metric that matches your error costs',
    ],
    theory: [
      [
        'Precision',
        'TP/(TP+FP): of everything flagged positive, how many were right? High precision means few false alarms.',
      ],
      [
        'Recall (sensitivity)',
        'TP/(TP+FN): of everything actually positive, how many were found? High recall means few misses.',
      ],
      [
        'The tradeoff',
        'Lowering the threshold flags more items: recall rises, precision usually falls. There is no free lunch — the operating point must match the cost of each error type.',
      ],
      [
        'PR curve and average precision',
        'Plot precision against recall across thresholds. The area under this curve (average precision) summarises performance on the positive class and is far more informative than ROC-AUC under heavy imbalance.',
      ],
    ],
    definitions: [
      ['Precision', 'TP/(TP+FP), the purity of positive predictions.'],
      ['Recall', 'TP/(TP+FN), the coverage of actual positives.'],
      ['Average precision', 'Area under the precision–recall curve.'],
      ['Operating point', 'The threshold chosen for deployment.'],
    ],
    principles: [
      'Precision and recall trade off through the threshold',
      'PR curves are preferable to ROC under heavy imbalance',
      'Pick the operating point from the cost matrix, not from 0.5',
    ],
    formulas: [
      {
        name: 'Precision',
        expression: 'P = TP / (TP + FP)',
        variables: [
          ['TP', 'true positives'],
          ['FP', 'false positives'],
        ],
        example: 'TP=80, FP=10 → 0.889.',
        whenToUse: 'When false alarms are expensive.',
        mistakes: ['Reporting precision without recall', 'Computing precision on the whole dataset instead of per class'],
      },
      {
        name: 'Recall',
        expression: 'R = TP / (TP + FN)',
        variables: [
          ['TP', 'true positives'],
          ['FN', 'false negatives'],
        ],
        example: 'TP=80, FN=20 → 0.80.',
        whenToUse: 'When missing a positive is expensive.',
      },
    ],
    visuals: [
      {
        kind: 'curve',
        title: 'Precision–recall tradeoff across thresholds',
        values: [['t=0.1', 0.42], ['t=0.3', 0.61], ['t=0.5', 0.78], ['t=0.7', 0.89], ['t=0.9', 0.96]],
        caption: 'Raising the threshold increases precision while reducing recall — the curve is the full picture.',
      },
    ],
    examples: [
      {
        level: 'beginner',
        title: 'Compute both',
        problem: 'TP=60, FP=40, FN=15. Compute precision and recall.',
        solution: 'Precision = 60/100 = 0.60. Recall = 60/75 = 0.80.',
      },
      {
        level: 'practical',
        title: 'Choosing a target',
        problem: 'Cancer screening versus spam filtering — which metric matters more for each?',
        solution:
          'Screening prioritises recall (missing cancer is catastrophic; false alarms lead to further tests). Spam filtering prioritises precision (false positives hide real email).',
      },
      {
        level: 'advanced',
        title: 'Why PR-AUC over ROC-AUC',
        problem: 'With 1% positives, why does ROC-AUC look deceptively good?',
        solution:
          'ROC uses the false positive rate, whose denominator (TN+FP) is huge. Thousands of false positives barely move FPR while devastating precision. PR-AUC uses precision, so it reflects the practical damage.',
      },
    ],
    questions: [
      {
        type: 'numeric',
        prompt: 'TP=45, FP=15, FN=5. What is recall? (2 decimals)',
        answer: 0.9,
        tolerance: 0.01,
        explanation: 'Recall = 45/(45+5) = 0.9.',
        difficulty: 'intermediate',
      },
      {
        type: 'mcq',
        prompt: 'Lowering a classifier\u2019s threshold typically:',
        options: ['Increases precision, decreases recall', 'Increases recall, decreases precision', 'Increases both', 'Decreases both'],
        answer: '1',
        explanation: 'Flagging more items finds more positives (recall up) but includes more false positives (precision down).',
        difficulty: 'intermediate',
      },
      {
        type: 'truefalse',
        prompt: 'A model with 99% precision must have high recall.',
        answer: false,
        explanation: 'Precision and recall are independent; a model can be extremely precise by flagging only its most confident cases, missing most positives.',
        difficulty: 'beginner',
      },
    ],
    prerequisites: ['confusion-matrix', 'model-evaluation'],
    related: ['f1-score', 'accuracy', 'confusion-matrix'],
  },
  {
    id: 'f1-score',
    title: 'F1 Score',
    parentId: 'model-evaluation',
    type: 'concept',
    difficulty: 'intermediate',
    summary: 'The harmonic mean of precision and recall — a single number that punishes imbalance between them.',
    minutes: 8,
    objectives: ['Compute F1', 'Explain why harmonic rather than arithmetic mean', 'Recognise when F1 is the wrong choice'],
    theory: [
      [
        'Definition',
        'F1 = 2PR/(P+R). It is the harmonic mean, which is dominated by the smaller value — so a model cannot score well by maximising only one.',
      ],
      [
        'Why harmonic',
        'The arithmetic mean of precision 1.0 and recall 0.01 is 0.505, which sounds acceptable but is useless. The harmonic mean gives 0.0198, correctly reflecting the failure.',
      ],
      [
        'Limits',
        'F1 weights precision and recall equally. When one matters more, use Fβ: F_β = (1+β²)PR/(β²P+R), where β>1 favours recall.',
      ],
    ],
    formulas: [
      {
        name: 'F1 score',
        expression: 'F1 = 2PR / (P + R)',
        variables: [
          ['P', 'precision'],
          ['R', 'recall'],
        ],
        example: 'P=0.8, R=0.667 → F1 = 2(0.8)(0.667)/(1.467) ≈ 0.727.',
        whenToUse: 'Balanced concern for false positives and false negatives.',
        mistakes: ['Using F1 when error costs are asymmetric', 'Averaging F1 across folds incorrectly'],
      },
    ],
    examples: [
      {
        level: 'beginner',
        title: 'Compute F1',
        problem: 'Precision 0.9, recall 0.5. F1?',
        solution: '2(0.9)(0.5)/(1.4) = 0.9/1.4 ≈ 0.643.',
      },
      {
        level: 'practical',
        title: 'F1 vs F2',
        problem: 'Screening task where misses are far worse than false alarms. F1 or F2?',
        solution: 'F2 — β=2 weights recall more heavily, matching the cost structure.',
      },
    ],
    questions: [
      {
        type: 'numeric',
        prompt: 'Precision 0.75, recall 0.75. What is F1?',
        answer: 0.75,
        tolerance: 0.01,
        explanation: 'When P = R, F1 equals both: 2(0.75)(0.75)/1.5 = 0.75.',
        difficulty: 'beginner',
      },
      {
        type: 'mcq',
        prompt: 'F1 uses which kind of mean?',
        options: ['Arithmetic', 'Geometric', 'Harmonic', 'Quadratic'],
        answer: '2',
        explanation: 'The harmonic mean, which is pulled toward the smaller of the two values.',
        difficulty: 'intermediate',
      },
    ],
    prerequisites: ['precision-recall'],
    related: ['precision-recall', 'accuracy', 'model-evaluation'],
  },
  {
    id: 'cross-validation',
    title: 'Cross Validation',
    parentId: 'model-evaluation',
    type: 'concept',
    difficulty: 'intermediate',
    summary: 'Rotating held-out folds to estimate performance using all data without leaking.',
    minutes: 12,
    objectives: ['Explain k-fold cross-validation', 'Choose between stratified, grouped, and time-series splits', 'Explain why preprocessing must live inside folds'],
    theory: [
      [
        'k-fold',
        'Split data into k folds. Train on k−1, validate on the remaining one, rotate, and average. Every point is validated exactly once.',
      ],
      [
        'Variants',
        'Stratified preserves class proportions per fold. Grouped keeps all rows from one entity (patient, user) in the same fold. Time-series uses forward-chaining to respect temporal order.',
      ],
      [
        'Nested CV',
        'An inner loop selects hyperparameters, an outer loop estimates generalisation of the whole selection procedure. Necessary when the dataset is small and tuning is extensive.',
      ],
      [
        'Preprocessing inside folds',
        'Fitting a scaler or imputer on the full dataset before splitting leaks validation statistics. All learned transforms must be fit on the training fold only.',
      ],
    ],
    principles: [
      'Every learned transform belongs inside the fold',
      'Group related samples to avoid leakage',
      'Cross-validation estimates variance as well as mean performance',
    ],
    formulas: [
      {
        name: 'CV estimate',
        expression: 'CV = (1/k) Σ_{i=1}^{k} score(fold_i)',
        variables: [
          ['k', 'number of folds'],
          ['score', 'metric on the held-out fold'],
        ],
        example: 'k=5 scores 0.81, 0.79, 0.83, 0.77, 0.80 → mean 0.80, sd 0.021.',
        whenToUse: 'Small to medium datasets where a single split is noisy.',
        mistakes: ['Fitting preprocessing outside the loop', 'Ignoring grouped structure', 'Using k=5 on time-series data'],
      },
    ],
    visuals: [
      {
        kind: 'stack',
        title: '5-fold rotation',
        steps: ['Fold 1: [VAL][train][train][train][train]', 'Fold 2: [train][VAL][train][train][train]', 'Fold 3: [train][train][VAL][train][train]', 'Fold 4: [train][train][train][VAL][train]', 'Fold 5: [train][train][train][train][VAL]'],
      },
    ],
    examples: [
      {
        level: 'practical',
        title: 'Group leakage',
        problem: 'Patient data has 10 scans per patient. Random k-fold gives 0.95 AUC, production gives 0.72. Why?',
        solution:
          'The same patient appears in train and validation, so the model memorises patient-specific features. Use GroupKFold by patient id.',
      },
      {
        level: 'advanced',
        title: 'Nested CV cost',
        problem: 'Why not always use nested CV?',
        solution: 'It multiplies training cost by (inner folds × outer folds). It is used when the dataset is small enough that selection bias matters.',
      },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'For time-series data, the appropriate validation scheme is:',
        options: ['Random k-fold', 'Stratified k-fold', 'Forward-chaining splits', 'Leave-one-out'],
        answer: '2',
        explanation: 'Training data must always precede validation data to avoid leaking future information.',
        difficulty: 'intermediate',
      },
      {
        type: 'truefalse',
        prompt: 'It is safe to fit a StandardScaler on the whole dataset before cross-validation.',
        answer: false,
        explanation: 'That leaks validation statistics into training. Fit the scaler inside each fold.',
        difficulty: 'intermediate',
      },
      {
        type: 'short',
        prompt: 'What problem does GroupKFold solve?',
        answer: 'leak|same|group|patient|entity|duplicate',
        explanation: 'It keeps all samples from the same entity in a single fold, preventing the model from memorising entity-specific patterns across splits.',
        difficulty: 'advanced',
      },
    ],
    prerequisites: ['model-evaluation'],
    related: ['overfitting', 'regularization', 'bias-variance'],
  },
  {
    id: 'feature-engineering',
    title: 'Feature Engineering',
    parentId: 'ml-root',
    type: 'subject',
    difficulty: 'intermediate',
    summary: 'Turning raw data into representations that make the learning problem easier.',
    minutes: 16,
    objectives: [
      'Distinguish engineered features from learned representations',
      'Describe encoding strategies for categorical data',
      'Recognise leakage-prone transformations',
    ],
    theory: [
      [
        'Why it matters',
        'A model can only learn from the information present in its features. Good features encode domain knowledge compactly and often beat architecture changes.',
      ],
      [
        'Categorical encoding',
        'One-hot for low cardinality. Target encoding for high cardinality (with out-of-fold fitting to avoid leakage). Hashing for very large vocabularies. Embeddings for learned representations.',
      ],
      [
        'Numeric transforms',
        'Log transforms for heavy tails, binning for non-linearity, interaction terms for combined effects, and ratios when relative magnitude matters more than absolute.',
      ],
      [
        'Temporal features',
        'Lags, rolling windows, time since last event, and cyclical encodings for hour-of-day or month. Always respect the prediction time — never use information from the future.',
      ],
      [
        'Leakage risks',
        'Target encoding, aggregate statistics, and any feature computed over the full dataset must be fit within the training fold.',
      ],
    ],
    definitions: [
      ['One-hot encoding', 'Binary columns, one per category.'],
      ['Target encoding', 'Replacing a category with the mean target for that category, computed out-of-fold.'],
      ['Interaction feature', 'A product or combination of two features capturing joint effects.'],
      ['Feature store', 'Centralised system serving consistent features to training and inference.'],
    ],
    principles: [
      'Features encode assumptions — make them explicit',
      'Anything computed from the target can leak',
      'Train-time and serve-time features must be computed identically',
    ],
    examples: [
      {
        level: 'beginner',
        title: 'Log transform',
        problem: 'Income is heavily right-skewed. What helps a linear model?',
        solution: 'Log-transform it. The relationship often becomes closer to linear and the influence of extreme values is reduced.',
      },
      {
        level: 'practical',
        title: 'Target encoding leakage',
        problem: 'Why must target encoding be computed out-of-fold?',
        solution:
          'Encoding a category with the mean of its own target values injects the label into the feature. Out-of-fold computation gives each row an encoding that did not see its own label.',
      },
      {
        level: 'advanced',
        title: 'Train/serve skew',
        problem: 'Offline AUC is 0.88 but online it drops to 0.74. Most likely cause?',
        solution:
          'Feature computation differs between the training pipeline and the serving path — different time windows, missing backfills, or a default value at serve time. A shared feature store eliminates this class of bug.',
      },
    ],
    applications: [
      { title: 'Credit risk features', description: 'Utilisation ratios and payment recency outperform raw balances.', industry: 'Banking' },
      { title: 'Demand forecasting', description: 'Lags, holiday flags, and rolling averages dominate model choice.', industry: 'Retail' },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'Target encoding must be computed:',
        options: ['On the full dataset', 'Out-of-fold', 'Only on the test set', 'After model training'],
        answer: '1',
        explanation: 'Out-of-fold computation prevents the label from leaking into the feature.',
        difficulty: 'advanced',
      },
      {
        type: 'multi',
        prompt: 'Which are valid categorical encodings? Select all that apply.',
        options: ['One-hot', 'Target encoding', 'Standard scaling', 'Hashing'],
        answer: ['0', '1', '3'],
        explanation: 'Standard scaling is for numeric features; the others encode categories.',
        difficulty: 'intermediate',
      },
    ],
    prerequisites: ['ml-intro', 'statistics'],
    related: ['feature-scaling', 'cross-validation', 'pca'],
  },
  {
    id: 'feature-scaling',
    title: 'Feature Scaling',
    parentId: 'feature-engineering',
    type: 'concept',
    difficulty: 'beginner',
    summary: 'Putting features on comparable scales so distances and gradients behave sensibly.',
    minutes: 10,
    objectives: ['Distinguish standardisation from normalisation', 'Identify scale-sensitive algorithms', 'Explain fit-on-train-only'],
    theory: [
      [
        'Standardisation',
        'z = (x − μ)/σ gives zero mean and unit variance. Preferred when features are roughly Gaussian or when using regularisation.',
      ],
      [
        'Min–max normalisation',
        '(x − min)/(max − min) maps to [0,1]. Sensitive to outliers, but useful for bounded inputs like images.',
      ],
      [
        'Who needs it',
        'Distance-based (k-NN, k-Means, SVM with RBF), gradient-based (neural networks, regularised linear models), and PCA. Tree-based models do not.',
      ],
      [
        'Fit on training data only',
        'Compute μ and σ from the training fold and apply them to validation and test. Using global statistics leaks information.',
      ],
    ],
    principles: [
      'Scale-sensitive algorithms fail silently on unscaled data',
      'Always fit scalers on training data only',
      'Trees and forests do not need scaling',
    ],
    formulas: [
      {
        name: 'Standardisation',
        expression: 'z = (x − μ) / σ',
        variables: [
          ['μ', 'training mean'],
          ['σ', 'training standard deviation'],
        ],
        example: 'μ=50, σ=10, x=70 → z=2.',
        whenToUse: 'Gradient-based and distance-based models.',
        mistakes: ['Computing μ and σ on the full dataset', 'Scaling the target unnecessarily'],
      },
    ],
    examples: [
      {
        level: 'practical',
        title: 'Symptom recognition',
        problem: 'A neural network with unscaled features (0–1 and 0–100000) trains very slowly. Why?',
        solution:
          'The loss surface is extremely elongated, so gradients point across the ravine rather than along it. Standardising features makes the surface far better conditioned.',
      },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'Which model does NOT require feature scaling?',
        options: ['k-NN', 'k-Means', 'Random Forest', 'SVM with RBF kernel'],
        answer: '2',
        explanation: 'Tree splits are thresholds on individual features, so monotone rescaling does not change them.',
        difficulty: 'beginner',
      },
      {
        type: 'truefalse',
        prompt: 'Scalers should be fit on the combined train and test data for consistency.',
        answer: false,
        explanation: 'That leaks test statistics. Fit on training data and transform test data with those parameters.',
        difficulty: 'intermediate',
      },
    ],
    prerequisites: ['feature-engineering'],
    related: ['knn', 'kmeans', 'pca', 'gradient-descent'],
  },
  {
    id: 'training-data',
    title: 'Training, Validation & Test Data',
    parentId: 'ml-root',
    type: 'topic',
    difficulty: 'beginner',
    summary: 'The three roles of data in a disciplined machine learning workflow.',
    minutes: 10,
    objectives: ['Assign data to the correct split', 'Explain the cost of reusing splits', 'Handle small-data situations'],
    theory: [
      [
        'Roles',
        'Training fits parameters. Validation guides decisions. Test reports once. Each additional use of a split for a different role erodes its value.',
      ],
      [
        'Proportions',
        '70/15/15 for moderate data. With millions of rows, 98/1/1 is often sufficient. With very little data, use cross-validation instead of a fixed validation split.',
      ],
      [
        'Distribution shift',
        'Splits should mirror the deployment distribution. Random splits on time-series or grouped data violate this.',
      ],
    ],
    principles: ['A split is defined by its role, not its size', 'Random splits are wrong for dependent data', 'Report on test data exactly once'],
    examples: [
      {
        level: 'beginner',
        title: 'Assigning a role',
        problem: 'You have 10,000 rows and 3 candidate models. How do you use the data?',
        solution:
          'Train on 70%, compare models on 15% validation, then refit the winner on 85% and report on the held-out 15% test set once.',
      },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'Model selection should use:',
        options: ['Training data', 'Validation data', 'Test data', 'Production data'],
        answer: '1',
        explanation: 'Validation data guides selection; test data is reserved for the final estimate.',
        difficulty: 'beginner',
      },
    ],
    prerequisites: ['ml-intro'],
    related: ['model-evaluation', 'cross-validation'],
  },
];
