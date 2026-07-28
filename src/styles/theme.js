// Single source of truth for colour, radius, shadow and spacing.
// The palette keeps the trustworthy blue as the primary and adds warm Nepali
// accents (saffron and temple terracotta) that sit well next to the Kathmandu
// photography used across the app.
const blue = {
  900: '#0d2b57',
  800: '#103a76',
  700: '#143f7d',
  600: '#1a4f9d',
  500: '#2f6ec4',
  400: '#3b82f6',
};

export const theme = {
  colors: {
    // brand
    primary: blue[600],
    primaryDark: blue[700],
    primaryDeep: blue[800],
    primaryLight: blue[500],
    secondary: blue[400],

    // Warm accents drawn from temple brick and prayer flags.
    // `accent` is the call-to-action colour and is used behind white text, so
    // it must stay dark enough for contrast; saffron is decorative only.
    accent: '#c2410c',
    accentDark: '#9a330a',
    saffron: '#f5b301',
    // Saffron is far too light for anything that must be legible (1.85:1 on
    // white). This deeper tone is the one to use for icons and text.
    saffronDeep: '#a9750a',

    // surfaces
    surface: '#f6f8fd',
    surfaceDim: '#dde3ec',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f1f4f9',
    surfaceContainerHigh: '#e8edf5',

    // text
    onSurface: '#161a21',
    onSurfaceVariant: '#4b5563',
    onSurfaceFaint: '#7b8494',

    // lines
    outline: '#b8c0cf',
    outlineVariant: '#dbe1ea',

    // status
    error: '#ba1a1a',
    success: '#00713c',
    warning: '#854d00',
    info: blue[600],

    // soft tints for badges and banners (replaces scattered rgba literals)
    primarySoft: 'rgba(26, 79, 157, 0.10)',
    successSoft: 'rgba(0, 113, 60, 0.12)',
    errorSoft: 'rgba(186, 26, 26, 0.10)',
    warningSoft: 'rgba(198, 128, 0, 0.14)',
    accentSoft: 'rgba(194, 65, 12, 0.10)',
    saffronSoft: 'rgba(245, 179, 1, 0.18)',

    // aliases kept so the landing page can share this theme
    bg: '#f6f8fd',
    surfaceLow: '#f1f4f9',
    surfaceContainer: '#e8edf5',
    text: '#161a21',
    muted: '#4b5563',
    border: '#dbe1ea',
    gold: '#a9750a',
    verified: '#00713c',
  },

  gradients: {
    primary: `linear-gradient(135deg, ${blue[800]}, ${blue[600]} 58%, ${blue[700]})`,
    accent: 'linear-gradient(135deg, #f5b301, #e08a4d)',
    subtle: 'linear-gradient(180deg, #ffffff, #f1f4f9)',
    heroVeil: 'linear-gradient(180deg, rgba(8, 22, 42, 0.62), rgba(8, 22, 42, 0.48))',
  },

  fonts: {
    main: "'Inter', sans-serif",
    body: "'Inter', 'Poppins', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  // `roundness` predates the scale below; both point at the same 10px so older
  // components keep working while newer ones can pick a deliberate size.
  roundness: '10px',
  radius: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    card: '14px',
    pill: '999px',
  },

  // Softer, cooler-tinted elevation. The previous values used 24% black, which
  // read as a heavy grey halo on light surfaces.
  shadows: {
    xs: '0 1px 2px rgba(16, 32, 58, 0.05)',
    sm: '0 1px 2px rgba(16, 32, 58, 0.06), 0 2px 6px rgba(16, 32, 58, 0.06)',
    md: '0 4px 12px rgba(16, 32, 58, 0.08), 0 2px 4px rgba(16, 32, 58, 0.05)',
    lg: '0 12px 28px rgba(16, 32, 58, 0.12), 0 4px 10px rgba(16, 32, 58, 0.06)',
    primary: '0 6px 16px rgba(26, 79, 157, 0.24)',
    // landing-page aliases
    card: '0 4px 12px rgba(16, 32, 58, 0.06)',
    cardHover: '0 12px 28px rgba(16, 32, 58, 0.12)',
    nav: '0 8px 24px rgba(16, 32, 58, 0.06)',
  },

  transitions: {
    base: '180ms cubic-bezier(0.2, 0, 0.2, 1)',
  },

  spacing: (val) => `${val * 8}px`,
};
