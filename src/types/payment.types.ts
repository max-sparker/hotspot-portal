export interface Payment {
  id: number;
  user_id: number;
  location_id: number;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  payment_id: string | null;
  yookassa_payment_id: string | null;
  created_at: Date;
  completed_at: Date | null;
}

export interface CreatePaymentDto {
  user_id: number;
  location_id: number;
  amount: number;
}

export interface YookassaWebhookEvent {
  type: string;
  event: string;
  object: {
    id: string;
    status: string;
    paid: boolean;
    amount: {
      value: string;
      currency: string;
    };
    metadata?: {
      payment_db_id: string;
      user_id: string;
      location_id: string;
    };
  };
}
