// Synthesizes smooth ambient focus background music inspired by "United in Grief"
// Uses Web Audio API for zero latency, offline availability, and zero external asset dependencies.

export interface TrackOption {
  id: string;
  title: string;
  artist: string;
  description: string;
  tempo: number; // BPM
}

export const TRACKS: TrackOption[] = [
  {
    id: 'united-in-grief',
    title: 'United in Grief',
    artist: 'Smooth Focus Ambient',
    description: 'Lush piano chord progression with gentle sub-bass swell and warm resonance',
    tempo: 76,
  },
  {
    id: 'united-lofi',
    title: 'United in Grief (Lo-Fi Chill)',
    artist: 'HabitPulse Audio Engine',
    description: 'Soft warm rhodes keys with subtle vinyl flutter and lofi bassline',
    tempo: 70,
  },
  {
    id: 'deep-focus-flow',
    title: 'Deep Focus Meditation',
    artist: 'HabitPulse Audio Engine',
    description: 'Minimalist ambient drone with harmonic sine waves',
    tempo: 60,
  },
];

class UnitedInGriefPlayer {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentTrackId: string = 'united-in-grief';
  private volume: number = 0.35;
  private timerId: number | null = null;
  private currentChordIndex: number = 0;

  // Chord frequencies in Hz for "United in Grief" vibe (C#m9 -> Aadd9 -> Emaj7 -> G#m7)
  private unitedChords = [
    // Chord 1: C#m9 (C#3, G#3, B3, E4, D#5)
    [138.59, 207.65, 246.94, 329.63, 622.25],
    // Chord 2: Aadd9 (A2, E3, A3, C#4, B4)
    [110.00, 164.81, 220.00, 277.18, 493.88],
    // Chord 3: Emaj7 (E2, B2, E3, G#3, D#4)
    [82.41, 123.47, 164.81, 207.65, 311.13],
    // Chord 4: G#m7 (G#2, D#3, F#3, B3, D#4)
    [103.83, 155.56, 185.00, 246.94, 311.13],
  ];

  // Lo-Fi variation chords (F#m7 -> Dmaj7 -> A -> E)
  private lofiChords = [
    [185.00, 220.00, 277.18, 329.63], // F#m7
    [146.83, 220.00, 277.18, 369.99], // Dmaj7
    [220.00, 277.18, 329.63, 440.00], // A
    [164.81, 207.65, 246.94, 329.63], // E
  ];

  // Ambient Drone chords (C -> G -> Am -> F)
  private ambientChords = [
    [130.81, 196.00, 261.63, 329.63],
    [98.00, 146.83, 196.00, 246.94],
    [110.00, 164.81, 220.00, 261.63],
    [87.31, 130.81, 174.61, 220.00],
  ];

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTrack(): string {
    return this.currentTrackId;
  }

  public setTrack(trackId: string) {
    this.currentTrackId = trackId;
    this.currentChordIndex = 0;
    if (this.isPlaying) {
      this.stop();
      this.start();
    }
  }

  public start() {
    this.initCtx();
    if (!this.ctx) return;
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.currentChordIndex = 0;
    this.scheduleNextChord();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
    return this.isPlaying;
  }

  private scheduleNextChord() {
    if (!this.isPlaying || !this.ctx) return;

    const now = this.ctx.currentTime;
    const chordsList = 
      this.currentTrackId === 'united-in-grief'
        ? this.unitedChords
        : this.currentTrackId === 'united-lofi'
        ? this.lofiChords
        : this.ambientChords;

    const freqs = chordsList[this.currentChordIndex];
    const duration = this.currentTrackId === 'united-in-grief' ? 3.2 : 4.0;

    // Master gain for this chord
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(this.volume * 0.18, now + 0.4);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.8);

    // Filter for warm soft tone
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(this.currentTrackId === 'united-in-grief' ? 1200 : 800, now);
    filter.Q.setValueAtTime(1, now);

    masterGain.connect(filter);
    filter.connect(this.ctx.destination);

    // Play each harmonic note in the chord with slight arpeggiated stagger for human piano touch
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      // Soft triangle/sine blend for piano warmth
      osc.type = idx === 0 ? 'sine' : idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const noteStagger = idx * 0.04; // 40ms humanized delay
      oscGain.gain.setValueAtTime(0, now + noteStagger);
      oscGain.gain.linearRampToValueAtTime(1 / freqs.length, now + noteStagger + 0.1);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(oscGain);
      oscGain.connect(masterGain);

      osc.start(now + noteStagger);
      osc.stop(now + duration + 0.5);
    });

    // Sub-bass layer for "United in Grief" pulse
    if (this.currentTrackId === 'united-in-grief' && freqs[0]) {
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freqs[0] / 2, now); // Sub octave

      subGain.gain.setValueAtTime(0, now);
      subGain.gain.linearRampToValueAtTime(this.volume * 0.22, now + 0.3);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);

      subOsc.start(now);
      subOsc.stop(now + duration);
    }

    // Advance chord
    this.currentChordIndex = (this.currentChordIndex + 1) % chordsList.length;

    // Schedule next loop iteration
    const nextIntervalMs = (duration - 0.2) * 1000;
    this.timerId = window.setTimeout(() => {
      this.scheduleNextChord();
    }, nextIntervalMs);
  }
}

export const musicPlayer = new UnitedInGriefPlayer();
