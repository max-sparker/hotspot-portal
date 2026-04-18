import { YooCheckout, ICreatePayment, ICapturePayment, ICreateRefund } from '@a2seven/yoo-checkout';
import { config } from '../config/env';
import { generatePaymentId } from '../utils/crypto';

export interface CreatePaymentParams {
  amount: number;
  description: string;
  metadata?: {
    payment_db_id: string;
    user_id: string;
    location_id: string;
  };
}

export interface PaymentInfo {
  id: string;
  status: string;
  paid: boolean;
  amount: {
    value: string;
    currency: string;
  };
  confirmation?: {
    type: string;
    confirmation_url?: string;
  };
  metadata?: any;
}

export class YookassaService {
  private checkout: YooCheckout;

  constructor() {
    this.checkout = new YooCheckout({
      shopId: config.YOOKASSA_SHOP_ID,
      secretKey: config.YOOKASSA_SECRET_KEY,
    });
  }

  /**
   * Создать платёж
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentInfo> {
    try {
      const idempotenceKey = generatePaymentId();

      const createPayload: ICreatePayment = {
        amount: {
          value: (params.amount / 100).toFixed(2), // Копейки в рубли
          currency: 'RUB',
        },
        confirmation: {
          type: 'redirect',
          return_url: config.YOOKASSA_RETURN_URL,
        },
        capture: true, // Автоматическое подтверждение
        description: params.description,
        metadata: params.metadata,
      };

      const payment = await this.checkout.createPayment(createPayload, idempotenceKey);

      console.log('✅ ЮКасса payment created:', payment.id);

      return payment as PaymentInfo;
    } catch (error) {
      console.error('❌ Failed to create payment:', error);
      throw new Error('Payment creation failed');
    }
  }

  /**
   * Получить информацию о платеже
   */
  async getPayment(paymentId: string): Promise<PaymentInfo> {
    try {
      const payment = await this.checkout.getPayment(paymentId);
      return payment as PaymentInfo;
    } catch (error) {
      console.error('❌ Failed to get payment:', error);
      throw new Error('Failed to retrieve payment info');
    }
  }

  /**
   * Подтвердить платёж (если capture: false)
   */
  async capturePayment(paymentId: string, amount?: number): Promise<PaymentInfo> {
    try {
      const idempotenceKey = generatePaymentId();

      const capturePayload: ICapturePayment = amount
        ? {
          amount: {
            value: (amount / 100).toFixed(2),
            currency: 'RUB',
          },
        }
        : {};

      const payment = await this.checkout.capturePayment(
        paymentId,
        capturePayload,
        idempotenceKey
      );

      console.log('✅ Payment captured:', payment.id);

      return payment as PaymentInfo;
    } catch (error) {
      console.error('❌ Failed to capture payment:', error);
      throw new Error('Payment capture failed');
    }
  }

  /**
   * Отменить платёж
   */
  async cancelPayment(paymentId: string): Promise<PaymentInfo> {
    try {
      const idempotenceKey = generatePaymentId();
      const payment = await this.checkout.cancelPayment(paymentId, idempotenceKey);

      console.log('✅ Payment cancelled:', payment.id);

      return payment as PaymentInfo;
    } catch (error) {
      console.error('❌ Failed to cancel payment:', error);
      throw new Error('Payment cancellation failed');
    }
  }

  /**
   * Создать возврат
   */
  async refundPayment(paymentId: string, amount?: number): Promise<any> {
    try {
      const idempotenceKey = generatePaymentId();

      const refundPayload: ICreateRefund = {
        payment_id: paymentId,
        amount: {
          value: amount ? (amount / 100).toFixed(2) : '0.00',
          currency: 'RUB',
        },
      };

      const refund = await this.checkout.createRefund(refundPayload, idempotenceKey);

      console.log('✅ Refund created:', refund.id);

      return refund;
    } catch (error) {
      console.error('❌ Failed to create refund:', error);
      throw new Error('Refund creation failed');
    }
  }

  /**
   * Валидация webhook от ЮКасса
   */
  validateWebhook(payload: any): boolean {
    // ЮКасса отправляет события с типом notification
    if (payload.type !== 'notification') {
      return false;
    }

    // Проверяем наличие объекта платежа
    if (!payload.object || !payload.object.id) {
      return false;
    }

    return true;
  }

  /**
   * Обработка webhook события
   */
  async handleWebhook(payload: any): Promise<{
    paymentId: string;
    status: string;
    paid: boolean;
    metadata?: any;
  }> {
    if (!this.validateWebhook(payload)) {
      throw new Error('Invalid webhook payload');
    }

    const payment = payload.object;

    return {
      paymentId: payment.id,
      status: payment.status,
      paid: payment.paid,
      metadata: payment.metadata,
    };
  }
}
