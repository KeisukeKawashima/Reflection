export const LAYOUT = {
  STICKY_WIDTH: 224,
  STICKY_HEIGHT: 112,
  STICKY_OFFSET_X: 96,
  STICKY_OFFSET_Y: 56,
  HEADER_HEIGHT: 73,
  CONNECTION_DOT_SIZE: 12,
  CONNECTION_STROKE_WIDTH: 2,
  CONNECTION_CLICK_AREA: 12,
} as const

export const ANIMATION = {
  WELCOME_TIMEOUT: 3000,
  DELETE_ANIMATION: 800,
  SAVE_DEBOUNCE: 100,
} as const

export const COLORS = {
  GOOD: {
    bg: 'bg-green-100',
    border: 'border-green-300',
    text: 'text-green-700',
    hover: 'hover:bg-green-200',
  },
  GROWTH: {
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    text: 'text-blue-700',
    hover: 'hover:bg-blue-200',
  },
} as const
