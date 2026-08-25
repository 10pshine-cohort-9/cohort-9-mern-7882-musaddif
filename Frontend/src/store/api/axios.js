
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ,
    headers: {
        'Content-Type': 'application/json',
    },
});


api.interceptors.request.use((config) => {
    try {
        const persistAuth = localStorage.getItem('persist:auth');
        if (persistAuth) {
            const authState = JSON.parse(persistAuth);
            const token = JSON.parse(authState.token);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
    } catch (error) {
        console.error("Error reading token from local storage:", error);
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
