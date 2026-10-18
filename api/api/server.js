import axios from "axios";
import { API_HOST_WEB } from "./ip";

const api = axios.create({
  baseURL: API_HOST_WEB,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  timeout: 10000,
});

export default api;
export { api };
