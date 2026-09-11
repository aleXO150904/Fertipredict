import { api } from "./api";
import axios from "axios";
// Recovery must work even when an expired access token is stored locally.
const publicApi = axios.create({ baseURL: api.defaults.baseURL, timeout: 30000 });
import type { LoginRequest, AuthResponse, RegisterRequest } from "../types/auth";

export const authService = {
  async forgotPassword(email: string): Promise<void> {
    await publicApi.post("/auth/forgot-password", { email });
  },
  async resetPassword(token: string, password: string): Promise<void> {
    await publicApi.post("/auth/reset-password", { token, password });
  },
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", data);
    return response.data;
  },
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/register", data);
    return response.data;
  }
}