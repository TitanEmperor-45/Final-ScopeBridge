export interface ChannelMapping {
  booking_com?: string;
  airbnb?: string;
  lekkeslaap?: string;
  safarinow?: string;
  expedia?: string;
  agoda?: string;
  vrbo?: string;
  google_rentals?: string;
}

export const CHANNEL_MAPPINGS: Record<string, ChannelMapping> = {
  'UNIT-RL': {
    booking_com: 'ext_rivonia_laxe_1_bcom',
    airbnb: 'ext_rivonia_laxe_1_ab',
    lekkeslaap: 'ext_rivonia_laxe_1_ls',
    safarinow: 'ext_rivonia_laxe_1_sn',
    expedia: 'ext_rivonia_laxe_1_exp',
    agoda: 'ext_rivonia_laxe_1_ag',
    vrbo: 'ext_rivonia_laxe_1_vrbo',
    google_rentals: 'ext_rivonia_laxe_1_goog',
  },
  'UNIT-Buffalo': {
    booking_com: 'ext_17onbuffalo_bcom',
    airbnb: 'ext_17onbuffalo_ab',
    lekkeslaap: 'ext_17onbuffalo_ls',
    safarinow: 'ext_17onbuffalo_sn',
  }
};

export interface ChannexConfig {
  baseUrl: string;
  apiKey?: string;
  webhookUrl?: string;
  environment: 'staging' | 'production';
}

export const DEFAULT_CHANNEX_CONFIG: ChannexConfig = {
  baseUrl: 'https://staging.channex.io/api/v1',
  environment: 'staging',
};
