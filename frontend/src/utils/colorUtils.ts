/** Hue rotation in degrees for the card glow effect (0–360). 180 = complementary. */
export const GLOW_HUE_ROTATION = 180;

/**
 * Returns a color with rotated hue suitable for a glow effect.
 * The result is always bright and saturated enough to be visible as a drop-shadow.
 */
export function getComplementaryGlow(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    const l = (max + min) / 2;

    let h = 0;
    let s = 0;

    if (d !== 0) {
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / d + 2) / 6;
        else h = ((r - g) / d + 4) / 6;
    }

    const compH = (h + GLOW_HUE_ROTATION / 360) % 1;
    const compS = Math.min(1, s * 1.3 + 0.3);
    const compL = 0.55;

    const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };

    const q = compL < 0.5 ? compL * (1 + compS) : compL + compS - compL * compS;
    const p = 2 * compL - q;
    const rOut = Math.round(hue2rgb(p, q, compH + 1 / 3) * 255);
    const gOut = Math.round(hue2rgb(p, q, compH) * 255);
    const bOut = Math.round(hue2rgb(p, q, compH - 1 / 3) * 255);

    return `#${rOut.toString(16).padStart(2, '0')}${gOut.toString(16).padStart(2, '0')}${bOut.toString(16).padStart(2, '0')}`;
}
