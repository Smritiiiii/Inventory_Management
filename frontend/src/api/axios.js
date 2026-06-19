import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

api.interceptors.request.use((config) => {
  // Don't add token for login/register endpoints
  const publicEndpoints = ["/auth/login/", "/auth/register/"];
  const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));
  
  if (!isPublicEndpoint) {
    const token = localStorage.getItem("access");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
