import type { NodeSpec } from './types';

export const extraSpecs: NodeSpec[] = [
  {
    id: 'anomaly-detection',
    title: 'Anomaly Detection',
    parentId: 'unsupervised-learning',
    type: 'concept',
    difficulty: 'advanced',
    summary: 'Finding rare observations that deviate from the learned pattern of normal data.',
    minutes: 12,
    objectives: ['Compare statistical, distance, and density approaches', 'Explain why precision matters more than accuracy', 'Recognise the base-rate problem'],
    theory: [
      [
        'The problem shape',
        'Anomalies are rare, heterogeneous, and often unlabelled. Supervised classification is usually infeasible, so we model normality and flag deviations.',
      ],
      [
        'Approaches',
        'Statistical (z-score, Mahalanobis distance), distance-based (k-NN distance), density-based (LOF), and reconstruction-based (autoencoder error). Isolation Forest isolates points with random splits and is a strong default.',
      ],
      [
        'Evaluation',
        'With 0.1% anomalies, accuracy is meaningless. Use precision at a fixed alert budget, recall at low false-positive rate, or the area under the PR curve.',
      ],
    ],
    principles: ['Model normality, not the anomaly class', 'Alert budgets constrain the operating point', 'Anomaly scores need human triage loops'],
    formulas: [
      {
        name: 'Mahalanobis distance',
        expression: 'd(x) = √((x − μ)ᵀ Σ⁻¹ (x − μ))',
        variables: [
          ['μ', 'mean vector'],
          ['Σ', 'covariance matrix'],
        ],
        whenToUse: 'Multivariate anomalies where feature correlations matter.',
        mistakes: ['Using a singular covariance matrix without regularisation'],
      },
    ],
    examples: [
      {
        level: 'practical',
        title: 'Alert budget',
        problem: 'Analysts can review 50 alerts per day out of 2 million transactions. What do you optimise?',
        solution: 'Precision at the top 50 scores. Choose the threshold from the ranked score distribution, not from a fixed probability.',
      },
    ],
    applications: [{ title: 'Fraud monitoring', description: 'Score transactions and route the top-ranked to analysts.', industry: 'Finance' }],
    questions: [
      {
        type: 'mcq',
        prompt: 'Why is accuracy inappropriate for anomaly detection?',
        options: ['It is too slow to compute', 'Anomalies are extremely rare so trivial prediction scores high', 'It requires labels', 'It only works for regression'],
        answer: '1',
        explanation: 'With a 0.1% anomaly rate, predicting "normal" always gives 99.9% accuracy while detecting nothing.',
        difficulty: 'intermediate',
      },
      {
        type: 'truefalse',
        prompt: 'Isolation Forest works by modelling the density of normal points directly.',
        answer: false,
        explanation: 'It isolates points via random partitioning; anomalies require fewer splits to isolate and thus receive higher scores.',
        difficulty: 'advanced',
      },
    ],
    prerequisites: ['unsupervised-learning', 'statistics'],
    related: ['dbscan', 'pca', 'precision-recall'],
  },
  {
    id: 'generative-models',
    title: 'Generative Models',
    parentId: 'deep-learning',
    type: 'advanced',
    difficulty: 'expert',
    summary: 'Models that learn the data distribution itself, enabling sampling and density estimation.',
    minutes: 14,
    objectives: ['Distinguish explicit from implicit density models', 'Explain the GAN objective', 'Compare likelihood-based and adversarial training'],
    theory: [
      [
        'Two families',
        'Explicit models define a likelihood (VAEs, normalising flows, autoregressive models). Implicit models generate samples without a tractable density (GANs, diffusion models).',
      ],
      [
        'GAN objective',
        'A generator maps noise to samples; a discriminator distinguishes real from generated. Training is a minimax game. It produces sharp samples but is unstable and can mode-collapse.',
      ],
      [
        'Diffusion models',
        'Learn to reverse a gradual noising process. Training is a simple denoising objective and sampling is iterative. They dominate image generation because they are stable and high quality.',
      ],
    ],
    principles: ['Likelihood is not the same as sample quality', 'Adversarial training trades stability for sharpness', 'Diffusion trades sampling speed for stability'],
    examples: [
      {
        level: 'advanced',
        title: 'Mode collapse',
        problem: 'A GAN generates only three distinct faces. Diagnosis?',
        solution: 'Mode collapse: the generator found a few outputs that reliably fool the discriminator. Mitigate with minibatch discrimination, better regularisation, or a different model family.',
      },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'Diffusion models generate samples by:',
        options: ['A single forward pass', 'Iteratively reversing a noising process', 'Sampling from a fixed Gaussian', 'Maximising a discriminator score'],
        answer: '1',
        explanation: 'A learned denoiser is applied repeatedly, gradually turning noise into a sample.',
        difficulty: 'expert',
      },
    ],
    prerequisites: ['deep-learning', 'autoencoders'],
    related: ['autoencoders', 'embeddings'],
  },
  {
    id: 'generalized-linear-models',
    title: 'Generalized Linear Models',
    parentId: 'regression',
    type: 'advanced',
    difficulty: 'advanced',
    summary: 'Linear predictors combined with a link function to model non-Gaussian targets.',
    minutes: 12,
    objectives: ['Explain the link function', 'Identify Poisson and logistic as GLMs', 'Choose a distribution for a target type'],
    theory: [
      [
        'The structure',
        'A GLM models E[y] = g⁻¹(Xw) where g is the link function. Linear regression uses the identity link and Gaussian noise; logistic regression uses the logit link and Bernoulli noise.',
      ],
      [
        'Common members',
        'Poisson regression (log link) for counts. Gamma regression (log link) for positive skewed amounts. Negative binomial for overdispersed counts.',
      ],
      [
        'Why it matters',
        'Predicting counts with linear regression can produce negative values and assumes constant variance. A GLM respects the support and variance structure of the target.',
      ],
    ],
    principles: ['Match the distribution to the target\u2019s support', 'The link function is part of the model, not a preprocessing step', 'Check dispersion for count models'],
    examples: [
      {
        level: 'advanced',
        title: 'Counts with overdispersion',
        problem: 'Poisson regression fits poorly; variance exceeds the mean. What now?',
        solution: 'Use a negative binomial GLM or a quasi-Poisson approach. Overdispersion inflates standard errors and invalidates inference.',
      },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'Poisson regression typically uses which link function?',
        options: ['Identity', 'Logit', 'Log', 'Inverse'],
        answer: '2',
        explanation: 'The log link keeps the predicted rate positive: log(E[y]) = Xw.',
        difficulty: 'advanced',
      },
    ],
    prerequisites: ['regression', 'probability', 'logistic-regression'],
    related: ['linear-regression', 'logistic-regression', 'statistics'],
  },
  {
    id: 'causal-inference',
    title: 'Causal Inference',
    parentId: 'statistics',
    type: 'advanced',
    difficulty: 'expert',
    summary: 'Estimating the effect of an intervention rather than an association.',
    minutes: 14,
    objectives: ['Distinguish association from causation', 'Explain confounding', 'Describe randomised and observational designs'],
    theory: [
      [
        'The core problem',
        'Correlation tells you variables move together. Causal questions ask what happens under intervention. Confounders create associations that vanish under intervention.',
      ],
      [
        'Designs',
        'Randomised controlled trials break confounding by design. Observational methods include matching, propensity scores, difference-in-differences, and instrumental variables.',
      ],
      [
        'Potential outcomes',
        'Each unit has a treated and untreated potential outcome; only one is observed. The average treatment effect is the mean difference across the population.',
      ],
    ],
    principles: ['No adjustment set can fix unmeasured confounding', 'Randomisation is the cleanest identification strategy', 'Always state the causal assumption explicitly'],
    examples: [
      {
        level: 'advanced',
        title: 'Simpson\u2019s paradox',
        problem: 'A treatment helps within every subgroup but appears harmful overall. How?',
        solution: 'Subgroup sizes differ and the confounder correlates with both treatment and outcome. Aggregate comparisons reverse the sign. Stratify or adjust.',
      },
    ],
    questions: [
      {
        type: 'truefalse',
        prompt: 'Propensity score matching eliminates bias from unmeasured confounders.',
        answer: false,
        explanation: 'It only balances measured covariates. Unmeasured confounding remains a threat.',
        difficulty: 'expert',
      },
    ],
    prerequisites: ['statistics', 'probability'],
    related: ['statistics', 'model-evaluation'],
  },
  {
    id: 'bayesian-optimisation',
    title: 'Bayesian Optimization',
    parentId: 'optimization',
    type: 'advanced',
    difficulty: 'expert',
    summary: 'Sample-efficient hyperparameter search using a surrogate model and an acquisition function.',
    minutes: 12,
    objectives: ['Explain the surrogate model role', 'Describe expected improvement', 'Know when it beats grid search'],
    theory: [
      [
        'The setting',
        'Each evaluation is expensive (train a model). Bayesian optimisation builds a probabilistic surrogate of the objective and chooses the next point to maximise expected improvement.',
      ],
      [
        'Acquisition functions',
        'Expected improvement balances exploitation (low predicted loss) with exploration (high uncertainty). UCB does the same with an explicit optimism term.',
      ],
      [
        'When to use it',
        'Few evaluations, moderate dimensionality (under ~20 hyperparameters), and noisy but expensive objectives. Grid and random search remain strong baselines.',
      ],
    ],
    principles: ['Optimise the search, not just the model', 'Random search is a surprisingly strong baseline', 'High dimensionality breaks surrogate models'],
    examples: [
      {
        level: 'advanced',
        title: 'Evaluation budget',
        problem: 'You can afford 30 training runs over 8 hyperparameters. Grid search or Bayesian optimisation?',
        solution: 'Bayesian optimisation — 30 runs is far too few for a grid over 8 dimensions, and the surrogate uses each result to inform the next.',
      },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'Expected improvement balances:',
        options: ['Bias and variance', 'Exploration and exploitation', 'Precision and recall', 'Depth and width'],
        answer: '1',
        explanation: 'It trades the chance of a better value against the value of learning about uncertain regions.',
        difficulty: 'advanced',
      },
    ],
    prerequisites: ['optimization', 'probability'],
    related: ['cross-validation', 'model-evaluation'],
  },
  {
    id: 'dendrogram-analysis',
    title: 'Dendrogram Analysis',
    parentId: 'hierarchical-clustering',
    type: 'advanced',
    difficulty: 'intermediate',
    summary: 'Reading merge heights and structure in a hierarchical clustering tree.',
    minutes: 8,
    objectives: ['Interpret merge heights', 'Choose a cut level', 'Detect chaining artifacts'],
    theory: [
      [
        'Structure',
        'Leaves are observations; internal nodes are merges. The height of a merge is the distance at which clusters joined.',
      ],
      [
        'Choosing a cut',
        'A large vertical gap between successive merge heights suggests a natural cluster count. Cutting inside a dense band splits an artificial cluster.',
      ],
      [
        'Chaining',
        'Single linkage can produce long chains of points that gradually connect distinct groups. Complete or Ward linkage usually avoids this.',
      ],
    ],
    principles: ['Merge height is distance, not similarity', 'Gaps matter more than absolute heights', 'Linkage determines the tree shape'],
    examples: [
      {
        level: 'practical',
        title: 'Chaining artifact',
        problem: 'Single-linkage dendrogram shows one enormous cluster. Cause?',
        solution: 'Chaining through intermediate points. Switch to complete or Ward linkage, or use a density-based method.',
      },
    ],
    questions: [
      {
        type: 'truefalse',
        prompt: 'A dendrogram\u2019s vertical axis represents similarity between clusters.',
        answer: false,
        explanation: 'It represents the distance (or dissimilarity) at which clusters merged, so higher means less similar.',
        difficulty: 'intermediate',
      },
    ],
    prerequisites: ['hierarchical-clustering'],
    related: ['hierarchical-clustering', 'clustering'],
  },
];
