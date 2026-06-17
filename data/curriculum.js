// COOP Careers Financial Services Track — prep curriculum
// Fellowship start: Aug 12, 2026

export const FELLOWSHIP_START = new Date("2026-08-12");

export const MODULES = [
  {
    id: "excel",
    title: "Advanced Excel",
    icon: "📊",
    color: "#1d6f42",
    light: "#e6f4ec",
    description: "Pivot tables, XLOOKUP, INDEX/MATCH — the analytical backbone of the fellowship.",
    coopModule: "Advanced Excel module",
    lessons: [
      {
        id: "excel-1",
        title: "Pivot tables from scratch",
        minutes: 8,
        body: [
          "A pivot table is a dynamic summary of raw data. You drag fields into rows, columns, and values — Excel does the aggregation. No formulas needed for the count/sum/average layer.",
          "For COOP: the first thing you'll do with any dataset is pivot it. Approval counts by group, revenue by region, incidents by quarter — all pivots.",
          "Key moves: Insert → PivotTable, drag your group field to Rows, drag your outcome field to Values (count), then right-click → Show Values As → % of Column Total to get rates instantly.",
        ],
        challenge: "Open any CSV (try the HMDA sample data). Build a pivot: rows = race or gender, values = count of APPROVED vs DENIED. Screenshot it.",
        quiz: [
          { q: "What does dragging a field to 'Values' and setting it to 'Count' give you?", a: "The number of records in each category", options: ["The sum of that field", "The number of records in each category", "The average value", "A percentage breakdown"] },
          { q: "To get approval rate by group in a pivot, what setting do you use?", a: "Show Values As → % of Column Total", options: ["Show Values As → % of Grand Total", "Show Values As → % of Column Total", "Sort → Descending", "Group By → Row"] },
        ],
      },
      {
        id: "excel-2",
        title: "XLOOKUP and INDEX/MATCH",
        minutes: 7,
        body: [
          "XLOOKUP is the modern replacement for VLOOKUP. Syntax: =XLOOKUP(lookup_value, lookup_array, return_array). It works left-to-right OR right-to-left, handles missing values cleanly, and doesn't need column index numbers.",
          "INDEX/MATCH is the classic power-user combo. =INDEX(return_range, MATCH(lookup_value, lookup_array, 0)). More flexible than VLOOKUP, still works in older Excel versions.",
          "For COOP: you'll use these to join reference tables — e.g., look up a ZIP code's demographic profile, or pull a regulatory control description from a lookup table.",
        ],
        challenge: "In Excel, create a two-tab workbook: Tab 1 has applicant IDs and ZIP codes. Tab 2 has ZIP codes and a 'region' label. Use XLOOKUP to pull the region into Tab 1. If XLOOKUP isn't available, use INDEX/MATCH.",
        quiz: [
          { q: "What is the correct XLOOKUP syntax?", a: "=XLOOKUP(lookup_value, lookup_array, return_array)", options: ["=VLOOKUP(value, range, col_index)", "=XLOOKUP(lookup_value, lookup_array, return_array)", "=INDEX(range, MATCH(val, col, 0))", "=LOOKUP(value, range)"] },
          { q: "XLOOKUP vs VLOOKUP: which can search right-to-left?", a: "XLOOKUP", options: ["VLOOKUP", "XLOOKUP", "Both", "Neither"] },
        ],
      },
      {
        id: "excel-3",
        title: "Computing the four-fifths rule in Excel",
        minutes: 6,
        body: [
          "The four-fifths (80%) disparate impact test is pure Excel math: COUNTIFS → rate → ratio → flag. No formulas you haven't seen before.",
          "Step 1: =COUNTIFS(race_col, group, decision_col, 'APPROVED') gives approvals for one group. Step 2: divide by COUNTIF(race_col, group) to get the rate. Step 3: divide each group's rate by the highest rate. Step 4: flag if < 0.80.",
          "This is the calculation interviewers will ask you to walk through. Being able to do it live in Excel — not just describe it — is the differentiator.",
        ],
        challenge: "Using the HMDA-style data (or any approval/denial dataset), build a four-fifths calculator in Excel: one row per group, columns for total, approved, rate, ratio, and pass/fail. Add conditional formatting: red fill if ratio < 0.80.",
        quiz: [
          { q: "Which Excel function counts records matching TWO conditions?", a: "COUNTIFS", options: ["COUNTIF", "COUNTIFS", "SUMIF", "FILTER"] },
          { q: "Group A approval rate is 72%, Group B is 90%. What is Group A's four-fifths ratio?", a: "0.80", options: ["0.72", "0.80", "0.90", "1.25"] },
        ],
      },
    ],
  },
  {
    id: "stats",
    title: "Statistics Foundations",
    icon: "📈",
    color: "#1e40af",
    light: "#eff6ff",
    description: "Mean, variance, rates, probability — the math behind every bias test.",
    coopModule: "Statistics foundations module",
    lessons: [
      {
        id: "stats-1",
        title: "Rates, proportions, and the approval gap",
        minutes: 6,
        body: [
          "An approval rate is a proportion: approved ÷ total. It's the single most important number in fair-lending analysis. When two groups have different rates, you have a gap — and a gap is where the legal exposure lives.",
          "Three ways to measure the gap: (1) Absolute difference — 88% minus 53% = 35 percentage points. Plain English, easy to explain. (2) Ratio — 53% ÷ 88% = 0.60. This is the four-fifths test. (3) Odds ratio — more common in academic research, but the ratio is what regulators use.",
          "Always present both the absolute gap AND the ratio. The ratio tells you if there's a legal threshold issue. The absolute gap tells the human story.",
        ],
        challenge: "Given: White approval rate 88%, Black 53%, Hispanic 58%, Asian 91%. Compute: (1) absolute gap vs. highest group for each, (2) ratio vs. highest group for each, (3) which groups fail the 80% test?",
        quiz: [
          { q: "Group A: 60 approved out of 80 applicants. What is the approval rate?", a: "75%", options: ["60%", "75%", "80%", "25%"] },
          { q: "The four-fifths test uses which measure?", a: "Ratio of approval rates", options: ["Absolute difference", "Ratio of approval rates", "Odds ratio", "P-value"] },
        ],
      },
      {
        id: "stats-2",
        title: "Mean, standard deviation, and what 'normal' looks like",
        minutes: 7,
        body: [
          "Mean is the average. Standard deviation measures spread — how far typical values fall from the mean. Together they define what's 'normal' for a dataset and what's anomalous.",
          "Rule of thumb: in a roughly normal distribution, ~68% of values fall within 1 standard deviation of the mean, ~95% within 2. A value more than 2 standard deviations away is unusual enough to flag.",
          "For COOP: when you look at credit scores, income bands, or loan amounts by group, you're asking 'do these distributions look different?' A difference in means is a signal. A difference in spread (stddev) can also reveal bias — e.g., if one group gets approved only when scores are very high.",
        ],
        challenge: "Using Excel: compute the mean and standard deviation of confidence_score from the sample dataset, broken out by race group. Do any groups have noticeably different means or spreads? Write one sentence interpreting the finding.",
        quiz: [
          { q: "A value is 2.5 standard deviations above the mean. Is it unusual?", a: "Yes — outside the 95% band", options: ["No — that's normal", "Yes — outside the 95% band", "Only if the mean is high", "Depends on the sample size"] },
          { q: "Standard deviation measures:", a: "How spread out values are around the mean", options: ["The most common value", "The middle value", "How spread out values are around the mean", "The highest value minus the lowest"] },
        ],
      },
      {
        id: "stats-3",
        title: "Probability basics for risk scoring",
        minutes: 6,
        body: [
          "Probability is a number between 0 and 1. An AI model's confidence score IS a probability — the model's estimated likelihood that the record belongs to a given class (e.g., 'will repay').",
          "Key concept: a model doesn't decide; it scores. The decision rule (approve if score > threshold) is set by humans. Changing the threshold changes both who gets approved AND the disparate impact profile.",
          "Conditional probability matters here: P(approved | Black applicant) vs. P(approved | White applicant). If those differ significantly, you have a disparate impact problem — even if the model never saw race.",
        ],
        challenge: "In plain English, explain this sentence: 'The model assigns a 0.68 confidence score to applicant A003.' What does that number mean? What would happen to approval rates if the threshold were raised from 0.70 to 0.80?",
        quiz: [
          { q: "An AI model outputs a confidence score of 0.73. What does this represent?", a: "73% estimated probability of the positive class", options: ["73% accuracy", "73% estimated probability of the positive class", "The model is 73% complete", "73 out of 100 similar applicants were approved"] },
          { q: "Raising the approval threshold from 0.70 to 0.85 would generally:", a: "Reduce overall approvals and may worsen disparate impact if low-scoring groups are disproportionately affected", options: ["Increase overall approvals", "Have no effect on disparate impact", "Reduce overall approvals and may worsen disparate impact if low-scoring groups are disproportionately affected", "Automatically fix any bias in the model"] },
        ],
      },
    ],
  },
  {
    id: "tableau",
    title: "Tableau",
    icon: "🎨",
    color: "#e97627",
    light: "#fff7ed",
    description: "Dimensions, measures, and the governance dashboard that employers expect to see.",
    coopModule: "Tableau module",
    lessons: [
      {
        id: "tableau-1",
        title: "Dimensions vs. measures — the core mental model",
        minutes: 6,
        body: [
          "Everything in Tableau is either a Dimension or a Measure. Dimensions are categorical (race, gender, ZIP code, decision). Measures are numeric (approval rate, confidence score, loan amount). This split is the foundation of every view you'll build.",
          "Discrete vs. continuous is the second split. Discrete fields (blue pills) create headers. Continuous fields (green pills) create axes. Drag race to Columns → headers. Drag approval rate to Rows → an axis with bars.",
          "For COOP: your governance dashboard needs one bar chart (approval rate by group) with a reference line at the 80% threshold. That single view is what an analyst presents in a fair-lending review.",
        ],
        challenge: "In Tableau: connect to your HMDA-style CSV. Build a bar chart: Columns = Race, Rows = AVG(confidence_score) or a calculated approval rate. Add a reference line at 0.80. Color bars red if below threshold.",
        quiz: [
          { q: "In Tableau, what does a blue pill on the shelf indicate?", a: "A discrete (categorical) dimension", options: ["A continuous measure", "A discrete (categorical) dimension", "A calculated field", "A date field"] },
          { q: "To add a horizontal reference line at 80% on a bar chart, you:", a: "Right-click the axis → Add Reference Line → set Value to 0.80", options: ["Drag a pill to the reference shelf", "Right-click the axis → Add Reference Line → set Value to 0.80", "Add a filter for values below 80%", "Use a dual-axis chart"] },
        ],
      },
      {
        id: "tableau-2",
        title: "Building the governance dashboard",
        minutes: 8,
        body: [
          "A governance dashboard for COOP needs three views: (1) approval rate by group (the bias screen), (2) risk score distribution (shows model behavior), (3) flags over time or by group (shows which controls fired most).",
          "Dashboard assembly in Tableau: create each sheet separately, then drag them onto a Dashboard canvas. Use a Tiled layout for clean alignment. Add a title text box: 'AI Governance Dashboard — [Date] — SYNTHETIC DATA'.",
          "Key design principle: the dashboard should answer one question in 5 seconds — 'does this model treat all groups fairly?' If a reviewer can't answer that at a glance, redesign.",
        ],
        challenge: "Build a 2-sheet Tableau dashboard: Sheet 1 = approval rate by race with 80% reference line, Sheet 2 = count of records by risk level (LOW/MEDIUM/HIGH/CRITICAL). Add a title and your name. Export as PDF or image.",
        quiz: [
          { q: "What is the first step when building a Tableau dashboard?", a: "Build each chart as a separate sheet, then assemble on the Dashboard canvas", options: ["Drag all fields onto the Dashboard canvas directly", "Build each chart as a separate sheet, then assemble on the Dashboard canvas", "Connect to a live database first", "Set up calculated fields before connecting data"] },
          { q: "The one question a fair-lending governance dashboard should answer in 5 seconds:", a: "Does this model treat all groups fairly?", options: ["What is the average loan amount?", "How many records were processed?", "Does this model treat all groups fairly?", "Which ZIP codes have the most denials?"] },
        ],
      },
      {
        id: "tableau-3",
        title: "Calculated fields and approval rate formulas",
        minutes: 7,
        body: [
          "To compute approval rate in Tableau, you need a calculated field. In Tableau: Analysis → Create Calculated Field. Formula: SUM(IF [decision] = 'APPROVED' THEN 1 ELSE 0 END) / COUNT([decision]).",
          "For the four-fifths ratio, create a second calculated field: [Approval Rate] / WINDOW_MAX([Approval Rate]). This divides each group's rate by the max rate across the view — exactly the four-fifths calculation.",
          "Table calculations (like WINDOW_MAX) compute across the view, not row-by-row. Place them on the Rows shelf after your dimension. If it looks wrong, check 'Compute Using' → Table (Across).",
        ],
        challenge: "Create a Tableau calculated field for approval rate using the formula above. Add it to a bar chart by race. Then create the four-fifths ratio field and add it as a label on each bar. Bars below 0.80 should be red (use a color rule or mark).",
        quiz: [
          { q: "In Tableau, what function gives you the maximum value across the entire view (not row-by-row)?", a: "WINDOW_MAX()", options: ["MAX()", "WINDOW_MAX()", "FIXED LOD", "ATTR()"] },
          { q: "To compute approval rate in Tableau, the formula is:", a: "SUM(IF [decision]='APPROVED' THEN 1 ELSE 0 END) / COUNT([decision])", options: ["COUNT([decision]='APPROVED')", "SUM([decision]='APPROVED')", "SUM(IF [decision]='APPROVED' THEN 1 ELSE 0 END) / COUNT([decision])", "AVG([decision])"] },
        ],
      },
    ],
  },
  {
    id: "pitch",
    title: "Financial Pitch & ROI",
    icon: "💼",
    color: "#7c3aed",
    light: "#f5f3ff",
    description: "Risk assessment, GTM framing, and the ROI case for AI governance investment.",
    coopModule: "Financial product pitch deck module",
    lessons: [
      {
        id: "pitch-1",
        title: "The pitch structure: problem → solution → ROI",
        minutes: 7,
        body: [
          "Every financial product pitch at COOP follows the same skeleton: (1) Problem — who is hurting and how much does it cost them? (2) Solution — what does your product do, concretely? (3) Market — how big is this problem? (4) Business model — how does money flow? (5) ROI — what's the return vs. the investment?",
          "The anchor number for your pitch: the IBM 2024 Cost of a Data Breach Report puts the US average at $9.48M per incident. Your governance platform costs $10–15M to pilot. If it prevents one breach AND one regulatory fine (GDPR up to €20M, FHA private litigation in the millions), the ROI is positive in year two.",
          "Never lead with the technology. Lead with the pain: 'Financial services firms face up to $30M in combined regulatory and litigation exposure per disparate-impact finding. Most catch violations only after they've already occurred.' Then introduce the solution.",
        ],
        challenge: "Write a 5-bullet executive summary for a governance AI product: (1) Problem, (2) Cost of the problem, (3) Solution in one sentence, (4) Target market, (5) ROI case. Use real numbers — IBM breach figure, GDPR fine range, or FHA settlement precedent.",
        quiz: [
          { q: "What is the IBM 2024 average US data breach cost?", a: "$9.48M", options: ["$4.2M", "$9.48M", "$14.8M", "$22M"] },
          { q: "What should you lead with in a financial product pitch?", a: "The customer's pain and its cost", options: ["The technology architecture", "The team's credentials", "The customer's pain and its cost", "The competitive landscape"] },
        ],
      },
      {
        id: "pitch-2",
        title: "Go-to-market and the land-and-expand model",
        minutes: 6,
        body: [
          "Go-to-market (GTM) answers: who is your first customer, how do you reach them, and what does the expansion path look like? For a governance tool targeting financial services, the standard answer is land-and-expand.",
          "Land: start with one business unit — e.g., consumer lending at a mid-market bank. Prove ROI with a pilot (bias audit of existing model, compliance report, executive readout). Expand: same tool, new divisions — mortgage, auto, credit cards. Then new firms.",
          "For COOP: you don't need a polished GTM slide, you need to be able to answer 'who would buy this?' in a sentence. 'Mid-market US banks and credit unions running AI-driven underwriting models — roughly 400 institutions in the $1B–$50B AUM range — face the highest unaddressed disparate-impact exposure.'",
        ],
        challenge: "Write your GTM answer in three sentences: (1) Who is the first customer and why? (2) What does the pilot look like? (3) What does the expansion path look like after the pilot succeeds?",
        quiz: [
          { q: "What does 'land-and-expand' mean in a GTM strategy?", a: "Start with one customer segment or division, prove ROI, then expand to adjacent segments", options: ["Launch in multiple markets simultaneously", "Start with one customer segment or division, prove ROI, then expand to adjacent segments", "Land at the lowest price point and raise prices over time", "Focus on large enterprise customers from day one"] },
          { q: "For an AI governance tool in financial services, the ideal first customer is:", a: "A mid-market bank running AI-driven underwriting with no existing bias-testing program", options: ["A big-4 consulting firm", "A fintech startup with no compliance needs yet", "A mid-market bank running AI-driven underwriting with no existing bias-testing program", "A regulatory agency"] },
        ],
      },
      {
        id: "pitch-3",
        title: "Building the ROI model",
        minutes: 7,
        body: [
          "An ROI model in a pitch has three components: (1) Cost — what does the customer pay? (2) Risk avoided — what financial exposure does the solution prevent? (3) Efficiency gain — what manual work does it replace?",
          "For governance AI: Cost = $10–15M pilot + $4–5M/year ongoing. Risk avoided = (probability of a breach or finding) × (average cost per incident). If the platform reduces breach probability by 30% and the base cost is $9.48M, that's $2.84M/year in expected-value terms. Add regulatory fine avoidance and one avoided audit cycle ($30K–150K/system) and the math works.",
          "Present this as: 'At a 3-year horizon with a 25% discount rate, the net present value of the platform is positive in year two, assuming one avoided regulatory incident and 15% audit cost reduction.' That sentence sounds like a finance associate, not a tech pitch.",
        ],
        challenge: "Build a simple ROI table in Excel or a Google Sheet: rows = Year 0, Year 1, Year 2, Year 3. Columns = Platform cost, Risk-avoidance value, Audit savings, Net cash flow, Cumulative NPV (use a 20% discount rate). Show the breakeven year.",
        quiz: [
          { q: "In an ROI model, 'risk avoided' is calculated as:", a: "Probability of an incident × average cost per incident", options: ["Total regulatory fines last year", "Probability of an incident × average cost per incident", "Headcount saved × average salary", "Revenue × margin"] },
          { q: "What discount rate reflects a reasonable cost of capital for a financial services firm?", a: "15–25%", options: ["2–5%", "8–12%", "15–25%", "50%+"] },
        ],
      },
    ],
  },
  {
    id: "fintech",
    title: "FinTech & Regulation",
    icon: "⚖️",
    color: "#0f766e",
    light: "#f0fdfa",
    description: "FHA, ECOA, NIST AI RMF, EU AI Act, Treasury FS framework — the regulatory spine.",
    coopModule: "FinTech case study + AI-in-financial-services module",
    lessons: [
      {
        id: "fintech-1",
        title: "The regulatory stack: FHA, ECOA, NIST, EU AI Act",
        minutes: 8,
        body: [
          "Four frameworks govern AI bias in lending simultaneously. Knowing how they interlock is the mark of someone who understands governance beyond a single jurisdiction.",
          "Fair Housing Act § 3604 (US): prohibits lending practices with discriminatory effect on protected classes — regardless of intent. CFPB pulled back enforcement May 2026, but FHA's private right of action remains live in federal court. ECOA Regulation B (Federal Reserve): credit decisions must not use proxies for protected classes. ZIP code as a credit variable is a classic Regulation B concern.",
          "NIST AI RMF (2023): Govern → Map → Measure → Manage. The US voluntary standard for AI risk; increasingly expected by bank examiners. EU AI Act (2024, fully in force 2026): credit-scoring AI is classified 'high-risk' — requires conformity assessments, bias audits, and human oversight before deployment. Any company with EU customers must comply regardless of where the model was built.",
        ],
        challenge: "Create a one-page cheat sheet (can be notes or a table): for each framework (FHA, ECOA, NIST AI RMF, EU AI Act), write: (1) who it covers, (2) what it requires, (3) enforcement status as of mid-2026, (4) one sentence on how it applies to an AI lending model.",
        quiz: [
          { q: "The EU AI Act classifies credit-scoring AI as:", a: "High-risk — requires conformity assessment and bias audit", options: ["Low-risk — no special requirements", "Prohibited — cannot be used", "High-risk — requires conformity assessment and bias audit", "Unregulated — not yet covered"] },
          { q: "CFPB pulled back disparate-impact enforcement in May 2026. Does this mean the FHA no longer applies?", a: "No — the FHA's private right of action is still live in federal court", options: ["Yes — disparate impact is no longer a legal risk", "No — the FHA's private right of action is still live in federal court", "Only for banks with assets over $10B", "Yes, but the EU AI Act now covers the same ground"] },
        ],
      },
      {
        id: "fintech-2",
        title: "Treasury FS AI Risk Management Framework (Feb 2026)",
        minutes: 7,
        body: [
          "In February 2026, the US Treasury released a Financial Services AI Risk Management Framework with 230 control objectives. It's the most current US federal AI guidance in finance — citing it signals you track the regulatory frontier.",
          "Three key areas: (1) Fairness and non-discrimination — models must be tested for disparate impact across protected classes before deployment and on an ongoing basis. (2) Explainability — lenders must explain adverse decisions in terms applicants can understand (plain-language adverse-action notices). (3) Model monitoring — production models need drift detection, not just pre-deployment testing.",
          "The framework explicitly references SR 11-7 (the Fed's model risk guidance), NIST AI RMF, and ECOA as the backbone. Speaking all three in one sentence — 'This maps to Treasury's FS AI RMF, NIST AI RMF, and ECOA Regulation B' — is a strong credibility signal.",
        ],
        challenge: "In one paragraph, explain how a governance platform addresses all three Treasury FS AI RMF areas (fairness, explainability, monitoring). Use specific feature names or outputs — don't be vague. This is the paragraph you'd include in a FinTech case study.",
        quiz: [
          { q: "When was the Treasury FS AI Risk Management Framework released?", a: "February 2026", options: ["January 2024", "June 2025", "February 2026", "March 2023"] },
          { q: "SR 11-7 is a guidance document from:", a: "The Federal Reserve and OCC, covering model risk management at banks", options: ["The EU, covering AI Act compliance", "The Federal Reserve and OCC, covering model risk management at banks", "The CFPB, covering fair lending enforcement", "NIST, covering AI risk taxonomy"] },
        ],
      },
      {
        id: "fintech-3",
        title: "Writing your FinTech case study",
        minutes: 7,
        body: [
          "COOP's FinTech case study module asks you to analyze a tool through an ESG and regulatory lens. Write your governance project up as the case study — you're not just studying it, you built it.",
          "Structure: (1) Problem and market — what pain exists, how large is the market? (2) Solution and how it works — specific capabilities, not vague tech-speak. (3) Regulatory grounding — which frameworks apply and how the tool addresses them. (4) ESG angle — the 'S' (Social) case: fairness in lending is a direct social-impact story. (5) Business model and risks — how does it make money, what could go wrong?",
          "The ESG framing is important for COOP: 'This governance platform operationalizes the S in ESG for AI-driven lending — making fairness measurable, auditable, and enforceable.' That sentence works in a case study, a pitch, and an interview answer.",
        ],
        challenge: "Write a 4-paragraph FinTech case study: (1) Problem and market size, (2) How the solution works with 2 specific regulatory citations, (3) ESG angle in your own words, (4) One risk and how it's mitigated. Treat this as a real COOP submission.",
        quiz: [
          { q: "In an ESG framework, which letter does AI fairness in lending fall under?", a: "S — Social", options: ["E — Environmental", "S — Social", "G — Governance", "All three equally"] },
          { q: "The strongest sentence to open a governance FinTech case study:", a: "Financial services firms face up to $30M in combined regulatory and litigation exposure per disparate-impact finding — and most catch violations only after they've occurred.", options: ["AI is changing the financial services industry rapidly.", "Our platform uses machine learning to detect bias.", "Financial services firms face up to $30M in combined regulatory and litigation exposure per disparate-impact finding — and most catch violations only after they've occurred.", "We built a governance tool for COOP."] },
        ],
      },
    ],
  },
  {
    id: "aigovernance",
    title: "AI Governance & Ethics",
    icon: "🤖",
    color: "#dc2626",
    light: "#fef2f2",
    description: "Transparency, accountability, fairness, audit trails — the four pillars you need to own.",
    coopModule: "AI in financial services module",
    lessons: [
      {
        id: "gov-1",
        title: "The four pillars: transparency, accountability, fairness, auditability",
        minutes: 6,
        body: [
          "AI governance in financial services rests on four pillars that map directly to regulatory requirements and interview questions.",
          "Transparency: can you explain what the model does and why it made a specific decision? This is both a legal requirement (adverse-action notices) and a business requirement (regulators will ask). Accountability: who owns the model? Who is responsible if it causes harm? SR 11-7 requires a named model owner and an independent validator.",
          "Fairness: does the model produce equitable outcomes across protected classes? The four-fifths test is the standard screen. Auditability: can you prove what happened? An audit trail that logs every decision, every flag, and every control that fired is the foundation of defensibility.",
        ],
        challenge: "For each of the four pillars, write one sentence describing how a governance tool addresses it. Be specific — name a feature or output. Then rank the pillars in order of importance for a US bank facing a fair-lending exam. Defend your ranking in 2 sentences.",
        quiz: [
          { q: "SR 11-7 requires which of the following?", a: "A named model owner and independent validator for each production model", options: ["Annual bias audits of all models", "A named model owner and independent validator for each production model", "Real-time monitoring of all AI decisions", "Explainability scores for every output"] },
          { q: "An adverse-action notice is:", a: "A required explanation to an applicant of why their credit application was denied", options: ["A warning to a model developer that bias was detected", "A regulatory fine for disparate impact", "A required explanation to an applicant of why their credit application was denied", "A system alert for anomalous model behavior"] },
        ],
      },
      {
        id: "gov-2",
        title: "Disparate impact: intent vs. outcome",
        minutes: 6,
        body: [
          "Disparate impact is about outcomes, not intent. A model can be built with no discriminatory intent and still produce discriminatory results — because the training data, the feature set, or the decision threshold encodes historical bias.",
          "The classic proxy problem: ZIP code is not a protected class. But ZIP codes are highly correlated with race due to decades of discriminatory housing policy (redlining). A model that penalizes applicants from certain ZIP codes is a model that penalizes by race — without ever using the race field.",
          "Legal standard: under the Fair Housing Act, a plaintiff must show (1) a neutral policy (2) that produces a disparate impact on a protected class. The burden then shifts to the defendant to show the policy is 'necessary to achieve a substantial, legitimate, nondiscriminatory interest.' This is a high bar.",
        ],
        challenge: "In the HMDA-style sample data: identify one variable that could act as a racial proxy (besides the race column itself). Explain in 3 sentences why it's a proxy, what the historical reason is, and what a lender should do about it.",
        quiz: [
          { q: "Disparate impact requires proof of:", a: "Discriminatory outcome, not discriminatory intent", options: ["Explicit discriminatory intent", "Discriminatory outcome, not discriminatory intent", "Both intent and outcome", "Statistical significance at p < 0.05"] },
          { q: "Why can ZIP code act as a racial proxy in a lending model?", a: "Because residential segregation patterns (including historical redlining) create high correlation between ZIP code and race", options: ["Because ZIP codes were designed to track race", "Because lenders manually assign race by ZIP code", "Because residential segregation patterns (including historical redlining) create high correlation between ZIP code and race", "It cannot — ZIP code is a neutral geographic variable"] },
        ],
      },
      {
        id: "gov-3",
        title: "Your governance project as your COOP case study",
        minutes: 7,
        body: [
          "COOP's AI-in-financial-services module includes 'AI governance, platform policies, and ethical considerations.' You walk into that module having already built the thing. That's a top-decile position in the cohort.",
          "How to present it: don't say 'I built an app.' Say 'I designed and built an AI governance engine that audits lending decision data for algorithmic bias and compliance risk. It implements the four-fifths test under EEOC 29 C.F.R. § 1607.4(D), maps findings to named controls from the NIST AI RMF and Treasury's 2026 Financial Services AI Risk Management Framework, and generates timestamped audit trails for each analysis run.'",
          "Three things interviewers will probe: (1) Can you explain the math behind the bias test? (Yes — the four-fifths rule, by hand.) (2) Do you know the regulation? (Yes — FHA, ECOA, EU AI Act.) (3) What would you do differently? This is the most important question — it proves judgment, not just execution.",
        ],
        challenge: "Write your 60-second Mothership/governance project pitch as if you're introducing it to your COOP cohort during the AI module. Include: what it does, one specific technical feature, two regulatory frameworks it addresses, and one thing you'd build next. Practice saying it out loud.",
        quiz: [
          { q: "The EEOC standard that governs the four-fifths test is:", a: "29 C.F.R. § 1607.4(D) — Uniform Guidelines on Employee Selection Procedures", options: ["GDPR Article 22", "29 C.F.R. § 1607.4(D) — Uniform Guidelines on Employee Selection Procedures", "SR 11-7 Section 4", "Treasury FS AI RMF Control 2.11"] },
          { q: "The most important question an interviewer can ask about your project:", a: "What would you do differently?", options: ["What language did you use?", "How many lines of code is it?", "What would you do differently?", "Did you use a database?"] },
        ],
      },
    ],
  },
  {
    id: "capstone",
    title: "Capstone & Presentation",
    icon: "🎓",
    color: "#b45309",
    light: "#fffbeb",
    description: "Data viz, financial modeling, presenting findings, and the interview story.",
    coopModule: "Capstone module + Hustle track",
    lessons: [
      {
        id: "cap-1",
        title: "The capstone deliverable structure",
        minutes: 6,
        body: [
          "COOP's capstone is a team project that synthesizes all modules. Your deliverables are typically: a data analysis (Excel/Tableau), a financial model (ROI or valuation), a presentation (slides + verbal), and sometimes a written case study.",
          "Your positioning on a team: you are the technical owner of the governance/AI analysis track. You bring the bias audit, the Tableau dashboard, and the regulatory framing. Your teammates bring the financial model and the pitch narrative. Divide by expertise.",
          "What judges look for in COOP capstones: (1) Does the analysis actually answer a real business question? (2) Are the numbers right and defensible? (3) Is the presentation clear to a non-technical audience? (4) Does the team demonstrate they understand the domain, not just the tools?",
        ],
        challenge: "Outline your capstone contribution in bullet form: what analysis you'd own, what Tableau view you'd build, what regulatory framing you'd provide, and what slide(s) you'd present. Keep it tight — 8 bullets max.",
        quiz: [
          { q: "On a COOP capstone team, what is the strongest role for someone who built a governance AI tool?", a: "Technical owner of the bias analysis and regulatory framing track", options: ["Project manager coordinating all workstreams", "Financial modeler building the DCF", "Technical owner of the bias analysis and regulatory framing track", "Designer creating the slide deck"] },
          { q: "COOP capstone judges most want to see:", a: "Analysis that answers a real business question with defensible numbers", options: ["The most complex technical implementation", "The largest dataset", "Analysis that answers a real business question with defensible numbers", "The most slides"] },
        ],
      },
      {
        id: "cap-2",
        title: "Presenting data to a non-technical audience",
        minutes: 7,
        body: [
          "The translation formula: finding → what it means in plain English → what the organization should do. Never lead with methodology. Always lead with the finding and its consequence.",
          "Example: Bad — 'We computed the four-fifths ratio using COUNTIFS and found values below the EEOC threshold.' Good — 'Our analysis found that Black applicants were approved at 53% vs 88% for Asian applicants. That's a ratio of 0.60 — 20 points below the legal threshold. This is a real legal exposure that requires investigation before the model is redeployed.'",
          "For COOP presentations: every chart needs a 'so what' title (not just a label). Instead of 'Approval Rate by Race,' write 'Black and Hispanic Applicants Approved at Half the Rate of Asian Applicants.' The title IS the finding.",
        ],
        challenge: "Take any chart or table from your analysis. Write two versions of the slide title: (1) a neutral label, (2) a 'so what' title that states the finding. Then write the 2-sentence presenter note that goes with the 'so what' version.",
        quiz: [
          { q: "Which slide title follows best practice for presenting findings?", a: "'Black and Hispanic applicants approved at 53%–58% vs. 88% for Asian applicants — below the 80% legal threshold'", options: ["'Approval Rate Analysis'", "'Four-Fifths Test Results by Racial Group'", "'Black and Hispanic applicants approved at 53%–58% vs. 88% for Asian applicants — below the 80% legal threshold'", "'Disparate Impact Chart'"] },
          { q: "The right order for a data finding in a presentation:", a: "Finding → plain-English meaning → recommended action", options: ["Methodology → data → finding", "Finding → plain-English meaning → recommended action", "Recommendation → methodology → data", "Data → visualization → label"] },
        ],
      },
      {
        id: "cap-3",
        title: "The interview story: owning your project",
        minutes: 7,
        body: [
          "Every COOP interview for Data Governance or Analytics roles will ask: 'Tell me about a project you worked on.' This is where your governance project becomes a weapon — IF you can tell the story cleanly.",
          "The STAR format works here: Situation (what problem existed), Task (what you set out to build), Action (what you specifically did — not 'we'), Result (what it produced and what you learned). Keep it under 90 seconds. Practice it until it's automatic.",
          "Three things that make a project story credible: (1) Specific numbers — '53% vs 88% approval rate, a ratio of 0.60, below the 80% EEOC threshold.' (2) Specific decisions — 'I chose the four-fifths test because it's reproducible by hand and it's the EEOC's own standard.' (3) Honest reflection — 'If I rebuilt it, I'd add real-time model monitoring, not just batch analysis.' Specificity is credibility.",
        ],
        challenge: "Write your STAR answer for this question: 'Tell me about a data or analytics project you built.' Keep it under 200 words. Include one specific number, one specific decision and why you made it, and one thing you'd do differently. Then time yourself saying it out loud.",
        quiz: [
          { q: "In the STAR interview format, 'Action' should be:", a: "What YOU specifically did, not what the team did", options: ["What the team decided together", "What YOU specifically did, not what the team did", "The outcome of the project", "The situation that caused the project"] },
          { q: "What makes a project story credible in a data/analytics interview?", a: "Specific numbers, specific decisions with reasoning, and honest reflection", options: ["Using technical jargon confidently", "Claiming the project was very complex", "Specific numbers, specific decisions with reasoning, and honest reflection", "Mentioning every tool and language used"] },
        ],
      },
    ],
  },
];

export const FLASHCARDS = [
  { term: "Four-fifths rule", def: "Each group's approval rate ÷ highest group's rate. Flag if below 0.80. Source: EEOC 29 C.F.R. § 1607.4(D)." },
  { term: "Disparate impact", def: "A neutral policy that disproportionately harms a protected class — regardless of intent. Outcome-based, not motive-based." },
  { term: "NIST AI RMF", def: "Govern → Map → Measure → Manage. The US voluntary AI risk framework. Measure 2.11 covers harmful bias." },
  { term: "SR 11-7", def: "Federal Reserve / OCC model risk guidance. Requires model owner, independent validation, and ongoing monitoring for every production model." },
  { term: "Treasury FS AI RMF", def: "US Treasury framework released Feb 2026. 230 control objectives covering fairness, explainability, and model monitoring in financial services AI." },
  { term: "EU AI Act", def: "EU law (2024, fully in force 2026). Credit-scoring AI = high-risk. Requires conformity assessment, bias audit, and human oversight." },
  { term: "ECOA Regulation B", def: "Equal Credit Opportunity Act. Prohibits using proxies for protected classes (e.g., ZIP code as a racial proxy) in credit decisions." },
  { term: "Fair Housing Act § 3604", def: "Prohibits discriminatory effect in residential lending regardless of intent. CFPB pulled back enforcement May 2026; private right of action still live." },
  { term: "Welford's algorithm", def: "Online algorithm for computing mean and variance in a single pass. Used in the telemetry aggregator's summary engine." },
  { term: "Adverse-action notice", def: "Required notice to a credit applicant explaining why they were denied. Must cite specific reasons, not just 'the model said so.'" },
  { term: "Disparate treatment", def: "Different treatment based on a protected characteristic. Requires intent. Distinct from disparate impact, which is outcome-based." },
  { term: "XLOOKUP", def: "=XLOOKUP(lookup_value, lookup_array, return_array). Replaces VLOOKUP. Works left-to-right and right-to-left." },
  { term: "Proxy variable", def: "A variable that correlates strongly with a protected class. Using it in a model can produce disparate impact even without using the protected attribute directly." },
  { term: "Pivot table", def: "Excel feature that summarizes raw data dynamically. Drag fields to Rows/Columns/Values. Essential for computing group approval rates." },
  { term: "Standard deviation", def: "Measures spread around the mean. ~68% of values fall within 1σ, ~95% within 2σ. Values beyond 2σ are anomalous." },
  { term: "Land-and-expand GTM", def: "Start with one customer or business unit, prove ROI, then grow to adjacent segments. Common model for B2B SaaS governance tools." },
  { term: "IBM 2024 breach cost", def: "Average US data breach: $9.48M. Used as the anchor ROI number for AI governance investment justification." },
  { term: "GDPR fine range", def: "Up to €20M or 4% of global annual turnover (whichever is higher) for serious violations. Applies to any org processing EU personal data." },
  { term: "ESG — Social pillar", def: "The 'S' in Environmental, Social, Governance. AI fairness in lending is a Social issue: equitable outcomes for protected classes." },
  { term: "WINDOW_MAX() in Tableau", def: "Table calculation that returns the maximum value across the entire view. Used for the four-fifths ratio: [Rate] / WINDOW_MAX([Rate])." },
];
