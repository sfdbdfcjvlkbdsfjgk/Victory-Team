/// <reference types="vite/client" />
<<<<<<< HEAD

// Node.js 环境变量类型定义
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
  
  var process: {
    env: NodeJS.ProcessEnv;
  };
}

// WebRTC 类型定义
declare global {
  interface MediaStream {
    getTracks(): MediaStreamTrack[];
    getAudioTracks(): MediaStreamTrack[];
    getVideoTracks(): MediaStreamTrack[];
    addTrack(track: MediaStreamTrack): void;
    removeTrack(track: MediaStreamTrack): void;
  }

  interface MediaStreamTrack {
    kind: 'audio' | 'video';
    enabled: boolean;
    label: string;
    stop(): void;
    getSettings(): MediaTrackSettings;
    getCapabilities(): MediaTrackCapabilities;
    applyConstraints(constraints: MediaTrackConstraints): Promise<void>;
  }

  interface MediaTrackSettings {
    width?: number;
    height?: number;
    frameRate?: number;
    sampleRate?: number;
    channelCount?: number;
    echoCancellation?: boolean;
    noiseSuppression?: boolean;
    autoGainControl?: boolean;
  }

  interface MediaTrackCapabilities {
    width?: { min: number; max: number };
    height?: { min: number; max: number };
    frameRate?: { min: number; max: number };
    sampleRate?: { min: number; max: number };
    channelCount?: { min: number; max: number };
    echoCancellation?: boolean[];
    noiseSuppression?: boolean[];
    autoGainControl?: boolean[];
  }

  interface MediaTrackConstraints {
    width?: number | { min?: number; max?: number; ideal?: number };
    height?: number | { min?: number; max?: number; ideal?: number };
    frameRate?: number | { min?: number; max?: number; ideal?: number };
    sampleRate?: number | { min?: number; max?: number; ideal?: number };
    channelCount?: number | { min?: number; max?: number; ideal?: number };
    echoCancellation?: boolean | { ideal?: boolean };
    noiseSuppression?: boolean | { ideal?: boolean };
    autoGainControl?: boolean | { ideal?: boolean };
    facingMode?: string | { ideal?: string };
  }
}
=======
>>>>>>> origin/fjl
