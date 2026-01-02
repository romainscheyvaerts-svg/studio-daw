/**
 * DAW CONTEXT - Centralized State Management
 *
 * Simplifies state management for easier AI code generation.
 * All DAW state and actions are available through a single context.
 *
 * Benefits:
 * - Single source of truth
 * - No prop drilling
 * - Easy for AI to understand and modify
 * - Clear separation of concerns
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { DAWState, Track, PluginInstance, PluginType, TrackType, Clip } from '../types';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useTrackOperations } from '../hooks/useTrackOperations';
import { useClipOperations } from '../hooks/useClipOperations';

// ==================== CONTEXT INTERFACE ====================

interface DAWContextValue {
  // State
  state: DAWState;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Playback Control
  play: () => void;
  stop: () => void;
  seek: (time: number) => void;
  togglePlay: () => void;

  // Transport
  setBpm: (bpm: number) => void;
  setLoop: (start: number, end: number, active: boolean) => void;

  // Track Operations
  createTrack: (type: TrackType) => void;
  deleteTrack: (trackId: string) => void;
  duplicateTrack: (trackId: string) => void;
  updateTrack: (track: Track) => void;
  selectTrack: (trackId: string) => void;

  // Track Properties
  setTrackVolume: (trackId: string, volume: number) => void;
  setTrackPan: (trackId: string, pan: number) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackSolo: (trackId: string) => void;
  setTrackName: (trackId: string, name: string) => void;

  // Plugin Operations
  addPlugin: (trackId: string, pluginType: PluginType) => void;
  removePlugin: (trackId: string, pluginId: string) => void;
  updatePluginParams: (trackId: string, pluginId: string, params: Record<string, unknown>) => void;
  togglePluginBypass: (trackId: string, pluginId: string) => void;

  // Clip Operations
  editClip: (trackId: string, clipId: string, action: string, payload?: unknown) => void;
  moveClip: (sourceTrackId: string, destTrackId: string, clipId: string) => void;

  // View Control
  setView: (view: 'ARRANGEMENT' | 'MIXER' | 'AUTOMATION' | 'PIANO_ROLL') => void;

  // Audio Engine
  ensureAudioEngine: () => Promise<void>;
}

// ==================== CONTEXT ====================

const DAWContext = createContext<DAWContextValue | null>(null);

// ==================== PROVIDER ====================

interface DAWProviderProps {
  children: ReactNode;
  initialState: DAWState;
}

export const DAWProvider: React.FC<DAWProviderProps> = ({ children, initialState }) => {
  const { state, setState, setVisualState, undo, redo, canUndo, canRedo } = useUndoRedo(initialState);
  const { ensureAudioEngine, handleSeek, handleTogglePlay, handleStop, stateRef } = useAudioEngine(state);
  const {
    handleUpdateTrack,
    handleDuplicateTrack,
    handleCreateTrack,
    handleDeleteTrack,
    handleUpdatePluginParams,
    handleToggleBypass,
    handleRemovePlugin
  } = useTrackOperations({ setState, stateRef });
  const { handleEditClip, handleMoveClip } = useClipOperations({ setState });

  // ==================== ACTIONS ====================

  const play = () => handleTogglePlay(setVisualState);
  const stop = () => handleStop(setVisualState);
  const seek = (time: number) => handleSeek(time, setVisualState);
  const togglePlay = () => handleTogglePlay(setVisualState);

  const setBpm = (bpm: number) => {
    setState((prev) => ({ ...prev, bpm: Math.max(20, Math.min(999, bpm)) }));
  };

  const setLoop = (start: number, end: number, active: boolean) => {
    setState((prev) => ({ ...prev, loopStart: start, loopEnd: end, isLoopActive: active }));
  };

  const createTrack = (type: TrackType) => handleCreateTrack(type);
  const deleteTrack = (trackId: string) => handleDeleteTrack(trackId);
  const duplicateTrack = (trackId: string) => handleDuplicateTrack(trackId);
  const updateTrack = (track: Track) => handleUpdateTrack(track);

  const selectTrack = (trackId: string) => {
    setState((prev) => ({ ...prev, selectedTrackId: trackId }));
  };

  const setTrackVolume = (trackId: string, volume: number) => {
    const track = state.tracks.find((t) => t.id === trackId);
    if (track) {
      handleUpdateTrack({ ...track, volume });
    }
  };

  const setTrackPan = (trackId: string, pan: number) => {
    const track = state.tracks.find((t) => t.id === trackId);
    if (track) {
      handleUpdateTrack({ ...track, pan });
    }
  };

  const toggleTrackMute = (trackId: string) => {
    const track = state.tracks.find((t) => t.id === trackId);
    if (track) {
      handleUpdateTrack({ ...track, isMuted: !track.isMuted });
    }
  };

  const toggleTrackSolo = (trackId: string) => {
    const track = state.tracks.find((t) => t.id === trackId);
    if (track) {
      handleUpdateTrack({ ...track, isSolo: !track.isSolo });
    }
  };

  const setTrackName = (trackId: string, name: string) => {
    const track = state.tracks.find((t) => t.id === trackId);
    if (track) {
      handleUpdateTrack({ ...track, name });
    }
  };

  const addPlugin = (trackId: string, pluginType: PluginType) => {
    setState((prev) => {
      const track = prev.tracks.find((t) => t.id === trackId);
      if (!track) return prev;

      const newPlugin: PluginInstance = {
        id: `pl-${Date.now()}-${Math.random()}`,
        name: pluginType,
        type: pluginType,
        isEnabled: true,
        params: { isEnabled: true },
        latency: 0
      };

      return {
        ...prev,
        tracks: prev.tracks.map((t) =>
          t.id === trackId ? { ...t, plugins: [...t.plugins, newPlugin] } : t
        )
      };
    });
  };

  const removePlugin = (trackId: string, pluginId: string) => {
    handleRemovePlugin(trackId, pluginId);
  };

  const updatePluginParams = (trackId: string, pluginId: string, params: Record<string, unknown>) => {
    handleUpdatePluginParams(trackId, pluginId, params);
  };

  const togglePluginBypass = (trackId: string, pluginId: string) => {
    handleToggleBypass(trackId, pluginId);
  };

  const editClip = (trackId: string, clipId: string, action: string, payload?: unknown) => {
    handleEditClip(trackId, clipId, action, payload);
  };

  const moveClip = (sourceTrackId: string, destTrackId: string, clipId: string) => {
    handleMoveClip(sourceTrackId, destTrackId, clipId);
  };

  const setView = (view: 'ARRANGEMENT' | 'MIXER' | 'AUTOMATION' | 'PIANO_ROLL') => {
    setState((prev) => ({ ...prev, currentView: view }));
  };

  // ==================== CONTEXT VALUE ====================

  const value: DAWContextValue = {
    state,
    undo,
    redo,
    canUndo,
    canRedo,
    play,
    stop,
    seek,
    togglePlay,
    setBpm,
    setLoop,
    createTrack,
    deleteTrack,
    duplicateTrack,
    updateTrack,
    selectTrack,
    setTrackVolume,
    setTrackPan,
    toggleTrackMute,
    toggleTrackSolo,
    setTrackName,
    addPlugin,
    removePlugin,
    updatePluginParams,
    togglePluginBypass,
    editClip,
    moveClip,
    setView,
    ensureAudioEngine
  };

  return <DAWContext.Provider value={value}>{children}</DAWContext.Provider>;
};

// ==================== HOOK ====================

export const useDAW = (): DAWContextValue => {
  const context = useContext(DAWContext);
  if (!context) {
    throw new Error('useDAW must be used within DAWProvider');
  }
  return context;
};

// ==================== EXAMPLE USAGE ====================

/**
 * Example: Using DAW Context in a component
 *
 * ```tsx
 * import { useDAW } from './context/DAWContext';
 *
 * function TrackControls() {
 *   const { state, setTrackVolume, toggleTrackMute, addPlugin } = useDAW();
 *
 *   return (
 *     <div>
 *       {state.tracks.map(track => (
 *         <div key={track.id}>
 *           <button onClick={() => toggleTrackMute(track.id)}>Mute</button>
 *           <input
 *             type="range"
 *             value={track.volume}
 *             onChange={(e) => setTrackVolume(track.id, Number(e.target.value))}
 *           />
 *           <button onClick={() => addPlugin(track.id, 'COMPRESSOR')}>
 *             Add Compressor
 *           </button>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 *
 * Benefits for AI:
 * - All operations are named clearly
 * - No need to understand complex state updates
 * - Just call the function you need
 * - Type-safe with TypeScript
 */
