export interface LoginRequest {
    username: string;
    password: string;
  }
  
  export interface LoginResponse {
    token: string;
    expiresAt: string;
    userId: number;
    fullName: string;
    username: string;
    role: string;
  }