// Deep Link Configuration & Types

export type DeepLinkRoute = 
  | '/'
  | '/home'
  | '/bike/:id'
  | '/booking/:bikeId'
  | '/transaction/:id'
  | '/auth/login'
  | '/auth/register';

export interface DeepLinkConfig {
  path: string;
  parseParams?: (params: Record<string, string>) => Record<string, any>;
}

export interface DeepLinkParams {
  // Attribution parameters
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  
  // Referral parameters
  ref?: string;
  referral_code?: string;
  
  // Custom parameters
  promo?: string;
  discount?: string;
  source?: string;
  medium?: string;
  campaign?: string;
}

export interface ParsedDeepLink {
  route: string;
  params: DeepLinkParams;
  rawUrl: string;
}

export interface DeferredLinkData {
  originalUrl: string;
  route: string;
  params: DeepLinkParams;
  timestamp: number;
}

// Route configuration untuk mapping URL ke halaman
export const ROUTE_CONFIG: Record<string, DeepLinkConfig> = {
  '': { path: '/' },
  'home': { path: '/home' },
  'bike': { path: '/bike/:id' },
  'booking': { path: '/booking/:bikeId' },
  'transaction': { path: '/transaction/:id' },
  'auth/login': { path: '/auth/login' },
  'auth/register': { path: '/auth/register' },
};

// URL scheme configuration
export const URL_CONFIG = {
  scheme: 'rentbike' as const,
  host: 'rentbike.app' as const,
  paths: ['bike', 'booking', 'transaction', 'auth/login', 'auth/register'] as const,
};

