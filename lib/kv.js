// Vercel KV helpers — thin wrapper around Vercel KV REST API
// Uses the free tier (3,000 requests/day)

const KV_REST_API_URL = process.env.KV_REST_API_URL;
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;

async function kvRequest(command, args) {
    if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
        throw new Error("Vercel KV environment variables are not set");
    }

    const response = await fetch(`${KV_REST_API_URL}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${KV_REST_API_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify([command, ...args]),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`KV error: ${response.status} ${text}`);
    }

    const data = await response.json();
    return data.result;
}

/**
 * Get all stored jobs
 */
export async function getAllJobs() {
    const keys = await kvRequest("KEYS", ["job:*"]);
    if (!keys || keys.length === 0) return [];

    // Use MGET to fetch all jobs in one request
    const values = await kvRequest("MGET", keys);
    return values.filter(Boolean).map((v) => (typeof v === "string" ? JSON.parse(v) : v));
}

/**
 * Get a single job by ID
 */
export async function getJob(jobId) {
    const value = await kvRequest("GET", [`job:${jobId}`]);
    if (!value) return null;
    return typeof value === "string" ? JSON.parse(value) : value;
}

/**
 * Store a job (with 30-day TTL)
 */
export async function storeJob(job) {
    const key = `job:${job.id}`;
    const ttl = 60 * 60 * 24 * 30; // 30 days in seconds
    await kvRequest("SET", [key, JSON.stringify(job), "EX", ttl]);
}

/**
 * Update a job's status (applied/dismissed)
 */
export async function updateJobStatus(jobId, status) {
    const job = await getJob(jobId);
    if (!job) return null;

    job.status = status;
    job.statusUpdatedAt = new Date().toISOString();
    await storeJob(job);
    return job;
}

/**
 * Check if a job already exists (for dedup)
 */
export async function jobExists(jobId) {
    const result = await kvRequest("EXISTS", [`job:${jobId}`]);
    return result === 1;
}

/**
 * Store the last sync timestamp
 */
export async function setLastSync(timestamp) {
    await kvRequest("SET", ["meta:lastSync", timestamp]);
}

/**
 * Get the last sync timestamp
 */
export async function getLastSync() {
    return await kvRequest("GET", ["meta:lastSync"]);
}
