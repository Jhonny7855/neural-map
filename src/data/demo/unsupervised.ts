import type { NodeSpec } from './types';

export const unsupervisedSpecs: NodeSpec[] = [
  {
    id: 'unsupervised-learning',
    title: 'Unsupervised Learning',
    parentId: 'ml-root',
    type: 'subject',
    difficulty: 'intermediate',
    summary: 'Finding structure, groups, and low-dimensional representations without labels.',
    minutes: 12,
    objectives: [
      'Distinguish clustering from dimensionality reduction',
      'Explain why evaluation is task-dependent',
      'Recognise when unlabelled structure is genuinely useful',
    ],
    theory: [
      [
        'No ground truth',
        'Without labels there is no unique correct answer. Every unsupervised result is a hypothesis about structure, and its value depends on downstream use.',
      ],
      [
        'Two big families',
        '**Clustering** groups similar points (k-Means, hierarchical, DBSCAN). **Dimensionality reduction** finds compact representations (PCA, t-SNE, UMAP, autoencoders).',
      ],
      [
        'Evaluation',
        'Internal metrics (silhouette, Davies–Bouldin) measure compactness and separation. External metrics need labels you do not have. In practice, stability under resampling and human inspection matter most.',
      ],
    ],
    principles: [
      'Structure is only meaningful relative to its use',
      'Always scale features before distance-based methods',
      'Validate cluster stability before trusting a segmentation',
    ],
    examples: [
      {
        level: 'practical',
        title: 'Picking a method',
        problem: 'You want customer segments but do not know how many exist. What do you try first?',
        solution:
          'Hierarchical clustering or DBSCAN to discover the count, then k-Means for assignment once k is chosen. Validate with silhouette and stability.',
      },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'Which task is dimensionality reduction rather than clustering?',
        options: ['Assigning customers to segments', 'Projecting 100 features onto 2 components', 'Grouping documents by topic', 'Detecting density outliers'],
        answer: '1',
        explanation: 'PCA projects features onto components — that is representation learning, not grouping.',
        difficulty: 'beginner',
      },
    ],
    prerequisites: ['linear-algebra', 'statistics'],
    related: ['kmeans', 'hierarchical-clustering', 'pca'],
    contrasts: ['supervised-learning'],
  },
  {
    id: 'clustering',
    title: 'Clustering',
    parentId: 'unsupervised-learning',
    type: 'topic',
    difficulty: 'intermediate',
    summary: 'Partitioning data so that points within a group are more similar than across groups.',
    minutes: 10,
    objectives: ['Compare centroid, hierarchical, and density methods', 'Explain the silhouette score', 'Recognise when cluster count is unclear'],
    theory: [
      [
        'What a cluster is',
        'Depending on the method, a cluster is a region around a centroid, a branch of a dendrogram, or a connected region of high density. Each definition fails on certain shapes.',
      ],
      [
        'Centroid methods',
        'k-Means assumes roughly spherical, similarly sized clusters and requires k. It minimises within-cluster sum of squares with an EM-like loop.',
      ],
      [
        'Density methods',
        'DBSCAN finds arbitrarily shaped clusters and labels sparse points as noise. It needs no k but is sensitive to epsilon and minPts.',
      ],
      [
        'Validating clusters',
        'Silhouette score compares intra-cluster distance to nearest-cluster distance, in [−1,1]. High values mean well-separated, compact clusters.',
      ],
    ],
    principles: ['No clustering algorithm is universally best', 'Cluster count is often a modelling decision, not a discovery', 'Scaling changes cluster structure'],
    formulas: [
      {
        name: 'Silhouette score',
        expression: 's = (b − a) / max(a, b)',
        variables: [
          ['a', 'mean distance to points in the same cluster'],
          ['b', 'mean distance to points in the nearest other cluster'],
        ],
        example: 'a = 2, b = 8 → s = 0.75, a strong cluster.',
        whenToUse: 'Comparing clusterings when labels are unavailable.',
      },
    ],
    visuals: [
      {
        kind: 'bars',
        title: 'Silhouette score by k',
        values: [['k=2', 0.71], ['k=3', 0.78], ['k=4', 0.64], ['k=5', 0.51], ['k=6', 0.43]],
        caption: 'Here k=3 is best, but a single peak is not proof — confirm with stability analysis.',
      },
    ],
    examples: [
      {
        level: 'beginner',
        title: 'Reading silhouette',
        problem: 'A point has a=5, b=6. Interpret.',
        solution: 's = (6−5)/6 ≈ 0.167 — the point is barely closer to its own cluster than the neighbouring one.',
      },
    ],
    applications: [{ title: 'Customer segmentation', description: 'Grouping enables differentiated campaigns and pricing.', industry: 'Marketing' }],
    questions: [
      {
        type: 'mcq',
        prompt: 'Silhouette scores range from:',
        options: ['0 to 1', '−1 to 1', '0 to ∞', '−∞ to ∞'],
        answer: '1',
        explanation: 'Negative values indicate points likely assigned to the wrong cluster.',
        difficulty: 'intermediate',
      },
    ],
    prerequisites: ['unsupervised-learning'],
    related: ['kmeans', 'hierarchical-clustering', 'pca'],
  },
  {
    id: 'kmeans',
    title: 'K-Means',
    parentId: 'clustering',
    type: 'concept',
    difficulty: 'intermediate',
    summary: 'Alternate assignment and centroid updates to minimise within-cluster variance.',
    minutes: 14,
    objectives: [
      'Trace one full iteration by hand',
      'Explain the elbow method and its weaknesses',
      'Explain randomness and the need for restarts',
    ],
    theory: [
      [
        'The algorithm',
        '1. Initialise k centroids. 2. Assign each point to the nearest centroid. 3. Move each centroid to the mean of its points. 4. Repeat until assignments stabilise.',
      ],
      [
        'The objective',
        'Minimise inertia: the sum of squared distances from each point to its centroid. Each step decreases inertia, so it converges — but to a local optimum.',
      ],
      [
        'Choosing k',
        'The elbow method plots inertia against k and looks for a bend. It is subjective and sometimes absent. Silhouette or downstream utility is more actionable.',
      ],
      [
        'k-Means++',
        'Random centroids can be terrible. k-Means++ spreads initial centroids probabilistically by distance, giving faster and better convergence. Always use several restarts.',
      ],
    ],
    principles: [
      'Converges to a local optimum — restarts are mandatory',
      'Scaling changes the result entirely',
      'Assumes convex, roughly equal-sized clusters',
    ],
    formulas: [
      {
        name: 'k-Means objective',
        expression: 'J = Σ_{k} Σ_{x ∈ C_k} ‖x − μ_k‖²',
        variables: [
          ['C_k', 'cluster k membership'],
          ['μ_k', 'centroid of cluster k'],
        ],
        whenToUse: 'Measuring cluster compactness across iterations.',
        mistakes: ['Comparing inertia across different k without normalising', 'Using k-Means on non-convex shapes'],
      },
    ],
    visuals: [
      {
        kind: 'flow',
        title: 'k-Means iteration',
        steps: ['Initialise k centroids (k-Means++)', 'Assign points to nearest centroid', 'Recompute centroids as cluster means', 'Check assignments changed?', 'If yes repeat; if no, stop'],
      },
    ],
    examples: [
      {
        level: 'beginner',
        title: 'One-dimensional iteration',
        problem: 'Points [1,2,3,10,11,12], k=2, centroids initialised at 1 and 12.',
        solution:
          'Assignment: {1,2,3} to centroid 1 and {10,11,12} to centroid 12. New centroids: 2 and 11. Reassignment is unchanged, so it converges — correctly separating the two groups.',
      },
      {
        level: 'advanced',
        title: 'When k-Means fails',
        problem: 'Two concentric rings. What does k-Means do?',
        solution:
          'It splits both rings into two halves, because it can only produce convex Voronoi regions. Use spectral clustering or DBSCAN for ring-shaped structure.',
      },
    ],
    applications: [{ title: 'Image colour quantisation', description: 'Cluster pixel colours to compress palettes.', industry: 'Graphics' }],
    questions: [
      {
        type: 'mcq',
        prompt: 'k-Means minimises:',
        options: ['Between-cluster distance', 'Within-cluster squared distance', 'Cluster count', 'Silhouette directly'],
        answer: '1',
        explanation: 'The objective is inertia: sum of squared distances to the assigned centroid.',
        difficulty: 'beginner',
      },
      {
        type: 'truefalse',
        prompt: 'k-Means always finds the global optimum of its objective.',
        answer: false,
        explanation: 'It converges to a local optimum dependent on initialisation; restarts and k-Means++ mitigate but do not guarantee globality.',
        difficulty: 'intermediate',
      },
      {
        type: 'numeric',
        prompt: 'Cluster points at 0 and 4. What is the centroid coordinate?',
        answer: 2,
        tolerance: 0.001,
        explanation: 'The mean of 0 and 4 is 2.',
        difficulty: 'beginner',
      },
    ],
    prerequisites: ['clustering', 'linear-algebra'],
    related: ['hierarchical-clustering', 'pca', 'feature-scaling'],
  },
  {
    id: 'hierarchical-clustering',
    title: 'Hierarchical Clustering',
    parentId: 'clustering',
    type: 'concept',
    difficulty: 'intermediate',
    summary: 'Build a nested tree of clusters by repeatedly merging the closest groups.',
    minutes: 12,
    objectives: ['Explain agglomerative merging', 'Compare linkage criteria', 'Read a dendrogram'],
    theory: [
      [
        'Agglomerative approach',
        'Start with every point as its own cluster. Repeatedly merge the two closest clusters until one remains. The merge order forms a dendrogram.',
      ],
      [
        'Linkage',
        '**Single** uses the closest pair (chains, handles non-convex shapes). **Complete** uses the farthest pair (compact clusters). **Average** balances both. **Ward** minimises within-cluster variance increase.',
      ],
      [
        'Reading a dendrogram',
        'Cut the tree horizontally to obtain a clustering. The height of a merge indicates the distance at which clusters joined — long vertical branches suggest genuine separation.',
      ],
    ],
    principles: ['No k needed upfront', 'Linkage choice changes the result decisively', 'O(n²) memory limits scale'],
    examples: [
      {
        level: 'beginner',
        title: 'Cutting a dendrogram',
        problem: 'Merges happen at heights 1, 2, 3, 9, 10. Where do you cut for two clusters?',
        solution: 'Between 3 and 9 — the large gap indicates two well-separated groups.',
      },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'Single linkage defines cluster distance as:',
        options: ['Maximum pairwise distance', 'Minimum pairwise distance', 'Mean pairwise distance', 'Centroid distance'],
        answer: '1',
        explanation: 'Single linkage uses the closest pair, which allows long chained clusters.',
        difficulty: 'intermediate',
      },
    ],
    prerequisites: ['clustering'],
    related: ['kmeans', 'dendrogram-analysis'],
  },
  {
    id: 'dbscan',
    title: 'DBSCAN',
    parentId: 'clustering',
    type: 'concept',
    difficulty: 'advanced',
    summary: 'Density-based clustering that finds arbitrary shapes and labels sparse points as noise.',
    minutes: 12,
    objectives: ['Define core, border, and noise points', 'Explain epsilon and minPts sensitivity', 'Compare with k-Means'],
    theory: [
      [
        'Density reachability',
        'A point is a **core point** if at least minPts points lie within radius ε. Core points connect into clusters; border points attach to a core; everything else is noise.',
      ],
      [
        'Strengths',
        'No k required, arbitrary cluster shapes, explicit noise handling. Excellent for spatial data and anomaly discovery.',
      ],
      [
        'Weaknesses',
        'ε is hard to choose, performance degrades in high dimensions, and clusters of very different densities are impossible to capture with one ε.',
      ],
    ],
    principles: ['Density beats distance in irregular geometry', 'ε controls granularity more than cluster count', 'Noise labels are a feature, not a bug'],
    examples: [
      {
        level: 'practical',
        title: 'Tuning ε',
        problem: 'Almost every point is labelled noise. What do you change?',
        solution: 'Increase ε or decrease minPts. Plot the k-distance graph and pick ε at the knee.',
      },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'DBSCAN requires which inputs?',
        options: ['k only', 'ε and minPts', 'Learning rate', 'Number of iterations'],
        answer: '1',
        explanation: 'Radius ε and minimum neighbour count minPts define density.',
        difficulty: 'intermediate',
      },
    ],
    prerequisites: ['clustering'],
    related: ['kmeans', 'anomaly-detection'],
  },
  {
    id: 'pca',
    title: 'Principal Component Analysis',
    parentId: 'unsupervised-learning',
    type: 'concept',
    difficulty: 'advanced',
    summary: 'Rotate data onto orthogonal axes of maximum variance, then keep the leading components.',
    minutes: 16,
    objectives: [
      'Explain PCA as an eigen-decomposition of the covariance matrix',
      'Interpret explained variance ratio',
      'Explain the limits of linear projection',
    ],
    theory: [
      [
        'The idea',
        'Find the direction of maximum variance, then the orthogonal direction of next-most variance, and so on. Keeping the first k components compresses the data while preserving as much variance as possible.',
      ],
      [
        'Computation',
        'Center the data, compute the covariance matrix, take its eigenvectors and eigenvalues, and project. In practice singular value decomposition is used for numerical stability.',
      ],
      [
        'Explained variance',
        'Each eigenvalue divided by the total variance gives the fraction explained by that component. Cumulative explained variance guides how many components to keep.',
      ],
      [
        'Limits',
        'PCA is linear and unsupervised: it preserves variance, not class separation. It is sensitive to feature scaling, and components are combinations that can be hard to interpret.',
      ],
    ],
    principles: [
      'Always standardise before PCA',
      'High variance is not the same as high information',
      'PCA is not a classifier — never use it to pick labels',
    ],
    formulas: [
      {
        name: 'Covariance matrix',
        expression: 'Σ = (1/(n−1)) XᵀX (with X centered)',
        variables: [
          ['X', 'centered data matrix'],
          ['n', 'number of samples'],
        ],
        whenToUse: 'Deriving principal directions.',
        mistakes: ['Forgetting to center', 'Not standardising features'],
      },
      {
        name: 'Explained variance ratio',
        expression: 'EVR_k = λ_k / Σ_j λ_j',
        variables: [
          ['λ_k', 'k-th eigenvalue'],
          ['Σ λ_j', 'total variance'],
        ],
        example: 'Eigenvalues 4, 3, 1, 1 → total 9. The first component explains 44%, the first two 78%.',
        whenToUse: 'Deciding how many components to keep.',
      },
    ],
    visuals: [
      {
        kind: 'bars',
        title: 'Cumulative explained variance',
        values: [['1 comp', 44], ['2 comps', 78], ['3 comps', 89], ['4 comps', 100]],
        caption: 'Two components capture 78% of variance — a reasonable compression target.',
      },
    ],
    examples: [
      {
        level: 'beginner',
        title: 'Correlated features',
        problem: 'Height in cm and inches are perfectly correlated. What does PCA do?',
        solution: 'It finds one component capturing ~100% of variance and a second with ~0%. You can drop the second entirely.',
      },
      {
        level: 'practical',
        title: 'Speeding up a model',
        problem: 'Training on 500 features is slow and unstable. Would PCA help?',
        solution:
          'Possibly: reducing to 30 components capturing 95% of variance speeds training and reduces collinearity. But check accuracy — some variance directions carry the label signal.',
      },
      {
        level: 'advanced',
        title: 'PCA vs LDA',
        problem: 'Why can PCA hurt classification?',
        solution:
          'PCA maximises total variance, which may be unrelated to class separation. LDA maximises between-class over within-class variance — supervised and better aligned to the task.',
      },
    ],
    applications: [
      { title: 'Visualisation', description: 'Project high-dimensional embeddings to 2D for inspection.', industry: 'Data Science' },
      { title: 'Noise reduction', description: 'Dropping trailing components removes low-magnitude noise.', industry: 'Signal Processing' },
    ],
    questions: [
      {
        type: 'mcq',
        prompt: 'Principal components are ordered by:',
        options: ['Alphabetical feature name', 'Explained variance', 'Mean value', 'Number of outliers'],
        answer: '1',
        explanation: 'The first component captures the most variance, the second the most remaining variance, and so on.',
        difficulty: 'beginner',
      },
      {
        type: 'truefalse',
        prompt: 'PCA should always be applied without standardising features.',
        answer: false,
        explanation: 'Unstandardised features with larger scales dominate the variance and thus the components. Standardise unless units are intentionally comparable.',
        difficulty: 'intermediate',
      },
      {
        type: 'numeric',
        prompt: 'Eigenvalues are 6, 2, 1, 1. What percentage of variance does the first component explain?',
        answer: 60,
        tolerance: 1,
        explanation: '6 / (6+2+1+1) = 6/10 = 60%.',
        difficulty: 'intermediate',
      },
    ],
    prerequisites: ['linear-algebra', 'unsupervised-learning'],
    related: ['feature-scaling', 'kmeans', 'anomaly-detection'],
    extensions: ['autoencoders', 'tsne'],
    crossSubject: ['statistics'],
  },
  {
    id: 'tsne',
    title: 't-SNE & UMAP',
    parentId: 'pca',
    type: 'advanced',
    difficulty: 'expert',
    summary: 'Non-linear embedding methods for visualising high-dimensional structure.',
    minutes: 12,
    objectives: ['Explain why t-SNE preserves local structure', 'List common misinterpretations', 'Choose between t-SNE and UMAP'],
    theory: [
      [
        'Neighbourhood preservation',
        't-SNE converts pairwise distances into neighbour probabilities in high dimension, then finds a low-dimensional layout matching them. Nearby points attract; distant points are repelled.',
      ],
      [
        'What you cannot read from it',
        'Global distances and cluster sizes are not meaningful. Two clusters far apart in the plot may not be far apart in the original space, and the axes have no interpretation.',
      ],
      [
        'UMAP',
        'Faster and better at preserving some global structure, based on a topological construction. Still not a metric embedding — do not measure distances on the plot.',
      ],
    ],
    principles: [
      'Never cluster on t-SNE coordinates directly',
      'Perplexity controls neighbourhood size',
      'Run multiple seeds before drawing conclusions',
    ],
    examples: [
      {
        level: 'advanced',
        title: 'Trusting cluster sizes',
        problem: 'In a t-SNE plot, cluster A looks twice as large as cluster B. Is A twice the population?',
        solution: 'No. t-SNE expands dense clusters and compresses sparse ones; apparent area carries no reliable population information.',
      },
    ],
    questions: [
      {
        type: 'truefalse',
        prompt: 'Distances between clusters in a t-SNE plot are quantitatively interpretable.',
        answer: false,
        explanation: 'Only local neighbourhood relationships are preserved; global geometry is distorted.',
        difficulty: 'advanced',
      },
    ],
    prerequisites: ['pca'],
    related: ['pca', 'clustering'],
  },
];
