import { api } from "./api";
import type { PredictionDTO } from "../types/prediction";

export const predictionService = {
  async getAll(): Promise<PredictionDTO[]> {
    const response = await api.get<PredictionDTO[]>("/api/v1/prediction");
    return response.data || [];
  },

  async getById(id: number): Promise<PredictionDTO> {
    const response = await api.get<PredictionDTO>(`/api/v1/prediction/${id}`);
    return response.data;
  },

  async create(data: Partial<PredictionDTO>): Promise<PredictionDTO> {
    const response = await api.post<PredictionDTO>("/api/v1/prediction/register", data);
    return response.data;
  },

  async update(id: number, data: Partial<PredictionDTO>): Promise<PredictionDTO> {
    const response = await api.put<PredictionDTO>(`/api/v1/prediction/${id}`, data);
    return response.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/api/v1/prediction/${id}`);
  },
};
