// This shared Axios client keeps API calls consistent across the app.
// `withCredentials` matters here because auth is cookie-based, not token-in-local-storage based.
import axios from "axios";

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});

export default axiosClient;
