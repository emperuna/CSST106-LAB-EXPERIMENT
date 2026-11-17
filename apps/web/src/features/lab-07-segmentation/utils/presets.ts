export interface Settings {
  block: number;
  c: number;
  tolerance: number;
  low: number;
  high: number;
  minDistance: number;
}

// Settings that suit each sample, which also shows how much these methods depend on tuning.
export const PRESETS: Record<string, Settings> = {
  "cells.png": { block: 151, c: -5, tolerance: 30, low: 50, high: 150, minDistance: 15 },
  "coins.png": { block: 101, c: -5, tolerance: 45, low: 80, high: 180, minDistance: 22 },
  "page.png": { block: 35, c: 12, tolerance: 25, low: 50, high: 150, minDistance: 15 },
};
export const DEFAULTS = PRESETS["cells.png"] as Settings;
