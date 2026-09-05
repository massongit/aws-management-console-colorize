import { z } from "zod";

export type RgbColorType = { r: number; g: number; b: number };
export type HsvColorType = { h: number; s: number; v: number };

const hexPattern = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
const numberListPattern = /-?\d+(?:\.\d+)?/g;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function parseNumberList(text: string, length: number): number[] | undefined {
  const matched = text.match(numberListPattern);

  if (matched === null || matched.length !== length) {
    return undefined;
  }

  return matched.map((n) => Number.parseFloat(n));
}

export function hexToRgb(hex: string): RgbColorType | undefined {
  const matched = hexPattern.exec(hex);

  if (matched === null) {
    return undefined;
  }

  const [, r, g, b] = matched;
  return {
    r: Number.parseInt(z.string().parse(r), 16),
    g: Number.parseInt(z.string().parse(g), 16),
    b: Number.parseInt(z.string().parse(b), 16),
  };
}

export function rgbToHex({ r, g, b }: RgbColorType): string {
  const toHexPart = (n: number) =>
    clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${toHexPart(r)}${toHexPart(g)}${toHexPart(b)}`;
}

export function rgbToHsv({ r, g, b }: RgbColorType): HsvColorType {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;
  let h = 0;

  if (delta !== 0) {
    if (max === rNorm) {
      h = 60 * (((gNorm - bNorm) / delta) % 6);
    } else if (max === gNorm) {
      h = 60 * ((bNorm - rNorm) / delta + 2);
    } else {
      h = 60 * ((rNorm - gNorm) / delta + 4);
    }
  }

  if (h < 0) {
    h += 360;
  }

  return {
    h: Math.round(h),
    s: Math.round(max === 0 ? 0 : (delta / max) * 100),
    v: Math.round(max * 100),
  };
}

export function hsvToRgb({ h, s, v }: HsvColorType): RgbColorType {
  const sNorm = clamp(s, 0, 100) / 100;
  const vNorm = clamp(v, 0, 100) / 100;
  const hNorm = ((h % 360) + 360) % 360;
  const c = vNorm * sNorm;
  const x = c * (1 - Math.abs(((hNorm / 60) % 2) - 1));
  const m = vNorm - c;
  const [rPrime, gPrime, bPrime]: [number, number, number] =
    hNorm < 60
      ? [c, x, 0]
      : hNorm < 120
        ? [x, c, 0]
        : hNorm < 180
          ? [0, c, x]
          : hNorm < 240
            ? [0, x, c]
            : hNorm < 300
              ? [x, 0, c]
              : [c, 0, x];

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255),
  };
}

export function hexToRgbText(hex: string): string {
  const rgb = hexToRgb(hex);
  return rgb === undefined ? "" : `${rgb.r}, ${rgb.g}, ${rgb.b}`;
}

export function rgbTextToHex(text: string): string | undefined {
  const numbers = parseNumberList(text, 3);

  if (numbers === undefined) {
    return undefined;
  }

  const [r, g, b] = numbers;
  return rgbToHex({
    r: clamp(z.number().parse(r), 0, 255),
    g: clamp(z.number().parse(g), 0, 255),
    b: clamp(z.number().parse(b), 0, 255),
  });
}

export function hexToHsvText(hex: string): string {
  const rgb = hexToRgb(hex);

  if (rgb === undefined) {
    return "";
  }

  const { h, s, v } = rgbToHsv(rgb);
  return `${h}°, ${s}%, ${v}%`;
}

export function hsvTextToHex(text: string): string | undefined {
  const numbers = parseNumberList(text, 3);

  if (numbers === undefined) {
    return undefined;
  }

  const [h, s, v] = numbers;
  return rgbToHex(
    hsvToRgb({
      h: clamp(z.number().parse(h), 0, 360),
      s: clamp(z.number().parse(s), 0, 100),
      v: clamp(z.number().parse(v), 0, 100),
    }),
  );
}
