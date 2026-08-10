import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Play, Pause, Volume2, VolumeX, ChevronUp, ChevronDown, Radio, Sparkles, Disc } from 'lucide-react';
import { musicPlayer, TRACKS, TrackOption } from '../utils/musicSynth';

export const BackgroundMusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(musicPlayer.getIsPlaying());
  const [volume, setVolume] = useState<number>(musicPlayer.getVolume());
  const [currentTrackId, setCurrentTrackId] = useState<string>(musicPlayer.getCurrentTrack());
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [prevVolume, setPrevVolume] = useState<number>(0.35);

  const activeTrack = TRACKS.find(t => t.id === currentTrackId) || TRACKS[0];

  const handleTogglePlay = () => {
    const newState = musicPlayer.toggle();
    setIsPlaying(newState);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0) setIsMuted(false);
    musicPlayer.setVolume(val);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(prevVolume);
      musicPlayer.setVolume(prevVolume);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      setVolume(0);
      musicPlayer.setVolume(0);
    }
  };

  const handleSelectTrack = (track: TrackOption) => {
    setCurrentTrackId(track.id);
    musicPlayer.setTrack(track.id);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      <motion.div
        layout
        className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 hover:border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-white transition-all w-80 sm:w-96"
      >
        {/* Main Player Bar */}
        <div className="p-3.5 flex items-center justify-between gap-3">
          {/* Album / Track Icon & Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <motion.div
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ repeat: isPlaying ? Infinity : 0, duration: 10, ease: 'linear' }}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-lg ${
                isPlaying
                  ? 'bg-gradient-to-tr from-lime-400 via-emerald-500 to-cyan-400 text-slate-950 border-lime-300 shadow-lime-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Disc className="w-5 h-5" />
            </motion.div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded-full border border-lime-400/20 flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 animate-pulse" /> Focus Music
                </span>
                {isPlaying && (
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="w-0.5 h-2.5 bg-lime-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-0.5 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>

              <h4 className="text-xs font-black text-white truncate mt-0.5" title={activeTrack.title}>
                {activeTrack.title}
              </h4>
              <p className="text-[10px] text-slate-400 truncate">{activeTrack.artist}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Play / Pause Toggle */}
            <button
              onClick={handleTogglePlay}
              className={`p-2.5 rounded-2xl font-black transition-all cursor-pointer shadow-md ${
                isPlaying
                  ? 'bg-lime-400 hover:bg-lime-300 text-slate-950 shadow-lime-500/20 scale-105'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
              title={isPlaying ? 'Pause Background Music' : 'Play Background Music ("United in Grief")'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-slate-950 stroke-[2.5]" /> : <Play className="w-4 h-4 fill-white stroke-[2.5] ml-0.5" />}
            </button>

            {/* Expand / Collapse Details */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Music settings & track list"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Drawer Options */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-800/80 bg-slate-950/60 p-4 space-y-3"
            >
              {/* Volume Slider */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleMute}
                  className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-lime-400" />}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full accent-lime-400 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                />
                <span className="text-[10px] font-mono font-bold text-slate-400 w-8 text-right">
                  {Math.round(volume * 100)}%
                </span>
              </div>

              {/* Track Selector */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">
                  Select Ambient Track
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {TRACKS.map(track => {
                    const isSelected = track.id === currentTrackId;
                    return (
                      <button
                        key={track.id}
                        onClick={() => handleSelectTrack(track)}
                        className={`w-full text-left p-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between border ${
                          isSelected
                            ? 'bg-lime-400/10 border-lime-400/40 text-lime-300'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-extrabold flex items-center gap-1.5">
                            {isSelected && <Sparkles className="w-3 h-3 text-lime-400 shrink-0" />}
                            <span className="truncate">{track.title}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-normal truncate mt-0.5">{track.description}</p>
                        </div>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md shrink-0">
                          {track.tempo} BPM
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
