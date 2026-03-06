// Daily job fetch — triggered by Vercel Cron (0 7 * * *)
// Fetches jobs from JSearch API, scores with Gemini, stores in KV

import { profile } from "../../lib/profile.js";
import { scoreJob } from "../../lib/scorer.js";
import { storeJob, jobExists, setLastSync, clearAllJobs } from "../../lib/kv.js";

const JSEARCH_API_URL = "https://jsearch.p.rapidapi.com/search";

// Vercel Hobby allows up to 60s for serverless functions
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
    // Verify this is a cron invocation or has auth
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;

    // Vercel cron sends the CRON_SECRET as Authorization header
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        // Also allow manual trigger with JOBRADAR_TOKEN
        const dashToken = process.env.JOBRADAR_TOKEN;
        if (!dashToken || authHeader !== `Bearer ${dashToken}`) {
            return res.status(401).json({ error: "Unauthorized" });
        }
    }

    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (!rapidApiKey) {
        return res.status(500).json({ error: "RAPIDAPI_KEY not configured" });
    }

    try {
        // Check for reset flag (clears all jobs to allow re-scoring)
        const resetParam = req.query?.reset || req.url?.includes('reset=true');
        if (resetParam) {
            const cleared = await clearAllJobs();
            console.log(`[JobFetch] Reset: cleared ${cleared} existing jobs`);
        }

        // Pick today's search query (rotate daily)
        const dayOfWeek = new Date().getDay(); // 0-6
        const query = profile.search_queries[dayOfWeek % profile.search_queries.length];

        console.log(`[JobFetch] Running query: "${query}"`);

        // Fetch jobs from JSearch
        const searchResponse = await fetch(
            `${JSEARCH_API_URL}?query=${encodeURIComponent(query)}&page=1&num_pages=1&date_posted=week`,
            {
                method: "GET",
                headers: {
                    "x-rapidapi-key": rapidApiKey,
                    "x-rapidapi-host": "jsearch.p.rapidapi.com",
                },
            }
        );

        if (!searchResponse.ok) {
            const errorText = await searchResponse.text();
            console.error("[JobFetch] JSearch error:", searchResponse.status, errorText);
            return res.status(502).json({ error: "JSearch API error", status: searchResponse.status });
        }

        const searchData = await searchResponse.json();
        const jobs = searchData.data || [];
        console.log(`[JobFetch] Found ${jobs.length} listings`);

        let newJobs = 0;
        let skippedDupes = 0;

        // Filter out existing jobs first
        const jobsToScore = [];
        for (const job of jobs) {
            const jobId = generateJobId(job);
            if (await jobExists(jobId)) {
                skippedDupes++;
            } else {
                jobsToScore.push({ job, jobId });
            }
        }

        // Score in parallel batches of 3 to stay within rate limits
        const BATCH_SIZE = 3;
        for (let i = 0; i < jobsToScore.length; i += BATCH_SIZE) {
            const batch = jobsToScore.slice(i, i + BATCH_SIZE);
            const results = await Promise.all(
                batch.map(async ({ job, jobId }) => {
                    const scoring = await scoreJob(job);
                    return {
                        id: jobId,
                        title: job.job_title || "Unknown Title",
                        company: job.employer_name || "Unknown Company",
                        companyLogo: job.employer_logo || null,
                        location: formatLocation(job),
                        isRemote: job.job_is_remote || false,
                        type: job.job_employment_type || "Unknown",
                        description: (job.job_description || "").substring(0, 1000),
                        applyUrl: job.job_apply_link || job.job_google_link || null,
                        linkedinUrl: job.job_google_link || null,
                        postedAt: job.job_posted_at_datetime_utc || null,
                        fetchedAt: new Date().toISOString(),
                        searchQuery: query,
                        score: scoring.score,
                        reasoning: scoring.reasoning,
                        locationTier: scoring.locationTier,
                        sector: scoring.sector || "Unknown",
                        companyDescription: scoring.companyDescription || "",
                        status: "new",
                        statusUpdatedAt: null,
                    };
                })
            );

            for (const jobRecord of results) {
                // Skip tier 0 jobs (rejected locations like US/Americas)
                if (jobRecord.locationTier === 0) {
                    console.log(`[JobFetch] Skipping ${jobRecord.title} — tier 0 (${jobRecord.location})`);
                    continue;
                }
                await storeJob(jobRecord);
                newJobs++;
            }
        }

        // Update last sync timestamp
        await setLastSync(new Date().toISOString());

        const summary = {
            query,
            totalFound: jobs.length,
            newJobs,
            skippedDupes,
            timestamp: new Date().toISOString(),
        };

        console.log("[JobFetch] Complete:", summary);
        return res.status(200).json(summary);
    } catch (error) {
        console.error("[JobFetch] Error:", error);
        return res.status(500).json({ error: error.message });
    }
}

/**
 * Generate a stable ID for deduplication
 */
function generateJobId(job) {
    const raw = `${job.employer_name || ""}-${job.job_title || ""}-${job.job_id || ""}`.toLowerCase();
    // Simple hash
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        const char = raw.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

/**
 * Format location string
 */
function formatLocation(job) {
    const parts = [job.job_city, job.job_state, job.job_country].filter(Boolean);
    if (job.job_is_remote) {
        return parts.length > 0 ? `Remote (${parts.join(", ")})` : "Remote";
    }
    return parts.join(", ") || "Not specified";
}
