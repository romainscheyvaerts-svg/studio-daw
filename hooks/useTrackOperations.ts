import { useCallback } from 'react';
import { Track, TrackType, PluginType, PluginInstance, DAWState, TrackSend, Clip, MidiNote } from '../types';
import { audioEngine } from '../engine/AudioEngine';

const TRACK_COLORS = ['#ff0000', '#00f2ff', '#fbbf24', '#a855f7', '#10b981', '#f97316', '#3b82f6', '#ec4899'];

interface UseTrackOperationsProps {
  setState: (updater: DAWState | ((prev: DAWState) => DAWState)) => void;
  stateRef: React.MutableRefObject<DAWState>;
}

export const useTrackOperations = ({ setState, stateRef }: UseTrackOperationsProps) => {
  const handleUpdateTrack = useCallback((track: Track) => {
    setState((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === track.id ? track : t))
    }));
  }, [setState]);

  const handleDuplicateTrack = useCallback((trackId: string) => {
    setState((prev) => {
      const track = prev.tracks.find((t) => t.id === trackId);
      if (!track) return prev;

      const newTrack: Track = {
        ...track,
        id: `track-${Date.now()}`,
        name: `${track.name} (Copy)`,
        clips: track.clips.map((c) => ({ ...c, id: `c-${Date.now()}-${Math.random()}` }))
      };

      return { ...prev, tracks: [...prev.tracks, newTrack] };
    });
  }, [setState]);

  const handleCreateTrack = useCallback((type: TrackType) => {
    setState((prev) => {
      const defaultSends: TrackSend[] = prev.tracks
        .filter((t) => t.type === TrackType.SEND)
        .map((s) => ({ id: s.id, level: 0, isEnabled: true }));

      const newTrack: Track = {
        id: `track-${Date.now()}`,
        name: `${type} TRACK`,
        type,
        color: TRACK_COLORS[prev.tracks.length % TRACK_COLORS.length],
        isMuted: false,
        isSolo: false,
        isTrackArmed: false,
        isFrozen: false,
        volume: 1.0,
        pan: 0,
        outputTrackId: 'master',
        sends: defaultSends,
        clips: [],
        plugins: [],
        automationLanes: [],
        totalLatency: 0
      };

      return { ...prev, tracks: [...prev.tracks, newTrack] };
    });
  }, [setState]);

  const handleDeleteTrack = useCallback((trackId: string) => {
    setState((prev) => ({
      ...prev,
      tracks: prev.tracks.filter((t) => t.id !== trackId),
      selectedTrackId: prev.selectedTrackId === trackId ? null : prev.selectedTrackId
    }));
  }, [setState]);

  const handleUpdatePluginParams = useCallback(
    (trackId: string, pluginId: string, params: Record<string, unknown>) => {
      setState((prev) => {
        const newTracks = prev.tracks.map((t) =>
          t.id !== trackId
            ? t
            : {
                ...t,
                plugins: t.plugins.map((p) =>
                  p.id === pluginId ? { ...p, params: { ...p.params, ...params } } : p
                )
              }
        );
        return { ...prev, tracks: newTracks };
      });

      const pluginNode = audioEngine.getPluginNodeInstance(trackId, pluginId);
      if (pluginNode && 'updateParams' in pluginNode && typeof pluginNode.updateParams === 'function') {
        pluginNode.updateParams(params);
      }
    },
    [setState]
  );

  const handleToggleBypass = useCallback(
    (trackId: string, pluginId: string) => {
      setState((prev) => ({
        ...prev,
        tracks: prev.tracks.map((t) =>
          t.id === trackId
            ? {
                ...t,
                plugins: t.plugins.map((p) =>
                  p.id === pluginId ? { ...p, isEnabled: !p.isEnabled } : p
                )
              }
            : t
        )
      }));

      const track = stateRef.current.tracks.find((t) => t.id === trackId);
      const plugin = track?.plugins.find((p) => p.id === pluginId);
      if (plugin) {
        const node = audioEngine.getPluginNodeInstance(trackId, pluginId);
        if (node && 'updateParams' in node && typeof node.updateParams === 'function') {
          node.updateParams({ isEnabled: !plugin.isEnabled });
        }
      }
    },
    [setState, stateRef]
  );

  const handleRemovePlugin = useCallback(
    (trackId: string, pluginId: string) => {
      setState((prev) => ({
        ...prev,
        tracks: prev.tracks.map((t) =>
          t.id === trackId ? { ...t, plugins: t.plugins.filter((p) => p.id !== pluginId) } : t
        )
      }));
    },
    [setState]
  );

  return {
    handleUpdateTrack,
    handleDuplicateTrack,
    handleCreateTrack,
    handleDeleteTrack,
    handleUpdatePluginParams,
    handleToggleBypass,
    handleRemovePlugin
  };
};
