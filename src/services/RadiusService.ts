import { db } from '../config/database';
import { RadiusUser, RadiusSession } from '../types/radius.types';
import { generatePassword } from '../utils/crypto';

export class RadiusService {
  /**
   * Добавить пользователя в RADIUS
   */
  static async addUser(
    username: string,
    password?: string,
    sessionTimeout: number = 7200,
    idleTimeout: number = 600
  ): Promise<string> {
    const client = await db.getClient();
    const pwd = password || generatePassword();

    try {
      await client.query('BEGIN');

      // Удаляем старые записи если есть
      await client.query(
        'DELETE FROM radcheck WHERE username = $1',
        [username]
      );
      await client.query(
        'DELETE FROM radreply WHERE username = $1',
        [username]
      );

      // Добавляем в radcheck
      await client.query(
        `INSERT INTO radcheck (username, attribute, op, value)
         VALUES ($1, 'Cleartext-Password', ':=', $2)`,
        [username, pwd]
      );

      // Session-Timeout
      await client.query(
        `INSERT INTO radreply (username, attribute, op, value)
         VALUES ($1, 'Session-Timeout', ':=', $2)`,
        [username, sessionTimeout.toString()]
      );

      // Idle-Timeout
      await client.query(
        `INSERT INTO radreply (username, attribute, op, value)
         VALUES ($1, 'Idle-Timeout', ':=', $2)`,
        [username, idleTimeout.toString()]
      );

      await client.query('COMMIT');

      console.log(`✅ Added RADIUS user: ${username}`);
      return pwd;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Failed to add RADIUS user:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Удалить пользователя из RADIUS
   */
  static async removeUser(username: string): Promise<void> {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');
      
      await client.query('DELETE FROM radcheck WHERE username = $1', [username]);
      await client.query('DELETE FROM radreply WHERE username = $1', [username]);
      
      await client.query('COMMIT');
      
      console.log(`✅ Removed RADIUS user: ${username}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Failed to remove RADIUS user:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Проверить существует ли пользователь в RADIUS
   */
  static async userExists(username: string): Promise<boolean> {
    const result = await db.query(
      'SELECT 1 FROM radcheck WHERE username = $1 LIMIT 1',
      [username]
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Получить активные сессии
   */
  static async getActiveSessions(username?: string): Promise<RadiusSession[]> {
    let query = `
      SELECT username, callingstationid, nasipaddress, 
             acctstarttime, acctsessiontime, 
             acctinputoctets, acctoutputoctets
      FROM radacct 
      WHERE acctstoptime IS NULL
    `;

    const params: any[] = [];
    if (username) {
      query += ' AND username = $1';
      params.push(username);
    }

    query += ' ORDER BY acctstarttime DESC';

    const result = await db.query<RadiusSession>(query, params);
    return result.rows;
  }

  /**
   * Получить историю сессий
   */
  static async getSessionHistory(username: string, limit: number = 10): Promise<RadiusSession[]> {
    const result = await db.query<RadiusSession>(
      `SELECT * FROM radacct 
       WHERE username = $1 
       ORDER BY acctstarttime DESC 
       LIMIT $2`,
      [username, limit]
    );
    return result.rows;
  }

  /**
   * Получить статистику по пользователю
   */
  static async getUserStats(username: string): Promise<{
    totalSessions: number;
    totalInputBytes: number;
    totalOutputBytes: number;
    totalSessionTime: number;
  }> {
    const result = await db.query(
      `SELECT 
         COUNT(*) as total_sessions,
         COALESCE(SUM(acctinputoctets), 0) as total_input_bytes,
         COALESCE(SUM(acctoutputoctets), 0) as total_output_bytes,
         COALESCE(SUM(acctsessiontime), 0) as total_session_time
       FROM radacct 
       WHERE username = $1`,
      [username]
    );

    const row = result.rows[0];
    return {
      totalSessions: parseInt(row.total_sessions, 10),
      totalInputBytes: parseInt(row.total_input_bytes, 10),
      totalOutputBytes: parseInt(row.total_output_bytes, 10),
      totalSessionTime: parseInt(row.total_session_time, 10),
    };
  }
}
