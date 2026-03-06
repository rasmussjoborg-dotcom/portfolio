// Dashboard client-side logic
// Auth, data fetching, rendering, filtering, and actions

(function () {
    'use strict';

    const API_BASE = '/api/jobs';
    const TOKEN_KEY = 'jobRadar_token';

    // State
    let token = localStorage.getItem(TOKEN_KEY) || '';
    let allJobs = [];
    let filters = {
        location: 'all',
        status: 'new',
        minScore: 0,
    };

    // ── Elements ──
    const authGate = document.getElementById('authGate');
    const authForm = document.getElementById('authForm');
    const tokenInput = document.getElementById('tokenInput');
    const authError = document.getElementById('authError');
    const dashboard = document.getElementById('dashboard');
    const jobList = document.getElementById('jobList');
    const emptyState = document.getElementById('emptyState');
    const loadingState = document.getElementById('loadingState');
    const lastSyncEl = document.getElementById('lastSync');
    const manualFetchBtn = document.getElementById('manualFetch');
    const scoreSlider = document.getElementById('scoreSlider');
    const scoreValueEl = document.getElementById('scoreValue');

    // Stats
    const statTotal = document.getElementById('statTotal');
    const statAvg = document.getElementById('statAvg');
    const statApplied = document.getElementById('statApplied');
    const statDismissed = document.getElementById('statDismissed');

    // ── Init ──
    if (token) {
        showDashboard();
    }

    // ── Auth ──
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        token = tokenInput.value.trim();
        if (!token) return;

        localStorage.setItem(TOKEN_KEY, token);
        authError.hidden = true;

        try {
            await fetchJobs();
            showDashboard();
        } catch (err) {
            localStorage.removeItem(TOKEN_KEY);
            token = '';
            authError.hidden = false;
        }
    });

    function showDashboard() {
        authGate.hidden = true;
        dashboard.hidden = false;
        fetchJobs();
    }

    // ── Fetch Jobs ──
    async function fetchJobs() {
        showLoading(true);

        try {
            const res = await fetch(API_BASE, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 401) {
                // Token invalid
                localStorage.removeItem(TOKEN_KEY);
                token = '';
                authGate.hidden = false;
                dashboard.hidden = true;
                authError.hidden = false;
                return;
            }

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            allJobs = data.jobs || [];

            // Update stats
            const meta = data.meta || {};
            statTotal.textContent = meta.total ?? allJobs.length;
            statAvg.textContent = meta.averageScore ?? '—';
            statApplied.textContent = meta.appliedCount ?? 0;
            statDismissed.textContent = meta.dismissedCount ?? 0;

            // Update last sync
            if (meta.lastSync) {
                const syncDate = new Date(meta.lastSync);
                lastSyncEl.textContent = `Last sync: ${formatRelativeTime(syncDate)}`;
            }

            renderJobs();
        } catch (err) {
            console.error('Failed to fetch jobs:', err);
            jobList.innerHTML = `<p style="color: #f87171; font-family: var(--font-mono); font-size: 0.85rem;">Error loading jobs: ${err.message}</p>`;
        } finally {
            showLoading(false);
        }
    }

    // ── Render Jobs ──
    function renderJobs() {
        const filtered = applyFilters(allJobs);

        if (filtered.length === 0) {
            jobList.innerHTML = '';
            emptyState.hidden = false;
            return;
        }

        emptyState.hidden = true;
        jobList.innerHTML = filtered.map(renderJobCard).join('');

        // Attach event listeners
        jobList.querySelectorAll('[data-action]').forEach((btn) => {
            btn.addEventListener('click', handleAction);
        });
    }

    function renderJobCard(job) {
        const scoreClass = job.score >= 80 ? 'high' : job.score >= 60 ? 'mid' : 'low';
        const statusClass = job.status === 'dismissed' ? 'dismissed' : job.status === 'applied' ? 'applied' : '';
        const locationTag = getLocationTag(job);
        const postedDate = job.postedAt ? formatRelativeTime(new Date(job.postedAt)) : '';

        return `
      <div class="job-card ${statusClass}" data-id="${job.id}">
        <div class="score-badge ${scoreClass}">${job.score}</div>
        <div class="job-info">
          <div class="job-title">${escapeHtml(job.title)}</div>
          <div class="job-company">
            ${job.companyLogo ? `<img src="${job.companyLogo}" class="job-company-logo" alt="" onerror="this.style.display='none'">` : ''}
            ${escapeHtml(job.company)}
          </div>
          <div class="job-meta">
            ${locationTag}
            ${job.type ? `<span class="job-tag">${escapeHtml(job.type)}</span>` : ''}
            ${postedDate ? `<span class="job-tag">${postedDate}</span>` : ''}
            ${job.status === 'applied' ? '<span class="job-tag" style="color: #818cf8; border-color: rgba(129,140,248,0.3);">✓ Applied</span>' : ''}
          </div>
          <div class="job-reasoning">"${escapeHtml(job.reasoning)}"</div>
        </div>
        <div class="job-actions">
          ${job.status === 'new' ? `
            ${job.applyUrl ? `<a href="${job.applyUrl}" target="_blank" rel="noopener" class="job-action-btn apply" onclick="event.stopPropagation()">Apply →</a>` : ''}
            <button class="job-action-btn dismiss" data-action="dismissed" data-id="${job.id}">Dismiss</button>
          ` : `
            <button class="job-action-btn undo" data-action="new" data-id="${job.id}">↩ Undo</button>
          `}
        </div>
      </div>
    `;
    }

    function getLocationTag(job) {
        if (job.locationTier === 1 || job.isRemote) {
            return `<span class="job-tag remote">🌍 ${escapeHtml(job.location)}</span>`;
        }
        if (job.locationTier === 2) {
            return `<span class="job-tag stockholm">📍 ${escapeHtml(job.location)}</span>`;
        }
        if (job.locationTier === 3) {
            return `<span class="job-tag relocation">✈️ ${escapeHtml(job.location)}</span>`;
        }
        return `<span class="job-tag">${escapeHtml(job.location)}</span>`;
    }

    // ── Filters ──
    function applyFilters(jobs) {
        return jobs.filter((job) => {
            // Location filter
            if (filters.location !== 'all') {
                const tierMap = { remote: 1, stockholm: 2, relocation: 3 };
                if (job.locationTier !== tierMap[filters.location]) return false;
            }

            // Status filter
            if (filters.status !== 'all' && job.status !== filters.status) return false;

            // Min score
            if (job.score < filters.minScore) return false;

            return true;
        });
    }

    // Filter pill clicks
    document.querySelectorAll('.filter-pills').forEach((group) => {
        group.addEventListener('click', (e) => {
            const pill = e.target.closest('.filter-pill');
            if (!pill) return;

            // Toggle active state within group
            group.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('active'));
            pill.classList.add('active');

            const filterType = group.id === 'locationFilter' ? 'location' : 'status';
            filters[filterType] = pill.dataset.value;
            renderJobs();
        });
    });

    // Score slider
    scoreSlider.addEventListener('input', () => {
        filters.minScore = parseInt(scoreSlider.value, 10);
        scoreValueEl.textContent = scoreSlider.value;
        renderJobs();
    });

    // ── Actions ──
    async function handleAction(e) {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const jobId = btn.dataset.id;
        const action = btn.dataset.action;

        btn.disabled = true;
        btn.textContent = '...';

        try {
            const res = await fetch(`${API_BASE}/action`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ jobId, action }),
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            // Update local state
            const job = allJobs.find((j) => j.id === jobId);
            if (job) {
                job.status = action;
                job.statusUpdatedAt = new Date().toISOString();
            }

            // Update stats
            statApplied.textContent = allJobs.filter((j) => j.status === 'applied').length;
            statDismissed.textContent = allJobs.filter((j) => j.status === 'dismissed').length;

            renderJobs();
        } catch (err) {
            console.error('Action failed:', err);
            btn.disabled = false;
            btn.textContent = action === 'dismissed' ? 'Dismiss' : '↩ Undo';
        }
    }

    // Manual fetch
    manualFetchBtn.addEventListener('click', async () => {
        manualFetchBtn.classList.add('loading');
        manualFetchBtn.disabled = true;

        try {
            const res = await fetch(`${API_BASE}/fetch`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const result = await res.json();
            console.log('Manual fetch result:', result);

            // Refresh the job list
            await fetchJobs();
        } catch (err) {
            console.error('Manual fetch failed:', err);
        } finally {
            manualFetchBtn.classList.remove('loading');
            manualFetchBtn.disabled = false;
        }
    });

    // ── Utilities ──
    function showLoading(show) {
        loadingState.hidden = !show;
        if (show) {
            jobList.innerHTML = '';
            emptyState.hidden = true;
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function formatRelativeTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
})();
