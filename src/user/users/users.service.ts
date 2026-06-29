import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface User {
  id: string;
  email: string;
  email_verified: boolean;
  region_id: number | null;
  gender_id: number | null;
  age_group_id: number | null;
}

const USER_COLUMNS =
  'id, email, email_verified, region_id, gender_id, age_group_id';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async findByProviderIdentity(
    provider: string,
    providerUid: string,
  ): Promise<User | undefined> {
    const rows = await this.db.query<User>(
      `SELECT u.id, u.email, u.email_verified, u.region_id, u.gender_id, u.age_group_id
       FROM users u
       JOIN auth_identities ai ON ai.user_id = u.id
       WHERE ai.provider = $1 AND ai.provider_uid = $2`,
      [provider, providerUid],
    );
    return rows[0];
  }

  async findProvidersByUserId(userId: string): Promise<string[]> {
    const rows = await this.db.query<{ provider: string }>(
      'SELECT DISTINCT provider FROM auth_identities WHERE user_id = $1 ORDER BY provider',
      [userId],
    );
    return rows.map((row) => row.provider);
  }

  async findById(userId: string): Promise<User | undefined> {
    const rows = await this.db.query<User>(
      `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
      [userId],
    );
    return rows[0];
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const rows = await this.db.query<User>(
      `SELECT ${USER_COLUMNS} FROM users WHERE email = $1`,
      [email],
    );
    return rows[0];
  }

  async linkIdentity(
    userId: string,
    provider: string,
    providerUid: string,
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO auth_identities (user_id, provider, provider_uid)
       VALUES ($1, $2, $3)`,
      [userId, provider, providerUid],
    );
  }

  async mergeAccounts(survivorId: string, mergedId: string): Promise<void> {
    await this.db.runInTransaction([
      {
        sql: 'UPDATE auth_identities SET user_id = $1 WHERE user_id = $2',
        params: [survivorId, mergedId],
      },
      {
        sql: `INSERT INTO user_medications (user_id, atc)
              SELECT $1, atc FROM user_medications WHERE user_id = $2
              ON CONFLICT (user_id, atc) DO NOTHING`,
        params: [survivorId, mergedId],
      },
      { sql: 'DELETE FROM users WHERE id = $1', params: [mergedId] },
    ]);
  }

  // Creates the user and its first identity in one atomic statement, so we
  // never leave a user without a way to log in.
  async createWithIdentity(params: {
    email: string;
    emailVerified: boolean;
    provider: string;
    providerUid: string;
  }): Promise<User> {
    const { email, emailVerified, provider, providerUid } = params;
    const rows = await this.db.query<User>(
      `WITH new_user AS (
         INSERT INTO users (email, email_verified)
         VALUES ($1, $2)
         RETURNING ${USER_COLUMNS}
       ), new_identity AS (
         INSERT INTO auth_identities (user_id, provider, provider_uid)
         SELECT id, $3, $4 FROM new_user
       )
       SELECT ${USER_COLUMNS} FROM new_user`,
      [email, emailVerified, provider, providerUid],
    );
    return rows[0];
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id],
    );
    return rows.length > 0;
  }
}
