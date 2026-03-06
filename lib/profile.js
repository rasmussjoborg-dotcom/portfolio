// Profile configuration — the scoring reference for job matching
// Extracted from rsjo.io portfolio

export const profile = {
    name: "Rasmus Sjöborg",
    title: "Head of Design & Product Strategist",

    skills: [
        "Design Systems",
        "UX/UI Design",
        "Product Strategy",
        "Design Leadership",
        "AI Workflows",
        "Team Scaling",
        "Product Design",
        "Brand Design",
        "Digital Design",
        "Design Direction",
        "Figma",
        "Prototyping",
        "User Research",
        "Design Ops",
        "Frontend Development",
    ],

    experience_years: 15,

    sectors: [
        "fintech",
        "e-commerce",
        "cryptocurrency",
        "fashion",
        "b2b saas",
        "hr-tech",
        "automotive",
        "retail",
    ],

    notable_companies: [
        "IKEA",
        "Helmut Lang",
        "Android",
        "Jaguar",
        "Simployer",
    ],

    current_role: "Senior Product Designer at Simployer",
    linkedin: "https://www.linkedin.com/in/rasmussjoborg/",

    location: {
        // Tier 1: Remote in/around Europe (CET ±3h timezone)
        tier1_remote: true,
        // Tier 2: Stockholm only
        tier2_stockholm: true,
        // Tier 3: Relocation with support
        tier3_relocation_if_supported: true,
    },

    // Geographic constraint for remote jobs
    remote_regions: ["Europe", "EMEA", "UK", "EU", "Nordics", "Scandinavia"],
    reject_regions: ["US", "USA", "United States", "Americas only", "US timezone"],

    // Search queries — rotated daily to stay within free API limits
    // 7 queries, 1 per day + any leftover budget
    search_queries: [
        "Head of Design remote Europe",
        "Design Director remote EMEA",
        "VP Design remote Europe",
        "Product Design Lead Stockholm",
        "Senior Product Designer remote Europe",
        "Design Systems Lead remote",
        "UX Director remote Europe",
    ],

    // Seniority-level keywords that signal a good match
    seniority_signals: [
        "head of",
        "director",
        "vp",
        "vice president",
        "lead",
        "principal",
        "senior",
        "staff",
        "manager",
    ],
};
