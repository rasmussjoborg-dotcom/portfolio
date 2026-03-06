// POST /api/jobs/action — Mark jobs as applied or dismissed

import { updateJobStatus, getJob } from "../../lib/kv.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Auth check
    const authHeader = req.headers.authorization;
    const dashToken = process.env.JOBRADAR_TOKEN;

    if (!dashToken || authHeader !== `Bearer ${dashToken}`) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const { jobId, action } = req.body;

        if (!jobId || !action) {
            return res.status(400).json({ error: "jobId and action are required" });
        }

        if (!["applied", "dismissed", "new"].includes(action)) {
            return res
                .status(400)
                .json({ error: "action must be 'applied', 'dismissed', or 'new'" });
        }

        const updatedJob = await updateJobStatus(jobId, action);

        if (!updatedJob) {
            return res.status(404).json({ error: "Job not found" });
        }

        return res.status(200).json({ success: true, job: updatedJob });
    } catch (error) {
        console.error("[Action API] Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
