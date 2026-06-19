import axios from "axios";

// =========================
// BASE API
// =========================

const api = axios.create({
  baseURL: "http://10.13.93.81:8000/",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  timeout: 10000,
});


export default api;
export { api };
