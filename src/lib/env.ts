/**
 * Environment Runtime Configuration
 * - Published AI Studio Domain: https://ScopeBridge.ais.studio
 * - Production Server: https://ais-pre-prho5hzgxphrbuhiofy4qb-872497617609.europe-west2.run.app
 * - Primary Workspace (nightscope58@gmail.com): https://ais-dev-prho5hzgxphrbuhiofy4qb-872497617609.europe-west2.run.app
 *   Connected directly to the live Production Cloud SQL & Firestore Database (ai-studio-staysyncproperty-2e13e0fd-d4da-4f75-9ef4-ab92045cf50c).
 */

function resolveRuntimeEnvironment(): 'production' | 'development' {
  if (typeof window !== 'undefined') {
    try {
      const hostname = (window.location.hostname || '').toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const envParam = (params.get('env') || params.get('mode') || '').toLowerCase();

      // Explicit manual override via ?env=dev or ?env=prod
      if (envParam === 'development' || envParam === 'dev') {
        localStorage.setItem('scopebridg_runtime_mode_v2', 'development');
        localStorage.setItem('scopebridg_runtime_mode', 'development');
        return 'development';
      }
      if (envParam === 'production' || envParam === 'prod') {
        localStorage.setItem('scopebridg_runtime_mode_v2', 'production');
        localStorage.setItem('scopebridg_runtime_mode', 'production');
        return 'production';
      }

      // ScopeBridge.ais.studio maps directly to live production ais-pre
      if (hostname.includes('scopebridge.ais.studio')) {
        localStorage.setItem('scopebridg_runtime_mode_v2', 'production');
        localStorage.setItem('scopebridg_runtime_mode', 'production');
        if (typeof window !== 'undefined' && window.location.origin !== PRODUCTION_APP_URL && !window.location.href.includes('ais-pre')) {
          // Optional seamless routing
        }
        return 'production';
      }

      if (
        hostname.includes('scopebridge.ai.studio') ||
        hostname.includes('.ai.studio') ||
        hostname.includes('ais-pre') ||
        hostname.includes('ais-dev')
      ) {
        localStorage.setItem('scopebridg_runtime_mode_v2', 'production');
        localStorage.setItem('scopebridg_runtime_mode', 'production');
        return 'production';
      }

      // Default: production
      localStorage.setItem('scopebridg_runtime_mode_v2', 'production');
      localStorage.setItem('scopebridg_runtime_mode', 'production');
      return 'production';
    } catch {
      // Ignore storage access errors in restricted iframes
    }
  }
  return 'production';
}

export function setRuntimeEnvironment(mode: 'production' | 'development') {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('scopebridg_runtime_mode_v2', mode);
      localStorage.setItem('scopebridg_runtime_mode', mode);
      const url = new URL(window.location.href);
      url.searchParams.set('env', mode);
      window.location.href = url.toString();
    } catch {
      window.location.reload();
    }
  }
}

export function toggleRuntimeEnvironment() {
  const current = resolveRuntimeEnvironment();
  const next = current === 'production' ? 'development' : 'production';
  setRuntimeEnvironment(next);
}

export const RUNTIME_ENV: 'production' | 'development' = resolveRuntimeEnvironment();
export const IS_PROD: boolean = RUNTIME_ENV === 'production';
export const IS_DEV: boolean = RUNTIME_ENV === 'development';
export const PUBLISHED_AI_STUDIO_DOMAIN = 'https://ScopeBridge.ais.studio';
export const PRODUCTION_APP_URL = 'https://ais-pre-prho5hzgxphrbuhiofy4qb-872497617609.europe-west2.run.app';
export const DEVELOPMENT_APP_URL = 'https://ais-dev-prho5hzgxphrbuhiofy4qb-872497617609.europe-west2.run.app';
export const AUTHORIZED_PUBLISHER_EMAILS = [
  'nightscope58@gmail.com',
  'Kenny.weeder71@gmail.com',
  'kenny.weeder71@gmail.com',
  'admin@scopebridg.co.za',
];

