// Environment configuration for RM Dashboard
export const config = {
  // API URLs
  loginApiUrl: process.env.LOGIN_API_URL || 'https://api.floorselector.convrse.ai/api/sales-person/login',
  validateTokenUrl: process.env.VALIDATE_TOKEN_URL || 'https://api.floorselector.convrse.ai/api/auth/validate',
  refreshTokenUrl: process.env.REFRESH_TOKEN_URL || 'https://api.floorselector.convrse.ai/api/auth/login',
  
  // Business Configuration
  businessIdentifier: process.env.BUSINESS_IDENTIFIER || 'krisala',
  
  // Token Configuration
  tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  rememberMeExpiry: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  
  // App Configuration
  appVersion: '1.0.0',
  platform: 'web',
} as const;
