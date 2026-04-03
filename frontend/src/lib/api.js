import axios from "axios";

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const API_BASE_URL = configuredBaseUrl.replace(/\/$/, "");

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
});

export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return token ? { Authorization: `Bearer ${token}` } : {};
};
