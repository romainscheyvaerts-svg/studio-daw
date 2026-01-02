import { useState, useCallback, useRef } from 'react';
import { DAWState } from '../types';

interface HistoryState {
  past: DAWState[];
  present: DAWState;
  future: DAWState[];
}

const MAX_HISTORY = 100;

export const useUndoRedo = (initialState: DAWState) => {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initialState,
    future: []
  });

  const setState = useCallback((updater: DAWState | ((prev: DAWState) => DAWState)) => {
    setHistory((curr) => {
      const newState = typeof updater === 'function' ? updater(curr.present) : updater;

      if (newState === curr.present) return curr;

      // Don't add to history if only time changed
      const isTimeUpdateOnly =
        newState.currentTime !== curr.present.currentTime &&
        newState.tracks === curr.present.tracks &&
        newState.isPlaying === curr.present.isPlaying;

      if (isTimeUpdateOnly) {
        return { ...curr, present: newState };
      }

      return {
        past: [...curr.past, curr.present].slice(-MAX_HISTORY),
        present: newState,
        future: []
      };
    });
  }, []);

  const setVisualState = useCallback((updater: Partial<DAWState>) => {
    setHistory((curr) => ({
      ...curr,
      present: { ...curr.present, ...updater }
    }));
  }, []);

  const undo = useCallback(() => {
    setHistory((curr) => {
      if (curr.past.length === 0) return curr;

      return {
        past: curr.past.slice(0, -1),
        present: curr.past[curr.past.length - 1],
        future: [curr.present, ...curr.future]
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((curr) => {
      if (curr.future.length === 0) return curr;

      return {
        past: [...curr.past, curr.present],
        present: curr.future[0],
        future: curr.future.slice(1)
      };
    });
  }, []);

  return {
    state: history.present,
    setState,
    setVisualState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0
  };
};
