// Gemini-powered job scoring logic
// Takes a job listing + profile, returns a relevance score with reasoning

import { profile } from "./profile.js";

const GEMINI_API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Score a job listing against the profile using Gemini API
 * @param {Object} job - Job listing from JSearch
 * @returns {Promise<{score: number, reasoning: string, locationTier: number}>}
 */
export async function scoreJob(job) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    const prompt = buildScoringPrompt(job);

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "object",
                        properties: {
                            score: {
                                type: "integer",
                                description: "Match score from 0-100",
                            },
                            reasoning: {
                                type: "string",
                                description:
                                    "One-sentence explanation of why this score was given",
                            },
                            locationTier: {
                                type: "integer",
                                description:
                                    "1=remote, 2=Stockholm, 3=relocation supported, 0=bad location match",
                            },
                        },
                        required: ["score", "reasoning", "locationTier"],
                    },
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Gemini API error:", response.status, errorText);
            return fallbackScore(job);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.error("No text in Gemini response");
            return fallbackScore(job);
        }

        const result = JSON.parse(text);
        return {
            score: Math.min(100, Math.max(0, result.score)),
            reasoning: result.reasoning || "No reasoning provided",
            locationTier: result.locationTier || 0,
        };
    } catch (error) {
        console.error("Scoring error:", error.message);
        return fallbackScore(job);
    }
}

/**
 * Build the scoring prompt for Gemini
 */
function buildScoringPrompt(job) {
    return `You are a job-match scoring system. Score how well this job listing matches the candidate profile.

## Candidate Profile
- Name: ${profile.name}
- Current Title: ${profile.title}
- Current Role: ${profile.current_role}
- Experience: ${profile.experience_years}+ years
- Core Skills: ${profile.skills.join(", ")}
- Sectors: ${profile.sectors.join(", ")}
- Notable Companies: ${profile.notable_companies.join(", ")}
- Seniority signals that are a good match: ${profile.seniority_signals.join(", ")}

## Location Preferences (in priority order)
1. Remote (tier 1) — strongly preferred
2. Stockholm, Sweden (tier 2) — acceptable
3. Other locations ONLY if relocation support is explicitly mentioned in the listing (tier 3)
4. On-site in non-Stockholm locations without relocation support = tier 0 (poor match)

## Job Listing
- Title: ${job.job_title || "Unknown"}
- Company: ${job.employer_name || "Unknown"}
- Location: ${job.job_city || ""}, ${job.job_state || ""}, ${job.job_country || ""}
- Remote: ${job.job_is_remote ? "Yes" : "No"}
- Type: ${job.job_employment_type || "Unknown"}
- Description: ${(job.job_description || "").substring(0, 2000)}

## Scoring Rules
- Score 0-100 where 100 = perfect match
- Role/title match: up to 35 points (design leadership roles score highest)
- Skills overlap: up to 25 points
- Location fit: up to 25 points (remote=25, Stockholm=20, relocation=10, other=0)
- Company/industry fit: up to 15 points
- Penalize heavily if the role is junior-level or unrelated to design/product
- A job explicitly requiring relocation without mentioning relocation support = score penalty

Return a JSON object with: score (integer 0-100), reasoning (one sentence), locationTier (1/2/3/0).`;
}

/**
 * Fallback scoring when Gemini is unavailable — keyword-based heuristic
 */
function fallbackScore(job) {
    let score = 30; // base score
    const title = (job.job_title || "").toLowerCase();
    const desc = (job.job_description || "").toLowerCase();

    // Title matching
    const titleKeywords = [
        "design",
        "ux",
        "ui",
        "product",
        "creative",
        "brand",
    ];
    const seniorKeywords = [
        "head",
        "director",
        "vp",
        "lead",
        "principal",
        "senior",
        "staff",
        "manager",
    ];

    if (titleKeywords.some((k) => title.includes(k))) score += 20;
    if (seniorKeywords.some((k) => title.includes(k))) score += 15;

    // Skills matching
    const skillHits = profile.skills.filter((s) =>
        desc.includes(s.toLowerCase())
    ).length;
    score += Math.min(20, skillHits * 4);

    // Location
    let locationTier = 0;
    if (job.job_is_remote) {
        locationTier = 1;
        score += 15;
    } else if (
        (job.job_city || "").toLowerCase().includes("stockholm")
    ) {
        locationTier = 2;
        score += 10;
    } else if (desc.includes("relocation")) {
        locationTier = 3;
        score += 5;
    }

    return {
        score: Math.min(100, score),
        reasoning: "Scored by keyword fallback (Gemini unavailable)",
        locationTier,
    };
}
