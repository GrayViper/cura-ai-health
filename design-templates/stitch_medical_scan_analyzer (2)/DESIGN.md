---
name: Clinical Precision
colors:
  surface: '#f9f9fe'
  surface-dim: '#d9dadf'
  surface-bright: '#f9f9fe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f8'
  surface-container: '#ededf3'
  surface-container-high: '#e7e8ed'
  surface-container-highest: '#e2e2e7'
  on-surface: '#191c1f'
  on-surface-variant: '#42474f'
  inverse-surface: '#2e3034'
  inverse-on-surface: '#f0f0f5'
  outline: '#727780'
  outline-variant: '#c2c7d1'
  surface-tint: '#2d6197'
  primary: '#00355f'
  on-primary: '#ffffff'
  primary-container: '#0f4c81'
  on-primary-container: '#8ebdf9'
  inverse-primary: '#a0c9ff'
  secondary: '#006970'
  on-secondary: '#ffffff'
  secondary-container: '#8df2fc'
  on-secondary-container: '#006f77'
  tertiary: '#532800'
  on-tertiary: '#ffffff'
  tertiary-container: '#743b00'
  on-tertiary-container: '#f9a767'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e4ff'
  primary-fixed-dim: '#a0c9ff'
  on-primary-fixed: '#001c37'
  on-primary-fixed-variant: '#07497d'
  secondary-fixed: '#8df2fc'
  secondary-fixed-dim: '#70d6df'
  on-secondary-fixed: '#002022'
  on-secondary-fixed-variant: '#004f54'
  tertiary-fixed: '#ffdcc4'
  tertiary-fixed-dim: '#ffb780'
  on-tertiary-fixed: '#2f1400'
  on-tertiary-fixed-variant: '#6f3800'
  background: '#f9f9fe'
  on-background: '#191c1f'
  surface-variant: '#e2e2e7'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-display:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  container-margin: 24px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is built on the pillars of **precision, clarity, and trust**. It caters to a dual audience: healthcare professionals who require data density and accuracy, and patients who seek reassurance and ease of use. 

The aesthetic is **Clinical-Modern**. It leverages a minimalist framework with structured information architecture to ensure that critical medical data is never obscured. The emotional response is one of calm authority—reducing the anxiety often associated with medical diagnostics through clean whitespace, purposeful typography, and a "security-first" visual language. This is achieved through a hybrid of **Corporate Modern** and **Tonal Layering**, prioritizing functional utility over decorative flair.

## Colors
The palette is grounded in a deep clinical blue to project authority and institutional trust. 

- **Primary (Deep Blue):** Used for headers, primary actions, and navigational anchors.
- **Secondary (Medical Teal):** Used for supportive actions, health-related highlights, and progress indicators.
- **Semantic Accents:** "Emergency Red" is reserved exclusively for critical alerts and abnormal test results. "Success Green" validates clear scans and completed actions.
- **Neutral Foundation:** The background uses a very light slate-gray to reduce screen glare compared to pure white, improving long-term legibility for practitioners.

## Typography
This design system utilizes **Inter** for its exceptional legibility and neutral, technical character. For specific medical data points (e.g., blood pressure readings, chemical values, or timestamps), **JetBrains Mono** is introduced to provide a distinct, tabular "readout" feel that suggests mathematical precision.

**Hierarchy Rules:**
- Use `headline-lg` for primary page titles like "Patient Dashboard" or "Radiology Report."
- `label-caps` should be used for section headers within cards to maintain a structured, form-like appearance.
- High contrast must be maintained; body text should never fall below a 4.5:1 ratio against the background.

## Layout & Spacing
The layout follows a **8px grid system** to ensure mathematical consistency. 

- **Desktop:** A 12-column fluid grid with 24px side margins. Large data tables and scan viewers may expand to a "Wide" container (max-width 1440px).
- **Mobile:** A single-column layout with 16px margins.
- **Spacing Rhythm:** Use `stack-md` (16px) for the majority of component spacing. Use `stack-lg` (32px) to separate distinct logical sections, such as "Patient History" from "Current Medications."

## Elevation & Depth
Depth is used sparingly and logically to signify interaction and information priority.

- **Level 0 (Base):** The `neutral_base` background.
- **Level 1 (Cards):** White surfaces with a 1px border (#E2E8F0) and a very soft, diffused shadow (0px 2px 4px rgba(0,0,0,0.05)). This houses the majority of content.
- **Level 2 (Modals/Overlays):** Elevated with a more pronounced shadow (0px 10px 25px rgba(0,0,0,0.1)) to draw focus for diagnostic tools or record editing.
- **Interaction:** Buttons should not use heavy shadows. Use subtle tonal shifts (darkening the primary color) on hover to maintain a flat, professional appearance.

## Shapes
A **Rounded (0.5rem)** approach is applied to soften the clinical edge of the platform without appearing informal.

- **Standard Elements:** Input fields, buttons, and cards use the base 8px (0.5rem) radius.
- **Small Elements:** Chips and tags use 4px (0.25rem) to maintain sharp definition at small scales.
- **Large Elements:** Container-level modules use 16px (1rem) for a modern, nested appearance.

## Components
- **Buttons:** Primary buttons use the Clinical Blue background with white text. Secondary buttons use a teal outline. Avoid "ghost" buttons for critical actions; clarity is paramount.
- **Input Fields:** Use clear labels and a focus state with a 2px Deep Blue border. Error states must include both the Emergency Red border and a descriptive error icon for accessibility.
- **Data Cards:** Every card should have a clear header using `label-caps`. If a card contains an "Alert," the left border should be thickened (4px) and colored with the appropriate semantic accent.
- **Status Chips:** Small, pill-shaped indicators. "Pending" uses a soft gray, "Critical" uses a red background with white text, and "Normal" uses a light green tint with Success Green text.
- **Medical Icons:** Use a thin-stroke (1.5pt) icon set. Icons must be literal—use a heart for cardiology, a lung for pulmonology—avoid abstract metaphors.
- **Progress Steps:** For multi-stage diagnostic flows, use a linear progress tracker in the header to reduce patient cognitive load.