import axios from "axios";

// Relative so requests always go to the domain the app is served from
// (localhost, preview deploys, production). Only used from client components.
const baseUrl = "/api";

const axiosInstance = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;
