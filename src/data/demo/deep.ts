import type { NodeSpec } from './types';

export const deepSpecs: NodeSpec[] = [
  {
    id: 'neural-networks',
    title: 'Neural Networks',
    parentId: 'ml-root',
    type: 'subject',
    difficulty: 'advanced',
    summary: 'Layers of weighted sums and non-linearities that learn hierarchical representations.',
    minutes: 20,
    objectives: [
      'Describe a forward pass through a dense layer',
      'Explain why non-linear activations are essential',
      'Explain backpropagation at a high level',
    ],
    theory: [
      [
        'A layer',
        'z = Wx + b, then a = φ(z). Stacking layers composes these transformations. The matrix W contains the learnable weights.',
      ],
      [
        'Why non-linearity',
        'Composing linear functions gives another linear function. Without a non-linear activation, depth collapses to a single linear map — this is why the activation function is not optional.',
      ],
      [
        'Activations',
        'ReLU max(0,z) is standard: cheap, sparse, and avoids saturating gradients. Sigmoid and tanh saturate and cause vanishing gradients in deep stacks. GELU and SiLU smooth ReLU for modern architectures.',
      ],
      [
        'Backpropagation',
        'Compute the loss, then propagate gradients backward using the chain rule, caching forward activations. Automatic differentiation frameworks do this symbolically over a computation graph.',
      ],
      [
        'Universal approximation',
        'A wide enough single hidden layer can approximate any continuous function on a compact domain. This is an existence result, not a statement about learnability from finite data.',
      ],
    ],
    definitions: [
      ['Weight', 'A learnable scalar in a layer\u2019s transformation matrix.'],
      ['Activation function', 'A non-linear elementwise function applied after a linear transform.'],
      ['Backpropagation', 'Reverse-mode automatic differentiation of the loss through the network.'],
      ['Epoch', 'One complete pass over the training set.'],
    ],
    principles: [
      'Depth builds hierarchical features',
      'Non-linearity is what makes depth meaningful',
      'Architecture encodes inductive bias',
    ],
    formulas: [
      {
        name: 'Dense layer',
        expression: 'a = φ(Wx + b)',
        variables: [
          ['W', 'weight matrix (outputs × inputs)'],
          ['x', 'input vector'],
          ['b', 'bias vector'],
          ['φ', 'activation function'],
        ],
        example: 'W = [[1,0],[0,1]], b = 0, φ = ReLU, x = (−2, 3) → a = (0, 3).',
        whenToUse: 'Any feedforward architecture.',
        mistakes: ['Forgetting the non-linearity', 'Mismatched weight dimensions'],
      },
      {
        name: 'ReLU',
        expression: 'ReLU(z) = max(0, z)',
        variables: [['z', 'pre-activation value']],
        example: 'ReLU(−1.5) = 0, ReLU(2.3) = 2.3. Derivative is 0 or 1.',
        whenToUse: 'Hidden layers of deep networks.',
        mistakes: ['Ignoring dead ReLU units caused by large negative biases'],
      },
    ],
    visuals: [
      {
        kind: 'flow',
        title: 'Feedforward pass',
        steps: ['Input x', 'Linear transform W₁x+b₁', 'ReLU', 'Linear transform W₂·h+b₂', 'Softmax', 'Probability distribution', 'Cross-entropy loss'],
      },
    ],
    examples: [
      {
        level: 'beginner',
        title: 'One neuron',
        problem: 'w = (2,−1), b = 1, x = (3,4), φ = ReLU. Compute a.',
        solution: 'z = 2·3 + (−1)·4 + 1 = 3. ReLU(3) = 3.',
      },
      {
        level: 'practical',
        title: 'Dead ReLUs',
        problem: 'Half your units output zero for every input after training. Cause and fix?',
        solution:
          'Large negative biases or a high learning rate pushed pre-activations permanently negative, so gradient is zero forever. Use LeakyReLU/GELU, lower the learning rate, or add batch normalisation.',
      },
      {
        level: 'advanced',
        title: 'Parameter counting',
        problem: 'How many parameters in a dense layer mapping 256 → 128?',
        solution: '256×128 weights + 128 biases = 32,896 parameters.',
      },
    ],
    applications: [
      { title: 'Vision', description: 'Convolutional networks power detection and segmentation.', industry: 'Imaging' },
      { title: 'Language', description: 'Transformers are deep networks with attention instead of recurrence.', industry: 'NLP' },
    ],
    questions: [
      {
        type: 'numeric',
        prompt: 'Parameters in a dense layer 10 → 10 including biases?',
        answer: 110,
        tolerance: 0.001,
        explanation: '10×10 = 100 weights plus 10 biases = 110.',
        difficulty: 'intermediate',
      },
      {
        type: 'mcq',
        prompt: 'Removing all non-linear activations from a deep network produces:',
        options: ['A deeper network with more capacity', 'An equivalent single linear layer', 'A convolutional network', 'A decision tree'],
        answer: '1',
        explanation: 'A composition of linear maps is linear, so the whole stack collapses to one affine transformation.',
        difficulty: 'beginner',
      },
      {
        type: 'short',
        prompt: 'Why does ReLU help with vanishing gradients compared to sigmoid?',
        answer: 'derivative|one|saturate|gradient|positive',
        explanation: 'ReLU has derivative exactly 1 for positive inputs, so gradients do not shrink multiplicatively through depth. Sigmoid\u2019s derivative is at most 0.25 and saturates near zero.',
        difficulty: 'advanced',
      },
    ],
    prerequisites: ['linear-algebra', 'calculus', 'logistic-regression'],
    related: ['deep-learning', 'gradient-descent', 'loss-functions', 'regularization'],
    extensions: ['cnn', 'transformers'],
  },
  {
    id: 'deep-learning',
    title: 'Deep Learning',
    parentId: 'neural-networks',
    type: 'topic',
    difficulty: 'advanced',
    summary: 'Many-layered networks, the training tricks that make them work, and the architectures that dominate modern AI.',
    minutes: 18,
    objectives: [
      'Explain why depth enables hierarchical features',
      'Describe batch normalisation and residual connections',
      'Recognise architecture families and their inductive biases',
    ],
    theory: [
      [
        'Why depth',
        'Early layers detect edges, middle layers compose parts, late layers represent objects. Depth creates a feature hierarchy that shallow models must approximate with enormous width.',
      ],
      [
        'Training deep networks',
        'Normalisation (batch/layer) stabilises activations, residual connections give gradients a short path to early layers, and careful initialisation (He/Xavier) keeps variances stable.',
      ],
      [
        'Architecture families',
        'CNNs encode translation equivariance for grids. RNNs encode sequential order. Transformers encode content-based routing via attention and scale better than recurrence.',
      ],
      [
        'The cost',
        'Deep learning needs substantial data and compute. For small tabular datasets, gradient-boosted trees usually win.',
      ],
    ],
    principles: [
      'Architecture should match the structure of the data',
      'Normalisation and residual paths are what made depth trainable',
      'Bigger is not automatically better — data quality dominates',
    ],
    examples: [
      {
        level: 'practical',
        title: 'Choosing an architecture',
        problem: 'You have 4,000 tabular rows and 30 features. Deep learning?',
        solution:
          'Unlikely to beat gradient boosting. Neural nets need more data to exploit their flexibility. Start with boosted trees and only move on if a clear ceiling appears.',
      },
      {
        level: 'advanced',
        title: 'Residual connections',
        problem: 'Why does y = x + F(x) help very deep networks?',
        solution:
          'The identity path lets gradients flow backward without passing through every weight matrix, mitigating vanishing gradients, and makes it easy for layers to learn near-identity mappings.',
      },
    ],
    applications: [
      { title: 'Foundation models', description: 'Large pretrained transformers serve as general-purpose representation engines.', industry: 'AI' },
      { title: 'Medical imaging', description: 'CNNs detect pathology in radiology scans.', industry: 'Healthcare' },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'Residual connections primarily help by:',
        options: ['Increasing parameter count', 'Providing a short gradient path', 'Removing the need for activations', 'Replacing normalisation'],
        answer: '1',
        explanation: 'The identity shortcut carries gradients directly to earlier layers, making very deep optimisation feasible.',
        difficulty: 'advanced',
      },
      {
        type: 'truefalse',
        prompt: 'Deep learning usually outperforms gradient boosting on small tabular datasets.',
        answer: false,
        explanation: 'On small tabular data, boosted trees typically match or exceed neural networks with far less tuning.',
        difficulty: 'intermediate',
      },
    ],
    prerequisites: ['neural-networks'],
    related: ['cnn', 'transformers', 'overfitting', 'regularization'],
  },
  {
    id: 'cnn',
    title: 'Convolutional Networks',
    parentId: 'deep-learning',
    type: 'advanced',
    difficulty: 'advanced',
    summary: 'Weight-shared local filters that exploit spatial structure in images and signals.',
    minutes: 14,
    objectives: ['Explain convolution and weight sharing', 'Compute output dimensions', 'Explain pooling'],
    theory: [
      [
        'Local receptive fields',
        'A filter slides over the input computing dot products. Because the same filter is reused at every position, parameters are shared and translation equivariance is built in.',
      ],
      [
        'Output size',
        'For input size n, kernel k, padding p, stride s: out = ⌊(n + 2p − k)/s⌋ + 1.',
      ],
      [
        'Pooling',
        'Max pooling downsamples by taking the maximum in each window, adding translation invariance and reducing computation.',
      ],
    ],
    formulas: [
      {
        name: 'Convolution output size',
        expression: 'out = ⌊(n + 2p − k)/s⌋ + 1',
        variables: [
          ['n', 'input width/height'],
          ['k', 'kernel size'],
          ['p', 'padding'],
          ['s', 'stride'],
        ],
        example: 'n=32, k=3, p=1, s=1 → (32+2−3)/1 + 1 = 32 (same padding).',
        whenToUse: 'Designing CNN architectures.',
        mistakes: ['Forgetting padding doubles before dividing', 'Non-integer output from mismatched stride'],
      },
    ],
    examples: [
      {
        level: 'practical',
        title: 'Parameter efficiency',
        problem: 'Compare a fully connected layer and a conv layer on 224×224×3 input with 64 filters.',
        solution:
          'Fully connected: 224·224·3·64 ≈ 9.6M parameters. A 3×3 conv with 64 filters: 3·3·3·64 = 1,728 parameters. Weight sharing is a 5000× reduction.',
      },
    ],
    questions: [
      {
        type: 'numeric',
        prompt: 'Input 28, kernel 5, padding 0, stride 1. Output size?',
        answer: 24,
        tolerance: 0.001,
        explanation: '(28 + 0 − 5)/1 + 1 = 24.',
        difficulty: 'intermediate',
      },
    ],
    prerequisites: ['deep-learning', 'linear-algebra'],
    related: ['transformers', 'feature-engineering'],
  },
  {
    id: 'transformers',
    title: 'Transformers & Attention',
    parentId: 'cnn',
    type: 'advanced',
    difficulty: 'expert',
    summary: 'Self-attention lets every position attend to every other, enabling parallel sequence modelling at scale.',
    minutes: 18,
    objectives: ['Explain scaled dot-product attention', 'Describe why attention parallelises better than recurrence', 'Explain positional encoding'],
    theory: [
      [
        'Self-attention',
        'Each token produces a query, key, and value. Attention weights are softmax(QKᵀ/√d) and the output is a weighted sum of values. Every token can see every other token in one step.',
      ],
      [
        'Multi-head',
        'Several attention heads run in parallel on projected subspaces, letting the model attend to different relationship types simultaneously.',
      ],
      [
        'Parallelism',
        'Unlike RNNs, attention has no sequential dependency across positions, so the whole sequence is processed at once — which is why transformers scale so well on modern hardware.',
      ],
      [
        'Positional information',
        'Attention is permutation invariant, so position must be injected via learned or sinusoidal encodings, or relative position biases.',
      ],
    ],
    principles: [
      'Attention is a differentiable lookup',
      'Scaling by √d keeps logits in a stable range',
      'Compute cost grows quadratically with sequence length',
    ],
    formulas: [
      {
        name: 'Scaled dot-product attention',
        expression: 'Attention(Q,K,V) = softmax(QKᵀ/√d_k) V',
        variables: [
          ['Q', 'query matrix'],
          ['K', 'key matrix'],
          ['V', 'value matrix'],
          ['d_k', 'key dimension'],
        ],
        example: 'With d_k=64, divide logits by 8 before softmax to avoid saturation.',
        whenToUse: 'Any attention-based architecture.',
        mistakes: ['Omitting the √d_k scaling', 'Applying a causal mask incorrectly during training'],
      },
    ],
    examples: [
      {
        level: 'advanced',
        title: 'Why the scaling factor',
        problem: 'If q and k have unit variance components, what is the variance of q·k?',
        solution:
          'Each product has variance 1 and there are d_k terms, so the dot product has variance d_k and standard deviation √d_k. Dividing by √d_k normalises it, preventing softmax saturation.',
      },
    ],
    applications: [
      { title: 'Language models', description: 'Decoder-only transformers generate text token by token.', industry: 'AI' },
      { title: 'Protein folding', description: 'Attention over residue pairs predicts structure.', industry: 'Biotech' },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'The √d_k scaling in attention prevents:',
        options: ['Overfitting', 'Softmax saturation from large logits', 'Vanishing positional encodings', 'Excessive memory use'],
        answer: '1',
        explanation: 'Large logits push softmax into saturated regions with tiny gradients; scaling keeps variance near 1.',
        difficulty: 'advanced',
      },
      {
        type: 'truefalse',
        prompt: 'Self-attention is inherently order-aware without positional encodings.',
        answer: false,
        explanation: 'Attention is permutation equivariant; position information must be added explicitly.',
        difficulty: 'expert',
      },
    ],
    prerequisites: ['deep-learning', 'linear-algebra'],
    related: ['cnn', 'embeddings'],
  },
  {
    id: 'embeddings',
    title: 'Embeddings',
    parentId: 'neural-networks',
    type: 'advanced',
    difficulty: 'advanced',
    summary: 'Dense vectors where geometric proximity encodes semantic similarity.',
    minutes: 12,
    objectives: ['Explain the embedding lookup', 'Describe contrastive training', 'Explain why cosine similarity is standard'],
    theory: [
      [
        'Lookup as a linear layer',
        'An embedding table is a matrix of size vocabulary × dimension; lookup is selecting a row, which is equivalent to a one-hot matrix multiply.',
      ],
      [
        'Training signal',
        'Word2vec predicts context from a word (or vice versa). Modern embedding models use contrastive objectives: pull matched pairs together, push mismatched pairs apart.',
      ],
      [
        'Properties',
        'Semantic arithmetic emerges — vector("king") − vector("man") + vector("woman") lands near vector("queen"). This reflects distributional structure, not symbolic reasoning.',
      ],
    ],
    formulas: [
      {
        name: 'Cosine similarity',
        expression: 'cos(a,b) = (a·b) / (‖a‖‖b‖)',
        variables: [
          ['a·b', 'dot product'],
          ['‖a‖', 'L2 norm'],
        ],
        example: 'a=(1,0), b=(0.7,0.7) → cos = 0.7/0.99 ≈ 0.707, an angle of 45°.',
        whenToUse: 'Comparing embeddings where magnitude is uninformative.',
      },
    ],
    examples: [
      {
        level: 'practical',
        title: 'Semantic search',
        problem: 'Why does embedding search beat keyword search for paraphrases?',
        solution:
          'Embeddings place paraphrases near each other even with no shared tokens, whereas keyword matching requires lexical overlap. Hybrid retrieval combines both for robustness.',
      },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'Cosine similarity ignores:',
        options: ['Direction', 'Magnitude', 'Both', 'Neither'],
        answer: '1',
        explanation: 'Cosine normalises by the norms, so only the angle — the direction — matters.',
        difficulty: 'intermediate',
      },
    ],
    prerequisites: ['neural-networks', 'linear-algebra'],
    related: ['transformers', 'knn'],
  },
  {
    id: 'autoencoders',
    title: 'Autoencoders',
    parentId: 'pca',
    type: 'advanced',
    difficulty: 'advanced',
    summary: 'Networks trained to reconstruct their input through a bottleneck, learning compact codes.',
    minutes: 10,
    objectives: ['Explain the bottleneck principle', 'Distinguish denoising from variational autoencoders', 'Relate to PCA'],
    theory: [
      [
        'Architecture',
        'An encoder maps x to a low-dimensional z; a decoder maps z back to x̂. The loss is reconstruction error ‖x − x̂‖². The bottleneck forces compression.',
      ],
      [
        'Non-linear PCA',
        'With linear activations and squared error, the autoencoder recovers the PCA subspace. Non-linear activations allow curved manifolds.',
      ],
      [
        'Variants',
        'Denoising autoencoders corrupt input and reconstruct the clean version. Variational autoencoders model a distribution over z, enabling sampling — at the cost of a KL term in the loss.',
      ],
    ],
    principles: ['The bottleneck is the regulariser', 'Reconstruction loss is not a semantic objective', 'VAEs trade fidelity for a generative model'],
    examples: [
      {
        level: 'advanced',
        title: 'Why VAEs blur',
        problem: 'Why do VAE reconstructions look blurrier than autoencoder ones?',
        solution:
          'The KL divergence forces the latent distribution toward a smooth prior, spreading probability mass and producing an average of plausible reconstructions rather than one sharp output.',
      },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'The bottleneck layer exists to:',
        options: ['Increase parameter count', 'Force a compact representation', 'Provide non-linearity', 'Remove the decoder'],
        answer: '1',
        explanation: 'The low-dimensional layer forces the model to retain only information needed for reconstruction.',
        difficulty: 'intermediate',
      },
    ],
    prerequisites: ['neural-networks', 'pca'],
    related: ['pca', 'embeddings', 'generative-models'],
  },
];
