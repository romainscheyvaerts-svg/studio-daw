/**
 * UTILITY USAGE EXAMPLES
 *
 * This file demonstrates how to use the centralized utilities,
 * constants, and helper functions in real-world scenarios.
 */

import { AUDIO_CONFIG, UI_CONFIG, PLUGIN_CONSTANTS, ERROR_MESSAGES } from '../utils/constants';
import {
  dbToLinear,
  linearToDb,
  clamp,
  formatTime,
  snapToGrid,
  generateId,
  debounce,
  hexToRgb,
} from '../utils/helpers';
import type { AudioParameter, Handler, Position } from '../types/common';

// ============================================================================
// EXAMPLE 1: Creating a Track with Validated Parameters
// ============================================================================

interface Track {
  id: string;
  name: string;
  volume: number;
  color: string;
  plugins: Plugin[];
}

interface Plugin {
  id: string;
  type: string;
  params: Record<string, number>;
}

function createTrack(name: string, colorIndex: number): Track | null {
  // Validate we haven't exceeded track limit
  const existingTracks = getExistingTracks();
  if (existingTracks.length >= AUDIO_CONFIG.MAX_TRACKS) {
    alert(ERROR_MESSAGES.TRACK_LIMIT_REACHED);
    return null;
  }

  // Create track with constants
  return {
    id: generateId('track'),
    name,
    volume: AUDIO_CONFIG.DEFAULT_TRACK_VOLUME, // 0.8
    color: UI_CONFIG.TRACK_COLORS[colorIndex % UI_CONFIG.TRACK_COLORS.length],
    plugins: [],
  };
}

// ============================================================================
// EXAMPLE 2: Volume Fader with dB Conversion
// ============================================================================

function VoluumeFader(props: { value: number; onChange: Handler<number> }) {
  // Convert linear volume to dB for display
  const dbValue = linearToDb(props.value);

  const handleSliderChange = (linearValue: number) => {
    // Clamp to valid range
    const clamped = clamp(linearValue, 0, 1);
    props.onChange(clamped);
  };

  return (
    <div className="fader">
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={props.value}
        onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
      />
      <span>{dbValue.toFixed(1)} dB</span>
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Snapping Clips to Grid
// ============================================================================

function snapClipToGrid(
  clipStartTime: number,
  bpm: number,
  gridSize: number
): number {
  // Use helper function to snap to nearest grid division
  return snapToGrid(clipStartTime, gridSize, bpm);
}

// Example: Snap clip at 1.3 seconds to 1/4 note grid at 120 BPM
const clippedTime = 1.3;
const snappedTime = snapClipToGrid(clippedTime, 120, 0.25);
console.log(`Original: ${clippedTime}s, Snapped: ${snappedTime}s`);

// ============================================================================
// EXAMPLE 4: Debounced Auto-Save
// ============================================================================

function ProjectAutoSave() {
  const saveProject = async (projectData: unknown) => {
    console.log('Saving project...', projectData);
    // Actual save logic here
  };

  // Debounce saves to prevent excessive writes
  const debouncedSave = debounce(saveProject, UI_CONFIG.AUTOSAVE_INTERVAL);

  const handleProjectChange = (newData: unknown) => {
    // Save will only trigger after 30 seconds of inactivity
    debouncedSave(newData);
  };

  return {
    onChange: handleProjectChange,
  };
}

// ============================================================================
// EXAMPLE 5: Plugin Parameter Validation
// ============================================================================

function setPluginParameter(
  plugin: Plugin,
  paramName: string,
  value: number
): boolean {
  // Get parameter definition
  const paramDef = getParameterDefinition(paramName);
  if (!paramDef) {
    console.error(`Unknown parameter: ${paramName}`);
    return false;
  }

  // Validate and clamp value
  const clampedValue = clamp(value, paramDef.range.min, paramDef.range.max);

  // Apply to plugin
  plugin.params[paramName] = clampedValue;

  console.log(
    `Set ${paramName} to ${clampedValue} ${paramDef.range.unit || ''}`
  );
  return true;
}

function getParameterDefinition(paramName: string): AudioParameter | null {
  // Example parameter definitions
  const params: Record<string, AudioParameter> = {
    threshold: {
      id: 'threshold',
      name: 'Threshold',
      value: PLUGIN_CONSTANTS.COMPRESSOR_DEFAULTS.threshold,
      range: { min: -60, max: 0, default: -20, unit: 'dB' },
    },
    ratio: {
      id: 'ratio',
      name: 'Ratio',
      value: PLUGIN_CONSTANTS.COMPRESSOR_DEFAULTS.ratio,
      range: { min: 1, max: 20, default: 4, unit: ':1' },
    },
  };

  return params[paramName] || null;
}

// ============================================================================
// EXAMPLE 6: Timeline Position Calculation
// ============================================================================

function calculateTimelinePosition(
  mouseX: number,
  timelineWidth: number,
  zoom: number,
  scrollOffset: number
): number {
  // Calculate time from pixel position
  const pixelsPerSecond = zoom;
  const offsetX = mouseX + scrollOffset;
  const time = offsetX / pixelsPerSecond;

  return Math.max(0, time); // Ensure non-negative
}

function formatTimelineTime(seconds: number): string {
  // Use helper to format time
  return formatTime(seconds);
}

// Example usage
const mousePosition: Position = { x: 500, y: 100 };
const time = calculateTimelinePosition(mousePosition.x, 1920, 50, 0);
console.log(`Time at cursor: ${formatTimelineTime(time)}`); // "0:10"

// ============================================================================
// EXAMPLE 7: Track Color Management
// ============================================================================

function getTrackColorWithVariation(
  baseColorIndex: number,
  isSelected: boolean
): string {
  const baseColor = UI_CONFIG.TRACK_COLORS[baseColorIndex];

  if (isSelected) {
    // Brighten by 30% when selected
    const rgb = hexToRgb(baseColor);
    if (!rgb) return baseColor;

    const brighten = (value: number) => Math.min(255, value + value * 0.3);
    return `rgb(${brighten(rgb.r)}, ${brighten(rgb.g)}, ${brighten(rgb.b)})`;
  }

  return baseColor;
}

// ============================================================================
// EXAMPLE 8: Responsive Layout Helper
// ============================================================================

function useResponsiveLayout() {
  const [isMobileView, setIsMobileView] = React.useState(
    window.innerWidth < UI_CONFIG.MOBILE_BREAKPOINT
  );

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < UI_CONFIG.MOBILE_BREAKPOINT);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: isMobileView,
    trackHeaderWidth: isMobileView ? 150 : UI_CONFIG.TRACK_HEADER_WIDTH,
    showFullControls: !isMobileView,
  };
}

// ============================================================================
// EXAMPLE 9: Plugin Instance Creation
// ============================================================================

function createCompressorPlugin(): Plugin {
  return {
    id: generateId('plugin'),
    type: 'COMPRESSOR',
    params: {
      threshold: PLUGIN_CONSTANTS.COMPRESSOR_DEFAULTS.threshold,
      ratio: PLUGIN_CONSTANTS.COMPRESSOR_DEFAULTS.ratio,
      attack: PLUGIN_CONSTANTS.COMPRESSOR_DEFAULTS.attack,
      release: PLUGIN_CONSTANTS.COMPRESSOR_DEFAULTS.release,
      knee: PLUGIN_CONSTANTS.COMPRESSOR_DEFAULTS.knee,
      mix: PLUGIN_CONSTANTS.COMPRESSOR_DEFAULTS.mix,
    },
  };
}

function addPluginToTrack(track: Track, pluginType: string): boolean {
  // Check plugin limit
  if (track.plugins.length >= AUDIO_CONFIG.MAX_PLUGINS_PER_TRACK) {
    alert(ERROR_MESSAGES.PLUGIN_LIMIT_REACHED);
    return false;
  }

  let newPlugin: Plugin;

  switch (pluginType) {
    case 'COMPRESSOR':
      newPlugin = createCompressorPlugin();
      break;
    case 'REVERB':
      newPlugin = {
        id: generateId('plugin'),
        type: 'REVERB',
        params: { ...PLUGIN_CONSTANTS.REVERB_DEFAULTS },
      };
      break;
    default:
      console.error(`Unknown plugin type: ${pluginType}`);
      return false;
  }

  track.plugins.push(newPlugin);
  return true;
}

// ============================================================================
// EXAMPLE 10: Error Boundary Usage in Practice
// ============================================================================

import { ErrorBoundary } from '../components/ErrorBoundary';

function PluginRackWithErrorHandling({ track }: { track: Track }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="error-message">
          Failed to load plugin rack. Please try reloading.
        </div>
      }
      onError={(error, errorInfo) => {
        // Log to analytics or error tracking service
        console.error('Plugin rack error:', error);
        console.error('Component stack:', errorInfo.componentStack);
      }}
    >
      <PluginRack plugins={track.plugins} />
    </ErrorBoundary>
  );
}

// ============================================================================
// HELPER STUBS (for demo purposes)
// ============================================================================

function getExistingTracks(): Track[] {
  return []; // Placeholder
}

function PluginRack({ plugins }: { plugins: Plugin[] }) {
  return <div>{plugins.length} plugins loaded</div>;
}

// React import (would normally be at top)
import React from 'react';

// ============================================================================
// SUMMARY
// ============================================================================

/*
  This example demonstrates:

  ✅ Using constants instead of magic numbers
  ✅ Validating parameters with helper functions
  ✅ Converting between dB and linear gain
  ✅ Snapping timeline positions to grid
  ✅ Debouncing expensive operations
  ✅ Type-safe parameter handling
  ✅ Color manipulation for UI states
  ✅ Responsive layout based on breakpoints
  ✅ Plugin creation with default values
  ✅ Error boundaries for fault tolerance

  Benefits:
  - Code is more readable and self-documenting
  - Easier for AI to understand and modify
  - Centralized configuration makes changes easy
  - Type safety prevents bugs at compile-time
  - Helper functions reduce code duplication
*/
