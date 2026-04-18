export interface User {
  id: number;
  mac_address: string;
  phone: string | null;
  phone_verified: boolean;
  email: string | null;
  created_at: Date;
}

export interface CreateUserDto {
  mac_address: string;
  phone?: string;
  email?: string;
}

export interface UserSession {
  id: number;
  user_id: number;
  location_id: number;
  start_time: Date;
  paid_until: Date | null;
  is_active: boolean;
  created_at: Date;
}
