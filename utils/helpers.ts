/**
 * COMMON UTILITY FUNCTIONS
 *
 * Reusable helper functions used throughout the application.
 * Prevents code duplication and improves maintainability.
 */

// ============================================================================
// AUDIO CONVERSION UTILITIES
// ============================================================================

/**
 * Convert decibels to linear gain (0-1 range)
 * @param db - Decibel value
 * @returns Linear gain value
 */
export const dbToLinear = (db: number): number => {
  return Math.pow(10, db / 20);
};

/**
 * Convert linear gain to decibels
 * @param linear - Linear gain value (0-1)
 * @returns Decibel value
 */
export const linearToDb = (linear: number): number => {
  return 20 * Math.log10(Math.max(linear, 0.0001)); // Prevent -Infinity
};

/**
 * Convert frequency to MIDI note number
 * @param frequency - Frequency in Hz
 * @returns MIDI note number
 */
export const freqToMidi = (frequency: number): number => {
  return 69 + 12 * Math.log2(frequency / 440);
};

/**
 * Convert MIDI note number to frequency
 * @param midi - MIDI note number
 * @returns Frequency in Hz
 */
export const midiToFreq = (midi: number): number => {
  return 440 * Math.pow(2, (midi - 69) / 12);
};

// ============================================================================
// MATH UTILITIES
// ============================================================================

/**
 * Clamp a value between min and max
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Linear interpolation between two values
 * @param a - Start value
 * @param b - End value
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated value
 */
export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * clamp(t, 0, 1);
};

/**
 * Map a value from one range to another
 * @param value - Input value
 * @param inMin - Input range minimum
 * @param inMax - Input range maximum
 * @param outMin - Output range minimum
 * @param outMax - Output range maximum
 * @returns Mapped value
 */
export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

/**
 * Round to specified number of decimal places
 * @param value - Value to round
 * @param decimals - Number of decimal places
 * @returns Rounded value
 */
export const roundTo = (value: number, decimals: number): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

// ============================================================================
// TIME UTILITIES
// ============================================================================

/**
 * Format seconds as MM:SS
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

/**
 * Format seconds as MM:SS:MS (with milliseconds)
 * @param seconds - Time in seconds
 * @returns Formatted time string with milliseconds
 */
export const formatTimeMs = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${mins}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};

/**
 * Calculate time from BPM and beat position
 * @param beat - Beat position
 * @param bpm - Beats per minute
 * @returns Time in seconds
 */
export const beatToTime = (beat: number, bpm: number): number => {
  return (beat * 60) / bpm;
};

/**
 * Calculate beat position from time
 * @param time - Time in seconds
 * @param bpm - Beats per minute
 * @returns Beat position
 */
export const timeToBeat = (time: number, bpm: number): number => {
  return (time * bpm) / 60;
};

/**
 * Snap time to grid
 * @param time - Time in seconds
 * @param gridSize - Grid size in beats (e.g., 0.25 for 16th notes)
 * @param bpm - Beats per minute
 * @returns Snapped time in seconds
 */
export const snapToGrid = (time: number, gridSize: number, bpm: number): number => {
  if (gridSize === 0) return time;
  const beat = timeToBeat(time, bpm);
  const snappedBeat = Math.round(beat / gridSize) * gridSize;
  return beatToTime(snappedBeat, bpm);
};

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Generate a unique ID
 * @param prefix - Optional prefix for the ID
 * @returns Unique ID string
 */
export const generateId = (prefix = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Truncate string to maximum length
 * @param str - Input string
 * @param maxLength - Maximum length
 * @returns Truncated string with ellipsis if needed
 */
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
};

/**
 * Format file size in bytes to human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${roundTo(size, 2)} ${units[unitIndex]}`;
};

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Move an item in an array from one index to another
 * @param arr - Input array
 * @param fromIndex - Source index
 * @param toIndex - Destination index
 * @returns New array with item moved
 */
export const arrayMove = <T>(arr: T[], fromIndex: number, toIndex: number): T[] => {
  const newArr = [...arr];
  const [item] = newArr.splice(fromIndex, 1);
  newArr.splice(toIndex, 0, item);
  return newArr;
};

/**
 * Remove duplicates from array
 * @param arr - Input array
 * @returns Array with duplicates removed
 */
export const unique = <T>(arr: T[]): T[] => {
  return Array.from(new Set(arr));
};

/**
 * Group array items by key
 * @param arr - Input array
 * @param keyFn - Function to extract grouping key
 * @returns Object with grouped items
 */
export const groupBy = <T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]> => {
  return arr.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Check if value is a valid number
 * @param value - Value to check
 * @returns True if valid number
 */
export const isValidNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

/**
 * Check if value is within range
 * @param value - Value to check
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns True if within range
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * Validate frequency value
 * @param freq - Frequency in Hz
 * @returns True if valid frequency
 */
export const isValidFrequency = (freq: number): boolean => {
  return isValidNumber(freq) && isInRange(freq, 20, 20000);
};

// ============================================================================
// DEBOUNCE / THROTTLE
// ============================================================================

/**
 * Debounce function calls
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Throttle function calls
 * @param fn - Function to throttle
 * @param delay - Delay in milliseconds
 * @returns Throttled function
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
};

// ============================================================================
// COLOR UTILITIES
// ============================================================================

/**
 * Convert hex color to RGB
 * @param hex - Hex color string (e.g., "#ff0000")
 * @returns RGB object
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Convert RGB to hex color
 * @param r - Red (0-255)
 * @param g - Green (0-255)
 * @param b - Blue (0-255)
 * @returns Hex color string
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(clamp(x, 0, 255)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

/**
 * Adjust color brightness
 * @param hex - Hex color string
 * @param percent - Percentage to adjust (-100 to 100)
 * @returns Adjusted hex color
 */
export const adjustBrightness = (hex: string, percent: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const adjust = (value: number) => {
    return clamp(value + (value * percent / 100), 0, 255);
  };

  return rgbToHex(adjust(rgb.r), adjust(rgb.g), adjust(rgb.b));
};

// ============================================================================
// BROWSER / DEVICE DETECTION
// ============================================================================

/**
 * Check if running on mobile device
 * @returns True if mobile
 */
export const isMobile = (): boolean => {
  return window.innerWidth < 768;
};

/**
 * Check if running on tablet
 * @returns True if tablet
 */
export const isTablet = (): boolean => {
  return window.innerWidth >= 768 && window.innerWidth < 1024;
};

/**
 * Check if Web Audio API is supported
 * @returns True if supported
 */
export const isWebAudioSupported = (): boolean => {
  return 'AudioContext' in window || 'webkitAudioContext' in window;
};

/**
 * Get user's preferred color scheme
 * @returns 'dark' or 'light'
 */
export const getColorScheme = (): 'dark' | 'light' => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};
