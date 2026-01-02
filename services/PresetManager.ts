/**
 * PRESET MANAGER - Universal Plugin Preset System
 *
 * Manages presets for all plugins:
 * - Save/Load/Delete presets
 * - Import/Export presets as JSON
 * - Share presets between users
 * - Preset categories and tags
 * - Factory presets vs User presets
 */

import { PluginType } from '../types';

export interface PluginPreset {
  id: string;
  name: string;
  pluginType: PluginType;
  params: Record<string, any>;
  category?: string;
  tags?: string[];
  author?: string;
  description?: string;
  isFactory: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PresetCategory {
  id: string;
  name: string;
  pluginType: PluginType;
}

export class PresetManager {
  private presets: Map<PluginType, PluginPreset[]> = new Map();
  private readonly STORAGE_KEY = 'studio_daw_presets';

  constructor() {
    this.loadFromLocalStorage();
    this.initializeFactoryPresets();
  }

  /**
   * Save a new preset
   */
  public savePreset(preset: Omit<PluginPreset, 'id' | 'createdAt' | 'updatedAt'>): PluginPreset {
    const newPreset: PluginPreset = {
      ...preset,
      id: `preset-${Date.now()}-${Math.random()}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const pluginPresets = this.presets.get(preset.pluginType) || [];
    pluginPresets.push(newPreset);
    this.presets.set(preset.pluginType, pluginPresets);

    this.saveToLocalStorage();
    return newPreset;
  }

  /**
   * Update an existing preset
   */
  public updatePreset(presetId: string, updates: Partial<Omit<PluginPreset, 'id' | 'createdAt'>>): boolean {
    for (const [pluginType, presets] of this.presets.entries()) {
      const index = presets.findIndex(p => p.id === presetId);
      if (index !== -1) {
        // Don't allow updating factory presets
        if (presets[index].isFactory) {
          console.warn('Cannot update factory preset');
          return false;
        }

        presets[index] = {
          ...presets[index],
          ...updates,
          updatedAt: Date.now()
        };

        this.presets.set(pluginType, presets);
        this.saveToLocalStorage();
        return true;
      }
    }
    return false;
  }

  /**
   * Delete a preset
   */
  public deletePreset(presetId: string): boolean {
    for (const [pluginType, presets] of this.presets.entries()) {
      const index = presets.findIndex(p => p.id === presetId);
      if (index !== -1) {
        // Don't allow deleting factory presets
        if (presets[index].isFactory) {
          console.warn('Cannot delete factory preset');
          return false;
        }

        presets.splice(index, 1);
        this.presets.set(pluginType, presets);
        this.saveToLocalStorage();
        return true;
      }
    }
    return false;
  }

  /**
   * Get all presets for a plugin type
   */
  public getPresetsForPlugin(pluginType: PluginType): PluginPreset[] {
    return this.presets.get(pluginType) || [];
  }

  /**
   * Get a specific preset by ID
   */
  public getPreset(presetId: string): PluginPreset | null {
    for (const presets of this.presets.values()) {
      const preset = presets.find(p => p.id === presetId);
      if (preset) return preset;
    }
    return null;
  }

  /**
   * Get presets by category
   */
  public getPresetsByCategory(pluginType: PluginType, category: string): PluginPreset[] {
    const presets = this.getPresetsForPlugin(pluginType);
    return presets.filter(p => p.category === category);
  }

  /**
   * Search presets by name or tags
   */
  public searchPresets(pluginType: PluginType, query: string): PluginPreset[] {
    const presets = this.getPresetsForPlugin(pluginType);
    const lowerQuery = query.toLowerCase();

    return presets.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description?.toLowerCase().includes(lowerQuery) ||
      p.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Export preset to JSON
   */
  public exportPreset(presetId: string): string | null {
    const preset = this.getPreset(presetId);
    if (!preset) return null;

    return JSON.stringify(preset, null, 2);
  }

  /**
   * Export all presets for a plugin
   */
  public exportPluginPresets(pluginType: PluginType): string {
    const presets = this.getPresetsForPlugin(pluginType);
    return JSON.stringify(presets, null, 2);
  }

  /**
   * Import preset from JSON
   */
  public importPreset(json: string): PluginPreset | null {
    try {
      const preset = JSON.parse(json) as PluginPreset;

      // Validate preset structure
      if (!preset.pluginType || !preset.params) {
        throw new Error('Invalid preset format');
      }

      // Remove factory flag and regenerate ID
      const importedPreset = this.savePreset({
        name: preset.name,
        pluginType: preset.pluginType,
        params: preset.params,
        category: preset.category,
        tags: preset.tags,
        author: preset.author,
        description: preset.description,
        isFactory: false
      });

      return importedPreset;
    } catch (error) {
      console.error('Failed to import preset:', error);
      return null;
    }
  }

  /**
   * Import multiple presets
   */
  public importPresets(json: string): PluginPreset[] {
    try {
      const presets = JSON.parse(json) as PluginPreset[];
      const imported: PluginPreset[] = [];

      for (const preset of presets) {
        const result = this.importPreset(JSON.stringify(preset));
        if (result) imported.push(result);
      }

      return imported;
    } catch (error) {
      console.error('Failed to import presets:', error);
      return [];
    }
  }

  /**
   * Clone a preset (create a copy)
   */
  public clonePreset(presetId: string, newName?: string): PluginPreset | null {
    const original = this.getPreset(presetId);
    if (!original) return null;

    return this.savePreset({
      name: newName || `${original.name} (Copy)`,
      pluginType: original.pluginType,
      params: { ...original.params },
      category: original.category,
      tags: original.tags,
      author: original.author,
      description: original.description,
      isFactory: false
    });
  }

  /**
   * Get categories for a plugin type
   */
  public getCategoriesForPlugin(pluginType: PluginType): string[] {
    const presets = this.getPresetsForPlugin(pluginType);
    const categories = new Set<string>();

    presets.forEach(p => {
      if (p.category) categories.add(p.category);
    });

    return Array.from(categories).sort();
  }

  /**
   * Save to localStorage
   */
  private saveToLocalStorage() {
    try {
      const data: Record<string, PluginPreset[]> = {};

      for (const [pluginType, presets] of this.presets.entries()) {
        // Only save user presets (not factory)
        data[pluginType] = presets.filter(p => !p.isFactory);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save presets to localStorage:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const data = JSON.parse(stored) as Record<string, PluginPreset[]>;

      for (const [pluginType, presets] of Object.entries(data)) {
        this.presets.set(pluginType as PluginType, presets);
      }
    } catch (error) {
      console.error('Failed to load presets from localStorage:', error);
    }
  }

  /**
   * Initialize factory presets
   */
  private initializeFactoryPresets() {
    // CompressorPro factory presets
    this.addFactoryPresets('COMPRESSOR', [
      {
        name: 'Vocal Comp',
        params: { threshold: -20, ratio: 4, attack: 3, release: 100, knee: 6, autoMakeup: true, analogMode: true },
        category: 'Vocals',
        description: 'Smooth vocal compression with analog warmth'
      },
      {
        name: 'Drum Bus Glue',
        params: { threshold: -12, ratio: 2, attack: 10, release: 200, knee: 3, mix: 30, analogMode: true },
        category: 'Drums',
        description: 'Parallel compression for drum glue'
      },
      {
        name: 'Bass Leveler',
        params: { threshold: -15, ratio: 6, attack: 1, release: 80, knee: 12, autoMakeup: true },
        category: 'Bass',
        description: 'Fast compression for consistent bass levels'
      },
      {
        name: 'Mix Bus',
        params: { threshold: -6, ratio: 2, attack: 30, release: 400, knee: 6, analogMode: true },
        category: 'Mix',
        description: 'Gentle mix bus glue compression'
      }
    ]);

    // ReverbPro factory presets
    this.addFactoryPresets('REVERB', [
      {
        name: 'Vocal Plate',
        params: { mode: 'PLATE', decay: 1.4, preDelay: 25, damping: 12000, size: 0.6, width: 0.7, mix: 0.2 },
        category: 'Vocals',
        description: 'Classic vocal plate reverb'
      },
      {
        name: 'Large Hall',
        params: { mode: 'HALL', decay: 2.8, preDelay: 40, damping: 8000, size: 0.9, width: 1.0, mix: 0.25 },
        category: 'Orchestral',
        description: 'Spacious concert hall reverb'
      },
      {
        name: 'Tight Room',
        params: { mode: 'ROOM', decay: 0.6, preDelay: 10, damping: 8000, size: 0.3, width: 0.5, mix: 0.15 },
        category: 'Drums',
        description: 'Tight room for drums and percussion'
      },
      {
        name: 'Cathedral',
        params: { mode: 'CATHEDRAL', decay: 5.0, preDelay: 60, damping: 6000, size: 1.0, width: 1.0, mix: 0.35 },
        category: 'Ambient',
        description: 'Massive cathedral space'
      }
    ]);

    // DelayPro factory presets
    this.addFactoryPresets('DELAY', [
      {
        name: '1/4 Slap',
        params: { division: '1/4', feedback: 0.2, mix: 0.25, damping: 8000, mode: 'MONO' },
        category: 'Vocals',
        description: 'Classic slapback delay'
      },
      {
        name: '1/8 Ping-Pong',
        params: { division: '1/8', feedback: 0.45, mix: 0.3, damping: 12000, mode: 'PINGPONG', modulation: 0.15 },
        category: 'Synths',
        description: 'Stereo ping-pong delay'
      },
      {
        name: 'Dub Echo',
        params: { division: '1/4', feedback: 0.7, mix: 0.4, damping: 4000, mode: 'STEREO', modulation: 0.3 },
        category: 'Creative',
        description: 'Heavy dub-style delay'
      }
    ]);

    // EQPro factory presets
    this.addFactoryPresets('PROEQ12', [
      {
        name: 'Vocal Presence',
        params: {
          bands: [
            { frequency: 80, gain: 0, type: 'highpass', q: 0.707 },
            { frequency: 200, gain: -2, type: 'peaking', q: 1.5 },
            { frequency: 3000, gain: 3, type: 'peaking', q: 2.0 },
            { frequency: 8000, gain: 2, type: 'peaking', q: 1.5 }
          ]
        },
        category: 'Vocals',
        description: 'Enhance vocal clarity and presence'
      },
      {
        name: 'Bass Boost',
        params: {
          bands: [
            { frequency: 100, gain: 4, type: 'lowshelf', q: 0.707 },
            { frequency: 500, gain: -2, type: 'peaking', q: 1.5 }
          ]
        },
        category: 'Bass',
        description: 'Warm bass enhancement'
      }
    ]);
  }

  /**
   * Helper to add factory presets
   */
  private addFactoryPresets(pluginType: PluginType, presetsData: Array<{
    name: string;
    params: Record<string, any>;
    category?: string;
    description?: string;
  }>) {
    const existingPresets = this.presets.get(pluginType) || [];

    const factoryPresets: PluginPreset[] = presetsData.map((data, index) => ({
      id: `factory-${pluginType}-${index}`,
      name: data.name,
      pluginType,
      params: data.params,
      category: data.category,
      description: data.description,
      tags: [],
      author: 'Studio DAW',
      isFactory: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }));

    this.presets.set(pluginType, [...factoryPresets, ...existingPresets]);
  }

  /**
   * Reset to factory defaults (delete all user presets)
   */
  public resetToFactoryDefaults(pluginType?: PluginType) {
    if (pluginType) {
      // Reset specific plugin
      const allPresets = this.presets.get(pluginType) || [];
      const factoryOnly = allPresets.filter(p => p.isFactory);
      this.presets.set(pluginType, factoryOnly);
    } else {
      // Reset all plugins
      for (const [type, allPresets] of this.presets.entries()) {
        const factoryOnly = allPresets.filter(p => p.isFactory);
        this.presets.set(type, factoryOnly);
      }
    }

    this.saveToLocalStorage();
  }

  /**
   * Get statistics
   */
  public getStats(): {
    totalPresets: number;
    factoryPresets: number;
    userPresets: number;
    byPlugin: Record<string, number>;
  } {
    let totalPresets = 0;
    let factoryPresets = 0;
    let userPresets = 0;
    const byPlugin: Record<string, number> = {};

    for (const [pluginType, presets] of this.presets.entries()) {
      totalPresets += presets.length;
      factoryPresets += presets.filter(p => p.isFactory).length;
      userPresets += presets.filter(p => !p.isFactory).length;
      byPlugin[pluginType] = presets.length;
    }

    return { totalPresets, factoryPresets, userPresets, byPlugin };
  }
}

// Singleton instance
export const presetManager = new PresetManager();
