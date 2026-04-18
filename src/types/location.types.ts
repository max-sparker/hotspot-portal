export interface Location {
  id: number;
  name: string;
  location_type: 'dorm' | 'cafe';
  is_paid: boolean;
  price_per_week: number;
  free_minutes: number;
  mikrotik_ip: string;
  created_at: Date;
}
