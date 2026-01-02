import { useCallback } from 'react';
import { DAWState, Clip } from '../types';

interface UseClipOperationsProps {
  setState: (updater: DAWState | ((prev: DAWState) => DAWState)) => void;
}

export const useClipOperations = ({ setState }: UseClipOperationsProps) => {
  const handleEditClip = useCallback(
    (trackId: string, clipId: string, action: string, payload?: unknown) => {
      setState((prev) => {
        const track = prev.tracks.find((t) => t.id === trackId);
        if (!track) return prev;

        const newClips = [...track.clips];
        const idx = newClips.findIndex((c) => c.id === clipId);
        if (idx === -1) return prev;

        switch (action) {
          case 'MOVE':
            if (payload && typeof payload === 'object' && 'start' in payload) {
              newClips[idx] = { ...newClips[idx], start: payload.start as number };
            }
            break;
          case 'UPDATE_PROPS':
            if (payload && typeof payload === 'object') {
              newClips[idx] = { ...newClips[idx], ...payload };
            }
            break;
          case 'DELETE':
            newClips.splice(idx, 1);
            break;
          case 'MUTE':
            newClips[idx] = { ...newClips[idx], isMuted: !newClips[idx].isMuted };
            break;
          case 'DUPLICATE':
            newClips.push({
              ...newClips[idx],
              id: `clip-dup-${Date.now()}`,
              start: newClips[idx].start + newClips[idx].duration + 0.1
            });
            break;
          case 'RENAME':
            if (payload && typeof payload === 'object' && 'name' in payload) {
              newClips[idx] = { ...newClips[idx], name: payload.name as string };
            }
            break;
          case 'SPLIT': {
            const clip = newClips[idx];
            if (payload && typeof payload === 'object' && 'time' in payload) {
              const splitTime = payload.time as number;
              if (splitTime > clip.start && splitTime < clip.start + clip.duration) {
                const firstDuration = splitTime - clip.start;
                const secondDuration = clip.duration - firstDuration;
                newClips[idx] = { ...clip, duration: firstDuration };
                newClips.push({
                  ...clip,
                  id: `clip-split-${Date.now()}`,
                  start: splitTime,
                  duration: secondDuration,
                  offset: clip.offset + firstDuration
                });
              }
            }
            break;
          }
        }

        return {
          ...prev,
          tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, clips: newClips } : t))
        };
      });
    },
    [setState]
  );

  const handleMoveClip = useCallback(
    (sourceTrackId: string, destTrackId: string, clipId: string) => {
      setState((prev) => {
        const sourceTrack = prev.tracks.find((t) => t.id === sourceTrackId);
        const destTrack = prev.tracks.find((t) => t.id === destTrackId);
        if (!sourceTrack || !destTrack) return prev;

        const clip = sourceTrack.clips.find((c) => c.id === clipId);
        if (!clip) return prev;

        const newSourceClips = sourceTrack.clips.filter((c) => c.id !== clipId);
        const newDestClips = [...destTrack.clips, { ...clip }];

        const newTracks = prev.tracks.map((t) => {
          if (t.id === sourceTrackId) return { ...t, clips: newSourceClips };
          if (t.id === destTrackId) return { ...t, clips: newDestClips };
          return t;
        });

        return { ...prev, tracks: newTracks };
      });
    },
    [setState]
  );

  return {
    handleEditClip,
    handleMoveClip
  };
};
