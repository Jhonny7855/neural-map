import type { NodeSpec } from './types';

export const foundationSpecs: NodeSpec[] = [
  {
    id: 'ml-root',
    title: 'Machine Learning Galaxy',
    parentId: null,
    type: 'universe',
    difficulty: 'beginner',
    summary: 'A complete map of machine learning: from linear algebra and probability through regression, deep learning, and model evaluation.',
    description:
      'This universe connects the mathematical foundations of machine learning to the practical algorithms used to build systems that learn from data. Every concept links to its prerequisites so you can always find the shortest path to understanding.',
    minutes: 8,
    objectives: [
      'Navigate the relationships between foundations, algorithms, and evaluation',
      'Identify the prerequisites for any concept you want to learn',
      'Build a mental model of how a model learns, generalizes, and fails',
    ],
    theory: [
      [
        'What this universe covers',
        'Machine learning is the study of algorithms that improve their performance on a task through experience. This universe is organised into three layers: **foundations** (linear algebra, probability, statistics, calculus), **methods** (regression, classification, clustering, deep learning), and **discipline** (evaluation, regularisation, data handling).',
      ],
      [
        'How to navigate it',
        'Start from a goal rather than a topic. If you want to understand why a model overfits, follow the path Foundations → Regression → Model Evaluation → Overfitting. The prerequisite edges encode one valid ordering, not the only one.',
      ],
      [
        'The unifying idea',
        'Almost every supervised method can be read as: choose a hypothesis class, define a loss, and minimise expected loss on unseen data. The differences between algorithms are mostly differences in hypothesis class and loss.',
      ],
    ],
    principles: [
      'Every method trades bias for variance somewhere',
      'A model is only as good as the data it is measured on',
      'Understanding beats memorising the algorithm list',
    ],
    prerequisites: [],
    related: ['ml-intro', 'probability', 'linear-algebra'],
  },
  {
    id: 'ml-intro',
    title: 'Introduction to Machine Learning',
    parentId: 'ml-root',
    type: 'subject',
    difficulty: 'beginner',
    summary: 'What learning from data actually means, the three main paradigms, and how a model is trained and evaluated.',
    minutes: 14,
    importance: 'This is the conceptual spine of the entire universe.',
    objectives: [
      'Define supervised, unsupervised, and reinforcement learning',
      'Describe the training / validation / test split and why it exists',
      'Explain the difference between a parameter and a hyperparameter',
    ],
    theory: [
      [
        'Learning from data',
        'A program is said to learn from experience **E** with respect to task **T** and performance measure **P** if its performance at T, as measured by P, improves with experience E. Training a spam filter on labelled emails (E) to classify spam (T) by accuracy (P) is the canonical example.',
      ],
      [
        'Supervised learning',
        'You have input–output pairs and want to predict the output for new inputs. If the output is continuous the task is **regression**; if it is a discrete class the task is **classification**. The signal is the label.',
      ],
      [
        'Unsupervised learning',
        'You have only inputs, and you look for structure: clusters, low-dimensional manifolds, density, or associations. There is no label to be right or wrong about, so evaluation is harder and more task-dependent.',
      ],
      [
        'Reinforcement learning',
        'An agent takes actions in an environment and receives rewards. Learning is driven by delayed feedback rather than labelled examples, which introduces exploration, credit assignment, and stability problems that supervised learning does not have.',
      ],
      [
        'Parameters vs hyperparameters',
        '**Parameters** are learned from data (weights, split thresholds). **Hyperparameters** are chosen before training (learning rate, tree depth, k in k-NN). Tuning hyperparameters on the test set is a subtle form of leakage.',
      ],
    ],
    definitions: [
      ['Parameter', 'A value learned during training, such as a regression coefficient or neural network weight.'],
      ['Hyperparameter', 'A configuration value set before training, such as learning rate or number of neighbours.'],
      ['Generalisation', 'Performance on data the model has not seen during training.'],
      ['Label', 'The target output provided in supervised training data.'],
    ],
    principles: [
      'Optimising training error is not the goal — generalisation is',
      'Any decision made using test data invalidates the test estimate',
      'Start with the simplest model that could plausibly work',
    ],
    visuals: [
      {
        kind: 'flow',
        title: 'The supervised learning loop',
        steps: ['Collect data', 'Split train/val/test', 'Choose hypothesis class', 'Fit parameters', 'Evaluate on validation', 'Tune hyperparameters', 'Report on test'],
        caption: 'Test data is touched exactly once, at the end.',
      },
    ],
    examples: [
      {
        level: 'beginner',
        title: 'House price prediction',
        problem: 'Predict sale price from floor area, location, and age.',
        solution:
          'The target is continuous, so this is regression. Features are the three inputs, the label is price. Split 70/15/15. Fit linear regression, evaluate mean absolute error on validation, select a model, then report the test error once.',
      },
      {
        level: 'practical',
        title: 'Diagnosing a pipeline',
        problem: 'A model has 99% training accuracy and 61% test accuracy. What is happening and what do you check first?',
        solution:
          'This is classic overfitting or leakage. First verify the split is not leaking (duplicate rows across splits, target-derived features). Then check model capacity, add regularisation, and increase data. Only after ruling out leakage should you assume genuine overfitting.',
      },
      {
        level: 'advanced',
        title: 'Choosing a paradigm',
        problem: 'You must segment customers and you have no labels. Which paradigm, and how do you validate?',
        solution:
          'Unsupervised clustering. Validation cannot use accuracy; use silhouette score, cluster stability under resampling, and business-level inspection of segment meaning. If a downstream labelled objective exists, evaluate clusters by their usefulness as features.',
      },
    ],
    applications: [
      { title: 'Recommendation ranking', description: 'Supervised ranking models predict engagement, unsupervised methods build embeddings for cold-start similarity.', industry: 'E-commerce' },
      { title: 'Predictive maintenance', description: 'Sensor regression predicts remaining useful life; anomaly detection flags unseen failure modes.', industry: 'Manufacturing' },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'Which task is regression rather than classification?',
        options: ['Predicting whether an email is spam', 'Predicting tomorrow\u2019s temperature', 'Predicting a species of flower', 'Predicting a customer churn flag'],
        answer: '1',
        explanation: 'Temperature is continuous, so the target is numeric — that is regression. The others produce discrete class labels.',
        difficulty: 'beginner',
      },
      {
        type: 'truefalse',
        prompt: 'Tuning hyperparameters repeatedly on the test set gives an unbiased estimate of generalisation.',
        answer: false,
        explanation: 'Each evaluation on the test set leaks information into your decisions. Use a validation set or cross-validation, and reserve the test set for a single final estimate.',
        difficulty: 'intermediate',
      },
      {
        type: 'short',
        prompt: 'In one or two sentences, explain why a separate test set is needed.',
        answer: 'validation|unseen|unbiased|overfit|generalisation',
        explanation: 'The test set estimates performance on truly unseen data. Any data used during model selection is optimistic, so a held-out set keeps the final estimate honest.',
        difficulty: 'intermediate',
      },
    ],
    prerequisites: ['linear-algebra', 'probability'],
    related: ['regression', 'classification', 'model-evaluation'],
    extensions: ['deep-learning', 'reinforcement-learning'],
    contrasts: ['statistics'],
  },
  {
    id: 'linear-algebra',
    title: 'Linear Algebra',
    parentId: 'ml-root',
    type: 'subject',
    difficulty: 'intermediate',
    summary: 'Vectors, matrices, dot products, and eigen-decomposition — the language in which models are written.',
    minutes: 20,
    importance: 'Every model is a matrix computation. Without this, regression and PCA are memorised formulas rather than ideas.',
    objectives: [
      'Compute dot products and interpret them geometrically',
      'Explain what a matrix multiplication does to a vector space',
      'Interpret eigenvalues and eigenvectors for covariance matrices',
    ],
    theory: [
      [
        'Vectors as points and directions',
        'A vector is both a point in space and a direction with magnitude. The **dot product** a·b = Σ aᵢbᵢ measures alignment: it is |a||b|cos θ. Two vectors are orthogonal exactly when their dot product is zero.',
      ],
      [
        'Matrices as transformations',
        'Multiplying by a matrix maps vectors to new vectors. It can rotate, scale, shear, or project. The shape of that transformation is captured by the **singular value decomposition**: any matrix is a rotation, a scaling along axes, and another rotation.',
      ],
      [
        'Eigenvalues and eigenvectors',
        'An eigenvector v of A satisfies Av = λv: the transformation only stretches it, by factor λ. For a covariance matrix, eigenvectors are the directions of maximum variance and eigenvalues are the variances along them. This is precisely what PCA extracts.',
      ],
      [
        'Norms and distances',
        'The L2 norm ‖x‖₂ = √(Σxᵢ²) is Euclidean length. L1 and L∞ norms appear in regularisation and robustness discussions. Distance functions built on norms define what "similar" means for k-NN and clustering.',
      ],
    ],
    definitions: [
      ['Dot product', 'Scalar Σ aᵢbᵢ measuring alignment between two vectors.'],
      ['Orthogonal', 'Perpendicular; dot product equals zero.'],
      ['Eigenvector', 'A vector whose direction is unchanged by a linear transformation.'],
      ['Rank', 'The number of linearly independent columns of a matrix.'],
    ],
    principles: [
      'Linear models are dot products plus a bias',
      'Variance directions are eigenvector directions of the covariance matrix',
      'High-dimensional geometry is counterintuitive — distances concentrate',
    ],
    formulas: [
      {
        name: 'Dot product',
        expression: 'a · b = Σᵢ aᵢ bᵢ = ‖a‖‖b‖ cos θ',
        variables: [
          ['aᵢ, bᵢ', 'components of the two vectors'],
          ['θ', 'angle between them'],
        ],
        example: 'a = (1,2,3), b = (4,5,6): a·b = 4 + 10 + 18 = 32.',
        whenToUse: 'Similarity scoring, linear model predictions, projections.',
        mistakes: ['Confusing dot product with element-wise product', 'Forgetting that dot product is unbounded — normalise for cosine similarity'],
      },
      {
        name: 'Eigen equation',
        expression: 'A v = λ v',
        variables: [
          ['A', 'square matrix (e.g. covariance)'],
          ['v', 'eigenvector'],
          ['λ', 'eigenvalue'],
        ],
        derivation: 'Solve det(A − λI) = 0 for λ, then solve (A − λI)v = 0 for each λ.',
        example: 'For A = [[2,1],[1,2]], eigenvalues are 3 and 1 with eigenvectors (1,1) and (1,−1).',
        whenToUse: 'PCA, spectral clustering, stability analysis.',
        mistakes: ['Eigenvalues of a non-symmetric matrix can be complex', 'Eigenvectors are only defined up to scale'],
      },
    ],
    visuals: [
      {
        kind: 'matrix',
        title: 'Covariance matrix of two correlated features',
        matrix: { rows: ['x₁', 'x₂'], cols: ['x₁', 'x₂'], values: [[1, 0.8], [0.8, 1]] },
        caption: 'Off-diagonal entry 0.8 means the features share most of their variance — a candidate for dimensionality reduction.',
      },
    ],
    examples: [
      {
        level: 'beginner',
        title: 'Cosine similarity of two documents',
        problem: 'Compare bag-of-words vectors (1,1,0) and (1,0,1).',
        solution: 'Dot = 1. ‖a‖=√2, ‖b‖=√2. cos θ = 1/2, so θ = 60°. They share one term out of three.',
      },
      {
        level: 'practical',
        title: 'Why feature scaling matters',
        problem: 'Features in metres (0–5) and grams (0–5000) are fed to k-NN. What goes wrong?',
        solution:
          'Euclidean distance is dominated by the gram feature: its variance is ~10⁶ times larger, so the metre feature contributes nothing. Standardise features before distance-based methods.',
      },
      {
        level: 'advanced',
        title: 'Low-rank approximation',
        problem: 'A 1000×1000 user–item matrix has rank 20. What does that imply?',
        solution:
          'Only 20 independent factors drive the data, so a rank-20 SVD reconstructs it exactly. Truncating to rank 20 is lossless compression and is the basis of latent-factor recommenders.',
      },
    ],
    applications: [
      { title: 'Embedding search', description: 'Vector databases retrieve nearest neighbours by cosine similarity over learned embeddings.', industry: 'Search' },
      { title: 'Recommender systems', description: 'Matrix factorisation decomposes user–item interactions into latent factors.', industry: 'Media' },
    ],
    questions: [
      {
        type: 'numeric',
        prompt: 'Compute the dot product of (2, −1, 3) and (1, 4, 2).',
        answer: 4,
        tolerance: 0.001,
        explanation: '2·1 + (−1)·4 + 3·2 = 2 − 4 + 6 = 4.',
        difficulty: 'beginner',
      },
      {
        type: 'mcq',
        prompt: 'The eigenvectors of a covariance matrix give:',
        options: ['The mean of each feature', 'The directions of maximum variance', 'The number of samples', 'The correlation of the target'],
        answer: '1',
        explanation: 'Covariance eigenvectors are the principal directions; eigenvalues are the variance along each direction.',
        difficulty: 'intermediate',
      },
      {
        type: 'multi',
        prompt: 'Which operations require feature scaling to behave well? Select all that apply.',
        options: ['k-Nearest Neighbours', 'k-Means clustering', 'Gradient descent on raw features', 'Decision tree splits'],
        answer: ['0', '1', '2'],
        explanation: 'Distance- and gradient-based methods are scale sensitive. Decision trees split on thresholds per feature and are invariant to monotone rescaling.',
        difficulty: 'advanced',
      },
    ],
    prerequisites: [],
    related: ['probability', 'pca', 'linear-regression'],
    extensions: ['neural-networks'],
    crossSubject: ['physics', 'computer-graphics'],
  },
  {
    id: 'probability',
    title: 'Probability',
    parentId: 'ml-root',
    type: 'subject',
    difficulty: 'intermediate',
    summary: 'Random variables, distributions, conditional probability, Bayes\u2019 rule, and expectation — the logic of uncertainty in models.',
    minutes: 22,
    objectives: [
      'Apply Bayes\u2019 rule to invert a conditional probability',
      'Distinguish marginal, joint, and conditional distributions',
      'Explain maximum likelihood estimation intuitively',
    ],
    theory: [
      [
        'Random variables and distributions',
        'A random variable maps outcomes to numbers. A **discrete** variable has a probability mass function; a **continuous** one has a density. The Bernoulli, binomial, categorical, Gaussian, and Poisson distributions cover most introductory modelling.',
      ],
      [
        'Conditional probability',
        'P(A|B) = P(A ∩ B) / P(B) restricts the sample space to B. Independence means P(A|B) = P(A). Most modelling assumptions are statements about conditional independence.',
      ],
      [
        'Bayes\u2019 rule',
        'P(θ|D) ∝ P(D|θ)P(θ). The posterior is proportional to likelihood times prior. This is the engine behind Naive Bayes, Bayesian optimisation, and probabilistic inference generally.',
      ],
      [
        'Expectation and variance',
        'E[X] is the long-run average; Var(X) = E[(X − E[X])²] measures spread. Linearity of expectation, E[X+Y] = E[X] + E[Y], holds even when variables are dependent — a remarkably useful fact.',
      ],
      [
        'Maximum likelihood',
        'Choose parameters that make the observed data most probable: θ̂ = argmax log P(D|θ). For a Gaussian, this recovers the sample mean and variance; for classification with cross-entropy, it recovers logistic regression.',
      ],
    ],
    definitions: [
      ['Prior', 'Distribution over parameters before observing data.'],
      ['Likelihood', 'Probability of the observed data as a function of parameters.'],
      ['Posterior', 'Updated distribution over parameters after observing data.'],
      ['i.i.d.', 'Independent and identically distributed — the standard sampling assumption.'],
    ],
    principles: [
      'Conditioning changes the sample space, not the underlying randomness',
      'Correlation is not causation but dependence is a modelling claim',
      'Log-likelihoods turn products into sums — always work in log space',
    ],
    formulas: [
      {
        name: 'Bayes\u2019 rule',
        expression: 'P(A|B) = P(B|A) P(A) / P(B)',
        variables: [
          ['P(A)', 'prior probability of A'],
          ['P(B|A)', 'likelihood of evidence given A'],
          ['P(B)', 'marginal probability of the evidence'],
        ],
        example: 'A disease affects 1% of people. A test is 99% sensitive and 5% false-positive. P(disease|positive) = 0.99·0.01 / (0.99·0.01 + 0.05·0.99) ≈ 0.167 — only 16.7%.',
        whenToUse: 'Diagnosis, spam filtering, any base-rate inversion.',
        mistakes: ['Ignoring the base rate', 'Confusing P(A|B) with P(B|A)'],
      },
      {
        name: 'Variance',
        expression: 'Var(X) = E[X²] − (E[X])²',
        variables: [
          ['E[X]', 'expected value'],
          ['E[X²]', 'second moment'],
        ],
        whenToUse: 'Quantifying spread, deriving bias–variance decomposition.',
      },
    ],
    visuals: [
      {
        kind: 'bars',
        title: 'Base-rate effect on a positive test result',
        values: [['True positives', 9.9], ['False positives', 49.5]],
        caption: 'With a 1% prevalence, false positives vastly outnumber true positives even at 99% sensitivity.',
      },
    ],
    examples: [
      {
        level: 'beginner',
        title: 'Two dice',
        problem: 'What is the probability the sum of two fair dice is 7?',
        solution: 'There are 36 equally likely outcomes; six produce 7: (1,6)…(6,1). Probability 6/36 = 1/6 ≈ 0.167.',
      },
      {
        level: 'practical',
        title: 'Naive Bayes classification',
        problem: 'Why is it called naive?',
        solution:
          'It assumes features are conditionally independent given the class, so P(x₁…xₙ|y) factorises into a product. This assumption is usually false, yet the classifier often works because the argmax decision is robust to miscalibrated probabilities.',
      },
      {
        level: 'advanced',
        title: 'Variance of a sum',
        problem: 'X and Y each have variance 1 and correlation ρ. Find Var(X + Y).',
        solution: 'Var(X+Y) = Var(X) + Var(Y) + 2Cov(X,Y) = 1 + 1 + 2ρ = 2 + 2ρ. Independence (ρ=0) gives 2; perfect correlation gives 4.',
      },
    ],
    applications: [
      { title: 'Medical screening', description: 'Base rates dominate the interpretation of diagnostic tests.', industry: 'Healthcare' },
      { title: 'Spam filtering', description: 'Naive Bayes over token counts remains a strong baseline.', industry: 'Email' },
    ],
    questions: [
      {
        type: 'numeric',
        prompt: 'A fair coin is flipped 3 times. What is the probability of exactly 2 heads? (decimal, 3 places)',
        answer: 0.375,
        tolerance: 0.005,
        explanation: 'C(3,2)/8 = 3/8 = 0.375.',
        difficulty: 'beginner',
      },
      {
        type: 'mcq',
        prompt: 'P(A)=0.3, P(B)=0.5, P(A∩B)=0.15. What is P(A|B)?',
        options: ['0.15', '0.3', '0.5', '0.45'],
        answer: '1',
        explanation: 'P(A|B) = P(A∩B)/P(B) = 0.15/0.5 = 0.3. A and B are independent.',
        difficulty: 'intermediate',
      },
      {
        type: 'short',
        prompt: 'State Bayes\u2019 rule and say in one sentence why it matters for models.',
        answer: 'likelihood|prior|posterior|invert|update',
        explanation: 'P(θ|D) ∝ P(D|θ)P(θ). It lets us invert a conditional to update beliefs about parameters given evidence — the basis of Bayesian inference.',
        difficulty: 'advanced',
      },
    ],
    prerequisites: ['linear-algebra'],
    related: ['statistics', 'naive-bayes', 'loss-functions'],
    extensions: ['reinforcement-learning', 'bayesian-optimisation'],
  },
  {
    id: 'statistics',
    title: 'Statistics',
    parentId: 'ml-root',
    type: 'subject',
    difficulty: 'intermediate',
    summary: 'Estimation, sampling distributions, hypothesis testing, and the bias–variance tradeoff viewed statistically.',
    minutes: 18,
    objectives: [
      'Explain what a sampling distribution is',
      'Distinguish a population parameter from a sample estimate',
      'Interpret a confidence interval correctly',
    ],
    theory: [
      [
        'Populations and samples',
        'We observe a sample and want to infer properties of the population. An **estimator** is a function of the sample; its realised value is an **estimate**. The sampling distribution describes how the estimator varies across hypothetical repeated samples.',
      ],
      [
        'Bias and variance of estimators',
        'Bias is E[θ̂] − θ; variance is spread of θ̂ around its mean. Mean squared error decomposes as bias² + variance. The sample mean is unbiased; the sample variance uses n−1 to correct its bias.',
      ],
      [
        'Law of large numbers and CLT',
        'Averages converge to the expectation (LLN), and the distribution of the sample mean approaches a Gaussian with standard error σ/√n (central limit theorem). This is why so many procedures rely on normality asymptotically.',
      ],
      [
        'Hypothesis testing',
        'A p-value is the probability of data at least as extreme as observed, assuming the null hypothesis. It is not the probability that the null is true. Multiple comparisons inflate false positives, which is why correction matters in high-dimensional analysis.',
      ],
    ],
    definitions: [
      ['Estimator', 'A rule for computing a guess about a population parameter from a sample.'],
      ['Standard error', 'The standard deviation of an estimator\u2019s sampling distribution.'],
      ['p-value', 'Probability of observing data at least as extreme under the null hypothesis.'],
      ['Consistency', 'An estimator converges to the true parameter as sample size grows.'],
    ],
    principles: [
      'Every statistic has a sampling distribution',
      'More data reduces variance, not necessarily bias',
      'Report uncertainty, not just point estimates',
    ],
    formulas: [
      {
        name: 'Standard error of the mean',
        expression: 'SE = σ / √n',
        variables: [
          ['σ', 'population standard deviation'],
          ['n', 'sample size'],
        ],
        example: 'σ = 10, n = 100 → SE = 1. To halve SE you need 4× the data.',
        whenToUse: 'Confidence intervals, comparing group means.',
      },
      {
        name: 'MSE decomposition',
        expression: 'MSE(θ̂) = Bias(θ̂)² + Var(θ̂)',
        variables: [
          ['Bias', 'E[θ̂] − θ'],
          ['Var', 'spread of the estimator'],
        ],
        whenToUse: 'Understanding why a slightly biased estimator can beat an unbiased one.',
      },
    ],
    examples: [
      {
        level: 'beginner',
        title: 'Sample vs population mean',
        problem: 'Heights of 10 sampled people average 172 cm. What can you claim?',
        solution:
          'You estimate the population mean at 172 cm, with uncertainty SE = s/√10. You cannot claim the population mean is exactly 172 — only that it is plausible within a confidence interval.',
      },
      {
        level: 'practical',
        title: 'Why n−1?',
        problem: 'Explain the denominator in the sample variance.',
        solution:
          'Deviations are taken from the sample mean, which is itself estimated, consuming one degree of freedom. Dividing by n−1 makes the estimator unbiased for σ².',
      },
      {
        level: 'advanced',
        title: 'Multiple testing',
        problem: 'You test 1000 features at α=0.05 and find 60 significant. How many are expected by chance?',
        solution:
          'About 50 false positives are expected under the global null (1000 × 0.05). Only ~10 of the 60 are plausibly real without correction. Use Benjamini–Hochberg to control the false discovery rate.',
      },
    ],
    applications: [
      { title: 'A/B testing', description: 'Experiments compare conversion rates with confidence intervals and sequential monitoring.', industry: 'Product' },
      { title: 'Clinical trials', description: 'Pre-registered hypotheses and multiplicity control protect against false claims.', industry: 'Pharma' },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'Quadrupling sample size changes the standard error by a factor of:',
        options: ['4', '2', '1/2', '1/4'],
        answer: '2',
        explanation: 'SE ∝ 1/√n. Going from n to 4n multiplies SE by 1/√4 = 1/2 — so SE halves, i.e. the factor by which it changes is 1/2. The correct option describing the multiplier on SE is 1/2.',
        difficulty: 'intermediate',
      },
      {
        type: 'truefalse',
        prompt: 'A p-value of 0.03 means there is a 3% chance the null hypothesis is true.',
        answer: false,
        explanation: 'It means that if the null were true, 3% of experiments would produce data this extreme. It says nothing directly about the probability of the null.',
        difficulty: 'advanced',
      },
      {
        type: 'numeric',
        prompt: 'A sample of 25 has standard deviation 15. What is the standard error? (1 decimal)',
        answer: 3,
        tolerance: 0.05,
        explanation: 'SE = 15/√25 = 15/5 = 3.',
        difficulty: 'beginner',
      },
    ],
    prerequisites: ['probability'],
    related: ['model-evaluation', 'bias-variance', 'cross-validation'],
    extensions: ['causal-inference'],
  },
  {
    id: 'calculus',
    title: 'Calculus & Optimization',
    parentId: 'ml-root',
    type: 'subject',
    difficulty: 'intermediate',
    summary: 'Derivatives, gradients, the chain rule, convexity, and how these become gradient descent.',
    minutes: 16,
    objectives: [
      'Compute a gradient of a multivariate loss',
      'Apply the chain rule through a composition',
      'Identify convex versus non-convex objectives',
    ],
    theory: [
      [
        'Derivatives as sensitivity',
        'The derivative measures how the output changes per unit change in input. In learning, it tells us which direction to move parameters to reduce loss.',
      ],
      [
        'Gradients',
        'For a scalar function of many variables, the gradient ∇f is the vector of partial derivatives. It points in the direction of steepest ascent, so descending means moving against it.',
      ],
      [
        'The chain rule',
        'For composed functions, df/dx = df/dg · dg/dx. Backpropagation is the chain rule applied systematically to a computation graph, reusing intermediate derivatives.',
      ],
      [
        'Convexity',
        'A convex function has a single global minimum and any local descent reaches it. Linear and logistic regression with appropriate loss are convex; neural networks are not, so initialisation and schedule matter.',
      ],
    ],
    definitions: [
      ['Gradient', 'Vector of partial derivatives pointing toward steepest increase.'],
      ['Learning rate', 'Step size multiplier applied to the gradient.'],
      ['Convex function', 'A function whose graph lies below any chord between two points.'],
      ['Saddle point', 'A stationary point that is a minimum along some directions and a maximum along others.'],
    ],
    principles: [
      'Gradients give direction, not step size',
      'Non-convexity means initialisation is part of the model',
      'Every differentiable pipeline can be differentiated end to end',
    ],
    formulas: [
      {
        name: 'Gradient descent update',
        expression: 'θ ← θ − η ∇L(θ)',
        variables: [
          ['θ', 'parameters'],
          ['η', 'learning rate'],
          ['∇L', 'gradient of the loss'],
        ],
        example: 'L(θ)=θ², ∇L=2θ, θ₀=4, η=0.1 → θ₁ = 4 − 0.1·8 = 3.2.',
        whenToUse: 'Fitting any differentiable model at scale.',
        mistakes: ['Learning rate too large causes divergence', 'Forgetting to average gradients over a batch'],
      },
      {
        name: 'Chain rule',
        expression: 'd/dx f(g(x)) = f′(g(x)) · g′(x)',
        variables: [
          ['f', 'outer function'],
          ['g', 'inner function'],
        ],
        whenToUse: 'Backpropagation, deriving gradients of composed losses.',
      },
    ],
    visuals: [
      {
        kind: 'curve',
        title: 'Gradient descent on a convex loss',
        values: [['θ = 4.0', 16], ['θ = 3.2', 10.24], ['θ = 2.56', 6.55], ['θ = 2.05', 4.19], ['θ = 1.64', 2.68], ['θ = 1.31', 1.72], ['θ = 1.05', 1.10]],
        caption: 'Each step moves against the gradient by η; the loss falls geometrically toward the minimum at 0.',
      },
    ],
    examples: [
      {
        level: 'beginner',
        title: 'Derivative of a quadratic',
        problem: 'Find d/dx (3x² − 5x + 2).',
        solution: '6x − 5. Set to zero: x = 5/6 is the minimum.',
      },
      {
        level: 'practical',
        title: 'Gradient of squared error',
        problem: 'L(w) = (y − wx)². Find dL/dw.',
        solution: 'Let r = y − wx. dL/dw = 2r · (−x) = −2x(y − wx). This is exactly the per-sample gradient used in linear regression.',
      },
      {
        level: 'advanced',
        title: 'Vanishing gradients',
        problem: 'A deep sigmoid network trains slowly in early layers. Why?',
        solution:
          'Sigmoid derivative is at most 0.25, so a product of L such factors decays like 0.25^L. Early-layer gradients vanish. ReLU activations, residual connections, and normalisation mitigate this.',
      },
    ],
    applications: [
      { title: 'Neural network training', description: 'Backpropagation computes gradients through millions of parameters.', industry: 'AI' },
      { title: 'Resource allocation', description: 'Constrained optimisation schedules compute and budget across fleets.', industry: 'Cloud' },
    ],
    questions: [
      {
        type: 'numeric',
        prompt: 'If L(θ) = θ² and θ = 3, what is dL/dθ?',
        answer: 6,
        tolerance: 0.001,
        explanation: 'd/dθ θ² = 2θ = 6.',
        difficulty: 'beginner',
      },
      {
        type: 'mcq',
        prompt: 'A gradient descent step with too large a learning rate typically causes:',
        options: ['Slower but stable convergence', 'Divergence or oscillation', 'Exact convergence in one step', 'No change in loss'],
        answer: '1',
        explanation: 'Overshooting the minimum repeatedly increases loss; the iteration diverges or oscillates.',
        difficulty: 'intermediate',
      },
      {
        type: 'short',
        prompt: 'Why does backpropagation reuse intermediate values?',
        answer: 'chain rule|reuse|efficiency|computation graph|dynamic programming',
        explanation: 'The chain rule factors a derivative into products of local derivatives. Caching forward activations lets each local term be computed once, making the backward pass roughly as cheap as the forward pass.',
        difficulty: 'advanced',
      },
    ],
    prerequisites: ['linear-algebra'],
    related: ['gradient-descent', 'optimization', 'loss-functions'],
    extensions: ['deep-learning'],
  },
  {
    id: 'reinforcement-learning',
    title: 'Reinforcement Learning',
    parentId: 'ml-root',
    type: 'subject',
    difficulty: 'advanced',
    summary: 'Agents, states, actions, rewards, and the exploration–exploitation dilemma.',
    minutes: 20,
    objectives: [
      'Describe the Markov decision process formalism',
      'Explain the exploration–exploitation tradeoff',
      'Distinguish value-based from policy-based learning',
    ],
    theory: [
      [
        'The MDP formalism',
        'An MDP is (S, A, P, R, γ): states, actions, transition probabilities, rewards, and a discount factor. The agent chooses actions to maximise expected discounted return G = Σ γᵗ rₜ.',
      ],
      [
        'Value functions',
        'V(s) is expected return from state s under a policy. Q(s,a) conditions on the first action. The Bellman equations relate values recursively, which is what makes learning tractable.',
      ],
      [
        'Exploration vs exploitation',
        'Greedy action selection can lock in a mediocre policy. ε-greedy, optimism, and Thompson sampling inject exploration. The cost of exploration is regret.',
      ],
      [
        'Policy gradients',
        'Instead of estimating values, directly parameterise the policy and ascend the expected return gradient. This handles continuous actions naturally but has higher variance, mitigated by baselines and advantage estimates.',
      ],
    ],
    definitions: [
      ['Policy', 'A mapping from states to action probabilities.'],
      ['Return', 'Discounted sum of future rewards.'],
      ['Regret', 'Cumulative loss relative to the best possible policy.'],
      ['Discount factor γ', 'Weight on future rewards, between 0 and 1.'],
    ],
    principles: [
      'Delayed reward makes credit assignment hard',
      'Exploration is a cost paid for information',
      'Reward design is the specification — and the failure mode',
    ],
    formulas: [
      {
        name: 'Bellman expectation',
        expression: 'V^π(s) = Σ_a π(a|s) Σ_{s′} P(s′|s,a)[R + γ V^π(s′)]',
        variables: [
          ['π', 'policy'],
          ['P', 'transition probability'],
          ['γ', 'discount factor'],
        ],
        whenToUse: 'Policy evaluation, deriving TD updates.',
      },
    ],
    examples: [
      {
        level: 'beginner',
        title: 'Gridworld',
        problem: 'An agent moves on a 4×4 grid toward a goal with reward +1. What is the optimal policy?',
        solution: 'Value iteration converges to a field where each cell points toward the shortest path to the goal. With no step cost, all shortest paths are optimal.',
      },
      {
        level: 'practical',
        title: 'Reward hacking',
        problem: 'A boat-racing agent learns to spin in circles collecting power-ups. Diagnose.',
        solution:
          'The reward function rewarded power-ups directly, so the agent optimised the proxy, not the race. Fix by shaping rewards on progress and penalising time, or by using a sparse terminal reward.',
      },
      {
        level: 'advanced',
        title: 'High variance in policy gradients',
        problem: 'Why subtract a baseline?',
        solution:
          'The gradient estimator is unbiased for any baseline b(s) independent of the action, because Σ_a ∇π(a|s)b(s) = 0. A good baseline reduces variance without adding bias — this is the actor–critic idea.',
      },
    ],
    applications: [
      { title: 'Game playing', description: 'Self-play agents exceed human level in strategy games.', industry: 'Gaming' },
      { title: 'Robotic control', description: 'Policies learn locomotion and manipulation from simulated experience.', industry: 'Robotics' },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'The exploration–exploitation tradeoff refers to:',
        options: ['Speed vs accuracy at inference', 'Trying new actions vs using known-good actions', 'Training vs test data', 'Model size vs latency'],
        answer: '1',
        explanation: 'Exploration gathers information about uncertain actions; exploitation uses the current best estimate.',
        difficulty: 'beginner',
      },
      {
        type: 'truefalse',
        prompt: 'Q-learning is an on-policy algorithm.',
        answer: false,
        explanation: 'Q-learning is off-policy: it updates toward the greedy max over next actions regardless of the behaviour policy. SARSA is on-policy.',
        difficulty: 'advanced',
      },
    ],
    prerequisites: ['probability', 'calculus'],
    related: ['deep-learning', 'ml-intro'],
    contrasts: ['supervised-learning'],
  },
];
