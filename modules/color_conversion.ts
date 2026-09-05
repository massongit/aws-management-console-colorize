import { z } from "zod";

export type RgbColorType = { r: number; g: number; b: number };
export type HsvColorType = { h: number; s: number; v: number };

const hexPattern = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
const numberListPattern = /-?\d+(?:\.\d+)?/g;

function clamp({
  value,
  min,
  max,
}: {
  value: number;
  min: number;
  max: number;
}): number {
  return Math.min(Math.max(value, min), max);
}

function parseNumberList(text: string, length: number): number[] | undefined {
  const matched = text.match(numberListPattern);

  if (matched === null || matched.length !== length) {
    return undefined;
  }

  return matched.map(Number.parseFloat);
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

function toHexPart(n: number): string {
  return clamp({ value: Math.round(n), min: 0, max: 255 })
    .toString(16)
    .padStart(2, "0");
}

export function rgbToHex({ r, g, b }: RgbColorType): string {
  return `#${toHexPart(r)}${toHexPart(g)}${toHexPart(b)}`;
}

export function rgbToHsv({ r, g, b }: RgbColorType): HsvColorType {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const delta = max - Math.min(rNorm, gNorm, bNorm);
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
  const vNorm = clamp({ value: v, min: 0, max: 100 }) / 100;
  const hNorm = ((h % 360) + 360) % 360;
  const c = (vNorm * clamp({ value: s, min: 0, max: 100 })) / 100;
  const x = c * (1 - Math.abs(((hNorm / 60) % 2) - 1));
  const m = vNorm - c;
  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (hNorm < 60) {
    rPrime = c;
    gPrime = x;
  } else if (hNorm < 120) {
    rPrime = x;
    gPrime = c;
  } else if (hNorm < 180) {
    gPrime = c;
    bPrime = x;
  } else if (hNorm < 240) {
    gPrime = x;
    bPrime = c;
  } else if (hNorm < 300) {
    rPrime = x;
    bPrime = c;
  } else {
    rPrime = c;
    bPrime = x;
  }

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
    r: clamp({ value: z.number().parse(r), min: 0, max: 255 }),
    g: clamp({ value: z.number().parse(g), min: 0, max: 255 }),
    b: clamp({ value: z.number().parse(b), min: 0, max: 255 }),
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
      h: clamp({ value: z.number().parse(h), min: 0, max: 360 }),
      s: clamp({ value: z.number().parse(s), min: 0, max: 100 }),
      v: clamp({ value: z.number().parse(v), min: 0, max: 100 }),
    }),
  );
}
