import type { NodeSpec } from './types';

export const supervisedSpecs: NodeSpec[] = [
  {
    id: 'supervised-learning',
    title: 'Supervised Learning',
    parentId: 'ml-root',
    type: 'subject',
    difficulty: 'beginner',
    summary: 'Learning a mapping from inputs to labelled outputs — the largest family of practical ML methods.',
    minutes: 12,
    objectives: [
      'Distinguish regression from classification tasks',
      'Describe the hypothesis class / loss / optimiser triad',
      'Recognise when a problem is better framed as unsupervised',
    ],
    theory: [
      [
        'The setup',
        'Given a training set of pairs (xᵢ, yᵢ), learn f such that f(x) ≈ y for new x. The core assumption is that training and test data come from the same distribution.',
      ],
      [
        'Three ingredients',
        'Every supervised method specifies a **hypothesis class** (what functions are allowed), a **loss function** (how wrong predictions are penalised), and an **optimisation procedure** (how to find good parameters). Changing any one changes the algorithm.',
      ],
      [
        'Inductive bias',
        'The hypothesis class encodes assumptions. Linear models assume linearity; trees assume axis-aligned partitions; k-NN assumes local smoothness. Matching bias to the problem matters more than the specific optimiser.',
      ],
    ],
    definitions: [
      ['Hypothesis class', 'The set of functions a learning algorithm can represent.'],
      ['Loss function', 'A measure of prediction error used for optimisation.'],
      ['Inductive bias', 'Assumptions that let a model generalise beyond training data.'],
    ],
    principles: [
      'No free lunch: every model has an inductive bias',
      'The best model family depends on data size, dimensionality, and structure',
      'Framing matters more than tuning',
    ],
    visuals: [
      {
        kind: 'flow',
        title: 'Supervised pipeline',
        steps: ['Raw data', 'Clean & feature engineer', 'Split', 'Choose hypothesis class', 'Fit', 'Evaluate', 'Deploy & monitor'],
      },
    ],
    examples: [
      {
        level: 'beginner',
        title: 'Framing a task',
        problem: 'Predict whether a loan will default. Regression or classification?',
        solution: 'Classification (default / no default). If you needed expected loss amount, that would be regression.',
      },
      {
        level: 'practical',
        title: 'Class imbalance',
        problem: '99% of transactions are legitimate. Accuracy is 99% by predicting "legit" always. What now?',
        solution:
          'Accuracy is the wrong metric. Use precision/recall, PR-AUC, or cost-sensitive evaluation; resample or reweight; and calibrate thresholds against business cost.',
      },
    ],
    applications: [{ title: 'Credit scoring', description: 'Gradient-boosted trees over tabular features predict default risk.', industry: 'Finance' }],
    questions: [
      {
        type: 'mcq',
        prompt: 'Inductive bias in a learning algorithm is:',
        options: ['A bug in the optimiser', 'Assumptions that generalise beyond training data', 'A data preprocessing step', 'A type of regularisation only for trees'],
        answer: '1',
        explanation: 'Inductive bias is the set of assumptions the hypothesis class encodes, enabling generalisation.',
        difficulty: 'intermediate',
      },
      {
        type: 'multi',
        prompt: 'Which are supervised tasks? Select all that apply.',
        options: ['Predicting house prices', 'Clustering customers', 'Classifying emails as spam', 'Dimensionality reduction with PCA'],
        answer: ['0', '2'],
        explanation: 'Price prediction is regression and spam classification is classification — both need labels. Clustering and PCA use no labels.',
        difficulty: 'beginner',
      },
    ],
    prerequisites: ['ml-intro'],
    related: ['regression', 'classification', 'model-evaluation'],
    extensions: ['deep-learning'],
    crossSubject: ['statistics'],
  },
  {
    id: 'regression',
    title: 'Regression',
    parentId: 'supervised-learning',
    type: 'topic',
    difficulty: 'beginner',
    summary: 'Predicting continuous values by fitting a function to data, and measuring how wrong it is.',
    minutes: 10,
    objectives: ['Explain the least-squares objective', 'Interpret residual plots', 'Know when to transform the target'],
    theory: [
      [
        'What regression answers',
        'Given features, estimate a numeric target. The model captures the conditional mean E[y|x] under squared loss, and the conditional median under absolute loss.',
      ],
      [
        'Loss choice changes the fit',
        'Squared error is smooth and penalises outliers heavily. Absolute error is robust but non-differentiable at zero. Huber loss blends both.',
      ],
      [
        'Diagnostics',
        'Plot residuals against predictions. Structure in residuals means the model is missing something; funnel shapes mean heteroscedasticity and suggest weighting or transformation.',
      ],
    ],
    principles: ['Squared loss estimates the mean; absolute loss estimates the median', 'Always inspect residuals, not just aggregate error'],
    formulas: [
      {
        name: 'Mean squared error',
        expression: 'MSE = (1/n) Σ (yᵢ − ŷᵢ)²',
        variables: [
          ['yᵢ', 'true value'],
          ['ŷᵢ', 'predicted value'],
          ['n', 'number of samples'],
        ],
        whenToUse: 'Regression evaluation when large errors should dominate.',
      },
    ],
    examples: [
      {
        level: 'beginner',
        title: 'Reading residuals',
        problem: 'Residuals form a U-shape against a feature. What does that imply?',
        solution: 'A linear term is insufficient — the relationship is curved. Add a polynomial term, spline, or switch to a non-linear model.',
      },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'Squared-error regression estimates which conditional statistic?',
        options: ['The median', 'The mode', 'The mean', 'The variance'],
        answer: '2',
        explanation: 'Minimising expected squared error yields the conditional mean; absolute error yields the median.',
        difficulty: 'intermediate',
      },
    ],
    prerequisites: ['ml-intro', 'statistics'],
    related: ['linear-regression', 'overfitting', 'feature-scaling'],
  },
  {
    id: 'linear-regression',
    title: 'Linear Regression',
    parentId: 'regression',
    type: 'concept',
    difficulty: 'beginner',
    summary: 'Fit a straight line (or hyperplane) minimising squared error — the reference model for all of regression.',
    minutes: 16,
    importance: 'The baseline every regression model must beat, and the clearest illustration of bias–variance.',
    objectives: [
      'Derive the normal equation and the gradient descent update',
      'Interpret coefficients and their units',
      'Explain the assumptions behind ordinary least squares',
    ],
    theory: [
      [
        'The model',
        'ŷ = w·x + b. Each weight is the expected change in the target per unit change in that feature, holding others fixed.',
      ],
      [
        'Closed-form solution',
        'Minimising ‖y − Xw‖² gives the normal equation w = (XᵀX)⁻¹Xᵀy. It is exact but costs O(p³) in the number of features, so gradient descent or QR decomposition is used for large p.',
      ],
      [
        'Assumptions',
        'Linearity in parameters, independent errors, homoscedasticity, and no perfect multicollinearity. Violations do not always break predictions, but they break inference about coefficients.',
      ],
      [
        'Regularised variants',
        'Ridge adds λ‖w‖² and shrinks coefficients (handles collinearity). Lasso adds λ‖w‖₁ and drives some coefficients to exactly zero, performing selection.',
      ],
    ],
    definitions: [
      ['Coefficient', 'The learned weight on a feature; its marginal effect on the prediction.'],
      ['Residual', 'Observed minus predicted value.'],
      ['Multicollinearity', 'Highly correlated features that make coefficients unstable.'],
      ['Ridge regression', 'L2-penalised linear regression.'],
    ],
    principles: [
      'Always compare against the mean-prediction baseline',
      'Coefficients are interpretable only if features are on comparable scales',
      'Regularisation trades a little bias for a lot of variance reduction',
    ],
    formulas: [
      {
        name: 'Ordinary least squares (normal equation)',
        expression: 'w = (XᵀX)⁻¹ Xᵀ y',
        variables: [
          ['X', 'design matrix with a bias column'],
          ['y', 'target vector'],
          ['w', 'coefficient vector'],
        ],
        derivation: 'Setting the gradient of ‖y − Xw‖² to zero gives XᵀXw = Xᵀy, then invert XᵀX.',
        example: 'For a single feature: w₁ = Cov(x,y)/Var(x), w₀ = ȳ − w₁x̄.',
        whenToUse: 'Small to medium feature counts where an exact solution is desirable.',
        mistakes: ['Inverting a singular XᵀX (collinear features)', 'Forgetting the bias column', 'Interpreting coefficients without scaling features'],
      },
      {
        name: 'Ridge objective',
        expression: 'min ‖y − Xw‖² + λ‖w‖²',
        variables: [
          ['λ', 'regularisation strength'],
          ['‖w‖²', 'sum of squared coefficients'],
        ],
        example: 'λ=0 recovers OLS; λ→∞ drives coefficients to zero.',
        whenToUse: 'Collinear features or when p is large relative to n.',
      },
    ],
    visuals: [
      {
        kind: 'bars',
        title: 'Coefficient shrinkage as λ increases',
        values: [['λ = 0', 1.0], ['λ = 0.5', 0.79], ['λ = 1', 0.66], ['λ = 2', 0.5], ['λ = 5', 0.29]],
        caption: 'Ridge shrinks coefficients smoothly; none reach exactly zero.',
      },
    ],
    examples: [
      {
        level: 'beginner',
        title: 'One-feature fit',
        problem: 'x = [1,2,3,4], y = [2,4,6,8]. Fit a line.',
        solution: 'Perfect linear relation y = 2x. Slope 2, intercept 0, residuals all zero.',
      },
      {
        level: 'practical',
        title: 'Reading a coefficient',
        problem: 'Model: price = 120·area + 15·rooms + 40 (area in m², price in thousands). Interpret.',
        solution:
          'Each additional m² is associated with +120k, holding room count fixed. Each additional room is +15k holding area fixed. Interpret with caution under collinearity.',
      },
      {
        level: 'advanced',
        title: 'Ridge as shrinkage',
        problem: 'Show that ridge is a biased but lower-variance estimator.',
        solution:
          'w_ridge = (XᵀX + λI)⁻¹Xᵀy. Bias increases with λ since coefficients are pulled toward zero; variance decreases because the inverse is better conditioned. There is an optimal λ minimising MSE.',
      },
    ],
    applications: [
      { title: 'Baseline demand forecasting', description: 'Linear models with calendar features remain competitive for short horizons.', industry: 'Retail' },
      { title: 'Risk factor attribution', description: 'Coefficients quantify exposure to interpretable factors.', industry: 'Finance' },
    ],
    questions: [
      {
        type: 'numeric',
        prompt: 'Model ŷ = 3x + 2. What is the prediction for x = 5?',
        answer: 17,
        tolerance: 0.001,
        explanation: '3·5 + 2 = 17.',
        difficulty: 'beginner',
      },
      {
        type: 'mcq',
        prompt: 'Ridge regression adds which penalty?',
        options: ['L0', 'L1', 'L2', 'Elastic net only'],
        answer: '2',
        explanation: 'Ridge penalises the sum of squared coefficients — the L2 norm.',
        difficulty: 'beginner',
      },
      {
        type: 'multi',
        prompt: 'Which statements about OLS are true? Select all that apply.',
        options: [
          'It minimises sum of squared residuals',
          'It always produces unbiased coefficient estimates under its assumptions',
          'It is invariant to feature scaling in its predictions',
          'It requires the target to be normally distributed',
        ],
        answer: ['0', '1', '2'],
        explanation:
          'OLS minimises squared residuals and is unbiased under Gauss–Markov assumptions. Predictions are unchanged by a linear rescaling of features (coefficients change, fitted values do not). Normality of the target is not required for the estimator, only for some inference.',
        difficulty: 'advanced',
      },
    ],
    prerequisites: ['regression', 'linear-algebra', 'calculus'],
    related: ['logistic-regression', 'gradient-descent', 'regularization', 'feature-scaling'],
    extensions: ['polynomial-regression', 'generalized-linear-models'],
  },
  {
    id: 'polynomial-regression',
    title: 'Polynomial Regression',
    parentId: 'linear-regression',
    type: 'advanced',
    difficulty: 'intermediate',
    summary: 'Extending linear regression with polynomial features to capture curvature — still linear in parameters.',
    minutes: 10,
    objectives: ['Explain why polynomial regression is still "linear"', 'Recognise the overfitting risk of high degree'],
    theory: [
      [
        'Linear in parameters',
        'ŷ = w₀ + w₁x + w₂x² + … is linear in w, so the normal equation still applies. Only the feature matrix changes.',
      ],
      [
        'Degree as capacity',
        'Higher degree increases flexibility and variance. A degree-n polynomial can interpolate n+1 points exactly, which is almost always overfitting.',
      ],
    ],
    formulas: [
      {
        name: 'Polynomial model',
        expression: 'ŷ = Σ_{d=0}^{D} w_d x^d',
        variables: [
          ['D', 'polynomial degree'],
          ['w_d', 'coefficient for degree d'],
        ],
        whenToUse: 'Smooth non-linear trends in low dimensions.',
        mistakes: ['Extrapolating far outside the data range', 'Using high degree without validation'],
      },
    ],
    examples: [
      {
        level: 'practical',
        title: 'U-shaped cost curve',
        problem: 'Cost falls then rises with production volume. Which degree?',
        solution: 'Degree 2 is usually sufficient and interpretable; validate against degree 3+ to confirm no real improvement.',
      },
    ],
    questions: [
      {
        type: 'truefalse',
        prompt: 'Polynomial regression is a non-linear model in its parameters.',
        answer: false,
        explanation: 'It is linear in parameters — that is why it can be solved with OLS. Only the features are non-linear transforms of the input.',
        difficulty: 'intermediate',
      },
    ],
    prerequisites: ['linear-regression'],
    related: ['overfitting', 'regularization'],
  },
  {
    id: 'classification',
    title: 'Classification',
    parentId: 'supervised-learning',
    type: 'topic',
    difficulty: 'beginner',
    summary: 'Assigning discrete labels to inputs, and the decision boundaries that separate them.',
    minutes: 12,
    objectives: ['Describe a decision boundary', 'Distinguish discriminative from generative classifiers', 'Explain the role of a threshold'],
    theory: [
      [
        'Labels and boundaries',
        'A classifier partitions feature space into regions. The boundary is where the predicted class changes. Linear classifiers produce hyperplanes; trees produce axis-aligned staircases.',
      ],
      [
        'Discriminative vs generative',
        'Discriminative models learn P(y|x) directly (logistic regression, SVM). Generative models learn P(x|y)P(y) and apply Bayes (Naive Bayes, GDA). Generative can sample; discriminative often needs less data to reach the same accuracy.',
      ],
      [
        'Thresholds are a decision',
        'Most classifiers output a score. The default 0.5 threshold is arbitrary. Medical screening and fraud detection both need asymmetric costs, so tune the threshold explicitly.',
      ],
    ],
    principles: [
      'Accuracy collapses under class imbalance',
      'Report probabilities and choose thresholds deliberately',
      'A boundary is only as trustworthy as the data near it',
    ],
    visuals: [
      {
        kind: 'matrix',
        title: 'Confusion matrix for a binary classifier',
        matrix: { rows: ['Actual +', 'Actual −'], cols: ['Predicted +', 'Predicted −'], values: [[80, 20], [10, 890]] },
        caption: 'Recall 80%, precision 88.9%, accuracy 97%. Three very different stories about the same model.',
      },
    ],
    examples: [
      {
        level: 'beginner',
        title: 'Linear separability',
        problem: 'Can a straight line separate points with x > y from x < y?',
        solution: 'Yes — the boundary is the line x = y. Any point above it has x > y.',
      },
      {
        level: 'practical',
        title: 'Threshold tuning',
        problem: 'A fraud model flags 0.4% of transactions. The business loses more on missed fraud than on manual review cost. What do you change?',
        solution: 'Lower the threshold to increase recall, accepting more false positives, and evaluate against the explicit cost matrix rather than accuracy.',
      },
    ],
    applications: [
      { title: 'Spam detection', description: 'Text classifiers filter billions of messages per day.', industry: 'Email' },
      { title: 'Medical triage', description: 'Screening prioritises patients for follow-up tests.', industry: 'Healthcare' },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'A decision boundary separates:',
        options: ['Training from test data', 'Regions predicting different classes', 'Features from labels', 'Hyperparameters from parameters'],
        answer: '1',
        explanation: 'The boundary is where the predicted class label changes as you move through feature space.',
        difficulty: 'beginner',
      },
      {
        type: 'short',
        prompt: 'Why is accuracy a poor metric for imbalanced data?',
        answer: 'majority|imbalance|misleading|class|minority',
        explanation: 'A trivial majority-class predictor scores high accuracy while never detecting the minority class that usually matters.',
        difficulty: 'intermediate',
      },
    ],
    prerequisites: ['regression', 'probability'],
    related: ['logistic-regression', 'decision-trees', 'knn', 'naive-bayes', 'svm', 'precision-recall'],
  },
  {
    id: 'logistic-regression',
    title: 'Logistic Regression',
    parentId: 'classification',
    type: 'concept',
    difficulty: 'intermediate',
    summary: 'A linear model squeezed through a sigmoid into probabilities — the standard binary classification baseline.',
    minutes: 16,
    objectives: [
      'Explain the sigmoid and log-odds link',
      'Derive the cross-entropy loss intuition',
      'Interpret coefficients as odds ratios',
    ],
    theory: [
      [
        'From score to probability',
        'Compute z = w·x + b, then p = σ(z) = 1/(1+e^(−z)). The sigmoid maps any real number into (0,1) monotonically.',
      ],
      [
        'Log-odds interpretation',
        'The model is linear in log-odds: log(p/(1−p)) = w·x + b. A coefficient of 0.7 means each unit increase multiplies the odds by e^0.7 ≈ 2.01.',
      ],
      [
        'Why cross-entropy',
        'Maximising the likelihood of the observed labels yields the cross-entropy loss L = −[y log p + (1−y) log(1−p)]. It is convex, penalises confident mistakes harshly, and its gradient is pleasingly simple: (p − y)x.',
      ],
      [
        'Multiclass extension',
        'Softmax generalises sigmoid to K classes: p_k = e^{z_k}/Σ e^{z_j}. The loss becomes categorical cross-entropy.',
      ],
    ],
    definitions: [
      ['Sigmoid', 'σ(z)=1/(1+e^(−z)), mapping reals to (0,1).'],
      ['Log-odds', 'log(p/(1−p)), the natural linear scale for binary probabilities.'],
      ['Cross-entropy', 'Loss measuring divergence between predicted and true distributions.'],
      ['Odds ratio', 'e^w, the multiplicative change in odds per unit feature increase.'],
    ],
    principles: [
      'Logistic regression is a classifier with a linear decision boundary',
      'Class weights change the decision threshold implicitly',
      'Regularise it — separation leads to infinite coefficients',
    ],
    formulas: [
      {
        name: 'Sigmoid',
        expression: 'σ(z) = 1 / (1 + e^(−z))',
        variables: [['z', 'linear score w·x + b']],
        example: 'z = 2 → σ = 0.881. z = 0 → 0.5. z = −2 → 0.119.',
        whenToUse: 'Binary probability output.',
        mistakes: ['Forgetting σ(0)=0.5', 'Using MSE instead of cross-entropy for classification'],
      },
      {
        name: 'Cross-entropy loss',
        expression: 'L = −[y log p + (1 − y) log(1 − p)]',
        variables: [
          ['y', 'true label 0 or 1'],
          ['p', 'predicted probability'],
        ],
        derivation: 'Negative log-likelihood of a Bernoulli variable with parameter p.',
        example: 'If y=1 and p=0.9, L = −log 0.9 ≈ 0.105. If p=0.1, L ≈ 2.30 — a much harsher penalty.',
        whenToUse: 'Any probabilistic binary classification.',
      },
    ],
    visuals: [
      {
        kind: 'curve',
        title: 'Sigmoid response',
        values: [['z = −4', 0.018], ['z = −2', 0.119], ['z = 0', 0.5], ['z = 2', 0.881], ['z = 4', 0.982]],
        caption: 'The sigmoid saturates, so extreme scores give near-certain probabilities — and vanishing gradients.',
      },
    ],
    examples: [
      {
        level: 'beginner',
        title: 'Predicting a click',
        problem: 'z = 1.5 for a user. What is the click probability?',
        solution: 'σ(1.5) = 1/(1+e^−1.5) ≈ 0.818, so about 82%.',
      },
      {
        level: 'practical',
        title: 'Odds ratio',
        problem: 'Coefficient on "has subscription" is 1.2. Interpret.',
        solution: 'Odds multiply by e^1.2 ≈ 3.32. Subscribers have about 3.3× the odds of the positive outcome, all else equal.',
      },
      {
        level: 'advanced',
        title: 'Perfect separation',
        problem: 'A feature perfectly separates classes. What happens to the coefficient?',
        solution:
          'The likelihood keeps increasing as the coefficient grows, so the MLE diverges to infinity and probabilities saturate at 0/1. L2 regularisation keeps coefficients finite — a practical necessity.',
      },
    ],
    applications: [
      { title: 'Credit default', description: 'Interpretable coefficients support regulatory review.', industry: 'Banking' },
      { title: 'Clinical risk scores', description: 'Logistic models underpin many published risk calculators.', industry: 'Healthcare' },
    ],
    questions: [
      {
        type: 'numeric',
        prompt: 'For z = 0, what is σ(z)?',
        answer: 0.5,
        tolerance: 0.001,
        explanation: 'σ(0) = 1/(1+e⁰) = 1/2.',
        difficulty: 'beginner',
      },
      {
        type: 'mcq',
        prompt: 'Logistic regression assumes the log-odds are:',
        options: ['Quadratic in the features', 'Linear in the features', 'Constant', 'Log-normal'],
        answer: '1',
        explanation: 'log(p/(1−p)) = w·x + b — linear in the features, which is why the decision boundary is linear.',
        difficulty: 'intermediate',
      },
      {
        type: 'multi',
        prompt: 'Which are true of logistic regression? Select all that apply.',
        options: [
          'Its loss is convex in the parameters',
          'It can output calibrated probabilities',
          'It can model XOR without feature engineering',
          'It supports multiclass via softmax',
        ],
        answer: ['0', '1', '3'],
        explanation:
          'Cross-entropy is convex; the output is a probability (well-calibrated if specified correctly); softmax handles multiclass. XOR is not linearly separable, so a plain logistic model cannot solve it without interaction features.',
        difficulty: 'advanced',
      },
    ],
    prerequisites: ['classification', 'linear-regression', 'probability'],
    related: ['loss-functions', 'gradient-descent', 'regularization', 'precision-recall'],
    extensions: ['neural-networks', 'generalized-linear-models'],
  },
  {
    id: 'decision-trees',
    title: 'Decision Trees',
    parentId: 'classification',
    type: 'concept',
    difficulty: 'beginner',
    summary: 'Recursive axis-aligned splits that partition data into increasingly pure regions.',
    minutes: 15,
    objectives: [
      'Explain Gini impurity and information gain',
      'Describe how depth controls capacity',
      'Explain why single trees overfit',
    ],
    theory: [
      [
        'Recursive partitioning',
        'Choose the feature and threshold that best separate the classes, split, and recurse on each side. Each leaf predicts the majority class (or mean value for regression).',
      ],
      [
        'Split criteria',
        'Classification uses Gini impurity or entropy; regression uses variance reduction. The best split maximises the weighted impurity decrease.',
      ],
      [
        'Capacity and pruning',
        'Unconstrained trees memorise training data. `max_depth`, `min_samples_leaf`, and cost-complexity pruning limit capacity. A fully grown tree has zero training error and poor generalisation.',
      ],
      [
        'Interpretability',
        'Trees are readable as rule sets, but unstable: a small data change can produce a very different tree. Ensembles fix stability at the cost of interpretability.',
      ],
    ],
    definitions: [
      ['Gini impurity', '1 − Σ p_k², the probability of misclassifying a random sample.'],
      ['Information gain', 'Reduction in entropy achieved by a split.'],
      ['Pruning', 'Removing branches that add little predictive value.'],
      ['Leaf', 'A terminal node that outputs a prediction.'],
    ],
    principles: [
      'Greedy splits are locally optimal, not globally optimal',
      'Depth is the main capacity knob',
      'Trees need no feature scaling',
    ],
    formulas: [
      {
        name: 'Gini impurity',
        expression: 'G = 1 − Σ_{k} p_k²',
        variables: [
          ['p_k', 'fraction of class k in the node'],
          ['K', 'number of classes'],
        ],
        example: 'Node with 50/50 split: G = 1 − (0.25+0.25) = 0.5. Pure node: G = 0.',
        whenToUse: 'Choosing classification splits (CART).',
        mistakes: ['Confusing impurity with error rate', 'Ignoring class weights'],
      },
      {
        name: 'Entropy',
        expression: 'H = −Σ p_k log₂ p_k',
        variables: [['p_k', 'class proportion']],
        example: 'Balanced binary node: H = 1 bit. Pure node: H = 0.',
        whenToUse: 'Information-gain based splitting (ID3/C4.5).',
      },
    ],
    visuals: [
      {
        kind: 'flow',
        title: 'A shallow tree for loan approval',
        steps: ['Income > 60k?', '├─ yes → Credit score > 700?', '│   ├─ yes → Approve', '│   └─ no → Review', '└─ no → Debt ratio > 0.4?', '    ├─ yes → Reject', '    └─ no → Review'],
      },
    ],
    examples: [
      {
        level: 'beginner',
        title: 'Computing a split',
        problem: 'A node has 6 positives and 4 negatives. What is its Gini impurity?',
        solution: 'p₊=0.6, p₋=0.4. G = 1 − (0.36+0.16) = 0.48.',
      },
      {
        level: 'practical',
        title: 'Controlling overfit',
        problem: 'A tree has 100% train accuracy and 62% test accuracy. First fix?',
        solution: 'Set max_depth to 3–5 and min_samples_leaf to at least 5–20, then validate. Also consider pruning by cost complexity.',
      },
      {
        level: 'advanced',
        title: 'Why axis-aligned splits struggle with rotation',
        problem: 'Data is separated by a diagonal line. What happens?',
        solution:
          'An axis-aligned tree needs a staircase of many splits to approximate the diagonal, which wastes depth and generalises poorly. Rotating features or using oblique splits helps.',
      },
    ],
    applications: [
      { title: 'Clinical decision rules', description: 'Shallow trees produce auditable if-then triage rules.', industry: 'Healthcare' },
      { title: 'Churn flags', description: 'Tree rules drive retention interventions.', industry: 'SaaS' },
    ],
    questions: [
      {
        type: 'numeric',
        prompt: 'A node is 70% class A and 30% class B. What is the Gini impurity? (3 decimals)',
        answer: 0.42,
        tolerance: 0.01,
        explanation: 'G = 1 − (0.7² + 0.3²) = 1 − (0.49 + 0.09) = 0.42.',
        difficulty: 'intermediate',
      },
      {
        type: 'mcq',
        prompt: 'Decision trees are invariant to:',
        options: ['Class imbalance', 'Monotone feature rescaling', 'Label noise', 'Missing values'],
        answer: '1',
        explanation: 'Splits are thresholds on individual features, so rescaling a feature monotonically does not change the partition.',
        difficulty: 'intermediate',
      },
      {
        type: 'truefalse',
        prompt: 'A fully grown decision tree typically generalises better than a pruned one.',
        answer: false,
        explanation: 'Fully grown trees memorise noise. Pruning and depth limits improve generalisation.',
        difficulty: 'beginner',
      },
    ],
    prerequisites: ['classification', 'statistics'],
    related: ['random-forest', 'overfitting', 'bias-variance'],
    extensions: ['gradient-boosting'],
  },
  {
    id: 'random-forest',
    title: 'Random Forest',
    parentId: 'classification',
    type: 'concept',
    difficulty: 'intermediate',
    summary: 'An ensemble of decorrelated trees whose averaged predictions dramatically reduce variance.',
    minutes: 14,
    objectives: ['Explain bagging and feature subsampling', 'Explain why averaging reduces variance', 'Interpret out-of-bag error'],
    theory: [
      [
        'Bagging',
        'Train each tree on a bootstrap sample (sampled with replacement). Averaging many high-variance, low-bias trees reduces variance without inflating bias much.',
      ],
      [
        'Feature randomness',
        'At each split only a random subset of features is considered (typically √p for classification). This decorrelates trees, which is essential: averaging correlated predictors barely helps.',
      ],
      [
        'Out-of-bag estimate',
        'Each tree leaves out ~37% of samples. Predicting those with the trees that did not see them yields a nearly free validation estimate.',
      ],
      [
        'Limitations',
        'Forests smooth over fine structure, are memory hungry, and lose the interpretability of a single tree. Feature importances are biased toward high-cardinality features.',
      ],
    ],
    principles: [
      'Ensembles trade interpretability for stability',
      'Decorrelation is the whole trick',
      'Random forests are strong tabular baselines with little tuning',
    ],
    formulas: [
      {
        name: 'Variance of an average of correlated predictors',
        expression: 'Var(avg) = ρσ² + (1−ρ)σ²/B',
        variables: [
          ['ρ', 'pairwise correlation between trees'],
          ['B', 'number of trees'],
          ['σ²', 'variance of a single tree'],
        ],
        whenToUse: 'Reasoning about why feature randomness matters: as B→∞ the second term vanishes but ρσ² remains.',
      },
    ],
    examples: [
      {
        level: 'practical',
        title: 'Tuning a forest',
        problem: 'Validation accuracy plateaus at 200 trees. Should you add more?',
        solution: 'No. More trees cannot overfit in the averaging sense but give diminishing returns; instead tune depth, min_samples_leaf, and max_features.',
      },
    ],
    applications: [{ title: 'Tabular risk models', description: 'Forests handle mixed types and missing values with minimal preprocessing.', industry: 'Insurance' }],
    questions: [
      {
        type: 'mcq',
        prompt: 'Random forests reduce which error component most directly?',
        options: ['Bias', 'Variance', 'Irreducible noise', 'Label noise'],
        answer: '1',
        explanation: 'Averaging many decorrelated high-variance trees reduces variance; bias stays close to that of a single deep tree.',
        difficulty: 'intermediate',
      },
      {
        type: 'truefalse',
        prompt: 'Adding more trees to a random forest will eventually cause it to overfit.',
        answer: false,
        explanation: 'In the limit the generalisation error converges; more trees reduce variance of the ensemble estimate, not accuracy. Overfitting comes from depth and leaf size.',
        difficulty: 'advanced',
      },
    ],
    prerequisites: ['decision-trees', 'bias-variance'],
    related: ['gradient-boosting', 'cross-validation', 'feature-engineering'],
  },
  {
    id: 'gradient-boosting',
    title: 'Gradient Boosting',
    parentId: 'random-forest',
    type: 'advanced',
    difficulty: 'advanced',
    summary: 'Sequentially add weak learners, each fitting the residual error of the current ensemble.',
    minutes: 15,
    objectives: ['Explain boosting as functional gradient descent', 'Describe learning rate and early stopping', 'Recognise XGBoost/LightGBM design choices'],
    theory: [
      [
        'Boosting vs bagging',
        'Bagging trains trees in parallel and averages. Boosting trains sequentially: each new tree fits the negative gradient (residual) of the loss with respect to current predictions.',
      ],
      [
        'Shrinkage',
        'Each tree contributes only a fraction (learning rate) of its prediction. Small learning rates with many trees generalise better but train slower.',
      ],
      [
        'Regularised objectives',
        'Modern implementations add penalties on tree complexity (number of leaves, leaf weights) plus row and column subsampling, which is what makes them dominate tabular benchmarks.',
      ],
    ],
    principles: ['Boosting reduces bias; bagging reduces variance', 'Learning rate and tree count trade off against each other', 'Always use early stopping on a validation set'],
    formulas: [
      {
        name: 'Boosting update',
        expression: 'F_m(x) = F_{m−1}(x) + ν · h_m(x)',
        variables: [
          ['F_{m−1}', 'current ensemble'],
          ['h_m', 'new weak learner fit to residuals'],
          ['ν', 'learning rate (shrinkage)'],
        ],
        example: 'With ν=0.1, a tree predicting residual 5 contributes only 0.5 to the ensemble.',
        whenToUse: 'Tabular prediction where accuracy matters most.',
        mistakes: ['No early stopping', 'Learning rate and n_estimators tuned independently'],
      },
    ],
    examples: [
      {
        level: 'advanced',
        title: 'Why boosting can overfit',
        problem: 'Bagging rarely overfits with more trees, boosting does. Why?',
        solution:
          'Boosting keeps fitting remaining structure, including noise, so capacity grows with each round. Early stopping and shrinkage are the controls.',
      },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'Gradient boosting primarily reduces:',
        options: ['Variance', 'Bias', 'Irreducible error', 'Dimensionality'],
        answer: '1',
        explanation: 'Each round corrects systematic residual error, lowering bias. Variance is controlled separately via shrinkage and depth.',
        difficulty: 'advanced',
      },
    ],
    prerequisites: ['decision-trees', 'gradient-descent', 'bias-variance'],
    related: ['random-forest', 'regularization', 'model-evaluation'],
  },
  {
    id: 'svm',
    title: 'Support Vector Machines',
    parentId: 'classification',
    type: 'concept',
    difficulty: 'advanced',
    summary: 'Find the maximum-margin separating hyperplane, with kernels to handle non-linear boundaries.',
    minutes: 16,
    objectives: ['Explain the margin and support vectors', 'Describe the kernel trick', 'Explain the C parameter'],
    theory: [
      [
        'Maximum margin',
        'Among all separating hyperplanes, choose the one with the largest distance to the nearest points. Those nearest points are the **support vectors** — the solution depends only on them.',
      ],
      [
        'Soft margin',
        'Real data overlaps. Slack variables allow violations, penalised by C. Small C means a wider margin with more tolerance; large C means strict separation.',
      ],
      [
        'The kernel trick',
        'Replace dot products with a kernel function k(x,x′) that computes an inner product in a higher-dimensional space, without ever mapping explicitly. The RBF kernel gives an infinite-dimensional feature space.',
      ],
    ],
    principles: ['The solution depends only on support vectors', 'Kernels change the geometry, not the algorithm', 'Scale features before using an RBF kernel'],
    formulas: [
      {
        name: 'Margin',
        expression: 'margin = 2 / ‖w‖',
        variables: [['w', 'hyperplane normal vector']],
        whenToUse: 'Understanding why minimising ‖w‖ maximises the margin.',
      },
      {
        name: 'RBF kernel',
        expression: 'k(x, x′) = exp(−γ‖x − x′‖²)',
        variables: [
          ['γ', 'kernel width parameter'],
          ['‖x − x′‖²', 'squared Euclidean distance'],
        ],
        whenToUse: 'Non-linear boundaries; tune γ with C.',
        mistakes: ['Leaving features unscaled', 'Tuning γ without re-tuning C'],
      },
    ],
    examples: [
      {
        level: 'practical',
        title: 'Choosing C and γ',
        problem: 'Validation shows high variance and jagged boundaries. Which way to move?',
        solution: 'Decrease γ (smoother kernel) and/or decrease C (more regularisation), then re-validate.',
      },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'Support vectors are:',
        options: ['All training points', 'Points nearest the decision boundary', 'Misclassified points only', 'The kernel centres'],
        answer: '1',
        explanation: 'Support vectors lie on or within the margin and alone determine the hyperplane.',
        difficulty: 'intermediate',
      },
      {
        type: 'truefalse',
        prompt: 'SVMs scale comfortably to millions of samples with non-linear kernels.',
        answer: false,
        explanation: 'Kernel SVM training is roughly quadratic to cubic in sample count, so it is impractical at that scale. Linear approximations or other model families are used instead.',
        difficulty: 'advanced',
      },
    ],
    prerequisites: ['classification', 'linear-algebra'],
    related: ['logistic-regression', 'knn', 'feature-scaling'],
  },
  {
    id: 'knn',
    title: 'k-Nearest Neighbours',
    parentId: 'classification',
    type: 'concept',
    difficulty: 'beginner',
    summary: 'Predict from the labels of the k closest training points — a lazy, non-parametric learner.',
    minutes: 12,
    objectives: ['Explain why k-NN is called lazy', 'Describe the bias–variance role of k', 'Explain the curse of dimensionality'],
    theory: [
      [
        'The algorithm',
        'Store all training data. To predict, compute distances to all points, take the k nearest, and vote (classification) or average (regression). There is no training phase.',
      ],
      [
        'The role of k',
        'k=1 gives a jagged boundary with low bias and high variance. Large k smooths the boundary, increasing bias and reducing variance. k should be odd for binary voting.',
      ],
      [
        'Distance metrics',
        'Euclidean is default; Manhattan is more robust in high dimensions; cosine is standard for text embeddings. The metric encodes what "similar" means.',
      ],
      [
        'Curse of dimensionality',
        'As dimensions grow, distances concentrate and nearest neighbours become nearly as far as random points. k-NN degrades badly beyond a few dozen effective dimensions without reduction.',
      ],
    ],
    principles: ['Feature scaling is mandatory', 'k controls the bias–variance tradeoff', 'High dimensions break distance-based methods'],
    formulas: [
      {
        name: 'Euclidean distance',
        expression: 'd(x, x′) = √(Σᵢ (xᵢ − x′ᵢ)²)',
        variables: [
          ['xᵢ', 'feature value'],
          ['d', 'number of features'],
        ],
        whenToUse: 'Continuous features on comparable scales.',
      },
    ],
    examples: [
      {
        level: 'beginner',
        title: 'One-dimensional vote',
        problem: 'k=3, neighbour labels are [A, A, B]. Prediction?',
        solution: 'A, by majority vote (2 of 3).',
      },
      {
        level: 'practical',
        title: 'Unscaled features',
        problem: 'Age (0–90) and income (0–200,000). What happens with Euclidean distance?',
        solution: 'Income dominates completely. Standardise both features so each contributes comparably.',
      },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'Increasing k in k-NN generally:',
        options: ['Increases variance, decreases bias', 'Decreases variance, increases bias', 'Increases both', 'Decreases both'],
        answer: '1',
        explanation: 'A larger neighbourhood averages over more points, smoothing predictions — lower variance, higher bias.',
        difficulty: 'intermediate',
      },
      {
        type: 'numeric',
        prompt: 'Euclidean distance between (0,0) and (3,4)?',
        answer: 5,
        tolerance: 0.001,
        explanation: '√(9+16) = √25 = 5.',
        difficulty: 'beginner',
      },
    ],
    prerequisites: ['classification', 'linear-algebra'],
    related: ['feature-scaling', 'kmeans', 'pca'],
  },
  {
    id: 'naive-bayes',
    title: 'Naive Bayes',
    parentId: 'classification',
    type: 'concept',
    difficulty: 'intermediate',
    summary: 'A generative classifier that assumes conditional independence of features given the class.',
    minutes: 12,
    objectives: ['Apply Bayes\u2019 rule in classification form', 'State the conditional independence assumption', 'Explain Laplace smoothing'],
    theory: [
      [
        'The classifier',
        'Predict the class maximising P(y)·Π P(xᵢ|y). The denominator P(x) is constant across classes, so it can be ignored for the argmax.',
      ],
      [
        'Why it works despite being wrong',
        'The independence assumption is usually violated, so probability estimates are miscalibrated. But the ranking of classes is often preserved, and the argmax decision is what matters.',
      ],
      [
        'Smoothing',
        'If a token never appears with a class, the product becomes zero. Laplace (add-one) smoothing prevents this.',
      ],
    ],
    principles: ['Generative models can be trained in one pass', 'Smoothing is not optional for text', 'Excellent at high-dimensional sparse data'],
    formulas: [
      {
        name: 'Naive Bayes decision rule',
        expression: 'ŷ = argmax_y P(y) Πᵢ P(xᵢ | y)',
        variables: [
          ['P(y)', 'class prior'],
          ['P(xᵢ|y)', 'conditional feature probability'],
        ],
        example: 'Spam filtering with token counts: multiply the prior by the per-token likelihoods for each class.',
        whenToUse: 'Text classification, small data, fast baselines.',
        mistakes: ['Forgetting smoothing', 'Interpreting outputs as calibrated probabilities'],
      },
    ],
    examples: [
      {
        level: 'practical',
        title: 'Why the prior matters',
        problem: 'Spam is 20% of traffic. A token appears equally often in both classes. Does it change the decision?',
        solution: 'No. It contributes the same factor to both classes, so the prior decides — the message is predicted non-spam.',
      },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'The "naive" in Naive Bayes refers to:',
        options: ['Using no training data', 'Assuming features are conditionally independent', 'Ignoring priors', 'Using only binary features'],
        answer: '1',
        explanation: 'Features are assumed independent given the class, which simplifies the joint likelihood into a product.',
        difficulty: 'beginner',
      },
    ],
    prerequisites: ['classification', 'probability'],
    related: ['logistic-regression', 'feature-engineering'],
  },
];
