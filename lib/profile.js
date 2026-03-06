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
        // Tier 1: Remote — highest priority
        tier1_remote: true,
        // Tier 2: Stockholm only
        tier2_stockholm: true,
        // Tier 3: Relocation with support
        tier3_relocation_if_supported: true,
    },

    // Search queries — rotated daily to stay within free API limits
    // 7 queries, 1 per day + any leftover budget
    search_queries: [
        "Head of Design remote",
        "Design Director remote",
        "VP Design remote",
        "Product Design Lead Stockholm",
        "Senior Product Designer remote",
        "Design Systems Lead remote",
        "UX Director remote",
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
