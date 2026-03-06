// GET /api/jobs — Returns stored jobs for the dashboard
// Supports filtering by location tier and minimum score

import { getAllJobs, getLastSync } from "../../lib/kv.js";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Auth check
    const authHeader = req.headers.authorization;
    const dashToken = process.env.JOBRADAR_TOKEN;

    if (!dashToken || authHeader !== `Bearer ${dashToken}`) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        let jobs = await getAllJobs();

        // Apply filters from query params
        const { location, min_score, status, sort } = req.query;

        // Filter by location tier
        if (location) {
            const tierMap = { remote: 1, stockholm: 2, relocation: 3 };
            const tier = tierMap[location.toLowerCase()];
            if (tier) {
                jobs = jobs.filter((j) => j.locationTier === tier);
            }
        }

        // Filter by minimum score
        if (min_score) {
            const minScore = parseInt(min_score, 10);
            if (!isNaN(minScore)) {
                jobs = jobs.filter((j) => j.score >= minScore);
            }
        }

        // Filter by status
        if (status && status !== "all") {
            jobs = jobs.filter((j) => j.status === status);
        }

        // Sort (default: score descending)
        const sortField = sort || "score";
        if (sortField === "score") {
            jobs.sort((a, b) => b.score - a.score);
        } else if (sortField === "date") {
            jobs.sort(
                (a, b) => new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime()
            );
        }

        // Get last sync info
        const lastSync = await getLastSync();

        return res.status(200).json({
            jobs,
            meta: {
                total: jobs.length,
                lastSync,
                averageScore:
                    jobs.length > 0
                        ? Math.round(jobs.reduce((sum, j) => sum + j.score, 0) / jobs.length)
                        : 0,
                appliedCount: jobs.filter((j) => j.status === "applied").length,
                dismissedCount: jobs.filter((j) => j.status === "dismissed").length,
            },
        });
    } catch (error) {
        console.error("[Jobs API] Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
