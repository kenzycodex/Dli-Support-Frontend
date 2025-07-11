// types/global.d.ts

declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'set',
      eventName: string,
      parameters?: {
        event_category?: string
        event_label?: string
        value?: number | string
        custom_parameters?: Record<string, any>
        [key: string]: any
      }
    ) => void
  }
}

export {}