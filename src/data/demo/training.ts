import type { NodeSpec } from './types';

export const trainingSpecs: NodeSpec[] = [
  {
    id: 'gradient-descent',
    title: 'Gradient Descent',
    parentId: 'ml-intro',
    type: 'concept',
    difficulty: 'intermediate',
    summary: 'Iteratively step against the loss gradient, with batch, stochastic, and momentum variants.',
    minutes: 15,
    objectives: [
      'Compare batch, mini-batch, and stochastic updates',
      'Explain momentum and adaptive step sizes',
      'Diagnose divergence and slow convergence',
    ],
    theory: [
      [
        'The update rule',
        'θ ← θ − η∇L(θ). The gradient points uphill, so stepping against it decreases the loss for a small enough η.',
      ],
      [
        'Batch sizes',
        'Full batch gives an exact gradient but is slow per step. Stochastic (single sample) is noisy but fast. Mini-batches balance both and exploit hardware parallelism.',
      ],
      [
        'Momentum and adaptivity',
        'Momentum accumulates a velocity term, smoothing oscillations in ravines. Adam maintains per-parameter moving averages of gradient and squared gradient, adapting the effective step size.',
      ],
      [
        'Diagnostics',
        'Loss diverging: η too high, or unnormalised inputs. Loss flat: η too low, dead units, or saturated activations. Loss oscillating: reduce η or increase batch size.',
      ],
    ],
    definitions: [
      ['Learning rate', 'The step-size multiplier η.'],
      ['Epoch', 'One full pass over the dataset.'],
      ['Momentum', 'A running average of past gradients used to accelerate consistent directions.'],
      ['Adam', 'Adaptive moment estimation, combining momentum with per-parameter scaling.'],
    ],
    principles: [
      'Gradient direction is reliable; magnitude is not',
      'Smaller batches add useful noise but need smaller learning rates',
      'Always start by checking the loss curve',
    ],
    formulas: [
      {
        name: 'Momentum update',
        expression: 'v ← βv + ∇L(θ); θ ← θ − ηv',
        variables: [
          ['β', 'momentum coefficient, typically 0.9'],
          ['v', 'velocity buffer'],
        ],
        example: 'Consistent gradient g and β=0.9: velocity approaches g/(1−β) = 10g, so the effective step is 10× larger.',
        whenToUse: 'Ravine-shaped loss surfaces with oscillating gradients.',
      },
      {
        name: 'Adam step',
        expression: 'θ ← θ − η · m̂ / (√v̂ + ε)',
        variables: [
          ['m̂', 'bias-corrected first moment'],
          ['v̂', 'bias-corrected second moment'],
          ['ε', 'numerical stabiliser'],
        ],
        whenToUse: 'Default optimiser for deep networks.',
        mistakes: ['Using the same learning rate as plain SGD', 'Ignoring weight decay interaction'],
      },
    ],
    visuals: [
      {
        kind: 'curve',
        title: 'Loss over iterations',
        values: [['0', 4.5], ['10', 2.9], ['20', 1.8], ['30', 1.15], ['40', 0.78], ['60', 0.52], ['80', 0.46], ['100', 0.44]],
        caption: 'A healthy curve drops steeply then flattens. A spike or saturation signals a learning-rate problem.',
      },
    ],
    examples: [
      {
        level: 'beginner',
        title: 'One step',
        problem: 'L(θ)=θ², θ=3, η=0.1. Where does θ go?',
        solution: '∇L = 2θ = 6. θ ← 3 − 0.1·6 = 2.4.',
      },
      {
        level: 'practical',
        title: 'Choosing learning rate',
        problem: 'Loss oscillates wildly and never converges. First action?',
        solution: 'Reduce η by 10×. If still unstable, normalise inputs. A learning-rate finder or warm-up schedule also helps.',
      },
      {
        level: 'advanced',
        title: 'Why Adam sometimes generalises worse',
        problem: 'Adam converges faster but can end at a worse minimum than SGD. Why?',
        solution:
          'Adam\u2019s per-parameter scaling can lead it into sharp minima with poor generalisation. SGD\u2019s noise biases toward flatter regions. Switching to SGD with momentum late in training often helps.',
      },
    ],
    applications: [{ title: 'Model training', description: 'Every deep model is trained with some variant of SGD.', industry: 'AI' }],
    questions: [
      {
        type: 'numeric',
        prompt: 'L(θ)=θ², θ=10, η=0.05. What is θ after one step?',
        answer: 9,
        tolerance: 0.001,
        explanation: '∇L = 20. θ ← 10 − 0.05·20 = 9.',
        difficulty: 'intermediate',
      },
      {
        type: 'mcq',
        prompt: 'Momentum primarily helps with:',
        options: ['Overfitting', 'Oscillations in ravines', 'Label noise', 'Feature scaling'],
        answer: '1',
        explanation: 'Velocity accumulates consistent directions and damps alternating ones, smoothing progress along narrow valleys.',
        difficulty: 'intermediate',
      },
      {
        type: 'multi',
        prompt: 'Which are likely causes of a diverging loss? Select all that apply.',
        options: ['Learning rate too high', 'Unnormalised features', 'Batch size too large', 'Exploding gradients in an RNN'],
        answer: ['0', '1', '3'],
        explanation: 'Large steps, poorly conditioned features, and exploding gradients all cause divergence. A larger batch generally stabilises, not destabilises.',
        difficulty: 'advanced',
      },
    ],
    prerequisites: ['calculus', 'loss-functions'],
    related: ['optimization', 'neural-networks', 'regularization'],
  },
  {
    id: 'optimization',
    title: 'Optimization',
    parentId: 'gradient-descent',
    type: 'topic',
    difficulty: 'advanced',
    summary: 'Schedules, second-order structure, constraints, and why deep learning optimisation is unusual.',
    minutes: 14,
    objectives: ['Explain learning-rate schedules', 'Recognise saddle points versus local minima', 'Describe constrained optimisation'],
    theory: [
      [
        'Learning-rate schedules',
        'Step decay, cosine annealing, and warm restarts reduce η over time. Warm-up at the start prevents early instability in large models.',
      ],
      [
        'Saddle points',
        'In high dimensions, random critical points are overwhelmingly saddles, not local minima. Noise and momentum help escape them.',
      ],
      [
        'Constraint handling',
        'Lagrange multipliers convert constrained problems into unconstrained ones; in practice, projection or penalty terms are used.',
      ],
    ],
    principles: ['The schedule is part of the model', 'Escaping saddles needs noise, not just descent', 'Generalisation and optimisation are different objectives'],
    examples: [
      {
        level: 'advanced',
        title: 'Why cosine annealing',
        problem: 'What does cosine annealing achieve that step decay does not?',
        solution:
          'It decays smoothly without discrete jumps, avoiding loss spikes, and often settles into flatter minima. Warm restarts let the model re-explore periodically.',
      },
    ],
    questions: [
      {
        type: 'truefalse',
        prompt: 'In high-dimensional non-convex optimisation, most critical points are local minima.',
        answer: false,
        explanation: 'Most are saddle points; random directions are equally likely to curve up or down.',
        difficulty: 'advanced',
      },
    ],
    prerequisites: ['gradient-descent'],
    related: ['gradient-descent', 'loss-functions'],
  },
  {
    id: 'loss-functions',
    title: 'Loss Functions',
    parentId: 'ml-intro',
    type: 'concept',
    difficulty: 'intermediate',
    summary: 'The objective that defines what "good" means — and therefore what the model actually learns.',
    minutes: 14,
    objectives: [
      'Match loss to task type',
      'Explain why cross-entropy beats MSE for classification',
      'Recognise the effect of class weighting',
    ],
    theory: [
      [
        'Loss is the specification',
        'The model will optimise exactly what you measure. Choose the loss that reflects the real cost of error.',
      ],
      [
        'Regression losses',
        'MSE is smooth and mean-seeking. MAE is robust to outliers and median-seeking. Huber blends them with a threshold δ.',
      ],
      [
        'Classification losses',
        'Cross-entropy measures divergence between predicted and true distributions. It is convex in the logits for logistic regression and gives strong gradients when the model is confidently wrong.',
      ],
      [
        'Why not MSE for classification',
        'MSE saturates with the sigmoid: when the model is confidently wrong, the gradient is tiny, so learning stalls. Cross-entropy grows without bound and provides a strong corrective signal.',
      ],
      [
        'Imbalance',
        'Weighting the minority class changes the effective decision boundary. Focal loss down-weights easy examples to focus on hard ones.',
      ],
    ],
    definitions: [
      ['Cross-entropy', '−Σ y log p, divergence between label and prediction distributions.'],
      ['Huber loss', 'Squared error for small residuals, linear beyond δ.'],
      ['Focal loss', 'Cross-entropy modulated by (1−p)^γ to emphasise hard examples.'],
      ['Class weight', 'A multiplier applied to per-class loss contributions.'],
    ],
    principles: ['The loss defines the learned behaviour', 'Match loss to the cost structure of errors', 'Confident wrongness must produce large gradients'],
    formulas: [
      {
        name: 'MSE',
        expression: 'MSE = (1/n) Σ (yᵢ − ŷᵢ)²',
        variables: [
          ['yᵢ', 'target'],
          ['ŷᵢ', 'prediction'],
        ],
        whenToUse: 'Regression with roughly Gaussian noise.',
        mistakes: ['Using it for classification', 'Assuming robustness to outliers'],
      },
      {
        name: 'Categorical cross-entropy',
        expression: 'L = −Σ_k y_k log p_k',
        variables: [
          ['y_k', 'one-hot target'],
          ['p_k', 'predicted probability for class k'],
        ],
        example: 'True class 2, predicted p₂=0.9 → L = −log 0.9 ≈ 0.105. If p₂=0.01 → L ≈ 4.6.',
        whenToUse: 'Multiclass classification with softmax.',
      },
      {
        name: 'Huber loss',
        expression: 'L = 0.5r² if |r| ≤ δ, else δ(|r| − 0.5δ)',
        variables: [
          ['r', 'residual y − ŷ'],
          ['δ', 'transition threshold'],
        ],
        whenToUse: 'Regression with occasional large outliers.',
      },
    ],
    visuals: [
      {
        kind: 'bars',
        title: 'Loss shape comparison',
        values: [['MSE at r=1', 1], ['MSE at r=3', 9], ['MAE at r=1', 1], ['MAE at r=3', 3]],
        caption: 'Squared error grows quadratically; absolute error grows linearly and is thus more robust.',
      },
    ],
    examples: [
      {
        level: 'practical',
        title: 'Imbalanced classification loss',
        problem: 'Fraud is 0.5% of transactions. What changes?',
        solution:
          'Use weighted cross-entropy or focal loss, evaluate with PR-AUC, and choose a threshold from the cost matrix rather than 0.5.',
      },
      {
        level: 'advanced',
        title: 'Gradient magnitudes',
        problem: 'Compare the sigmoid+MSE gradient to sigmoid+cross-entropy when y=1 and p=0.01.',
        solution:
          'MSE gradient ∝ 2(p−y)σ′(z) = 2(−0.99)(0.0099) ≈ −0.0196. Cross-entropy gradient is (p−y) = −0.99 — roughly 50× larger. That is why cross-entropy learns so much faster when confidently wrong.',
      },
    ],
    applications: [{ title: 'Ranking systems', description: 'Pairwise and listwise losses align training with ranking metrics.', industry: 'Search' }],
    questions: [
      {
        type: 'mcq',
        prompt: 'For binary classification, the standard loss is:',
        options: ['MSE', 'Binary cross-entropy', 'L1', 'Hinge only'],
        answer: '1',
        explanation: 'Binary cross-entropy is the negative log-likelihood of a Bernoulli target.',
        difficulty: 'beginner',
      },
      {
        type: 'numeric',
        prompt: 'Cross-entropy with true label 1 and predicted probability 0.5. Give the value (3 decimals, natural log).',
        answer: 0.693,
        tolerance: 0.01,
        explanation: '−log(0.5) = ln 2 ≈ 0.693.',
        difficulty: 'intermediate',
      },
      {
        type: 'short',
        prompt: 'Why is MSE a poor loss for probabilistic classification?',
        answer: 'saturate|gradient|vanish|small|slow',
        explanation: 'With a sigmoid output, MSE\u2019s gradient includes the activation derivative which is tiny in saturated regions; a confidently wrong prediction produces almost no learning signal.',
        difficulty: 'advanced',
      },
    ],
    prerequisites: ['probability', 'calculus'],
    related: ['logistic-regression', 'gradient-descent', 'optimization', 'regularization'],
  },
  {
    id: 'regularization',
    title: 'Regularization',
    parentId: 'overfitting',
    type: 'concept',
    difficulty: 'intermediate',
    summary: 'Constraints and penalties that trade training fit for generalisation.',
    minutes: 14,
    objectives: [
      'Compare L1 and L2 penalties',
      'Explain dropout and early stopping',
      'Choose regularisation for a given symptom',
    ],
    theory: [
      [
        'Why regularise',
        'Unconstrained models exploit noise in the training set. Regularisation restricts the hypothesis class or the optimisation path so the model prefers simpler, smoother solutions.',
      ],
      [
        'L2 (weight decay)',
        'Penalise Σw², shrinking coefficients smoothly toward zero. It handles collinearity and stabilises solutions without eliminating features.',
      ],
      [
        'L1 (lasso)',
        'Penalise Σ|w|, which produces sparse solutions — some coefficients become exactly zero, giving automatic feature selection.',
      ],
      [
        'Dropout',
        'Randomly zero activations during training, forcing the network to avoid co-adaptation. At inference, activations are scaled to preserve expectations.',
      ],
      [
        'Early stopping',
        'Monitor validation loss and stop when it begins to rise. It is a cheap, effective regulariser that constrains effective training time.',
      ],
    ],
    definitions: [
      ['Weight decay', 'L2 penalty applied to parameters, shrinking them each step.'],
      ['Dropout', 'Random deactivation of units during training.'],
      ['Early stopping', 'Halting training when validation performance degrades.'],
      ['Elastic net', 'A weighted combination of L1 and L2 penalties.'],
    ],
    principles: [
      'Regularisation is a bias-for-variance trade',
      'Always tune λ on validation data',
      'More data is the best regulariser — when available',
    ],
    formulas: [
      {
        name: 'L2 regularised objective',
        expression: 'L = L_data + λ‖w‖²',
        variables: [
          ['λ', 'regularisation strength'],
          ['‖w‖²', 'squared L2 norm of weights'],
        ],
        example: 'λ=0 → unregularised. Large λ → coefficients shrink toward zero but never reach it.',
        whenToUse: 'Collinearity, high-dimensional data, unstable coefficients.',
        mistakes: ['Regularising the bias term', 'Tuning λ on the test set'],
      },
      {
        name: 'Elastic net',
        expression: 'L = L_data + λ₁‖w‖₁ + λ₂‖w‖²',
        variables: [
          ['λ₁', 'L1 strength'],
          ['λ₂', 'L2 strength'],
        ],
        whenToUse: 'When you want sparsity plus stability among correlated features.',
      },
    ],
    visuals: [
      {
        kind: 'bars',
        title: 'Coefficient paths under L1 vs L2',
        values: [['L1: w₁', 0.0], ['L1: w₂', 0.42], ['L1: w₃', 0.31], ['L2: w₁', 0.18], ['L2: w₂', 0.36], ['L2: w₃', 0.29]],
        caption: 'L1 drives w₁ exactly to zero (feature selection); L2 shrinks everything smoothly.',
      },
    ],
    examples: [
      {
        level: 'beginner',
        title: 'Choosing a penalty',
        problem: 'You have 500 features and suspect most are irrelevant. L1 or L2?',
        solution: 'L1 (or elastic net) — it produces sparse solutions and effectively selects features.',
      },
      {
        level: 'practical',
        title: 'Dropout rate',
        problem: 'A network underfits with dropout 0.7. What next?',
        solution: 'Lower the rate to 0.1–0.3. Aggressive dropout acts like a strong capacity limit and can prevent the model from learning at all.',
      },
      {
        level: 'advanced',
        title: 'Weight decay vs L2',
        problem: 'In Adam, is weight decay the same as L2 regularisation?',
        solution:
          'No. Standard L2 added to the loss interacts with Adam\u2019s adaptive scaling, shrinking high-gradient parameters less than intended. AdamW decouples the decay from the gradient, which is why it generalises better.',
      },
    ],
    applications: [{ title: 'Genomic prediction', description: 'Lasso selects a sparse set of predictive genes from tens of thousands.', industry: 'Biotech' }],
    questions: [
      {
        type: 'mcq',
        prompt: 'L1 regularisation tends to produce:',
        options: ['Dense coefficients', 'Sparse coefficients', 'Larger coefficients', 'No effect on coefficients'],
        answer: '1',
        explanation: 'The L1 geometry has corners on the axes, so the optimum often sets coefficients exactly to zero.',
        difficulty: 'intermediate',
      },
      {
        type: 'truefalse',
        prompt: 'Regularisation always improves test performance.',
        answer: false,
        explanation: 'Excessive regularisation causes underfitting. The right amount must be tuned on validation data.',
        difficulty: 'beginner',
      },
      {
        type: 'match',
        prompt: 'Match each technique to its mechanism.',
        pairs: [
          { left: 'L2 penalty', right: 'Smooth coefficient shrinkage' },
          { left: 'L1 penalty', right: 'Sparse feature selection' },
          { left: 'Dropout', right: 'Prevents co-adaptation of units' },
          { left: 'Early stopping', right: 'Limits effective training time' },
        ],
        answer: ['Smooth coefficient shrinkage', 'Sparse feature selection', 'Prevents co-adaptation of units', 'Limits effective training time'],
        explanation: 'Each mechanism imposes a different kind of restriction on the effective hypothesis class.',
        difficulty: 'intermediate',
      },
    ],
    prerequisites: ['overfitting', 'loss-functions'],
    related: ['cross-validation', 'bias-variance', 'model-evaluation'],
  },
  {
    id: 'overfitting',
    title: 'Overfitting',
    parentId: 'model-evaluation',
    type: 'concept',
    difficulty: 'beginner',
    summary: 'When a model learns noise instead of signal, training performance diverges from real-world performance.',
    minutes: 12,
    objectives: ['Recognise overfitting symptoms', 'Explain the gap between train and validation error', 'List remedies in order of preference'],
    theory: [
      [
        'The signature',
        'Training error keeps falling while validation error rises. The gap is the amount of variance the model has fitted to noise.',
      ],
      [
        'Causes',
        'Too much capacity relative to data, too many features, a leaky validation setup, or training too long without early stopping.',
      ],
      [
        'Remedies, best first',
        '1) Get more or better data. 2) Simplify the model. 3) Regularise (L1/L2, dropout). 4) Use early stopping. 5) Ensemble. Data beats every algorithmic fix.',
      ],
      [
        'Leakage masquerading as overfitting',
        'Duplicate rows across splits, target-derived features, and preprocessing fitted on the full dataset all create the illusion of a model that "memorises". Always fit transforms inside cross-validation folds.',
      ],
    ],
    definitions: [
      ['Overfitting', 'Fitting noise so that generalisation degrades.'],
      ['Generalisation gap', 'Validation error minus training error.'],
      ['Leakage', 'Information from the target or test set entering training.'],
    ],
    principles: [
      'A large train/validation gap is the diagnostic',
      'Suspect leakage before blaming capacity',
      'Reduce capacity before adding complexity',
    ],
    visuals: [
      {
        kind: 'curve',
        title: 'Train vs validation error over training time',
        values: [['Epoch 2 (train)', 30], ['Epoch 2 (val)', 34], ['Epoch 6 (train)', 14], ['Epoch 6 (val)', 18], ['Epoch 12 (train)', 6], ['Epoch 12 (val)', 24], ['Epoch 20 (train)', 2], ['Epoch 20 (val)', 38]],
        caption: 'Validation error bottoms out around epoch 6 and then rises — that is the stopping point.',
      },
    ],
    examples: [
      {
        level: 'beginner',
        title: 'Detecting overfit',
        problem: 'Train R² = 0.98, validation R² = 0.61. Diagnosis?',
        solution: 'Substantial overfitting. Start by checking for leakage, then reduce model complexity and add regularisation.',
      },
      {
        level: 'practical',
        title: 'Too little data',
        problem: 'Only 300 rows and 80 features. What is the most effective action?',
        solution:
          'Collect more data or reduce dimensionality. Regularisation helps but cannot manufacture information; use cross-validation and prefer simpler models.',
      },
      {
        level: 'advanced',
        title: 'Double descent',
        problem: 'Beyond the interpolation threshold, test error sometimes falls again. Why?',
        solution:
          'When the model has far more parameters than data points, it can interpolate while still finding smooth solutions, and implicit regularisation from SGD biases toward them. This is the double-descent phenomenon.',
      },
    ],
    applications: [{ title: 'Model monitoring', description: 'Production drift detection catches degradation that offline validation missed.', industry: 'MLOps' }],
    questions: [
      {
        type: 'mcq',
        prompt: 'The clearest sign of overfitting is:',
        options: ['High training error and high validation error', 'Low training error and high validation error', 'Low both', 'High training error only'],
        answer: '1',
        explanation: 'A widening gap where training success does not transfer is the defining signature.',
        difficulty: 'beginner',
      },
      {
        type: 'multi',
        prompt: 'Which reduce overfitting? Select all that apply.',
        options: ['More training data', 'Increasing model depth', 'L2 regularisation', 'Early stopping'],
        answer: ['0', '2', '3'],
        explanation: 'More data, regularisation, and early stopping all constrain effective capacity. Adding depth increases it.',
        difficulty: 'intermediate',
      },
      {
        type: 'short',
        prompt: 'Name the most common source of leakage in a preprocessing pipeline.',
        answer: 'scaling|imput|fit|full|before split|normalis',
        explanation: 'Fitting scalers, imputers, or feature selectors on the full dataset before splitting leaks validation statistics into training.',
        difficulty: 'advanced',
      },
    ],
    prerequisites: ['model-evaluation'],
    related: ['underfitting', 'regularization', 'cross-validation', 'bias-variance'],
  },
  {
    id: 'underfitting',
    title: 'Underfitting',
    parentId: 'overfitting',
    type: 'concept',
    difficulty: 'beginner',
    summary: 'When a model is too simple or too constrained to capture the underlying pattern.',
    minutes: 8,
    objectives: ['Distinguish underfitting from overfitting', 'Identify the remedies', 'Recognise when the data itself is the limit'],
    theory: [
      [
        'The signature',
        'Both training and validation error are high, and they converge to a plateau. The model is not expressing the structure that exists.',
      ],
      [
        'Causes',
        'Model too simple, features uninformative, excessive regularisation, or a training bug such as a frozen parameter group or a mis-set learning rate.',
      ],
      [
        'Remedies',
        'Increase capacity, add informative features, reduce regularisation, train longer, or check for pipeline bugs. Underfitting is often a bug rather than a modelling limit.',
      ],
    ],
    principles: [
      'High error on both splits means capacity or feature problems',
      'Check for pipeline bugs before adding complexity',
      'Some problems are genuinely unpredictable from the available features',
    ],
    examples: [
      {
        level: 'practical',
        title: 'Linear model on a curved relationship',
        problem: 'Train and validation RMSE are both high and nearly equal. What next?',
        solution:
          'The model is underfitting. Add non-linear features or interactions, or switch to a non-linear model family. Validate that the loss actually decreases.',
      },
    ],
    questions: [
      {
        type: 'truefalse',
        prompt: 'High training error rules out overfitting.',
        answer: true,
        explanation: 'Overfitting requires the model to fit training data well; if training error is high, the problem is underfitting or a bug.',
        difficulty: 'beginner',
      },
    ],
    prerequisites: ['model-evaluation'],
    related: ['overfitting', 'bias-variance', 'regularization'],
  },
  {
    id: 'bias-variance',
    title: 'Bias–Variance Tradeoff',
    parentId: 'overfitting',
    type: 'concept',
    difficulty: 'advanced',
    summary: 'Decomposing expected error into bias, variance, and irreducible noise — the central theoretical lens.',
    minutes: 14,
    objectives: [
      'State the decomposition',
      'Map algorithms to their bias/variance profile',
      'Explain why ensembles shift the balance',
    ],
    theory: [
      [
        'The decomposition',
        'Expected squared error at a point = bias² + variance + irreducible noise. Bias is systematic error from wrong assumptions; variance is sensitivity to the particular training sample.',
      ],
      [
        'Simple vs complex',
        'Linear models have high bias and low variance. Deep trees have low bias and high variance. The optimal complexity minimises the sum, not either term.',
      ],
      [
        'Ensembles move the dial',
        'Bagging reduces variance (averaging decorrelated high-variance models). Boosting reduces bias (sequentially correcting residuals). Knowing which term dominates tells you which ensemble to use.',
      ],
      [
        'Modern nuance',
        'Very over-parameterised models can interpolate the data yet generalise well, which the classical U-curve does not predict. The decomposition still holds; the assumption that variance must explode does not.',
      ],
    ],
    principles: [
      'Diagnose which term dominates before choosing a remedy',
      'More data reduces variance, not bias',
      'Bias and variance are properties of the estimator, not the dataset alone',
    ],
    formulas: [
      {
        name: 'Bias–variance decomposition',
        expression: 'E[(y − f̂)²] = Bias(f̂)² + Var(f̂) + σ²',
        variables: [
          ['Bias', 'E[f̂] − f'],
          ['Var', 'E[(f̂ − E[f̂])²]'],
          ['σ²', 'irreducible noise'],
        ],
        derivation: 'Add and subtract E[f̂] inside the expectation and expand; cross terms vanish because E[y − f] = 0.',
        example: 'A model with bias 4 and variance 9 plus noise 1 has expected MSE 16 + 9 + 1 = 26.',
        whenToUse: 'Reasoning about model selection and ensemble choice.',
        mistakes: ['Assuming the decomposition is additive on log loss', 'Treating irreducible noise as reducible'],
      },
    ],
    visuals: [
      {
        kind: 'curve',
        title: 'Total error vs model complexity',
        values: [['low complexity', 42], ['', 30], ['', 21], ['optimal', 15], ['', 18], ['', 27], ['high complexity', 44]],
        caption: 'Bias falls and variance rises with complexity; the minimum is where they balance.',
      },
    ],
    examples: [
      {
        level: 'practical',
        title: 'Diagnosing a model',
        problem: 'Train MSE 0.30, validation MSE 0.32 — both high. Which term dominates?',
        solution: 'Both are high and close, so bias dominates. Increase capacity or improve features rather than regularising harder.',
      },
      {
        level: 'advanced',
        title: 'Model averaging',
        problem: 'Why does averaging 100 decorrelated trees reduce variance by ~100× while leaving bias roughly unchanged?',
        solution:
          'Var(mean) = σ²/B when predictions are independent. Bias is a property of the average prediction and is essentially unaffected by averaging identically distributed models.',
      },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'Which model family typically has the highest variance?',
        options: ['Linear regression', 'Deep unconstrained decision tree', 'Logistic regression with L2', 'Naive Bayes'],
        answer: '1',
        explanation: 'A fully grown tree changes drastically with small data perturbations — high variance.',
        difficulty: 'intermediate',
      },
      {
        type: 'numeric',
        prompt: 'Bias² = 9, variance = 4, noise = 2. Expected MSE?',
        answer: 15,
        tolerance: 0.001,
        explanation: '9 + 4 + 2 = 15.',
        difficulty: 'beginner',
      },
      {
        type: 'short',
        prompt: 'For a model with high variance, which ensemble strategy helps and why?',
        answer: 'bagging|average|variance|decorrelat',
        explanation: 'Bagging averages many decorrelated high-variance models, and the variance of the average falls as 1/B while bias is preserved.',
        difficulty: 'advanced',
      },
    ],
    prerequisites: ['overfitting', 'statistics'],
    related: ['regularization', 'random-forest', 'cross-validation', 'model-evaluation'],
  },
];
