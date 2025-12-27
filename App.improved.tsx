import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Track,
  TrackType,
  DAWState,
  ProjectPhase,
  PluginInstance,
  PluginType,
  MobileTab,
  ViewMode,
  User,
  Theme
} from './types';
import { audioEngine } from './engine/AudioEngine';

// Components
import TransportBar from './components/TransportBar';
import SideBrowser from './components/SideBrowser';
import ArrangementView from './components/ArrangementView';
import MixerView from './components/MixerView';
import PluginEditor from './components/PluginEditor';
import ChatAssistant from './components/ChatAssistant';
import ViewModeSwitcher from './components/ViewModeSwitcher';
import ContextMenu from './components/ContextMenu';
import TouchInteractionManager from './components/TouchInteractionManager';
import GlobalClipMenu from './components/GlobalClipMenu';
import TrackCreationBar from './components/TrackCreationBar';
import AuthScreen from './components/AuthScreen';
import AutomationEditorView from './components/AutomationEditorView';
import ShareModal from './components/ShareModal';
import SaveProjectModal from './components/SaveProjectModal';
import LoadProjectModal from './components/LoadProjectModal';
import ExportModal from './components/ExportModal';
import AudioSettingsPanel from './components/AudioSettingsPanel';
import PluginManager from './components/PluginManager';
import PianoRoll from './components/PianoRoll';
import { SaveOverlay } from './components/SaveOverlay';
import { MobileBottomNav } from './components/MobileBottomNav';

// Custom Hooks
import { useUndoRedo } from './hooks/useUndoRedo';
import { useAudioEngine } from './hooks/useAudioEngine';
import { useTrackOperations } from './hooks/useTrackOperations';
import { useClipOperations } from './hooks/useClipOperations';

// Services
import { supabaseManager } from './services/SupabaseManager';
import { SessionSerializer } from './services/SessionSerializer';
import { getAIProductionAssistance } from './services/AIService';
import { novaBridge } from './services/NovaBridge';
import { ProjectIO } from './services/ProjectIO';

// Constants
const TRACK_COLORS = [
  '#ff0000',
  '#00f2ff',
  '#fbbf24',
  '#a855f7',
  '#10b981',
  '#f97316',
  '#3b82f6',
  '#ec4899'
];

const AVAILABLE_FX_MENU = [
  { id: 'MASTERSYNC', name: 'Master Sync', icon: 'fa-sync-alt' },
  { id: 'VOCALSATURATOR', name: 'Vocal Saturator', icon: 'fa-fire' },
  { id: 'PROEQ12', name: 'Pro-EQ 12', icon: 'fa-wave-square' },
  { id: 'AUTOTUNE', name: 'Auto-Tune Pro', icon: 'fa-microphone-alt' },
  { id: 'DENOISER', name: 'Denoiser', icon: 'fa-broom' },
  { id: 'COMPRESSOR', name: 'Leveler', icon: 'fa-compress-alt' },
  { id: 'REVERB', name: 'Spatial Verb', icon: 'fa-mountain-sun' },
  { id: 'DELAY', name: 'Sync Delay', icon: 'fa-history' },
  { id: 'CHORUS', name: 'Vocal Chorus', icon: 'fa-layer-group' },
  { id: 'FLANGER', name: 'Studio Flanger', icon: 'fa-wind' },
  { id: 'DOUBLER', name: 'Vocal Doubler', icon: 'fa-people-arrows' },
  { id: 'STEREOSPREADER', name: 'Phase Guard', icon: 'fa-arrows-alt-h' },
  { id: 'DEESSER', name: 'S-Killer', icon: 'fa-scissors' }
];

// Helper Functions
const createInitialState = (): DAWState => ({
  id: 'proj-1',
  name: 'STUDIO_SESSION',
  bpm: 120,
  isPlaying: false,
  isRecording: false,
  currentTime: 0,
  isLoopActive: false,
  loopStart: 0,
  loopEnd: 0,
  tracks: [],
  selectedTrackId: null,
  currentView: 'ARRANGEMENT',
  projectPhase: ProjectPhase.SETUP,
  isLowLatencyMode: false,
  isRecModeActive: false,
  systemMaxLatency: 0,
  recStartTime: null,
  isDelayCompEnabled: false
});

export default function App() {
  // ========== STATE ==========
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('nova_view_mode');
    if (saved) return saved as ViewMode;
    return window.innerWidth < 768 ? 'MOBILE' : window.innerWidth < 1024 ? 'TABLET' : 'DESKTOP';
  });

  // UI State
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('PROJECT');
  const [browserWidth, setBrowserWidth] = useState(320);
  const [isResizingBrowser, setIsResizingBrowser] = useState(false);
  const [sideTab, setSideTab] = useState<'local' | 'fx' | 'nova' | 'store'>('store');
  const [shouldFocusSearch, setShouldFocusSearch] = useState(false);
  const [activePlugin, setActivePlugin] = useState<{ trackId: string; plugin: PluginInstance } | null>(
    null
  );
  const [midiEditorOpen, setMidiEditorOpen] = useState<{ trackId: string; clipId: string } | null>(
    null
  );

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
  const [isLoadMenuOpen, setIsLoadMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPluginManagerOpen, setIsPluginManagerOpen] = useState(false);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);

  // Context Menus
  const [addPluginMenu, setAddPluginMenu] = useState<{
    trackId: string;
    x: number;
    y: number;
  } | null>(null);

  // Notifications
  const [aiNotification, setAiNotification] = useState<string | null>(null);
  const [externalImportNotice, setExternalImportNotice] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<{
    isSaving: boolean;
    progress: number;
    message: string;
  }>({ isSaving: false, progress: 0, message: '' });

  // ========== CUSTOM HOOKS ==========
  const initialState = useMemo(() => createInitialState(), []);
  const { state, setState, setVisualState, undo, redo, canUndo, canRedo } = useUndoRedo(initialState);
  const { ensureAudioEngine, handleSeek, handleTogglePlay, handleStop, stateRef } =
    useAudioEngine(state);
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

  // ========== DERIVED STATE ==========
  const isMobile = viewMode === 'MOBILE';

  // ========== EFFECTS ==========
  useEffect(() => {
    const u = supabaseManager.getUser();
    if (u) setUser(u);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.body.setAttribute('data-view-mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    novaBridge.connect();
  }, []);

  // Animation loop for playhead
  useEffect(() => {
    let animId: number;

    const updateLoop = () => {
      if (stateRef.current.isPlaying) {
        const time = audioEngine.getCurrentTime();
        setVisualState({ currentTime: time });
        animId = requestAnimationFrame(updateLoop);
      }
    };

    if (state.isPlaying) {
      animId = requestAnimationFrame(updateLoop);
    }

    return () => cancelAnimationFrame(animId);
  }, [state.isPlaying, setVisualState, stateRef]);

  // ========== HANDLERS ==========
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('nova_view_mode', mode);
  }, []);

  const handleUpdateBpm = useCallback(
    (newBpm: number) => {
      setState((prev) => ({ ...prev, bpm: Math.max(20, Math.min(999, newBpm)) }));
    },
    [setState]
  );

  const handleLogout = useCallback(async () => {
    await supabaseManager.signOut();
    setUser(null);
  }, []);

  const handleSaveCloud = useCallback(
    async (projectName: string) => {
      if (!user) {
        setIsAuthOpen(true);
        return;
      }

      try {
        setState((prev) => ({ ...prev, name: projectName }));
        setSaveState({ isSaving: true, progress: 20, message: 'Synchronisation...' });

        const stateToSave = { ...stateRef.current, name: projectName };
        const savedProject = await supabaseManager.saveUserSession(stateToSave);

        if (savedProject?.id) {
          setState((prev) => ({ ...prev, id: savedProject.id, name: savedProject.name }));
        }

        setSaveState({ isSaving: true, progress: 100, message: 'Sauvegarde réussie !' });
        setTimeout(() => setSaveState({ isSaving: false, progress: 0, message: '' }), 1500);
        setAiNotification('✅ Sauvegarde Cloud terminée.');
      } catch (e: unknown) {
        const error = e as Error;
        setSaveState({ isSaving: false, progress: 0, message: '' });
        setAiNotification(`❌ Erreur Cloud: ${error.message}`);
      }
    },
    [user, setState, stateRef]
  );

  const handleLoadCloud = useCallback(
    async (id: string) => {
      try {
        const loaded = await supabaseManager.loadUserSession(id);
        if (loaded) setState(loaded);
      } catch (e) {
        console.error(e);
      }
    },
    [setState]
  );

  const handleLoadLocalFile = useCallback(
    async (f: File) => {
      try {
        if (f.name.endsWith('.zip')) {
          const loaded = await ProjectIO.loadProject(f);
          setState(loaded);
        } else {
          const text = await f.text();
          const loaded = JSON.parse(text);
          setState(loaded);
        }
      } catch (e) {
        console.error(e);
      }
    },
    [setState]
  );

  const handleAddPluginFromContext = useCallback(
    (trackId: string, type: PluginType) => {
      setState((prev) => {
        const track = prev.tracks.find((t) => t.id === trackId);
        if (!track) return prev;

        const newPlugin: PluginInstance = {
          id: `pl-${Date.now()}-${Math.random()}`,
          name: type,
          type,
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
    },
    [setState]
  );

  const handleUniversalAudioImport = useCallback(
    async (source: string | File, name: string) => {
      try {
        setExternalImportNotice(`Analyse du flux binaire : ${name}...`);
        await audioEngine.init();

        let targetUrl: string;
        let isObjectUrl = false;

        if (source instanceof File) {
          targetUrl = URL.createObjectURL(source);
          isObjectUrl = true;
        } else {
          targetUrl = source;
        }

        const response = await fetch(targetUrl);
        if (!response.ok) {
          throw new Error(`Fichier audio inaccessible (HTTP ${response.status})`);
        }

        const arrayBuffer = await response.arrayBuffer();
        if (isObjectUrl) URL.revokeObjectURL(targetUrl);

        const audioBuffer = await audioEngine.ctx!.decodeAudioData(arrayBuffer);

        const newClip = {
          id: `c-universal-${Date.now()}`,
          name: name.replace(/_/g, ' ').toUpperCase(),
          start: 0,
          duration: audioBuffer.duration,
          offset: 0,
          fadeIn: 0.05,
          fadeOut: 0.05,
          type: TrackType.AUDIO,
          color: '#eab308',
          buffer: audioBuffer
        };

        setState((prev) => {
          const color = TRACK_COLORS[prev.tracks.length % TRACK_COLORS.length];
          const newTrack: Track = {
            id: `track-ext-${Date.now()}`,
            name: name.toUpperCase(),
            type: TrackType.AUDIO,
            color,
            isMuted: false,
            isSolo: false,
            isTrackArmed: false,
            isFrozen: false,
            volume: 1.0,
            pan: 0,
            outputTrackId: 'master',
            sends: [],
            clips: [newClip],
            plugins: [],
            automationLanes: [],
            totalLatency: 0
          };

          return {
            ...prev,
            tracks: [...prev.tracks, newTrack],
            selectedTrackId: newTrack.id,
            currentView: 'ARRANGEMENT'
          };
        });

        setActiveMobileTab('PROJECT');
        setExternalImportNotice(null);
        setAiNotification(`Import terminé : [${name}]`);
      } catch (err: unknown) {
        const error = err as Error;
        console.error('[IMPORT] Error:', err);
        setExternalImportNotice(`Erreur Import: ${error.message}`);
        setTimeout(() => setExternalImportNotice(null), 3000);
      }
    },
    [setState]
  );

  const handleBrowserResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = browserWidth;
    setIsResizingBrowser(true);

    const onMove = (m: MouseEvent) => {
      const delta = m.clientX - startX;
      setBrowserWidth(Math.max(200, Math.min(600, startWidth + delta)));
    };

    const onUp = () => {
      setIsResizingBrowser(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [browserWidth]);

  // ========== WINDOW API ==========
  useEffect(() => {
    (window as any).DAW_CORE = {
      handleAudioImport: (url: string, name: string) => handleUniversalAudioImport(url, name)
    };

    (window as any).DAW_CONTROL = {
      play: () => handleTogglePlay(setVisualState),
      stop: () => handleStop(setVisualState),
      seek: (time: number) => handleSeek(time, setVisualState),
      setBpm: handleUpdateBpm,
      setVolume: (tid: string, vol: number) => {
        const t = stateRef.current.tracks.find((tr) => tr.id === tid);
        if (t) handleUpdateTrack({ ...t, volume: vol });
      },
      setPan: (tid: string, pan: number) => {
        const t = stateRef.current.tracks.find((tr) => tr.id === tid);
        if (t) handleUpdateTrack({ ...t, pan });
      },
      duplicateTrack: handleDuplicateTrack,
      addTrack: handleCreateTrack,
      deleteTrack: handleDeleteTrack,
      bypassPlugin: handleToggleBypass,
      editClip: handleEditClip,
      getState: () => stateRef.current
    };
  }, [
    handleUniversalAudioImport,
    handleTogglePlay,
    handleStop,
    handleSeek,
    handleUpdateBpm,
    handleUpdateTrack,
    handleDuplicateTrack,
    handleCreateTrack,
    handleDeleteTrack,
    handleToggleBypass,
    handleEditClip,
    setVisualState,
    stateRef
  ]);

  // ========== AUTH GUARD ==========
  if (!user) {
    return (
      <AuthScreen
        onAuthenticated={(u) => {
          setUser(u);
          setIsAuthOpen(false);
        }}
      />
    );
  }

  // ========== RENDER ==========
  return (
    <div
      className="flex flex-col h-screen w-full overflow-hidden relative transition-colors duration-300"
      style={{
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-primary)',
        cursor: isResizingBrowser ? 'col-resize' : 'default'
      }}
    >
      {saveState.isSaving && <SaveOverlay progress={saveState.progress} message={saveState.message} />}

      {/* Transport Bar */}
      <div className="relative z-50">
        <TransportBar
          isPlaying={state.isPlaying}
          currentTime={state.currentTime}
          bpm={state.bpm}
          onBpmChange={handleUpdateBpm}
          isRecording={state.isRecording}
          isLoopActive={state.isLoopActive}
          onToggleLoop={() =>
            setState((prev) => ({
              ...prev,
              isLoopActive: !prev.isLoopActive
            }))
          }
          onStop={() => handleStop(setVisualState)}
          onTogglePlay={() => handleTogglePlay(setVisualState)}
          onToggleRecord={() => {}}
          currentView={state.currentView}
          onChangeView={(v) => setState((s) => ({ ...s, currentView: v }))}
          currentTheme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          onOpenSaveMenu={() => setIsSaveMenuOpen(true)}
          onOpenLoadMenu={() => setIsLoadMenuOpen(true)}
          onExportMix={() => setIsExportMenuOpen(true)}
          onShareProject={() => setIsShareModalOpen(true)}
          onOpenAudioEngine={() => setIsAudioSettingsOpen(true)}
          isDelayCompEnabled={state.isDelayCompEnabled}
          onToggleDelayComp={() =>
            setState((prev) => ({ ...prev, isDelayCompEnabled: !prev.isDelayCompEnabled }))
          }
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          user={user}
          onOpenAuth={() => setIsAuthOpen(true)}
          onLogout={handleLogout}
          showBrowserToggle={!isMobile}
          isBrowserOpen={browserWidth > 0}
          onToggleBrowser={() => setBrowserWidth((prev) => (prev > 0 ? 0 : 320))}
        >
          <div className="ml-4 border-l border-white/5 pl-4">
            <ViewModeSwitcher currentMode={viewMode} onChange={handleViewModeChange} />
          </div>
        </TransportBar>
      </div>

      {!isMobile && <TrackCreationBar onCreateTrack={handleCreateTrack} />}
      <TouchInteractionManager />
      <GlobalClipMenu />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Browser Sidebar */}
        {(!isMobile || activeMobileTab === 'BROWSER') && browserWidth > 0 && (
          <aside
            className={`${isMobile ? 'w-full absolute inset-0 z-40' : ''} transition-none z-20 flex bg-[#08090b]`}
            style={{ width: isMobile ? '100%' : `${browserWidth}px` }}
          >
            <div className="flex-1 overflow-hidden relative border-r border-white/5 h-full">
              <SideBrowser
                activeTabOverride={sideTab}
                onTabChange={setSideTab}
                shouldFocusSearch={shouldFocusSearch}
                onSearchFocused={() => setShouldFocusSearch(false)}
                onAddPlugin={(type) => {
                  if (state.selectedTrackId) {
                    handleAddPluginFromContext(state.selectedTrackId, type as PluginType);
                  }
                }}
                onLocalImport={(f) => handleUniversalAudioImport(f, f.name.split('.')[0])}
                user={user}
                onBuyLicense={() => {}}
              />
            </div>
            {!isMobile && (
              <div
                className="w-1 cursor-col-resize hover:bg-cyan-500/50 active:bg-cyan-500 transition-colors z-50 flex items-center justify-center group h-full"
                onMouseDown={handleBrowserResizeStart}
              >
                <div className="w-0.5 h-8 bg-white/20 rounded-full group-hover:bg-white/50" />
              </div>
            )}
          </aside>
        )}

        {/* Main Views */}
        <main className="flex-1 flex flex-col overflow-hidden relative min-w-0">
          {((!isMobile && state.currentView === 'ARRANGEMENT') ||
            (isMobile && activeMobileTab === 'PROJECT')) && (
            <ArrangementView
              tracks={state.tracks}
              currentTime={state.currentTime}
              isLoopActive={state.isLoopActive}
              loopStart={state.loopStart}
              loopEnd={state.loopEnd}
              onSetLoop={(start, end) =>
                setState((prev) => ({ ...prev, loopStart: start, loopEnd: end, isLoopActive: true }))
              }
              onSeek={(time) => handleSeek(time, setVisualState)}
              bpm={state.bpm}
              selectedTrackId={state.selectedTrackId}
              onSelectTrack={(id) => setState((p) => ({ ...p, selectedTrackId: id }))}
              onUpdateTrack={handleUpdateTrack}
              onReorderTracks={() => {}}
              onDropPluginOnTrack={() => {}}
              onSelectPlugin={(tid, p) => {
                ensureAudioEngine();
                setActivePlugin({ trackId: tid, plugin: p });
              }}
              onRemovePlugin={handleRemovePlugin}
              onRequestAddPlugin={(tid, x, y) => setAddPluginMenu({ trackId: tid, x, y })}
              onAddTrack={() => handleCreateTrack(TrackType.AUDIO)}
              onDuplicateTrack={handleDuplicateTrack}
              onDeleteTrack={handleDeleteTrack}
              onFreezeTrack={() => {}}
              onImportFile={() => {}}
              onEditClip={handleEditClip}
              isRecording={state.isRecording}
              recStartTime={state.recStartTime}
              onMoveClip={handleMoveClip}
              onEditMidi={(trackId, clipId) => setMidiEditorOpen({ trackId, clipId })}
              onCreatePattern={() => {}}
              onSwapInstrument={() => {}}
            />
          )}

          {((!isMobile && state.currentView === 'MIXER') ||
            (isMobile && activeMobileTab === 'MIXER')) && (
            <MixerView
              tracks={state.tracks}
              onUpdateTrack={handleUpdateTrack}
              onOpenPlugin={(tid, p) => setActivePlugin({ trackId: tid, plugin: p })}
              onDropPluginOnTrack={() => {}}
              onRemovePlugin={handleRemovePlugin}
              onAddBus={() => handleCreateTrack(TrackType.BUS)}
              onToggleBypass={handleToggleBypass}
              onRequestAddPlugin={(tid, x, y) => setAddPluginMenu({ trackId: tid, x, y })}
            />
          )}

          {((!isMobile && state.currentView === 'AUTOMATION') ||
            (isMobile && activeMobileTab === 'AUTOMATION')) && (
            <AutomationEditorView
              tracks={state.tracks}
              currentTime={state.currentTime}
              bpm={state.bpm}
              zoomH={40}
              onUpdateTrack={handleUpdateTrack}
              onSeek={(time) => handleSeek(time, setVisualState)}
            />
          )}
        </main>
      </div>

      {/* Mobile Navigation */}
      {isMobile && <MobileBottomNav activeTab={activeMobileTab} onTabChange={setActiveMobileTab} />}

      {/* Modals */}
      {isSaveMenuOpen && (
        <SaveProjectModal
          isOpen={isSaveMenuOpen}
          onClose={() => setIsSaveMenuOpen(false)}
          currentName={state.name}
          user={user}
          onSaveCloud={handleSaveCloud}
          onSaveLocal={() => {}}
          onSaveAsCopy={() => {}}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
      )}

      {isLoadMenuOpen && (
        <LoadProjectModal
          isOpen={isLoadMenuOpen}
          onClose={() => setIsLoadMenuOpen(false)}
          user={user}
          onLoadCloud={handleLoadCloud}
          onLoadLocal={handleLoadLocalFile}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
      )}

      {isExportMenuOpen && (
        <ExportModal
          isOpen={isExportMenuOpen}
          onClose={() => setIsExportMenuOpen(false)}
          projectState={state}
        />
      )}

      {/* Context Menus */}
      {addPluginMenu && (
        <ContextMenu
          x={addPluginMenu.x}
          y={addPluginMenu.y}
          onClose={() => setAddPluginMenu(null)}
          items={AVAILABLE_FX_MENU.map((fx) => ({
            label: fx.name,
            icon: fx.icon,
            onClick: () => handleAddPluginFromContext(addPluginMenu.trackId, fx.id as PluginType)
          }))}
        />
      )}

      {/* Plugin Editor */}
      {activePlugin && (
        <div
          className={`fixed inset-0 flex items-center justify-center z-[200] ${
            isMobile ? 'bg-[#0c0d10]' : 'bg-black/60 backdrop-blur-sm'
          }`}
          onMouseDown={() => !isMobile && setActivePlugin(null)}
        >
          <div
            className={`relative ${isMobile ? 'w-full h-full p-4 overflow-y-auto' : ''}`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <PluginEditor
              plugin={activePlugin.plugin}
              trackId={activePlugin.trackId}
              onClose={() => setActivePlugin(null)}
              onUpdateParams={(p) =>
                handleUpdatePluginParams(activePlugin.trackId, activePlugin.plugin.id, p)
              }
              isMobile={isMobile}
              track={state.tracks.find((t) => t.id === activePlugin.trackId)}
              onUpdateTrack={handleUpdateTrack}
            />
          </div>
        </div>
      )}

      {/* MIDI Editor */}
      {midiEditorOpen && state.tracks.find((t) => t.id === midiEditorOpen.trackId) && (
        <div className="fixed inset-0 z-[250] bg-[#0c0d10] flex flex-col animate-in slide-in-from-bottom-10 duration-200">
          <PianoRoll
            track={state.tracks.find((t) => t.id === midiEditorOpen.trackId)!}
            clipId={midiEditorOpen.clipId}
            bpm={state.bpm}
            currentTime={state.currentTime}
            onUpdateTrack={handleUpdateTrack}
            onClose={() => setMidiEditorOpen(null)}
          />
        </div>
      )}
    </div>
  );
}
