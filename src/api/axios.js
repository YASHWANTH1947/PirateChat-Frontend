import axios from "axios";

let getAuthToken = null;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
});

api.interceptors.request.use(async (config) => {
  const token = getAuthToken ? await getAuthToken() : null;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const setApiTokenGetter = (tokenGetter) => {
  getAuthToken = tokenGetter;
};

export default api;
export { setApiTokenGetter };
