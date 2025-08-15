export interface AppConfig {
  port: number;
  host: string;
  logLevel: string;
  nodeEnv: string;
  corsOrigins: string[] | boolean;
}

function validateRequiredEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

function validateOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export function loadConfig(): AppConfig {
  const nodeEnv = validateOptionalEnv('NODE_ENV', 'development');
  const logLevel = validateOptionalEnv('LOG_LEVEL', 'info');
  const port = Number(validateOptionalEnv('PORT', '3000'));
  const host = validateOptionalEnv('HOST', '0.0.0.0');

  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value: ${process.env.PORT}. Must be a number between 1 and 65535.`);
  }

  const validLogLevels = ['error', 'warn', 'info', 'debug', 'trace'];
  if (!validLogLevels.includes(logLevel)) {
    throw new Error(`Invalid LOG_LEVEL value: ${logLevel}. Must be one of: ${validLogLevels.join(', ')}`);
  }

  let corsOrigins: string[] | boolean;
  if (nodeEnv === 'production') {
    corsOrigins = [
      'https://commercial.charlyapp.com',
      'https://residential.charlyapp.com'
    ];
  } else {
    corsOrigins = true;
  }

  return {
    port,
    host,
    logLevel,
    nodeEnv,
    corsOrigins
  };
}