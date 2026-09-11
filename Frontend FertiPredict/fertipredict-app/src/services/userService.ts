import { api } from "./api";

export interface UserDTO {
  id: number;
  username: string; // Correo electrónico
  names: string;
  lastnames: string;
  role?: string;
}

export interface UpdateUserRequest {
  username: string;
  names: string;
  lastnames: string;
  password?: string;
}

export const userService = {
  async getMe(): Promise<UserDTO> {
    const response = await api.get<UserDTO>("/api/v1/user/me");
    return response.data;
  },
  
  async updateUser(data: UpdateUserRequest): Promise<{ message: string }> {
    const response = await api.put("/api/v1/user", data);
    window.dispatchEvent(new Event("fertipredict:profile-updated"));
    return response.data;
  }
};
