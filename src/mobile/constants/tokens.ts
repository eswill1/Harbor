// Harbor Design Tokens — Single source of truth for mobile
// Derived from DESIGN_BIBLE.md v1.1

// ─── Colors ───────────────────────────────────────────────────────────────────

export const palette = {
  // Brand palette
  deep:     '#1B2A3B',
  slate:    '#2E4057',
  water:    '#4A7FA5',
  seafoam:  '#72B8A0',
  sand:     '#F0E6D3',
  mist:     '#F7F4EF',
  fog:      '#E8E2D9',

  // Extended
  dark:     '#111820',
  white:    '#FFFFFF',
} as const

export const colors = {
  light: {
    bgBase:       '#F7F4EF',
    bgSurface:    '#FFFFFF',
    bgElevated:   '#F0E6D3',
    textPrimary:  '#1B2A3B',
    textSecondary:'#5A6A7A',
    textMuted:    '#9AABB8',
    accentPrimary:'#4A7FA5',
    accentSuccess:'#72B8A0',
    accentCaution:'#C4935A',
    accentCivic:  '#7B68A8',
    border:       '#E8E2D9',
    borderStrong: '#C8BFB4',
  },
  dark: {
    bgBase:       '#111820',
    bgSurface:    '#1B2A3B',
    bgElevated:   '#2E4057',
    textPrimary:  '#EEE8DF',
    textSecondary:'#8FA3B1',
    textMuted:    '#4A6070',
    accentPrimary:'#6B9FBF',
    accentSuccess:'#72B8A0',
    accentCaution:'#D4A870',
    accentCivic:  '#9B88C8',
    border:       '#2A3D50',
    borderStrong: '#3A5060',
  },
} as const

// ─── Typography ───────────────────────────────────────────────────────────────

export const fontSize = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  '2xl':30,
  '3xl':38,
} as const

export const lineHeight = {
  xs:   15,
  sm:   20,
  base: 24,
  md:   26,
  lg:   28,
  xl:   31,
  '2xl':36,
  '3xl':42,
} as const

export const fontWeight = {
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
}

export const fontFamily = {
  inter:        'Inter_400Regular',
  interMedium:  'Inter_500Medium',
  interSemibold:'Inter_600SemiBold',
  interBold:    'Inter_700Bold',
  lora:         'Lora_400Regular',
  loraBold:     'Lora_700Bold',
} as const

// ─── Spacing (8pt grid) ───────────────────────────────────────────────────────

export const space = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const

// ─── Border radius ────────────────────────────────────────────────────────────

export const radius = {
  sm:   6,
  md:   12,
  lg:   18,
  xl:   24,
  full: 999,
} as const

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const shadow = {
  sm: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius:  3,
    elevation:     2,
  },
  md: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius:  12,
    elevation:     4,
  },
  lg: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius:  24,
    elevation:     8,
  },
} as const

// ─── Animation durations (ms) ─────────────────────────────────────────────────

export const duration = {
  instant:  80,
  fast:     150,
  normal:   250,
  slow:     400,
  xslow:    600,
} as const
