/**
 * COMMON REUSABLE TYPES
 *
 * Shared TypeScript types used across the application.
 * Centralizes type definitions for better maintainability.
 */

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Make all properties in T optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make all properties in T required recursively
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * Extract property type from object
 */
export type ValueOf<T> = T[keyof T];

/**
 * Make specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Mutable version of a type
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

// ============================================================================
// FUNCTION TYPES
// ============================================================================

/**
 * Generic callback function
 */
export type Callback<T = void> = () => T;

/**
 * Generic event handler
 */
export type Handler<T = unknown> = (value: T) => void;

/**
 * Async callback function
 */
export type AsyncCallback<T = void> = () => Promise<T>;

/**
 * Async handler
 */
export type AsyncHandler<T = unknown> = (value: T) => Promise<void>;

/**
 * Predicate function
 */
export type Predicate<T> = (value: T) => boolean;

/**
 * Comparator function for sorting
 */
export type Comparator<T> = (a: T, b: T) => number;

// ============================================================================
// AUDIO TYPES
// ============================================================================

/**
 * Audio parameter value range
 */
export interface ParameterRange {
  min: number;
  max: number;
  default: number;
  step?: number;
  unit?: string;
  scale?: 'linear' | 'logarithmic' | 'exponential';
}

/**
 * Audio parameter definition
 */
export interface AudioParameter {
  id: string;
  name: string;
  value: number;
  range: ParameterRange;
  isAutomated?: boolean;
}

/**
 * Automation point
 */
export interface AutomationPoint {
  time: number;
  value: number;
  curve?: 'linear' | 'exponential' | 'logarithmic';
}

/**
 * Automation lane
 */
export interface AutomationLane {
  parameterId: string;
  points: AutomationPoint[];
  isEnabled: boolean;
}

/**
 * Audio meter data
 */
export interface MeterData {
  peak: number;
  rms: number;
  timestamp: number;
}

/**
 * Spectrum analyzer data
 */
export interface SpectrumData {
  frequencies: Float32Array;
  magnitudes: Float32Array;
  timestamp: number;
}

// ============================================================================
// UI TYPES
// ============================================================================

/**
 * Position in 2D space
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Size dimensions
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Rectangle bounds
 */
export interface Bounds extends Position, Size {}

/**
 * Drag state
 */
export interface DragState {
  isDragging: boolean;
  startPosition: Position;
  currentPosition: Position;
  offset: Position;
}

/**
 * Modal state
 */
export interface ModalState {
  isOpen: boolean;
  content?: React.ReactNode;
  onClose?: Callback;
}

/**
 * Toast notification
 */
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: Callback;
  };
}

// ============================================================================
// DATA LOADING TYPES
// ============================================================================

/**
 * Loading state
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Async data wrapper
 */
export interface AsyncData<T> {
  data: T | null;
  state: LoadingState;
  error: Error | null;
}

/**
 * Paginated data
 */
export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// FILE TYPES
// ============================================================================

/**
 * File metadata
 */
export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  duration?: number;
  sampleRate?: number;
  channels?: number;
}

/**
 * Audio file info
 */
export interface AudioFileInfo extends FileMetadata {
  duration: number;
  sampleRate: number;
  channels: number;
  bitDepth?: number;
  codec?: string;
}

// ============================================================================
// SETTINGS TYPES
// ============================================================================

/**
 * User preferences
 */
export interface UserPreferences {
  theme: 'dark' | 'light' | 'auto';
  autoSave: boolean;
  autoSaveInterval: number;
  gridSnap: boolean;
  defaultGridSize: number;
  defaultBPM: number;
  defaultTimeSignature: [number, number];
  showWaveforms: boolean;
  showMeters: boolean;
  showSpectrum: boolean;
}

/**
 * Audio settings
 */
export interface AudioSettings {
  sampleRate: number;
  bufferSize: number;
  latencyHint: 'balanced' | 'interactive' | 'playback';
  enablePDC: boolean;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Field validation
 */
export interface FieldValidation {
  field: string;
  rule: string;
  message: string;
}

// ============================================================================
// HISTORY TYPES
// ============================================================================

/**
 * Undo/Redo action
 */
export interface HistoryAction {
  id: string;
  type: string;
  description: string;
  timestamp: number;
  undo: Callback;
  redo: Callback;
}

/**
 * History state
 */
export interface History<T> {
  past: T[];
  present: T;
  future: T[];
}

// ============================================================================
// API TYPES
// ============================================================================

/**
 * API response
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * API error
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * Custom event data
 */
export interface CustomEventData<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
}

/**
 * Keyboard event data
 */
export interface KeyboardEventData {
  key: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

/**
 * Analytics event
 */
export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  audioLatency: number;
  cpuLoad: number;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if value is defined
 */
export const isDefined = <T>(value: T | undefined | null): value is T => {
  return value !== undefined && value !== null;
};

/**
 * Check if value is string
 */
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

/**
 * Check if value is number
 */
export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

/**
 * Check if value is boolean
 */
export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

/**
 * Check if value is object
 */
export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

/**
 * Check if value is array
 */
export const isArray = <T>(value: unknown): value is T[] => {
  return Array.isArray(value);
};

/**
 * Check if value is function
 */
export const isFunction = (value: unknown): value is Function => {
  return typeof value === 'function';
};
