# High Fantasy Master Style Guide: Grimoire, Journal & Record

## 1. Design Philosophy
The UI is a collection of physical artifacts. 
- **The Chronicler (Journal):** Hand-inked, informal, heavy use of `font-handwritten` and ink flourishes.
- **The Archmage (Grimoire):** Formal, magical, dark leather containers (`leather-card`) with gold filigree and glowing wax seals.
- **The Hero Record (Vellum):** Organized stats, character portraits with gold corners, and alchemical "Glass Vials" for vitality.

## 2. Design Tokens (Tailwind)
**Colors:**
- `obsidian`: '#0d0b08' (Main App Background)
- `parchment`: '#e6d5b8' (Aged paper)
- `leather-dark`: '#1a160f' (Leather card background)
- `paladin-gold`: '#d8ae31' (Primary accent/borders)
- `arcane-purple`: '#8b5cf6' (Magic highlights)
- `wax-red`: '#991b1b' (Action buttons/seals)
- `ink`: '#2c241a' (Text on parchment)
- `faded-ink`: '#6b5e4c' (Secondary text)

**Typography:**
- `blackletter`: ['Cinzel', 'serif'] (Headers/Titles)
- `display`: ['Newsreader', 'serif'] (Sub-headers/Formal body)
- `handwritten`: ['Crimson Text', 'serif'] (Journal entries/Flavor text)

## 3. Global CSS Components (`src/index.css`)
### Containers
- **.parchment-texture:** `bg-[#e6d5b8]` with inner-shadow `inset 0 0 100px rgba(0,0,0,0.1)` and radial gradients for "aging."
- **.leather-card:** `bg-gradient-to-br from-[#2a2419] to-[#1a160f]` with a `1px solid #443d27` border.
- **.vellum-scrap:** Small, slightly rotated containers (`rotate-1` or `-rotate-2`) used for inventory or tags.

### Decorations
- **.filigree-corner:** 24px L-shaped borders in `paladin-gold` placed absolutely in corners of `leather-cards`.
- **.gold-gradient-text:** `linear-gradient(to bottom, #fceabb, #fccd4d, #f8b500, #fbdf93)`.
- **.sketch-image:** `grayscale(100%) contrast(120%) mix-blend-multiply opacity(80%)`.

### Interactive
- **.wax-seal:** Circular `wax-red` buttons with a 3D "drip" effect and white-to-transparent radial highlight on the top-left.

## 4. Component Patterns
- **Progress Bars:** "Glass Vials" with `liquid-essence` (gradient from `#8b0000` to `#ff0000`).
- **Dividers:** Use horizontal lines with Unicode flourishes: `❧ ❦ ☙` or Material Symbol `flare`.
- **Stats Grid:** Enclosed in `border border-primary/20 rounded bg-black/5`.