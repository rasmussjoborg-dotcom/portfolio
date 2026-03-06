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
        // Tier 1: Remote within Europe/EMEA (strongly preferred)
        tier1_remote_europe: true,
        // Tier 2: Stockholm — hybrid or remote acceptable
        tier2_stockholm_hybrid_or_remote: true,
        // Tier 3: Dubai or Singapore — only with relocation package
        tier3_dubai_singapore_with_relocation: true,
    },

    // Geographic constraints
    preferred_regions: ["Europe", "EMEA", "UK", "EU", "Nordics", "Scandinavia", "Stockholm", "Dubai", "UAE", "Singapore"],
    relocation_required_regions: ["Dubai", "UAE", "Singapore"],
    reject_regions: ["US", "USA", "United States", "Americas only", "US timezone", "Canada", "LATAM"],

    // Search queries — rotated daily (14 queries = 2-week cycle)
    search_queries: [
        "Head of Design remote",
        "Design Director remote",
        "VP Design remote",
        "Product Design Lead Stockholm",
        "Senior Product Designer remote",
        "Design Systems Lead remote",
        "UX Director remote",
        "Creative Director digital remote",
        "Head of Product Design remote",
        "Principal Product Designer remote",
        "Director of UX remote",
        "AI Design Lead remote",
        "Staff Product Designer remote",
        "Design Manager remote",
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
        "chief",
        "creative director",
        "design ops",
        "design manager",
    ],
};
