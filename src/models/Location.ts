import { db } from '../config/database';
import { Location } from '../types/location.types';

export class LocationModel {
  /**
   * Найти локацию по ID
   */
  static async findById(id: number): Promise<Location | null> {
    const result = await db.query<Location>(
      'SELECT * FROM locations WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Найти локацию по типу
   */
  static async findByType(type: 'dorm' | 'cafe'): Promise<Location[]> {
    const result = await db.query<Location>(
      'SELECT * FROM locations WHERE location_type = $1',
      [type]
    );
    return result.rows;
  }

  /**
   * Получить все локации
   */
  static async getAll(): Promise<Location[]> {
    const result = await db.query<Location>(
      'SELECT * FROM locations ORDER BY id'
    );
    return result.rows;
  }

  /**
   * Найти локацию по IP MikroTik
   */
  static async findByMikrotikIp(ip: string): Promise<Location | null> {
    const result = await db.query<Location>(
      'SELECT * FROM locations WHERE mikrotik_ip = $1',
      [ip]
    );
    return result.rows[0] || null;
  }
}
