---
name: Midnight Grand Tambola
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363941'
  surface-container-lowest: '#0b0e15'
  surface-container-low: '#191b23'
  surface-container: '#1d1f27'
  surface-container-high: '#272a32'
  surface-container-highest: '#32353d'
  on-surface: '#e1e2ec'
  on-surface-variant: '#d8c3ad'
  inverse-surface: '#e1e2ec'
  inverse-on-surface: '#2d3038'
  outline: '#a08e7a'
  outline-variant: '#534434'
  surface-tint: '#ffb95f'
  primary: '#ffc174'
  on-primary: '#472a00'
  primary-container: '#f59e0b'
  on-primary-container: '#613b00'
  inverse-primary: '#855300'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#d5c3ff'
  on-tertiary: '#3c0091'
  tertiary-container: '#bda2ff'
  on-tertiary-container: '#520fbb'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffddb8'
  primary-fixed-dim: '#ffb95f'
  on-primary-fixed: '#2a1700'
  on-primary-fixed-variant: '#653e00'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d0bcff'
  on-tertiary-fixed: '#23005c'
  on-tertiary-fixed-variant: '#5516be'
  background: '#10131a'
  on-background: '#e1e2ec'
  surface-variant: '#32353d'
typography:
  display-hero:
    fontFamily: Syne
    fontSize: 64px
    fontWeight: '800'
    lineHeight: 72px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Syne
    fontSize: 38px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Syne
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Syne
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Syne
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
  headline-sm:
    fontFamily: Syne
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
  ticket-digit:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 22px
    letterSpacing: 0.01em
  ticket-digit-mobile:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.01em
  caller-announcement:
    fontFamily: Syne
    fontSize: 80px
    fontWeight: '800'
    lineHeight: 80px
    letterSpacing: -0.03em
  caller-announcement-mobile:
    fontFamily: Syne
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  grid-gutter: 1rem
  ticket-gap: 0.375rem
  console-pad-sm: 0.75rem
  console-pad-md: 1.25rem
  console-pad-lg: 2rem
  board-cell-size-desktop: 2.75rem
  board-cell-size-mobile: 1.875rem
---

## Brand & Style

This design system establishes a high-stakes, opulent digital salon for Tambola / Housie gaming. Merging deep-space obsidian darkness with translucent frosted glass and high-voltage jewel-toned glows, it evokes the electric tension of high-roller VIP lounges and modern esports stages.

### Aesthetics & Tone
- **Atmospheric & Immersive:** Grounded in layered blacks and midnight indigos, the interface dissolves background clutter so glowing gameplay matrices, active balls, and winning patterns take center stage.
- **Bespoke Glassmorphism:** Micro-etched iridescent glass boundaries, soft multi-layered backdrop filtration, and subtle inner specular light catchers replace heavy opaque cards.
- **Electric Tactility:** Interactive controls replicate luxury arcade hardware—damped capacitive toggles, backlit counters, tactile mechanical clatter, and intense light-pipe states for real-time multiplayer orchestration.

## Colors

The palette operates strictly in a deep midnight luminance hierarchy. Obsidian and nocturnal slate hues anchor the canvases, while ultra-saturated jewel tones represent functional game states, calls, and celebration triggers.

### Palette Architecture
- **Primary (Vibrant Gold / Amber - `#F59E0B`):** The hallmark of VIP wins, jackpot counters, active 1-90 called number spotlights, and crown achievements.
- **Secondary (Emerald Radiance - `#10B981`):** Verified ticket marks, validated claim confirmations, completed rows (Early Five, Lines), and positive latency indicators.
- **Tertiary (Electric Violet - `#8B5CF6`):** Host console switches, special power-ups, pattern triggers, and ambient rim spotlights.
- **Accent (Neon Cyan - `#06B6D4`):** Real-time telemetries, synced audio visualizers, countdown rings, and ticket cell hover triggers.
- **Base Canvas (`#0A0D14` & `#0F172A`):** Pure optical depth with zero muddiness, enriched with subtle radial light falloffs.

### Translucent Glass Layers
- **Surface Glass Layer 1 (Backdrop Base):** `rgba(15, 23, 42, 0.65)` with `backdrop-filter: blur(24px)`.
- **Surface Glass Layer 2 (Elevated Overlay / Modal):** `rgba(30, 41, 59, 0.70)` with `backdrop-filter: blur(32px)`.
- **Iridescent Borders:** Linear gradients flowing through `rgba(245, 158, 11, 0.45)`, `rgba(139, 92, 246, 0.25)`, and `rgba(6, 182, 212, 0.45)` applied at `1px` stroke.

## Typography

Typography balances dramatic luxury game-show flair with surgical mathematical legibility. 

- **Syne** serves as the headline and major score banner font, lending high-fashion avant-garde geometry and magnetic authority to game titles and winning declarations.
- **Plus Jakarta Sans** governs systemic body copy, player messages, chat streams, rules, and host settings with neutral, ultra-clear readability.
- **Space Grotesk** drives all numeric tables, ticket numbers, timers, serial badges, and tabular telemetry. It must be rendered with `font-variant-numeric: tabular-nums lining-nums` across all 3x9 Tambola ticket matrix layouts and 90-number caller boards to eliminate layout wobble during fast calls.

## Layout & Spacing

The layout model adapts between a wide-format dual-engine workstation (Host Console & Master Board) and a high-focus vertical handheld view (Player Ticket Deck).

### Grid Architecture
- **Desktop Host & Arena (>= 1280px):** 12-column dynamic flex layout. The left wing (3 columns) houses player lobbies, prize claims, and live stats; the center stage (6 columns) anchors the 90-ball Caller Wheel and master board; the right wing (3 columns) hosts real-time chat, event logs, and sound synthesis controls.
- **Tablet / Split View (768px - 1279px):** 8-column layout. The master board scales dynamically to 10x9 matrix format; tickets dock as tabbed glass sheets along the bottom third.
- **Mobile Handheld (< 768px):** 4-column column-first fluid stacking. Focus locks directly onto the current active Tambola tickets (9x3 grid) with a sticky mini-caller HUD displaying the last 5 calls across the top edge.

### Rhythm
Spacing runs strictly on an 8px standard module with 4px sub-increments for compact 90-ball matrix density. Ticket cell padding maintains equal aspect ratios to ensure tap accuracy under split-second claim windows.

## Elevation & Depth

Visual hierarchy uses physical illumination through tinted darkness rather than blunt drop shadows. Light sources radiate from within game elements out onto smoked-glass surfaces.

### Tiers of Light & Elevation

1. **Floor (Ground Canvas - `#0A0D14`):** Void-grade deep obsidian featuring subtle static mesh grids and radial ambient glows beneath active interactive regions.
2. **Glass Low (Boards & Tables):** `background: rgba(15, 23, 42, 0.70); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)`.
3. **Glass Mid (Tickets & Floating Panels):** `background: rgba(22, 33, 58, 0.65); backdrop-filter: blur(24px); border: 1px solid rgba(139, 92, 246, 0.25); box-shadow: 0 12px 36px -8px rgba(0, 0, 0, 0.65), 0 0 24px -4px rgba(139, 92, 246, 0.15)`.
4. **Glass High (Active Ball Announcer & Modals):** `background: rgba(30, 41, 59, 0.85); backdrop-filter: blur(40px); border: 1px solid rgba(245, 158, 11, 0.4); box-shadow: 0 20px 60px -10px rgba(0, 0, 0, 0.85), 0 0 40px 0 rgba(245, 158, 11, 0.25)`.
5. **Incandescent Focus (Dabbed Cell & Win Notification):** Concentrated neon bloom (`box-shadow: 0 0 16px rgba(16, 185, 129, 0.65), inset 0 0 8px rgba(255, 255, 255, 0.4)`).

## Shapes

The design system employs refined radius geometries (Level 2) to mirror laser-cut acrylic gaming hardware, rounded polyhedral tokens, and ergonomic physical consoles.

- **Base Cards, Panels, and Tickets:** `16px` (`rounded-lg`) corner radii keep structures cohesive and prevent harsh intersections on dark glass.
- **Ticket Grid Cells:** `8px` (`rounded-md`) rounding creates clear tactile separation between neighboring numbers while maintaining quick fingertip targeting.
- **Controls & Ball Tokens:** Number balls and active announcer spheres maintain perfect `9999px` circular geometry with concentric iridescent border rings.
- **Modals & Toast Alerts:** `24px` (`rounded-xl`) soft envelope radius with top-rim specular highlights.

## Components

### 1. The 9x3 Tambola Ticket
- **Container:** Smoked glass panel (`rgba(15, 23, 42, 0.85)`), layered with an iridescent top-to-bottom edge border. Header bar displays ticket serial ID, current active claims (Early 5, Top Line, Full House), and status pill badges.
- **Grid Structure:** 9 columns by 3 rows. Blank cells are rendered with muted inset dots on deep slate (`rgba(255, 255, 255, 0.02)`).
- **Number Cells:**
  - *Default:* Translucent button with Space Grotesk tabular digits in `#F1F5F9`.
  - *Hovered/Targeted:* Subtle neon cyan perimeter ring.
  - *Dabbed/Struck:* Transitions instantly into saturated Emerald (`#10B981`) or Amber Gold (`#F59E0B`) with an animated glowing starburst dab mark and a white interior number.
  - *Invalid Tap Shake:* Red-orange luminescence with a brief horizontal jitter.

### 2. The 90-Number Master Caller Board
- **Overview:** 10x9 matrix housing numbers 1 through 90.
- **Uncalled Cells:** Faint low-contrast ghost frames (`#1E293B`) with muted slate numbers.
- **Called Cells:** High-luminance Electric Violet or Emerald fill with high-contrast digits.
- **Current Number Callout:** Triple-ringed pulsating gold orb with real-time radial audio wave ripples.

### 3. Buttons & Action Triggers
- **Primary "Claim Win" Button:** Gold-to-amber diagonal gradient background, obsidian-black Syne bold text, high-intensity ambient amber glow (`box-shadow: 0 0 24px rgba(245, 158, 11, 0.4)`), and an active press scale down of 0.96.
- **Host Controller Toggles:** Rocker switches and capacitive push buttons in brushed obsidian with backlit status LEDs (Green for Autocall active, Violet for Manual Pull).

### 4. Chips & Status Badges
- **Pattern Badges (Full House, Jaldi 5, Corners):** Pill-shaped tags (`border-radius: 9999px`) featuring tinted glass backings matched to prize tiers (e.g., Gold for First Full House, Cyan for Corners).
- **Latency & Sync Indicators:** Micro circular beads featuring real-time pulse animations (`#10B981` < 40ms, `#F59E0B` > 100ms).

### 5. Input Fields & Selectors
- **Room Code & Wager Fields:** Deep glass containers (`rgba(15, 23, 42, 0.9)`) with Space Grotesk monospaced characters, glowing caret, and violet focus rings with zero blur bleed.

### 6. Victory Overlays & Celebration VFX
- **Winning Claim Modal:** Centered high-blur glass shield surrounded by radial neon god-rays.
- **Celebration Accents:** Hardware-accelerated particle confetti featuring jewel-toned shards (emerald, violet, gold) and shimmering coin fountains, paired with bold typography stating the winner's moniker and prize breakdown.