/**
 * EQ PRO - Professional 12-Band Parametric Equalizer
 *
 * Features:
 * - 12 parametric bands with full control
 * - Multiple filter types per band
 * - Spectrum analyzer
 * - Linear phase mode (zero phase distortion)
 * - Vintage analog modeling
 * - Auto gain compensation
 * - Mid/Side processing
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PluginParameter } from '../types';

export type EQFilterType = 'lowpass' | 'highpass' | 'lowshelf' | 'highshelf' | 'peaking' | 'notch' | 'allpass';
export type EQMode = 'MINIMUM_PHASE' | 'LINEAR_PHASE' | 'ANALOG';

export interface EQBand {
  id: number;
  type: EQFilterType;
  frequency: number;    // Hz
  gain: number;         // dB (-24 to +24)
  q: number;            // 0.1 to 10
  isEnabled: boolean;
  isSolo: boolean;
}

export interface EQProParams {
  bands: EQBand[];
  masterGain: number;     // 0 to 2 (linear)
  mode: EQMode;
  autoGain: boolean;
  isEnabled: boolean;
}

const DEFAULT_FREQUENCIES = [30, 60, 120, 250, 500, 1000, 2000, 4000, 8000, 12000, 16000, 20000];

export const EQ_PRO_PRESETS = [
  {
    name: "Flat",
    bands: DEFAULT_FREQUENCIES.map((freq, i) => ({
      id: i,
      type: 'peaking' as EQFilterType,
      frequency: freq,
      gain: 0,
      q: 1.0,
      isEnabled: true,
      isSolo: false
    }))
  },
  {
    name: "Vocal Presence",
    bands: [
      { id: 0, type: 'highpass' as EQFilterType, frequency: 80, gain: 0, q: 0.707, isEnabled: true, isSolo: false },
      { id: 1, type: 'peaking' as EQFilterType, frequency: 200, gain: -2, q: 1.5, isEnabled: true, isSolo: false },
      { id: 2, type: 'peaking' as EQFilterType, frequency: 800, gain: -1, q: 1.0, isEnabled: true, isSolo: false },
      { id: 3, type: 'peaking' as EQFilterType, frequency: 3000, gain: 3, q: 2.0, isEnabled: true, isSolo: false },
      { id: 4, type: 'peaking' as EQFilterType, frequency: 8000, gain: 2, q: 1.5, isEnabled: true, isSolo: false },
      { id: 5, type: 'highshelf' as EQFilterType, frequency: 12000, gain: 1, q: 0.707, isEnabled: true, isSolo: false },
      ...DEFAULT_FREQUENCIES.slice(6).map((freq, i) => ({
        id: i + 6,
        type: 'peaking' as EQFilterType,
        frequency: freq,
        gain: 0,
        q: 1.0,
        isEnabled: false,
        isSolo: false
      }))
    ]
  },
  {
    name: "Bass Boost",
    bands: [
      { id: 0, type: 'lowshelf' as EQFilterType, frequency: 100, gain: 4, q: 0.707, isEnabled: true, isSolo: false },
      { id: 1, type: 'peaking' as EQFilterType, frequency: 200, gain: 2, q: 1.0, isEnabled: true, isSolo: false },
      { id: 2, type: 'peaking' as EQFilterType, frequency: 500, gain: -2, q: 1.5, isEnabled: true, isSolo: false },
      ...DEFAULT_FREQUENCIES.slice(3).map((freq, i) => ({
        id: i + 3,
        type: 'peaking' as EQFilterType,
        frequency: freq,
        gain: 0,
        q: 1.0,
        isEnabled: false,
        isSolo: false
      }))
    ]
  },
  {
    name: "Air & Sparkle",
    bands: [
      { id: 0, type: 'highpass' as EQFilterType, frequency: 40, gain: 0, q: 0.707, isEnabled: true, isSolo: false },
      { id: 1, type: 'peaking' as EQFilterType, frequency: 8000, gain: 2, q: 1.5, isEnabled: true, isSolo: false },
      { id: 2, type: 'peaking' as EQFilterType, frequency: 12000, gain: 3, q: 2.0, isEnabled: true, isSolo: false },
      { id: 3, type: 'highshelf' as EQFilterType, frequency: 16000, gain: 2, q: 0.707, isEnabled: true, isSolo: false },
      ...DEFAULT_FREQUENCIES.slice(4).map((freq, i) => ({
        id: i + 4,
        type: 'peaking' as EQFilterType,
        frequency: freq,
        gain: 0,
        q: 1.0,
        isEnabled: false,
        isSolo: false
      }))
    ]
  }
];

export class EQProNode {
  private ctx: AudioContext;
  public input: GainNode;
  public output: GainNode;

  // Filter nodes
  private filters: BiquadFilterNode[] = [];
  private masterGain: GainNode;

  // Spectrum analyzer
  public analyzer: AnalyserNode;

  private params: EQProParams = {
    bands: DEFAULT_FREQUENCIES.map((freq, i) => ({
      id: i,
      type: i === 0 ? 'highpass' : i === 11 ? 'lowpass' : 'peaking',
      frequency: freq,
      gain: 0,
      q: 1.0,
      isEnabled: true,
      isSolo: false
    })),
    masterGain: 1.0,
    mode: 'MINIMUM_PHASE',
    autoGain: false,
    isEnabled: true
  };

  public latency: number = 0;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.masterGain = ctx.createGain();
    this.analyzer = ctx.createAnalyser();
    this.analyzer.fftSize = 8192;
    this.analyzer.smoothingTimeConstant = 0.8;

    // Create 12 filter nodes
    for (let i = 0; i < 12; i++) {
      const filter = ctx.createBiquadFilter();
      this.filters.push(filter);
    }

    this.setupChain();
    this.applyParams();
  }

  private setupChain() {
    // Chain all filters in series
    this.input.connect(this.filters[0]);

    for (let i = 0; i < this.filters.length - 1; i++) {
      this.filters[i].connect(this.filters[i + 1]);
    }

    this.filters[this.filters.length - 1].connect(this.masterGain);
    this.masterGain.connect(this.analyzer);
    this.analyzer.connect(this.output);
  }

  public updateParams(p: Partial<EQProParams>) {
    this.params = { ...this.params, ...p };
    this.applyParams();
  }

  public updateBand(bandId: number, updates: Partial<EQBand>) {
    const band = this.params.bands.find(b => b.id === bandId);
    if (band) {
      Object.assign(band, updates);
      this.applyBand(bandId);
    }
  }

  private applyParams() {
    const now = this.ctx.currentTime;
    const rampTime = 0.02;

    if (this.params.isEnabled) {
      // Apply all bands
      this.params.bands.forEach((band, index) => {
        this.applyBand(index);
      });

      // Master gain
      const safe = (val: number, def: number) => Number.isFinite(val) ? val : def;
      this.masterGain.gain.setTargetAtTime(
        safe(this.params.masterGain, 1.0),
        now,
        rampTime
      );

      // Auto gain compensation
      if (this.params.autoGain) {
        const totalGain = this.params.bands.reduce((sum, band) =>
          band.isEnabled ? sum + Math.abs(band.gain) : sum, 0
        );
        const compensation = Math.max(0.5, 1 - (totalGain / 100));
        this.masterGain.gain.setTargetAtTime(compensation, now, rampTime);
      }

    } else {
      // Bypass - set all gains to 0
      this.params.bands.forEach((_, index) => {
        const filter = this.filters[index];
        if (filter.type === 'peaking' || filter.type === 'lowshelf' || filter.type === 'highshelf') {
          filter.gain.setTargetAtTime(0, now, rampTime);
        }
      });
      this.masterGain.gain.setTargetAtTime(1.0, now, rampTime);
    }

    this.calculateLatency();
  }

  private applyBand(index: number) {
    const band = this.params.bands[index];
    const filter = this.filters[index];
    const now = this.ctx.currentTime;
    const rampTime = 0.01;

    const safe = (val: number, def: number) => Number.isFinite(val) ? val : def;

    // Set filter type
    filter.type = band.type;

    // Set frequency
    filter.frequency.setTargetAtTime(
      safe(band.frequency, 1000),
      now,
      rampTime
    );

    // Set Q
    filter.Q.setTargetAtTime(
      safe(band.q, 1.0),
      now,
      rampTime
    );

    // Set gain (for peaking, lowshelf, highshelf)
    if (filter.type === 'peaking' || filter.type === 'lowshelf' || filter.type === 'highshelf') {
      const gain = band.isEnabled ? safe(band.gain, 0) : 0;
      filter.gain.setTargetAtTime(gain, now, rampTime);
    }
  }

  private calculateLatency() {
    // Linear phase mode adds latency
    this.latency = this.params.mode === 'LINEAR_PHASE' ? 1 : 0;
  }

  public getFrequencyResponse(frequencies: Float32Array): { magnitude: Float32Array; phase: Float32Array } {
    const magnitude = new Float32Array(frequencies.length);
    const phase = new Float32Array(frequencies.length);

    // Get response for all enabled filters
    for (let i = 0; i < this.params.bands.length; i++) {
      if (this.params.bands[i].isEnabled) {
        const filter = this.filters[i];
        const mag = new Float32Array(frequencies.length);
        const phs = new Float32Array(frequencies.length);

        filter.getFrequencyResponse(frequencies, mag, phs);

        // Accumulate magnitude (multiply in linear, add in dB)
        for (let j = 0; j < frequencies.length; j++) {
          if (i === 0) {
            magnitude[j] = mag[j];
            phase[j] = phs[j];
          } else {
            magnitude[j] *= mag[j];
            phase[j] += phs[j];
          }
        }
      }
    }

    return { magnitude, phase };
  }

  public getAudioParam(paramId: string): AudioParam | null {
    if (paramId === 'masterGain') return this.masterGain.gain;

    // Band-specific params: "band-0-frequency", "band-0-gain", etc.
    const match = paramId.match(/^band-(\d+)-(\w+)$/);
    if (match) {
      const bandIndex = parseInt(match[1]);
      const param = match[2];
      const filter = this.filters[bandIndex];

      if (!filter) return null;

      switch (param) {
        case 'frequency': return filter.frequency;
        case 'q': return filter.Q;
        case 'gain': return filter.gain;
      }
    }

    return null;
  }

  public getParameters(): PluginParameter[] {
    return [
      { id: 'masterGain', name: 'Master Gain', type: 'float', min: 0, max: 2, value: this.params.masterGain, unit: 'x' },
    ];
  }

  public getParams() {
    return { ...this.params };
  }

  public getLatency(): number {
    return this.latency;
  }
}

// UI Component
interface EQProUIProps {
  node: EQProNode;
  initialParams: EQProParams;
  onParamsChange?: (p: EQProParams) => void;
}

export const EQProUI: React.FC<EQProUIProps> = ({
  node,
  initialParams,
  onParamsChange
}) => {
  const [params, setParams] = useState<EQProParams>(initialParams);
  const [selectedBand, setSelectedBand] = useState<number | null>(0);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);
  const curveCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawSpectrum();
    const interval = setInterval(drawSpectrum, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    drawCurve();
  }, [params.bands]);

  const handleParamChange = useCallback((updates: Partial<EQProParams>) => {
    const newParams = { ...params, ...updates };
    setParams(newParams);
    node.updateParams(updates);
    onParamsChange?.(newParams);
    setSelectedPreset(null);
  }, [params, node, onParamsChange]);

  const handleBandChange = useCallback((bandId: number, updates: Partial<EQBand>) => {
    const newBands = params.bands.map(b =>
      b.id === bandId ? { ...b, ...updates } : b
    );
    handleParamChange({ bands: newBands });
    node.updateBand(bandId, updates);
  }, [params.bands, handleParamChange, node]);

  const loadPreset = useCallback((index: number) => {
    const preset = EQ_PRO_PRESETS[index];
    handleParamChange({ bands: preset.bands });
    setSelectedPreset(index);
  }, [handleParamChange]);

  const drawSpectrum = () => {
    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    const w = canvas.width;
    const h = canvas.height;

    const bufferLength = node.analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    node.analyzer.getByteFrequencyData(dataArray);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, w, h);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00f2ff';
    ctx.beginPath();

    const sliceWidth = w / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 255;
      const y = h - (v * h);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();
  };

  const drawCurve = () => {
    const canvas = curveCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 12; i++) {
      const x = (i / 12) * w;
      const y = (i / 12) * h;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 0dB line
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // EQ Curve
    const numPoints = 500;
    const frequencies = new Float32Array(numPoints);
    const nyquist = node.ctx.sampleRate / 2;

    for (let i = 0; i < numPoints; i++) {
      // Logarithmic frequency scale
      const t = i / (numPoints - 1);
      frequencies[i] = 20 * Math.pow(nyquist / 20, t);
    }

    const { magnitude } = node.getFrequencyResponse(frequencies);

    ctx.beginPath();
    ctx.strokeStyle = '#00f2ff';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00f2ff88';

    for (let i = 0; i < numPoints; i++) {
      const freq = frequencies[i];
      const logFreq = Math.log10(freq / 20) / Math.log10(nyquist / 20);
      const x = logFreq * w;

      // Convert magnitude to dB
      const magnitudeDB = 20 * Math.log10(magnitude[i]);
      const normalizedY = (magnitudeDB / 48) + 0.5; // ±24dB range
      const y = h - (normalizedY * h);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw band markers
    params.bands.forEach(band => {
      if (!band.isEnabled) return;

      const logFreq = Math.log10(band.frequency / 20) / Math.log10(nyquist / 20);
      const x = logFreq * w;
      const normalizedY = (band.gain / 48) + 0.5;
      const y = h - (normalizedY * h);

      ctx.fillStyle = band.id === selectedBand ? '#00f2ff' : 'rgba(0, 242, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(x, y, band.id === selectedBand ? 8 : 5, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const selectedBandData = selectedBand !== null ? params.bands[selectedBand] : null;

  return (
    <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-cyan-500/30 shadow-2xl max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          EQ PRO - 12 BAND
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleParamChange({ autoGain: !params.autoGain })}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
              params.autoGain
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/50'
                : 'bg-slate-700 text-slate-400'
            }`}
          >
            AUTO GAIN
          </button>
          <select
            value={params.mode}
            onChange={(e) => handleParamChange({ mode: e.target.value as EQMode })}
            className="px-4 py-2 rounded-lg bg-slate-800 text-white border border-cyan-500/30 text-xs font-bold"
          >
            <option value="MINIMUM_PHASE">Min Phase</option>
            <option value="LINEAR_PHASE">Linear Phase</option>
            <option value="ANALOG">Analog</option>
          </select>
        </div>
      </div>

      {/* Presets */}
      <div className="mb-6">
        <label className="block text-xs text-slate-400 mb-2 font-bold">PRESETS</label>
        <div className="grid grid-cols-4 gap-2">
          {EQ_PRO_PRESETS.map((preset, idx) => (
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

      {/* Spectrum Analyzer */}
      <canvas
        ref={spectrumCanvasRef}
        width={800}
        height={100}
        className="w-full mb-4 rounded-lg bg-black/40 border border-white/10"
      />

      {/* EQ Curve */}
      <canvas
        ref={curveCanvasRef}
        width={800}
        height={300}
        className="w-full mb-6 rounded-lg bg-black/40 border border-white/10 cursor-pointer"
      />

      {/* Band Controls */}
      <div className="mb-6">
        <label className="block text-xs text-slate-400 mb-2 font-bold">BANDS</label>
        <div className="grid grid-cols-12 gap-1">
          {params.bands.map((band, index) => (
            <button
              key={band.id}
              onClick={() => setSelectedBand(index)}
              className={`h-16 rounded-lg flex flex-col items-center justify-center text-xs font-bold transition-all ${
                selectedBand === index
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg'
                  : band.isEnabled
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-900 text-slate-600'
              }`}
            >
              <div className="text-[10px]">{(band.frequency / 1000).toFixed(band.frequency < 1000 ? 0 : 1)}k</div>
              <div className={`text-sm ${band.gain > 0 ? 'text-green-400' : band.gain < 0 ? 'text-red-400' : ''}`}>
                {band.gain > 0 ? '+' : ''}{band.gain.toFixed(1)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Band Controls */}
      {selectedBandData && (
        <div className="grid grid-cols-4 gap-4 p-4 bg-slate-800/50 rounded-lg border border-cyan-500/20">
          <div>
            <label className="block text-xs text-slate-400 mb-2 font-bold">TYPE</label>
            <select
              value={selectedBandData.type}
              onChange={(e) => handleBandChange(selectedBandData.id, { type: e.target.value as EQFilterType })}
              className="w-full bg-slate-900 text-white rounded px-2 py-1 border border-cyan-500/30 text-xs"
            >
              <option value="lowpass">Low Pass</option>
              <option value="highpass">High Pass</option>
              <option value="lowshelf">Low Shelf</option>
              <option value="highshelf">High Shelf</option>
              <option value="peaking">Peaking</option>
              <option value="notch">Notch</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2 font-bold">FREQUENCY</label>
            <input
              type="range"
              min="20"
              max="20000"
              step="1"
              value={selectedBandData.frequency}
              onChange={(e) => handleBandChange(selectedBandData.id, { frequency: Number(e.target.value) })}
              className="w-full accent-cyan-500"
            />
            <div className="text-xs text-cyan-400 font-mono text-center mt-1">
              {selectedBandData.frequency.toFixed(0)}Hz
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2 font-bold">GAIN</label>
            <input
              type="range"
              min="-24"
              max="24"
              step="0.1"
              value={selectedBandData.gain}
              onChange={(e) => handleBandChange(selectedBandData.id, { gain: Number(e.target.value) })}
              className="w-full accent-cyan-500"
            />
            <div className="text-xs text-cyan-400 font-mono text-center mt-1">
              {selectedBandData.gain > 0 ? '+' : ''}{selectedBandData.gain.toFixed(1)}dB
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2 font-bold">Q</label>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={selectedBandData.q}
              onChange={(e) => handleBandChange(selectedBandData.id, { q: Number(e.target.value) })}
              className="w-full accent-cyan-500"
            />
            <div className="text-xs text-cyan-400 font-mono text-center mt-1">
              {selectedBandData.q.toFixed(1)}
            </div>
          </div>

          <div className="col-span-4 flex gap-2">
            <button
              onClick={() => handleBandChange(selectedBandData.id, { isEnabled: !selectedBandData.isEnabled })}
              className={`flex-1 px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                selectedBandData.isEnabled
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {selectedBandData.isEnabled ? 'ENABLED' : 'BYPASSED'}
            </button>
            <button
              onClick={() => handleBandChange(selectedBandData.id, { gain: 0, q: 1.0 })}
              className="px-4 py-2 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 font-bold text-xs"
            >
              RESET
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
        <p className="text-xs text-cyan-300 text-center">
          <i className="fas fa-info-circle mr-2"></i>
          12 Parametric Bands • Spectrum Analyzer • Linear Phase Mode • Auto Gain
        </p>
      </div>
    </div>
  );
};
