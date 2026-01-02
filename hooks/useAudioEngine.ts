import { useCallback, useRef, useEffect } from 'react';
import { audioEngine } from '../engine/AudioEngine';
import { DAWState, Track } from '../types';

export const useAudioEngine = (state: DAWState) => {
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Sync tracks with audio engine
  useEffect(() => {
    if (audioEngine.ctx) {
      state.tracks.forEach((t) => audioEngine.updateTrack(t, state.tracks));
    }
  }, [state.tracks]);

  const ensureAudioEngine = useCallback(async () => {
    if (!audioEngine.ctx) {
      await audioEngine.init();
    }
    if (audioEngine.ctx?.state === 'suspended') {
      await audioEngine.ctx.resume();
    }
  }, []);

  const handleSeek = useCallback((time: number, setVisualState: (state: Partial<DAWState>) => void) => {
    setVisualState({ currentTime: time });
    audioEngine.seekTo(time, stateRef.current.tracks, stateRef.current.isPlaying);
  }, []);

  const handleTogglePlay = useCallback(
    async (setVisualState: (state: Partial<DAWState>) => void) => {
      await ensureAudioEngine();

      // Sync tracks
      stateRef.current.tracks.forEach((t) =>
        audioEngine.updateTrack(t, stateRef.current.tracks)
      );

      if (!stateRef.current.isPlaying) {
        audioEngine.startPlayback(stateRef.current.currentTime, stateRef.current.tracks);
        setVisualState({ isPlaying: true });
      } else {
        audioEngine.stopAll();
        setVisualState({ isPlaying: false });
      }
    },
    [ensureAudioEngine]
  );

  const handleStop = useCallback((setVisualState: (state: Partial<DAWState>) => void) => {
    audioEngine.stopAll();
    audioEngine.seekTo(0, stateRef.current.tracks, false);
    setVisualState({ isPlaying: false, isRecording: false, currentTime: 0 });
  }, []);

  return {
    ensureAudioEngine,
    handleSeek,
    handleTogglePlay,
    handleStop,
    stateRef
  };
};
