# Educational Research Reference

Use this reference when a game has learning objectives, age-appropriate content, or difficulty progression. Ground the design in published research rather than intuition.

## Primary Sources

### Common Core State Standards (CCSS, 2010)
Grade-by-grade math content expectations adopted by most U.S. states.
- **K–2**: Addition and subtraction concepts and skills; understanding quantities and whole numbers.
- **Grades 3–5**: Multiplication and division of whole numbers; introduction to fractions.
- Use CCSS to establish number ranges per difficulty level (e.g., "addition within 10" for Kindergarten, "within 20" for Grade 1).
- Source: http://www.corestandards.org/Math/

### NCTM Principles and Standards for School Mathematics (2000)
Broad standards from the National Council of Teachers of Mathematics.
- **Pre-K–2**: Count with understanding; develop sense of whole numbers; connect number words to quantities.
- **Grades 3–5**: Develop fluency with basic number combinations for multiplication and division; understand meanings of operations.
- Source: https://www.nctm.org/standards/

### NCTM Curriculum Focal Points (2006)
More focused than NCTM 2000 — identifies the most important mathematical topics per grade through Grade 8.
- **Kindergarten**: Whole numbers to represent quantities.
- **Grade 1**: Addition and subtraction within 20.
- **Grade 2**: Base-ten understanding; multi-digit addition.
- **Grade 3**: Multiplication and division concepts.
- Source: https://www.nctm.org/focalpoints/

### National Mathematics Advisory Panel — "Foundations for Success" (2008)
U.S. Department of Education report on preparing students for algebra.
- Key finding: **fluency with basic arithmetic is the critical gateway to algebra**.
- Endorsed automatic recall of addition/subtraction facts through 18 and multiplication/division facts.
- Recommended focused, coherent progressions over broad coverage.
- Source: https://www2.ed.gov/about/bdscomm/list/mathpanel/report/final-report.pdf

### Clements & Sarama Learning Trajectories (2004, 2009)
Research-based developmental progressions for early mathematics.
- Counting develops: rote sequence → one-to-one correspondence → cardinality → counting on → skip counting.
- Typical milestones:
  - Ages 3–5: Cardinality understanding.
  - Kindergarten: Counting to 10; number sense with small quantities.
  - Grade 1: Addition within 10; mental strategies for sums.
- Source: Clements, D. H., & Sarama, J. (2004). *Learning trajectories in mathematics education*. Mathematical Thinking and Learning, 6(2), 81–89.

---

## Guidelines for Implementation

### Citing research in code
When defining difficulty-level constants, add a comment citing the source:
```ts
// Level 1: addition within 10 — CCSS K.OA, NCTM Focal Points Grade 1
const LEVEL_1_MAX = 10;

// Level 2: addition within 20 — CCSS 1.OA, NMAP fluency target
const LEVEL_2_MAX = 20;
```

### Adding a new educational area
Before defining difficulty ranges for a new topic, confirm the grade-level alignment using **at least two** of the sources above. Document the sources and grade levels in the code and in this file if the topic is new.

### Number range language
Prefer **"within N"** (matching standards language), e.g.:
- "addition within 10" not "numbers up to 10"
- "multiplication facts within 100" not "times tables to 10"

### Progression granularity
- **Level 1** must be accessible to the youngest intended audience with no prior instruction assumed.
- Each level step should correspond to roughly one grade level of progression per the cited standards.
- Avoid difficulty jumps that span more than one grade level within a single level step.
- **Level 3** should reach the grade-level standard for the target age group.

### Age grounding
| Level | Rough target age | Example anchor standard |
|-------|-----------------|------------------------|
| 1     | Age 5–6 (K)     | CCSS K.OA — add within 5 |
| 2     | Age 6–7 (Gr 1)  | CCSS 1.OA — add/subtract within 20 |
| 3     | Age 7–8 (Gr 2)  | CCSS 2.OA — fluency within 20; 2.NBT multi-digit |
| 4     | Age 8–9 (Gr 3)  | CCSS 3.OA — multiplication/division within 100 |

These are anchors, not hard requirements. Adjust if the game's audience is narrower.
