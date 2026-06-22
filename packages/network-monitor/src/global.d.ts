declare var performance: {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  now(): number;
  mark(name: string): void;
  measure(name: string, startMark?: string, endMark?: string): void;
};

declare var globalThis: typeof globalThis & {
  onerror?: (
    message: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error
  ) => void;
};
