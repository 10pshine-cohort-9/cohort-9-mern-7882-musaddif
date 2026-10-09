import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true, // send/receive httpOnly auth cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// Tokens live in httpOnly cookies set by the server, so JavaScript never
// reads or writes them. This helper simply wipes stale persisted auth state
// and redirects to login when a session can no longer be refreshed.
const clearSession = () => {
    try {
        localStorage.removeItem('persist:notes-auth');
    } catch {
        // ignore storage errors
    }
    if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
    }
};

const isAuthUrl = (url) => typeof url === 'string' && url.startsWith('/auth/');

let refreshInFlight = null;

const refreshTokens = async () => {
    const { data } = await api.post('/auth/refresh');
    return data;
};

const waitForInFlightRefresh = (config) =>
    refreshInFlight.then(() => api(config));

api.interceptors.response.use((response) => response, (error) => {
    const { response, config } = error;
    if (!response || response.status !== 401 || !config || config._retry || isAuthUrl(config.url)) {
        return Promise.reject(error);
    }

    config._retry = true;

    if (refreshInFlight) {
        return waitForInFlightRefresh(config);
    }

    refreshInFlight = refreshTokens()
        .then(() => api(config))
        .catch((refreshError) => {
            clearSession();
            return Promise.reject(refreshError);
        })
        .finally(() => {
            refreshInFlight = null;
        });

    return refreshInFlight;
});

export default api;