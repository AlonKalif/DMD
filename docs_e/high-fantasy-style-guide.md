# High Fantasy Manuscript: Technical Design Specification

## 1. Core Philosophy
The UI should feel like a physical, magical artifact—a leather-bound tome or a wizard's grimoire. 
- **Materiality:** Use parchment textures, gold filigree, and leather backgrounds.
- **Organic Imperfection:** Avoid straight lines. Use "rough-cut" edges for paper.
- **Arcane Energy:** Interactive elements should "hum" with a purple/blue glow.
- **Ink & Charcoal:** Images should look like hand-drawn sketches integrated into the paper.

## 2. Design Tokens (Tailwind Configuration)
Extend your `tailwind.config.js` with these specific values:
- **Colors:**
  - `obsidian`: '#0a0906' (Deep background)
  - `parchment`: '#e4d5b7' (Main container background)
  - `paladin-gold`: '#d8ae31' (Accents and borders)
  - `arcane-purple`: '#8a2be2' (Magic/hover effects)
  - `tome-leather`: '#2b1d12' (Secondary containers)
- **Typography:**
  - `display`: ['Newsreader', 'serif'] (Sub-headers and labels)
  - `blackletter`: ['Cinzel', 'serif'] (Primary headers and buttons)
  - `body`: ['EB Garamond', 'serif'] (Content text)

## 3. Global CSS & Keyframes
```css
/* Custom clip-path for irregular parchment edges */
.parchment-edge {
  clip-path: polygon(0% 2%, 5% 0%, 10% 3%, 15% 1%, 20% 4%, 25% 2%, 30% 5%, 35% 2%, 40% 4%, 45% 1%, 50% 3%, 55% 0%, 60% 4%, 65% 2%, 70% 5%, 75% 1%, 80% 4%, 85% 2%, 90% 5%, 95% 1%, 100% 3%, 98% 15%, 100% 25%, 97% 35%, 100% 45%, 98% 55%, 100% 65%, 97% 75%, 100% 85%, 98% 95%, 100% 100%, 95% 98%, 90% 100%, 85% 97%, 80% 100%, 75% 98%, 70% 100%, 65% 97%, 60% 100%, 55% 98%, 50% 100%, 45% 97%, 40% 100%, 35% 98%, 30% 100%, 25% 97%, 20% 100%, 15% 98%, 10% 100%, 5% 97%, 0% 100%, 2% 95%, 0% 85%, 3% 75%, 1% 65%, 4% 55%, 2% 45%, 5% 35%, 2% 25%, 4% 15%);
}

.gold-gradient-text {
  background: linear-gradient(to bottom, #fceabb 0%, #fccd4d 50%, #f8b500 51%, #fbdf93 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.sketch-image {
  filter: grayscale(100%) contrast(120%) opacity(80%);
  mix-blend-mode: multiply;
}
```
## 4. Core React Components
ParchmentCard: Use bg-parchment and .parchment-edge. Apply a subtle shadow-2xl.

GoldFrame: A wrapper with border-4 border-paladin-gold and absolute-positioned Unicode characters (❖) in the corners.

GlassVial: Progress bars should have rounded-full, a gold border, and a vertical white-to-transparent gradient overlay to simulate glass.

WaxSealButton: Primary buttons should be circular/rounded-sm, bg-paladin-gold, with a border-b-4 border-black/30 to simulate a 3D pressed seal.

## 5. Visual Accents
Background: Set global background to obsidian. Add decorative floating D20 icons (Google Material Symbols: casino) at low opacity (10%).

Interactive: Every card and button must transition to an arcane-purple glow (box-shadow: 0 0 15px #8a2be2) on hover.