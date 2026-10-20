// Environment Helper: Detects Production vs Development instance

import { IS_PROD } from '../lib/env';

export interface AppEnvironmentInfo {
  isProduction: boolean;
  isDevelopment: boolean;
  environmentName: 'Production' | 'Development';
  globeIconColorClass: string;
  badgeStyleClass: string;
  badgeLabel: string;
}

export function getAppEnvironmentInfo(): AppEnvironmentInfo {
  const isProd = IS_PROD;

  if (isProd) {
    return {
      isProduction: true,
      isDevelopment: false,
      environmentName: 'Production',
      globeIconColorClass: 'text-emerald-600',
      badgeStyleClass: 'bg-emerald-50 text-emerald-900 border-emerald-300',
      badgeLabel: 'Production • Global & Executive Stays',
    };
  }

  return {
    isProduction: false,
    isDevelopment: true,
    environmentName: 'Development',
    globeIconColorClass: 'text-amber-500',
    badgeStyleClass: 'bg-amber-50 text-amber-900 border-amber-300',
    badgeLabel: 'Development • Global & Executive Stays',
  };
}
