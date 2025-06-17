import axios from "axios";

const api = axios.create({
    baseURL: "http://192.168.0.159:4000/api", // Заміни на свій backend
});

api.interceptors.request.use((config) => {
    // @ts-ignore
    const token = global.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default api;