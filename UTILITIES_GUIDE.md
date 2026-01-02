# 🛠️ Utilities Guide

Complete guide to using the centralized utilities, constants, and helper functions in the Studio DAW application.

---

## 📁 File Structure

```
studio-daw/
├── utils/
│   ├── constants.ts      # All configuration constants
│   └── helpers.ts        # Reusable utility functions
├── types/
│   └── common.ts         # Shared TypeScript types
├── components/
│   └── ErrorBoundary.tsx # Error handling component
├── .eslintrc.json        # ESLint configuration
└── tsconfig.json         # TypeScript configuration (strict mode)
```

---

## 📋 Constants (`utils/constants.ts`)

### Audio Configuration

```typescript
import { AUDIO_CONFIG } from './utils/constants';

// Example usage
const maxTracks = AUDIO_CONFIG.MAX_TRACKS; // 64
const defaultBPM = AUDIO_CONFIG.DEFAULT_BPM; // 120
const sampleRate = AUDIO_CONFIG.DEFAULT_SAMPLE_RATE; // 48000
```

**Available Constants:**
- `MAX_TRACKS` - Maximum number of tracks (64)
- `MAX_PLUGINS_PER_TRACK` - Maximum plugins per track (16)
- `SAMPLE_RATES` - Available sample rates [44100, 48000, 88200, 96000]
- `BUFFER_SIZES` - Available buffer sizes [128, 256, 512, 1024, 2048, 4096]
- `DEFAULT_BPM` - Default tempo (120)
- `BPM_RANGE` - Min/max BPM {min: 20, max: 999}
- `DEFAULT_TRACK_VOLUME` - Default track volume (0.8)
- `FADE_TIME` - Audio fade time to prevent clicks (0.01s)

### UI Configuration

```typescript
import { UI_CONFIG } from './utils/constants';

// Example usage
const isMobile = window.innerWidth < UI_CONFIG.MOBILE_BREAKPOINT; // 768px
const trackColors = UI_CONFIG.TRACK_COLORS; // Array of 8 hex colors
```

**Available Constants:**
- `TRACK_HEADER_WIDTH` - Width of track header (272px)
- `MOBILE_BREAKPOINT` - Mobile breakpoint (768px)
- `TABLET_BREAKPOINT` - Tablet breakpoint (1024px)
- `TRACK_COLORS` - 8 predefined track colors
- `MIN_ZOOM` / `MAX_ZOOM` / `DEFAULT_ZOOM` - Zoom level constraints
- `ANIMATION_DURATION` - Default animation duration (200ms)
- `AUTOSAVE_INTERVAL` - Auto-save interval (30000ms / 30s)

### Plugin Constants

```typescript
import { PLUGIN_CONSTANTS } from './utils/constants';

// Example usage
const compressorDefaults = PLUGIN_CONSTANTS.COMPRESSOR_DEFAULTS;
const latency = PLUGIN_CONSTANTS.PLUGIN_LATENCY.COMPRESSOR; // 3ms
```

**Available for each plugin:**
- Default parameter values
- Latency compensation values
- Recommended settings

### DSP Constants

```typescript
import { DSP_CONSTANTS } from './utils/constants';

// Example usage
const freqRanges = DSP_CONSTANTS.FREQ_RANGES.BASS; // {min: 60, max: 250}
const fftSize = DSP_CONSTANTS.DEFAULT_FFT_SIZE; // 2048
```

### Storage Keys

```typescript
import { STORAGE_KEYS } from './utils/constants';

// Example usage
localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
```

### Error Messages

```typescript
import { ERROR_MESSAGES } from './utils/constants';

// Example usage
throw new Error(ERROR_MESSAGES.AUDIO_CONTEXT_FAILED);
```

---

## 🔧 Helper Functions (`utils/helpers.ts`)

### Audio Conversion

```typescript
import { dbToLinear, linearToDb, freqToMidi, midiToFreq } from './utils/helpers';

// Convert -6dB to linear gain
const gain = dbToLinear(-6); // 0.501

// Convert 0.5 gain to dB
const db = linearToDb(0.5); // -6.02

// Convert 440Hz to MIDI note
const midi = freqToMidi(440); // 69 (A4)

// Convert MIDI note 60 to frequency
const freq = midiToFreq(60); // 261.63 Hz (C4)
```

### Math Utilities

```typescript
import { clamp, lerp, mapRange, roundTo } from './utils/helpers';

// Clamp value between 0 and 1
const clamped = clamp(1.5, 0, 1); // 1

// Linear interpolation
const interpolated = lerp(0, 100, 0.5); // 50

// Map 50 from range 0-100 to range 0-1
const mapped = mapRange(50, 0, 100, 0, 1); // 0.5

// Round to 2 decimal places
const rounded = roundTo(3.14159, 2); // 3.14
```

### Time Utilities

```typescript
import {
  formatTime,
  formatTimeMs,
  beatToTime,
  timeToBeat,
  snapToGrid
} from './utils/helpers';

// Format seconds as MM:SS
const time = formatTime(125.5); // "2:05"

// Format with milliseconds
const timeMs = formatTimeMs(125.5); // "2:05.500"

// Convert beat position to time
const seconds = beatToTime(4, 120); // 2 seconds at 120 BPM

// Convert time to beat position
const beat = timeToBeat(2, 120); // 4 beats at 120 BPM

// Snap time to 1/4 note grid
const snapped = snapToGrid(1.3, 0.25, 120); // Snaps to nearest 1/4 beat
```

### String Utilities

```typescript
import { generateId, truncate, formatFileSize } from './utils/helpers';

// Generate unique ID
const id = generateId('track'); // "track-1640000000000-abc123xyz"

// Truncate long string
const short = truncate('This is a very long string', 10); // "This is..."

// Format file size
const size = formatFileSize(1536000); // "1.46 MB"
```

### Array Utilities

```typescript
import { arrayMove, unique, groupBy } from './utils/helpers';

// Move item from index 0 to index 2
const moved = arrayMove([1, 2, 3], 0, 2); // [2, 3, 1]

// Remove duplicates
const uniqueItems = unique([1, 2, 2, 3, 3]); // [1, 2, 3]

// Group tracks by color
const grouped = groupBy(tracks, (t) => t.color);
// { '#ff0000': [...], '#00f2ff': [...] }
```

### Validation

```typescript
import {
  isValidNumber,
  isInRange,
  isValidFrequency
} from './utils/helpers';

// Check if valid number
isValidNumber(42); // true
isValidNumber(NaN); // false

// Check if in range
isInRange(50, 0, 100); // true
isInRange(150, 0, 100); // false

// Validate frequency (20-20000 Hz)
isValidFrequency(440); // true
isValidFrequency(30000); // false
```

### Debounce & Throttle

```typescript
import { debounce, throttle } from './utils/helpers';

// Debounce: Wait 300ms after last call
const debouncedSave = debounce(() => {
  saveProject();
}, 300);

// Throttle: Maximum once every 100ms
const throttledUpdate = throttle(() => {
  updateVisualization();
}, 100);
```

### Color Utilities

```typescript
import { hexToRgb, rgbToHex, adjustBrightness } from './utils/helpers';

// Convert hex to RGB
const rgb = hexToRgb('#ff0000'); // { r: 255, g: 0, b: 0 }

// Convert RGB to hex
const hex = rgbToHex(255, 0, 0); // "#ff0000"

// Adjust brightness by +20%
const brighter = adjustBrightness('#ff0000', 20); // "#ff3333"
```

### Browser Detection

```typescript
import {
  isMobile,
  isTablet,
  isWebAudioSupported,
  getColorScheme
} from './utils/helpers';

// Check device type
if (isMobile()) {
  // Show mobile UI
}

// Check Web Audio support
if (!isWebAudioSupported()) {
  alert('Web Audio API not supported');
}

// Get color scheme preference
const scheme = getColorScheme(); // 'dark' or 'light'
```

---

## 🎭 Error Boundary (`components/ErrorBoundary.tsx`)

### Basic Usage

Wrap any component that might throw errors:

```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### Custom Fallback UI

```typescript
<ErrorBoundary
  fallback={
    <div>Something went wrong. Please refresh.</div>
  }
>
  <YourComponent />
</ErrorBoundary>
```

### Error Handler Callback

```typescript
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Log to error tracking service
    logErrorToSentry(error, errorInfo);
  }}
>
  <YourComponent />
</ErrorBoundary>
```

### Using as HOC

```typescript
import { withErrorBoundary } from './components/ErrorBoundary';

const SafeComponent = withErrorBoundary(MyComponent);
```

### Using Error Handler Hook

```typescript
import { useErrorHandler } from './components/ErrorBoundary';

function MyComponent() {
  const handleError = useErrorHandler();

  const doSomething = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      handleError(error); // Will be caught by nearest ErrorBoundary
    }
  };
}
```

---

## 📦 Common Types (`types/common.ts`)

### Utility Types

```typescript
import type { DeepPartial, ValueOf, PartialBy } from './types/common';

// Make all properties optional (recursively)
type PartialTrack = DeepPartial<Track>;

// Extract value types from object
type TrackColor = ValueOf<typeof UI_CONFIG.TRACK_COLORS>;

// Make specific properties optional
type OptionalId = PartialBy<Track, 'id'>;
```

### Function Types

```typescript
import type { Handler, AsyncHandler, Predicate } from './types/common';

// Event handler
const handleVolumeChange: Handler<number> = (volume) => {
  setVolume(volume);
};

// Async handler
const handleSave: AsyncHandler<Project> = async (project) => {
  await saveProject(project);
};

// Filter predicate
const isMuted: Predicate<Track> = (track) => track.isMuted;
const mutedTracks = tracks.filter(isMuted);
```

### Audio Types

```typescript
import type {
  AudioParameter,
  AutomationLane,
  MeterData
} from './types/common';

// Define audio parameter
const volumeParam: AudioParameter = {
  id: 'volume',
  name: 'Volume',
  value: 0.8,
  range: { min: 0, max: 1, default: 0.8 },
};

// Define automation
const automation: AutomationLane = {
  parameterId: 'volume',
  points: [
    { time: 0, value: 0.8 },
    { time: 2, value: 0.5, curve: 'exponential' },
  ],
  isEnabled: true,
};
```

### UI Types

```typescript
import type { Position, Size, Bounds, Toast } from './types/common';

// Position
const mousePos: Position = { x: 100, y: 200 };

// Size
const clipSize: Size = { width: 150, height: 80 };

// Bounds
const clipBounds: Bounds = { x: 50, y: 100, width: 150, height: 80 };

// Toast notification
const toast: Toast = {
  id: generateId('toast'),
  type: 'success',
  message: 'Project saved!',
  duration: 3000,
};
```

### Type Guards

```typescript
import { isDefined, isNumber, isObject } from './types/common';

// Check if defined
if (isDefined(value)) {
  // TypeScript knows value is not null/undefined
}

// Check if number
if (isNumber(value)) {
  // TypeScript knows value is number
  const doubled = value * 2;
}

// Check if object
if (isObject(value)) {
  // TypeScript knows value is Record<string, unknown>
  const keys = Object.keys(value);
}
```

---

## ⚙️ TypeScript Configuration

The `tsconfig.json` now has **strict mode enabled** for maximum type safety:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### What This Means

- ✅ No `any` types allowed (must be explicit)
- ✅ All variables must be initialized
- ✅ Null/undefined checking enforced
- ✅ Unused variables will show warnings
- ✅ All code paths must return a value
- ✅ Array access returns `T | undefined` (safer)

### Migration Tips

If you see TypeScript errors after enabling strict mode:

1. **Array access**: Add null checks
   ```typescript
   // Before
   const track = tracks[0];

   // After
   const track = tracks[0];
   if (!track) return;
   ```

2. **Optional properties**: Use optional chaining
   ```typescript
   // Before
   const name = track.clip.name;

   // After
   const name = track.clip?.name;
   ```

3. **Function parameters**: Define types explicitly
   ```typescript
   // Before
   const add = (a, b) => a + b;

   // After
   const add = (a: number, b: number): number => a + b;
   ```

---

## 📜 ESLint Configuration

The `.eslintrc.json` enforces code quality rules:

### Key Rules

- ⚠️ Warn on `any` types
- ❌ Error on `var` usage (use `const`/`let`)
- ✅ Prefer `const` over `let`
- ⚠️ Warn on console statements (except warn/error)

### Running ESLint

```bash
# Install ESLint if not already installed
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Run linter
npx eslint . --ext .ts,.tsx

# Auto-fix issues
npx eslint . --ext .ts,.tsx --fix
```

---

## 🎯 Best Practices

### 1. Always Import from Centralized Files

```typescript
// ❌ BAD: Magic numbers scattered everywhere
const maxTracks = 64;
if (tracks.length >= maxTracks) { ... }

// ✅ GOOD: Import from constants
import { AUDIO_CONFIG } from './utils/constants';
if (tracks.length >= AUDIO_CONFIG.MAX_TRACKS) { ... }
```

### 2. Use Helper Functions

```typescript
// ❌ BAD: Inline calculations repeated
const gain = Math.pow(10, db / 20);

// ✅ GOOD: Use helper function
import { dbToLinear } from './utils/helpers';
const gain = dbToLinear(db);
```

### 3. Type Everything

```typescript
// ❌ BAD: Implicit any
function updateVolume(volume) {
  track.volume = volume;
}

// ✅ GOOD: Explicit types
function updateVolume(volume: number): void {
  track.volume = clamp(volume, 0, 1);
}
```

### 4. Use Error Boundaries

```typescript
// ❌ BAD: No error handling
<PluginUI plugin={plugin} />

// ✅ GOOD: Wrapped in error boundary
<ErrorBoundary>
  <PluginUI plugin={plugin} />
</ErrorBoundary>
```

### 5. Validate User Input

```typescript
// ❌ BAD: Trust user input
const freq = parseFloat(userInput);
filter.frequency.value = freq;

// ✅ GOOD: Validate first
import { isValidFrequency, clamp } from './utils/helpers';
const freq = parseFloat(userInput);
if (isValidFrequency(freq)) {
  filter.frequency.value = freq;
} else {
  console.warn('Invalid frequency:', freq);
}
```

### 6. Debounce Expensive Operations

```typescript
// ❌ BAD: Save on every keystroke
onChange={(e) => saveProject(e.target.value)}

// ✅ GOOD: Debounced save
import { debounce } from './utils/helpers';
const debouncedSave = debounce(saveProject, 500);
onChange={(e) => debouncedSave(e.target.value)}
```

---

## 🚀 Performance Tips

1. **Use constants for config**: Prevents recalculation
2. **Memoize expensive calculations**: Use `useMemo` with helper functions
3. **Debounce UI updates**: Use `debounce` helper for real-time parameters
4. **Throttle animations**: Use `throttle` helper for canvas rendering
5. **Type safety prevents bugs**: Strict TypeScript catches errors at compile-time

---

## 📚 Further Reading

- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [ESLint Rules](https://eslint.org/docs/latest/rules/)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

**Happy Coding! 🎵**
