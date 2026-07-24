import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Point this at your machine's LAN IP when testing on a physical device —
// 'localhost' only works in the iOS simulator. e.g. http://192.168.1.20:5000
export const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE_URL });

// Attach the stored JWT to every outgoing request automatically.
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token has expired the API returns 401 — clear storage so the
// app falls back to the login screen next render.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user']);
    }
    return Promise.reject(error);
  }
);

export default api;
