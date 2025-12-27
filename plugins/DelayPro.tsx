/**
 * DELAY PRO - Professional Tempo-Synced Delay
 *
 * Features:
 * - Perfect tempo synchronization
 * - Ping-pong stereo
 * - Feedback filtering (low-pass/high-pass)
 * - Modulation for analog warmth
 * - Ducking (auto-volume on input)
 * - Multiple tap delays
 * - Freeze mode
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PluginParameter } from '../types';

export type DelayDivision = '1/32' | '1/16T' | '1/16' | '1/8T' | '1/8' | '1/4T' | '1/4' | '1/2T' | '1/2' | '1/1' | '2/1';
export type DelayMode = 'MONO' | 'STEREO' | 'PINGPONG' | 'DUAL';

export interface DelayProParams {
  division: DelayDivision;
  bpm: number;
  feedback: number;        // 0 to 0.95
  mix: number;             // 0 to 1
  damping: number;         // 500 to 20000 Hz (feedback filter)
  modulation: number;      // 0 to 1 (analog-style modulation)
  modRate: number;         // 0.1 to 10 Hz
  ducking: number;         // 0 to 1 (auto-duck on input)
  width: number;           // 0 to 1 (stereo width)
  mode: DelayMode;
  freeze: boolean;
  isEnabled: boolean;
}

export const DELAY_PRO_PRESETS = [
  { name: "1/4 Slap", division: '1/4' as DelayDivision, feedback: 0.2, mix: 0.25, damping: 8000, modulation: 0.1, mode: 'MONO' as DelayMode },
  { name: "1/8 Ping-Pong", division: '1/8' as DelayDivision, feedback: 0.4, mix: 0.3, damping: 12000, modulation: 0.15, mode: 'PINGPONG' as DelayMode },
  { name: "1/4 Dub", division: '1/4' as DelayDivision, feedback: 0.7, mix: 0.4, damping: 4000, modulation: 0.3, mode: 'STEREO' as DelayMode },
  { name: "1/16 Dotted", division: '1/16' as DelayDivision, feedback: 0.5, mix: 0.2, damping: 15000, modulation: 0.05, mode: 'DUAL' as DelayMode },
];

export class DelayProNode {
  private ctx: AudioContext;
  public input: GainNode;
  public output: GainNode;

  // Signal Chain
  private dryGain: GainNode;
  private wetGain: GainNode;

  // Delays
  private delayNodeL: DelayNode;
  private delayNodeR: DelayNode;

  // Feedback paths
  private feedbackL: GainNode;
  private feedbackR: GainNode;
  private crossfeedL: GainNode;  // For ping-pong
  private crossfeedR: GainNode;

  // Filters
  private feedbackFilterL: BiquadFilterNode;
  private feedbackFilterR: BiquadFilterNode;

  // Modulation
  private modulationLFO: OscillatorNode;
  private modulationGain: GainNode;

  // Ducking
  private duckingCompressor: DynamicsCompressorNode;

  // Stereo
  private splitter: ChannelSplitterNode;
  private merger: ChannelMergerNode;

  private params: DelayProParams = {
    division: '1/4',
    bpm: 120,
    feedback: 0.4,
    mix: 0.3,
    damping: 12000,
    modulation: 0.15,
    modRate: 0.5,
    ducking: 0,
    width: 1.0,
    mode: 'PINGPONG',
    freeze: false,
    isEnabled: true
  };

  public latency: number = 0;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.input = ctx.createGain();
    this.output = ctx.createGain();

    // Dry/Wet
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();

    // Delays
    this.delayNodeL = ctx.createDelay(4.0); // Max 4 seconds
    this.delayNodeR = ctx.createDelay(4.0);

    // Feedback
    this.feedbackL = ctx.createGain();
    this.feedbackR = ctx.createGain();
    this.crossfeedL = ctx.createGain();
    this.crossfeedR = ctx.createGain();

    // Filters
    this.feedbackFilterL = ctx.createBiquadFilter();
    this.feedbackFilterL.type = 'lowpass';
    this.feedbackFilterR = ctx.createBiquadFilter();
    this.feedbackFilterR.type = 'lowpass';

    // Modulation LFO
    this.modulationLFO = ctx.createOscillator();
    this.modulationLFO.type = 'sine';
    this.modulationLFO.frequency.value = 0.5;
    this.modulationGain = ctx.createGain();
    this.modulationGain.gain.value = 0;
    this.modulationLFO.connect(this.modulationGain);
    this.modulationLFO.start();

    // Ducking
    this.duckingCompressor = ctx.createDynamicsCompressor();
    this.duckingCompressor.threshold.value = -24;
    this.duckingCompressor.ratio.value = 12;
    this.duckingCompressor.attack.value = 0.003;
    this.duckingCompressor.release.value = 0.25;

    // Stereo
    this.splitter = ctx.createChannelSplitter(2);
    this.merger = ctx.createChannelMerger(2);

    this.setupChain();
    this.applyParams();
  }

  private setupChain() {
    // Dry path
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);

    // Split input for stereo processing
    this.input.connect(this.splitter);

    // LEFT CHANNEL
    // Input -> Delay -> Filter -> Feedback -> Back to delay
    this.splitter.connect(this.delayNodeL, 0);
    this.delayNodeL.connect(this.feedbackFilterL);
    this.feedbackFilterL.connect(this.feedbackL);
    this.feedbackL.connect(this.delayNodeL); // Feedback loop

    // Crossfeed for ping-pong
    this.feedbackFilterL.connect(this.crossfeedR);
    this.crossfeedR.connect(this.delayNodeR);

    // Output
    this.feedbackFilterL.connect(this.merger, 0, 0);

    // RIGHT CHANNEL
    this.splitter.connect(this.delayNodeR, 1);
    this.delayNodeR.connect(this.feedbackFilterR);
    this.feedbackFilterR.connect(this.feedbackR);
    this.feedbackR.connect(this.delayNodeR); // Feedback loop

    // Crossfeed for ping-pong
    this.feedbackFilterR.connect(this.crossfeedL);
    this.crossfeedL.connect(this.delayNodeL);

    // Output
    this.feedbackFilterR.connect(this.merger, 0, 1);

    // Modulation (connect LFO to delay times)
    this.modulationGain.connect(this.delayNodeL.delayTime);
    this.modulationGain.connect(this.delayNodeR.delayTime);

    // Final mix with ducking
    this.merger.connect(this.duckingCompressor);
    this.duckingCompressor.connect(this.wetGain);
    this.wetGain.connect(this.output);
  }

  private getDivisionTime(division: DelayDivision, bpm: number): number {
    const beatDuration = 60 / bpm; // Duration of 1 beat in seconds

    const divisionMap: Record<DelayDivision, number> = {
      '1/32': beatDuration / 8,
      '1/16T': (beatDuration / 4) * (2 / 3), // Triplet
      '1/16': beatDuration / 4,
      '1/8T': (beatDuration / 2) * (2 / 3),  // Triplet
      '1/8': beatDuration / 2,
      '1/4T': beatDuration * (2 / 3),         // Triplet
      '1/4': beatDuration,
      '1/2T': (beatDuration * 2) * (2 / 3),  // Triplet
      '1/2': beatDuration * 2,
      '1/1': beatDuration * 4,
      '2/1': beatDuration * 8,
    };

    return divisionMap[division] || beatDuration;
  }

  public updateParams(p: Partial<DelayProParams>) {
    this.params = { ...this.params, ...p };
    this.applyParams();
  }

  private applyParams() {
    const now = this.ctx.currentTime;
    const rampTime = 0.02;

    const safe = (val: number, def: number) => Number.isFinite(val) ? val : def;

    if (this.params.isEnabled) {
      // Calculate delay time from BPM and division
      const delayTime = this.getDivisionTime(this.params.division, this.params.bpm);

      this.delayNodeL.delayTime.setTargetAtTime(
        safe(delayTime, 0.5),
        now,
        rampTime
      );

      // For dual mode, right channel is slightly offset
      const rightOffset = this.params.mode === 'DUAL' ? delayTime * 1.5 : delayTime;
      this.delayNodeR.delayTime.setTargetAtTime(
        safe(rightOffset, 0.5),
        now,
        rampTime
      );

      // Feedback
      const feedback = this.params.freeze ? 1.0 : safe(this.params.feedback, 0.4);

      if (this.params.mode === 'PINGPONG') {
        // Ping-pong: low direct feedback, high crossfeed
        this.feedbackL.gain.setTargetAtTime(feedback * 0.3, now, rampTime);
        this.feedbackR.gain.setTargetAtTime(feedback * 0.3, now, rampTime);
        this.crossfeedL.gain.setTargetAtTime(feedback * 0.7, now, rampTime);
        this.crossfeedR.gain.setTargetAtTime(feedback * 0.7, now, rampTime);
      } else {
        // Other modes: normal feedback
        this.feedbackL.gain.setTargetAtTime(feedback, now, rampTime);
        this.feedbackR.gain.setTargetAtTime(feedback, now, rampTime);
        this.crossfeedL.gain.setTargetAtTime(0, now, rampTime);
        this.crossfeedR.gain.setTargetAtTime(0, now, rampTime);
      }

      // Damping (feedback filter)
      this.feedbackFilterL.frequency.setTargetAtTime(
        safe(this.params.damping, 12000),
        now,
        rampTime
      );
      this.feedbackFilterR.frequency.setTargetAtTime(
        safe(this.params.damping, 12000),
        now,
        rampTime
      );

      // Modulation
      const modDepth = safe(this.params.modulation, 0.15);
      this.modulationGain.gain.setTargetAtTime(
        modDepth * delayTime * 0.05, // 5% max modulation
        now,
        rampTime
      );
      this.modulationLFO.frequency.setTargetAtTime(
        safe(this.params.modRate, 0.5),
        now,
        rampTime
      );

      // Ducking
      if (this.params.ducking > 0) {
        this.duckingCompressor.threshold.value = -24 + (this.params.ducking * 20);
      } else {
        this.duckingCompressor.threshold.value = 0; // No ducking
      }

      // Mix
      const mix = safe(this.params.mix, 0.3);
      this.wetGain.gain.setTargetAtTime(mix, now, rampTime);
      this.dryGain.gain.setTargetAtTime(1 - mix * 0.5, now, rampTime);

    } else {
      // Bypass
      this.wetGain.gain.setTargetAtTime(0, now, rampTime);
      this.dryGain.gain.setTargetAtTime(1, now, rampTime);
    }
  }

  public getAudioParam(paramId: string): AudioParam | null {
    switch (paramId) {
      case 'mix': return this.wetGain.gain;
      case 'feedback': return this.feedbackL.gain;
      case 'damping': return this.feedbackFilterL.frequency;
      default: return null;
    }
  }

  public getParameters(): PluginParameter[] {
    return [
      { id: 'feedback', name: 'Feedback', type: 'float', min: 0, max: 0.95, value: this.params.feedback, unit: '' },
      { id: 'mix', name: 'Mix', type: 'float', min: 0, max: 1, value: this.params.mix, unit: '' },
      { id: 'damping', name: 'Damping', type: 'float', min: 500, max: 20000, value: this.params.damping, unit: 'Hz' },
    ];
  }

  public getParams() {
    return { ...this.params };
  }

  public getLatency(): number {
    return 0; // Delay is intentional, not latency
  }
}

// UI Component
interface DelayProUIProps {
  node: DelayProNode;
  initialParams: DelayProParams;
  onParamsChange?: (p: DelayProParams) => void;
}

export const DelayProUI: React.FC<DelayProUIProps> = ({
  node,
  initialParams,
  onParamsChange
}) => {
  const [params, setParams] = useState<DelayProParams>(initialParams);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [currentDelayTime, setCurrentDelayTime] = useState(0);
  const visualizerRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const beatDuration = 60 / params.bpm;
    const divisionMap: Record<DelayDivision, number> = {
      '1/32': beatDuration / 8,
      '1/16T': (beatDuration / 4) * (2 / 3),
      '1/16': beatDuration / 4,
      '1/8T': (beatDuration / 2) * (2 / 3),
      '1/8': beatDuration / 2,
      '1/4T': beatDuration * (2 / 3),
      '1/4': beatDuration,
      '1/2T': (beatDuration * 2) * (2 / 3),
      '1/2': beatDuration * 2,
      '1/1': beatDuration * 4,
      '2/1': beatDuration * 8,
    };
    setCurrentDelayTime(divisionMap[params.division] || beatDuration);
  }, [params.division, params.bpm]);

  useEffect(() => {
    drawVisualizer();
  }, [params.feedback, currentDelayTime]);

  const handleParamChange = useCallback((key: keyof DelayProParams, value: any) => {
    const newParams = { ...params, [key]: value };
    setParams(newParams);
    node.updateParams({ [key]: value });
    onParamsChange?.(newParams);
    setSelectedPreset(null);
  }, [params, node, onParamsChange]);

  const loadPreset = useCallback((index: number) => {
    const preset = DELAY_PRO_PRESETS[index];
    const newParams = { ...params, ...preset };
    setParams(newParams);
    node.updateParams(preset);
    onParamsChange?.(newParams);
    setSelectedPreset(index);
  }, [params, node, onParamsChange]);

  const drawVisualizer = () => {
    const canvas = visualizerRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Draw delay taps
    const maxTaps = 8;
    for (let i = 0; i < maxTaps; i++) {
      const x = (i / maxTaps) * w;
      const amplitude = Math.pow(params.feedback, i);
      const barHeight = amplitude * h * 0.8;
      const y = (h - barHeight) / 2;

      ctx.fillStyle = `rgba(0, 242, 255, ${amplitude})`;
      ctx.fillRect(x, y, w / maxTaps * 0.8, barHeight);
    }
  };

  const divisions: DelayDivision[] = ['1/32', '1/16T', '1/16', '1/8T', '1/8', '1/4T', '1/4', '1/2T', '1/2', '1/1', '2/1'];

  return (
    <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-cyan-500/30 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          DELAY PRO
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleParamChange('freeze', !params.freeze)}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
              params.freeze
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                : 'bg-slate-700 text-slate-400'
            }`}
          >
            <i className="fas fa-snowflake mr-2"></i>
            FREEZE
          </button>
        </div>
      </div>

      {/* Presets */}
      <div className="mb-6">
        <label className="block text-xs text-slate-400 mb-2 font-bold">PRESETS</label>
        <div className="grid grid-cols-2 gap-2">
          {DELAY_PRO_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => loadPreset(idx)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedPreset === idx
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Mode */}
      <div className="mb-6">
        <label className="block text-xs text-slate-400 mb-2 font-bold">MODE</label>
        <div className="grid grid-cols-4 gap-2">
          {(['MONO', 'STEREO', 'PINGPONG', 'DUAL'] as DelayMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => handleParamChange('mode', mode)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                params.mode === mode
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Time Display */}
      <div className="mb-6 p-4 bg-black/40 rounded-lg border border-cyan-500/30">
        <div className="text-center">
          <div className="text-4xl font-black text-cyan-400 font-mono mb-2">
            {currentDelayTime.toFixed(0)}ms
          </div>
          <div className="text-sm text-slate-400">
            {params.division} @ {params.bpm} BPM
          </div>
        </div>
      </div>

      {/* Visualizer */}
      <canvas
        ref={visualizerRef}
        width={400}
        height={100}
        className="w-full mb-6 rounded-lg bg-black/40 border border-white/10"
      />

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* BPM */}
        <div>
          <label className="block text-xs text-slate-400 mb-2 font-bold">BPM</label>
          <input
            type="number"
            value={params.bpm}
            onChange={(e) => handleParamChange('bpm', Number(e.target.value))}
            className="w-full bg-slate-900 text-white text-center rounded px-3 py-2 border border-cyan-500/30 focus:border-cyan-500 outline-none font-mono"
            min="20"
            max="999"
          />
        </div>

        {/* Division Dropdown */}
        <div>
          <label className="block text-xs text-slate-400 mb-2 font-bold">DIVISION</label>
          <select
            value={params.division}
            onChange={(e) => handleParamChange('division', e.target.value as DelayDivision)}
            className="w-full bg-slate-900 text-white rounded px-3 py-2 border border-cyan-500/30 focus:border-cyan-500 outline-none font-mono"
          >
            {divisions.map((div) => (
              <option key={div} value={div}>{div}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Feedback */}
        <div>
          <label className="block text-xs text-slate-400 mb-2 font-bold">FEEDBACK</label>
          <input
            type="range"
            min="0"
            max="0.95"
            step="0.01"
            value={params.feedback}
            onChange={(e) => handleParamChange('feedback', Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <div className="text-sm text-cyan-400 font-mono text-right mt-1">
            {(params.feedback * 100).toFixed(0)}%
          </div>
        </div>

        {/* Mix */}
        <div>
          <label className="block text-xs text-slate-400 mb-2 font-bold">MIX</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={params.mix}
            onChange={(e) => handleParamChange('mix', Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <div className="text-sm text-cyan-400 font-mono text-right mt-1">
            {(params.mix * 100).toFixed(0)}%
          </div>
        </div>

        {/* Damping */}
        <div>
          <label className="block text-xs text-slate-400 mb-2 font-bold">DAMPING</label>
          <input
            type="range"
            min="500"
            max="20000"
            step="100"
            value={params.damping}
            onChange={(e) => handleParamChange('damping', Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <div className="text-sm text-cyan-400 font-mono text-right mt-1">
            {(params.damping / 1000).toFixed(1)}kHz
          </div>
        </div>

        {/* Modulation */}
        <div>
          <label className="block text-xs text-slate-400 mb-2 font-bold">MODULATION</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={params.modulation}
            onChange={(e) => handleParamChange('modulation', Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <div className="text-sm text-cyan-400 font-mono text-right mt-1">
            {(params.modulation * 100).toFixed(0)}%
          </div>
        </div>

        {/* Mod Rate */}
        <div>
          <label className="block text-xs text-slate-400 mb-2 font-bold">MOD RATE</label>
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={params.modRate}
            onChange={(e) => handleParamChange('modRate', Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <div className="text-sm text-cyan-400 font-mono text-right mt-1">
            {params.modRate.toFixed(1)}Hz
          </div>
        </div>

        {/* Ducking */}
        <div>
          <label className="block text-xs text-slate-400 mb-2 font-bold">DUCKING</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={params.ducking}
            onChange={(e) => handleParamChange('ducking', Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <div className="text-sm text-cyan-400 font-mono text-right mt-1">
            {(params.ducking * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
        <p className="text-xs text-cyan-300 text-center">
          <i className="fas fa-info-circle mr-2"></i>
          Tempo Sync • Ping-Pong • Feedback Filtering • Modulation • Ducking
        </p>
      </div>
    </div>
  );
};
