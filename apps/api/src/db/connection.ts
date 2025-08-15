import { Pool, PoolClient } from 'pg';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

class DatabaseConnection {
  private pool: Pool;

  constructor() {
    const config: DatabaseConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'charly_dev',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: process.env.NODE_ENV === 'production'
    };

    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  /**
   * Get a database client with tenant context set for RLS
   */
  async getTenantClient(tenantType: 'RESIDENTIAL' | 'COMMERCIAL', userId: string): Promise<TenantClient> {
    const client = await this.pool.connect();
    
    try {
      // Set session variables for RLS
      await client.query('SELECT set_session_tenant($1, $2)', [tenantType, userId]);
      
      return new TenantClient(client, tenantType, userId);
    } catch (error) {
      client.release();
      throw error;
    }
  }

  /**
   * Get a basic client without tenant context (for auth operations)
   */
  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  /**
   * Execute a query without tenant context (for system operations)
   */
  async query(text: string, params?: any[]): Promise<any> {
    return this.pool.query(text, params);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export class TenantClient {
  constructor(
    private client: PoolClient,
    public readonly tenantType: 'RESIDENTIAL' | 'COMMERCIAL',
    public readonly userId: string
  ) {}

  async query(text: string, params?: any[]): Promise<any> {
    return this.client.query(text, params);
  }

  release(): void {
    this.client.release();
  }

  async transaction<T>(callback: (client: TenantClient) => Promise<T>): Promise<T> {
    try {
      await this.client.query('BEGIN');
      const result = await callback(this);
      await this.client.query('COMMIT');
      return result;
    } catch (error) {
      await this.client.query('ROLLBACK');
      throw error;
    }
  }
}

// Singleton instance
export const db = new DatabaseConnection();