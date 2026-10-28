const fs = require('fs');
const path = require('path');

function createPdf(title, subtitle, sections) {
  let stream = 'BT\n/F1 20 Tf\n50 730 Td\n(' + escapeText(title) + ') Tj\n';
  stream += '/F1 12 Tf\n0 -24 Td\n(' + escapeText(subtitle) + ') Tj\n';
  stream += '/F1 10 Tf\n0 -28 Td\n';

  for (const sec of sections) {
    if (sec.header) {
      stream += '/F1 12 Tf\n(' + escapeText(sec.header) + ') Tj\n/F1 10 Tf\n0 -18 Td\n';
    }
    for (const item of sec.items) {
      stream += '(' + escapeText(item) + ') Tj\n0 -16 Td\n';
    }
    stream += '0 -10 Td\n';
  }

  stream += '0 -20 Td\n/F1 9 Tf\n(Generated for CampusHub Students - Free Academic Sharing) Tj\n';
  stream += 'ET';

  const len = Buffer.byteLength(stream);

  let pdf = '%PDF-1.4\n';
  const offsets = [];

  function addObj(content) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += content + '\n';
  }

  addObj('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  addObj('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  addObj('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj');
  addObj('4 0 obj\n<< /Length ' + len + ' >>\nstream\n' + stream + '\nendstream\nendobj');
  addObj('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');

  const startXref = Buffer.byteLength(pdf);
  pdf += 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 0; i < offsets.length; i++) {
    pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + startXref + '\n%%EOF';
  return pdf;
}

function escapeText(str) {
  return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

const notesDir = path.join(__dirname, '..', '..', 'uploads', 'notes');
if (!fs.existsSync(notesDir)) {
  fs.mkdirSync(notesDir, { recursive: true });
}

// 1. Python Basics
fs.writeFileSync(
  path.join(notesDir, 'python_basics.pdf'),
  createPdf(
    'Python Basics for Beginners',
    'Course: Introduction to Programming (Semester 1) | Author: Priya Sharma',
    [
      {
        header: '1. Variables & Basic Types',
        items: [
          'Integers: age = 19 | Floats: gpa = 3.85',
          'Strings: name = "Campus Student" (supports slicing and format strings)',
          'Booleans: is_enrolled = True | NoneType: value = None',
        ],
      },
      {
        header: '2. Core Collections',
        items: [
          'Lists: fruits = ["apple", "banana"] (ordered, mutable)',
          'Tuples: coords = (10, 20) (ordered, immutable)',
          'Dictionaries: student = {"name": "Alex", "year": 2} (key-value pairs)',
          'Sets: unique_tags = {"python", "ai", "web"} (unique elements)',
        ],
      },
      {
        header: '3. Functions and Control Flow',
        items: [
          'def calculate_gpa(grades): return sum(grades) / len(grades)',
          'for item in items: print(item)',
          'if score >= 90: grade = "A" elif score >= 80: grade = "B"',
        ],
      },
      {
        header: '4. Best Practices',
        items: [
          'Follow PEP 8 style guidelines for readable code.',
          'Use virtual environments (venv) for project dependencies.',
        ],
      },
    ]
  )
);

// 2. Dynamic Programming
fs.writeFileSync(
  path.join(notesDir, 'dp_guide.pdf'),
  createPdf(
    'Dynamic Programming Complete Guide',
    'Course: Data Structures & Algorithms (Semester 5) | Author: Alex Johnson',
    [
      {
        header: '1. Core Philosophy of Dynamic Programming',
        items: [
          'Identify Overlapping Subproblems and Optimal Substructure.',
          'Top-Down Approach: Recursion with Memoization table (cache).',
          'Bottom-Up Approach: Iterative Tabulation from base cases upward.',
        ],
      },
      {
        header: '2. Classic DP Patterns',
        items: [
          'Fibonacci Style: F(n) = F(n-1) + F(n-2) | O(n) time, O(1) space.',
          '0/1 Knapsack: Choose item i with weight w or skip item i.',
          'Longest Common Subsequence (LCS) & Edit Distance for strings.',
          'Matrix Chain Multiplication & Interval DP.',
        ],
      },
      {
        header: '3. Step-by-Step Problem Solving Framework',
        items: [
          'Step 1: Define the state representation dp[i][j].',
          'Step 2: Formulate the recurrence transition equation.',
          'Step 3: Establish explicit base conditions.',
          'Step 4: Check if space complexity can be optimized from O(N) to O(1).',
        ],
      },
    ]
  )
);

// 3. Machine Learning Fundamentals
fs.writeFileSync(
  path.join(notesDir, 'ml_fundamentals.pdf'),
  createPdf(
    'Machine Learning Fundamentals',
    'Course: Data Science Track (Semester 4) | Author: Sarah Chen',
    [
      {
        header: '1. Supervised Learning',
        items: [
          'Linear & Logistic Regression for continuous and classification outputs.',
          'Decision Trees, Random Forests, and Gradient Boosting (XGBoost).',
          'Cost Functions: Mean Squared Error (MSE), Cross-Entropy Loss.',
        ],
      },
      {
        header: '2. Model Evaluation & Validation',
        items: [
          'Train / Validation / Test split strategies (e.g. 70/15/15).',
          'Metrics: Accuracy, Precision, Recall, F1-Score, and ROC-AUC.',
          'Diagnosing Bias (Underfitting) vs Variance (Overfitting).',
        ],
      },
      {
        header: '3. Data Preprocessing & Feature Engineering',
        items: [
          'Handling missing values, Outlier trimming, and One-Hot Encoding.',
          'Standardization (StandardScaler) vs Normalization (MinMaxScaler).',
        ],
      },
    ]
  )
);

// 4. Microprocessors 8085 Reference
fs.writeFileSync(
  path.join(notesDir, '8085_ref.pdf'),
  createPdf(
    'Microprocessors 8085 Quick Reference',
    'Course: Electronics & Communication (Semester 3) | Author: Marcus Williams',
    [
      {
        header: '1. Architectural Highlights',
        items: [
          '8-bit Microprocessor with 16-bit address bus (64 KB address space).',
          'General registers: B, C, D, E, H, L (and register pairs BC, DE, HL).',
          'Flags: Sign (S), Zero (Z), Auxiliary Carry (AC), Parity (P), Carry (CY).',
        ],
      },
      {
        header: '2. Instruction Groups',
        items: [
          'Data Transfer: MOV A, B | MVI A, 32H | LXI H, 2050H | LDA 2000H',
          'Arithmetic: ADD B | SUB C | INR A | DCR B | DAD H',
          'Logical: ANA B | ORA C | XRA A | CMP B | CMA',
          'Branching: JMP 2000H | JZ 2050H | CALL 3000H | RET',
        ],
      },
    ]
  )
);

// 5. UI/UX Design Principles
fs.writeFileSync(
  path.join(notesDir, 'ux_principles.pdf'),
  createPdf(
    'UI/UX Design Principles for Developers',
    'Course: Digital Media & Human-Computer Interaction | Author: Jordan Lee',
    [
      {
        header: '1. Visual Hierarchy & Typography',
        items: [
          'Guide the eye using scale, weight, contrast, and intentional white space.',
          'Establish consistent type scales: H1 (28px), H2 (20px), Body (15px).',
          'Maintain 1.5 to 1.6 line height for comfortable body reading.',
        ],
      },
      {
        header: '2. Color Theory & Accessibility',
        items: [
          'Use the 60-30-10 rule: 60% dominant neutral, 30% secondary, 10% accent.',
          'Ensure WCAG AA contrast ratio (minimum 4.5:1 for normal text).',
          'Provide clear visual feedback on hover, focus, active, and disabled states.',
        ],
      },
    ]
  )
);

console.log('✅ All 5 sample PDF notes generated successfully in uploads/notes!');
