// Coincide con LoginRequest.java del backend
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string; 
  names: string;
  lastnames: string;
}

// Coincide con AuthResponse.java del backend
export interface AuthResponse {
  token: string;
}