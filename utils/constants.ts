/**
 * CENTRALIZED CONSTANTS
 *
 * All magic numbers and configuration values in one place.
 * Makes the codebase easier to understand and modify.
 */

// ============================================================================
// AUDIO CONFIGURATION
// ============================================================================

export const AUDIO_CONFIG = {
  MAX_TRACKS: 64,
  MAX_PLUGINS_PER_TRACK: 16,
  SAMPLE_RATES: [44100, 48000, 88200, 96000] as const,
  BUFFER_SIZES: [128, 256, 512, 1024, 2048, 4096] as const,
  DEFAULT_SAMPLE_RATE: 48000,
  DEFAULT_BUFFER_SIZE: 512,
  DEFAULT_BPM: 120,
  BPM_RANGE: { min: 20, max: 999 },
  MAX_CLIPS_PER_TRACK: 1000,
  DEFAULT_TRACK_VOLUME: 0.8,
  DEFAULT_MASTER_VOLUME: 0.8,
  FADE_TIME: 0.01, // 10ms fade to prevent clicks
} as const;

// ============================================================================
// UI CONFIGURATION
// ============================================================================

export const UI_CONFIG = {
  // Layout
  TRACK_HEADER_WIDTH: 272,
  FADER_WIDTH: 40,
  CLIP_MIN_WIDTH: 20,
  GRID_SNAP_VALUES: [0, 0.25, 0.5, 1] as const,

  // Breakpoints
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  DESKTOP_BREAKPOINT: 1440,

  // Zoom
  MIN_ZOOM: 10,
  MAX_ZOOM: 1000,
  DEFAULT_ZOOM: 50,
  ZOOM_STEP: 10,

  // Colors
  TRACK_COLORS: [
    '#ff0000', // Red
    '#00f2ff', // Cyan
    '#fbbf24', // Yellow
    '#a855f7', // Purple
    '#10b981', // Green
    '#f97316', // Orange
    '#3b82f6', // Blue
    '#ec4899', // Pink
  ] as const,

  // Animation
  ANIMATION_DURATION: 200, // ms
  DEBOUNCE_DELAY: 300, // ms
  AUTOSAVE_INTERVAL: 30000, // 30 seconds
} as const;

// ============================================================================
// PLUGIN CONSTANTS
// ============================================================================

export const PLUGIN_CONSTANTS = {
  // Compressor
  COMPRESSOR_DEFAULTS: {
    threshold: -20,
    ratio: 4,
    attack: 10,
    release: 100,
    knee: 6,
    mix: 100,
    autoMakeup: true,
    analogMode: false,
  },

  // Reverb
  REVERB_DEFAULTS: {
    mode: 'HALL' as const,
    decay: 1.5,
    preDelay: 30,
    damping: 10000,
    size: 0.7,
    width: 1.0,
    mix: 0.3,
  },

  // Delay
  DELAY_DEFAULTS: {
    division: '1/4' as const,
    feedback: 0.3,
    mix: 0.3,
    damping: 12000,
    mode: 'STEREO' as const,
    modulation: 0,
    duck: 0,
  },

  // EQ
  EQ_DEFAULTS: {
    frequency: 1000,
    gain: 0,
    q: 1.0,
    type: 'peaking' as const,
  },

  // Latency (ms)
  PLUGIN_LATENCY: {
    COMPRESSOR: 3,
    REVERB: 0,
    DELAY: 0,
    PROEQ12: 0,
    LIMITER: 1,
    GATE: 0,
    SATURATOR: 2,
  },
} as const;

// ============================================================================
// AUDIO DSP CONSTANTS
// ============================================================================

export const DSP_CONSTANTS = {
  // Frequency ranges
  FREQ_MIN: 20,
  FREQ_MAX: 20000,
  FREQ_RANGES: {
    SUB_BASS: { min: 20, max: 60 },
    BASS: { min: 60, max: 250 },
    LOW_MID: { min: 250, max: 500 },
    MID: { min: 500, max: 2000 },
    HIGH_MID: { min: 2000, max: 4000 },
    PRESENCE: { min: 4000, max: 6000 },
    BRILLIANCE: { min: 6000, max: 20000 },
  },

  // Decibel ranges
  DB_MIN: -60,
  DB_MAX: 12,

  // Q ranges
  Q_MIN: 0.1,
  Q_MAX: 18,

  // Oversampling
  OVERSAMPLE_RATES: [1, 2, 4, 8] as const,

  // FFT sizes for analysis
  FFT_SIZES: [256, 512, 1024, 2048, 4096, 8192, 16384] as const,
  DEFAULT_FFT_SIZE: 2048,
} as const;

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  PRESETS: 'studio_daw_presets',
  USER_SETTINGS: 'studio_daw_settings',
  RECENT_PROJECTS: 'studio_daw_recent',
  UNDO_HISTORY: 'studio_daw_undo',
  PLUGIN_STATES: 'studio_daw_plugin_states',
} as const;

// ============================================================================
// TIME SIGNATURES
// ============================================================================

export const TIME_SIGNATURES = [
  { numerator: 4, denominator: 4, label: '4/4' },
  { numerator: 3, denominator: 4, label: '3/4' },
  { numerator: 6, denominator: 8, label: '6/8' },
  { numerator: 5, denominator: 4, label: '5/4' },
  { numerator: 7, denominator: 8, label: '7/8' },
] as const;

// ============================================================================
// DELAY DIVISIONS
// ============================================================================

export const DELAY_DIVISIONS = [
  '1/32',
  '1/16T',
  '1/16',
  '1/8T',
  '1/8',
  '1/4T',
  '1/4',
  '1/2T',
  '1/2',
  '1/1',
  '2/1',
] as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  AUDIO_CONTEXT_FAILED: 'Failed to initialize audio context. Please check your browser settings.',
  TRACK_LIMIT_REACHED: `Maximum of ${AUDIO_CONFIG.MAX_TRACKS} tracks reached.`,
  PLUGIN_LIMIT_REACHED: `Maximum of ${AUDIO_CONFIG.MAX_PLUGINS_PER_TRACK} plugins per track reached.`,
  FILE_LOAD_FAILED: 'Failed to load audio file. Please try a different file.',
  SAVE_FAILED: 'Failed to save project. Please try again.',
  INVALID_PRESET: 'Invalid preset format.',
  BROWSER_NOT_SUPPORTED: 'Your browser does not support Web Audio API.',
} as const;

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

export const KEYBOARD_SHORTCUTS = {
  PLAY_PAUSE: ' ',
  STOP: 'Escape',
  UNDO: 'z',
  REDO: 'y',
  SAVE: 's',
  DELETE: 'Delete',
  DUPLICATE: 'd',
  SPLIT: 's',
  ZOOM_IN: '=',
  ZOOM_OUT: '-',
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type TrackColor = typeof UI_CONFIG.TRACK_COLORS[number];
export type SampleRate = typeof AUDIO_CONFIG.SAMPLE_RATES[number];
export type BufferSize = typeof AUDIO_CONFIG.BUFFER_SIZES[number];
export type DelayDivision = typeof DELAY_DIVISIONS[number];
export type OversampleRate = typeof DSP_CONSTANTS.OVERSAMPLE_RATES[number];
export type FFTSize = typeof DSP_CONSTANTS.FFT_SIZES[number];
