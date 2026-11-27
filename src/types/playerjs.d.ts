export {};

declare global {
  type PlayerJsTimeUpdate = { seconds: number; duration: number };

  interface PlayerJsPlayer {
    on(event: "ended", callback: () => void): void;
    on(event: "timeupdate", callback: (data: PlayerJsTimeUpdate) => void): void;
    on(event: string, callback: (...args: unknown[]) => void): void;
    off?(event: string, callback?: (...args: unknown[]) => void): void;
  }

  interface Window {
    playerjs?: {
      Player: new (iframe: HTMLIFrameElement | string) => PlayerJsPlayer;
      addEvent: (elem: EventTarget, type: string, handler: EventListener) => void;
    };
  }
}