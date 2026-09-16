import axios from "axios";
import { API_HOST } from "./ip";

const api = axios.create({
  baseURL: "http://10.196.109.60:8000/",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  timeout: 10000,
});

export default api;
export { api };