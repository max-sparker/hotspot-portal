import { config } from '../config/env';
import { generateSmsCode } from '../utils/crypto';
import { SmsVerificationModel } from '../models/SmsVerification';

export class SmsService {
  /**
   * Отправить SMS с кодом верификации
   */
  async sendVerificationCode(phone: string): Promise<string> {
    // Генерируем код
    const code = config.SMS_ENABLED ? generateSmsCode() : config.SMS_VERIFICATION_CODE;

    // Сохраняем в БД
    await SmsVerificationModel.create(phone, code, 300); // 5 минут

    if (config.SMS_ENABLED) {
      // TODO: Интеграция с SMS провайдером (SMSC.ru, SMS.ru, etc.)
      // await this.sendSms(phone, `Ваш код: ${code}`);
      console.log(`📱 SMS sent to ${phone}: ${code}`);
    } else {
      console.log(`📱 [DEV MODE] SMS code for ${phone}: ${code}`);
    }

    return code;
  }

  /**
   * Проверить код верификации
   */
  async verifyCode(phone: string, code: string): Promise<boolean> {
    const verification = await SmsVerificationModel.findActive(phone, code);

    if (!verification) {
      return false;
    }

    // Отмечаем как использованный
    await SmsVerificationModel.markAsVerified(verification.id);

    return true;
  }

  /**
   * Отправка SMS через провайдера (заглушка)
   */
  private async sendSms(phone: string, message: string): Promise<void> {
    // Пример интеграции с SMSC.ru
    /*
    const response = await axios.get('https://smsc.ru/sys/send.php', {
      params: {
        login: process.env.SMSC_LOGIN,
        psw: process.env.SMSC_PASSWORD,
        phones: phone,
        mes: message,
        charset: 'utf-8',
        fmt: 3, // JSON
      },
    });

    if (response.data.error) {
      throw new Error(`SMS send error: ${response.data.error}`);
    }
    */

    // Пока просто логируем
    console.log(`Sending SMS to ${phone}: ${message}`);
  }

  /**
   * Очистка старых кодов верификации
   */
  async cleanup(): Promise<void> {
    await SmsVerificationModel.cleanup();
    console.log('🧹 Cleaned up expired SMS verifications');
  }
}
