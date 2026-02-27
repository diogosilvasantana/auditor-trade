const API_BASE = '/api';

async function request<T>(
    endpoint: string,
    options?: RequestInit,
): Promise<T> {
    const headers: any = { ...options?.headers };
    if (!(options?.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
        credentials: 'include',
        headers,
        ...options,
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || `HTTP ${res.status}`);
    }

    const text = await res.text();
    return text ? JSON.parse(text) : ({} as T);
}

// Auth
export const auth = {
    register: (email: string, password: string) =>
        request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    login: (email: string, password: string) =>
        request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    logout: () => request('/auth/logout', { method: 'POST' }),

    me: () => request('/auth/me'),
};

// Accounts
export const accounts = {
    list: () => request<any[]>('/accounts'),
    create: (data: any) => request('/accounts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/accounts/${id}`, { method: 'DELETE' }),
};

// Imports
export const imports = {
    upload: (file: File, accountId?: string, newAccountCategory?: string) => {
        const form = new FormData();
        form.append('file', file);
        if (accountId) form.append('accountId', accountId);
        if (newAccountCategory) form.append('newAccountCategory', newAccountCategory);
        return request('/imports', {
            method: 'POST',
            body: form,
            headers: {}, // Let browser set Content-Type with boundary
        });
    },

    list: () => request('/imports'),
    get: (id: string) => request(`/imports/${id}`),
    delete: (id: string) => request(`/imports/${id}`, { method: 'DELETE' }),
};

// Analytics
export const analytics = {
    overview: (start?: string, end?: string, accountId?: string) => {
        const p = new URLSearchParams();
        if (start) p.set('start', start);
        if (end) p.set('end', end);
        if (accountId) p.set('accountId', accountId);
        return request(`/analytics/overview?${p}`);
    },

    bySymbol: (start?: string, end?: string, accountId?: string) => {
        const p = new URLSearchParams();
        if (start) p.set('start', start);
        if (end) p.set('end', end);
        if (accountId) p.set('accountId', accountId);
        return request(`/analytics/by-symbol?${p}`);
    },

    heatmap: (opts?: { start?: string; end?: string; symbol?: string; bucket?: number; accountId?: string }) => {
        const p = new URLSearchParams();
        if (opts?.start) p.set('start', opts.start);
        if (opts?.end) p.set('end', opts.end);
        if (opts?.symbol) p.set('symbol', opts.symbol);
        if (opts?.bucket) p.set('bucket', String(opts.bucket));
        if (opts?.accountId) p.set('accountId', opts.accountId);
        return request(`/analytics/heatmap?${p}`);
    },

    byWeekday: (start?: string, end?: string, accountId?: string) => {
        const p = new URLSearchParams();
        if (start) p.set('start', start);
        if (end) p.set('end', end);
        if (accountId) p.set('accountId', accountId);
        return request(`/analytics/by-weekday?${p}`);
    },

    trades: (start?: string, end?: string, accountId?: string) => {
        const p = new URLSearchParams();
        if (start) p.set('start', start);
        if (end) p.set('end', end);
        if (accountId) p.set('accountId', accountId);
        return request(`/analytics/trades?${p}`);
    },
};

// Insights
export const insights = {
    get: (start?: string, end?: string, accountId?: string) => {
        const p = new URLSearchParams();
        if (start) p.set('start', start);
        if (end) p.set('end', end);
        if (accountId) p.set('accountId', accountId);
        return request(`/insights?${p}`);
    },
};

// Plans
export const plans = {
    getActive: (accountId?: string) => {
        const p = new URLSearchParams();
        if (accountId) p.set('accountId', accountId);
        return request(`/plans/active?${p}`);
    },
    create: (data: unknown) =>
        request('/plans', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) =>
        request(`/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    violations: (start?: string, end?: string, accountId?: string) => {
        const p = new URLSearchParams();
        if (start) p.set('start', start);
        if (end) p.set('end', end);
        if (accountId) p.set('accountId', accountId);
        return request(`/plans/violations?${p}`);
    },
};

// Prop Challenges
export const prop = {
    list: () => request<any[]>('/prop-challenges'),
    create: (data: unknown) =>
        request('/prop-challenges', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) =>
        request(`/prop-challenges/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/prop-challenges/${id}`, { method: 'DELETE' }),
    getPlan: (id: string) => request(`/prop-challenges/${id}/plan`),
    getProgress: (id: string, start?: string, end?: string) => {
        const p = new URLSearchParams();
        if (start) p.set('start', start);
        if (end) p.set('end', end);
        return request(`/prop-challenges/${id}/progress?${p}`);
    },
};

// Journal
export const journal = {
    list: (start?: string, end?: string, accountId?: string) => {
        const p = new URLSearchParams();
        if (start) p.set('start', start);
        if (end) p.set('end', end);
        if (accountId) p.set('accountId', accountId);
        return request(`/journal?${p}`);
    },
    getByDate: (date: string, accountId?: string) => {
        const p = new URLSearchParams();
        if (accountId) p.set('accountId', accountId);
        return request(`/journal/${date}?${p}`);
    },
    create: (data: unknown) =>
        request('/journal', { method: 'POST', body: JSON.stringify(data) }),
};
