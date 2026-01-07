
export class AudioService {
  private static instance: AudioService;
  private bgm: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private constructor() {}

  static getInstance() {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  public initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.bgmGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.bgmGain.connect(this.ctx.destination);
        this.sfxGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume().catch(e => console.error("AudioContext resume failed", e));
    }
  }

  playBGM(url: string, volume: number) {
    this.initContext();
    
    if (this.bgm) {
      // Normalize URLs for reliable comparison (handles encoding like %20)
      const currentSrc = new URL(this.bgm.src, window.location.href).href;
      const targetSrc = new URL(url, window.location.href).href;

      if (currentSrc === targetSrc) {
        this.bgm.volume = volume;
        // Crucial: Attempt to play even if source matches, 
        // in case it was previously blocked by autoplay policy.
        if (this.bgm.paused) {
          this.bgm.play().catch(() => {
            // Silently fail if still blocked; it will try again on next interaction/state change
          });
        }
        return;
      }
      this.bgm.pause();
      this.bgm = null;
    }

    this.bgm = new Audio();
    this.bgm.crossOrigin = "anonymous";
    this.bgm.src = url;
    this.bgm.loop = true;
    this.bgm.volume = volume;
    
    // Play with catch to handle browser autoplay restrictions gracefully
    const playPromise = this.bgm.play();
    if (playPromise !== undefined) {
      playPromise.catch(e => {
        console.debug("BGM playback deferred until user interaction.", e);
      });
    }
  }

  stopBGM() {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm = null;
    }
  }

  setBGMVolume(volume: number) {
    if (this.bgm) {
      this.bgm.volume = volume;
    }
  }

  playProceduralSfx(type: string, enabled: boolean) {
    if (!enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    const now = this.ctx.currentTime;

    switch (type) {
      case 'buy':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'startup':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(40, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.5);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
      case 'beep':
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'confirm':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'cancel':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'danger':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(200, now + 0.1);
        osc.frequency.linearRampToValueAtTime(100, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'success':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(660, now + 0.1);
        osc.frequency.setValueAtTime(880, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
    }
  }
}
