export interface HistoryController {
  start: () => void
  destroy: () => void
}

export function createHistoryController(listener: () => void): HistoryController {
  const originalPushState: History['pushState'] = window.history.pushState
  const originalReplaceState: History['replaceState'] = window.history.replaceState

  const handleRoutingEvent = (): void => {
    listener()
  }

  type HistoryMethodName = 'pushState' | 'replaceState'

  const methods: { name: HistoryMethodName; original: History[HistoryMethodName] }[] = [
    { name: 'pushState', original: originalPushState },
    { name: 'replaceState', original: originalReplaceState },
  ]

  return {
    start: (): void => {
      window.addEventListener('popstate', handleRoutingEvent)
      window.addEventListener('hashchange', handleRoutingEvent)

      methods.forEach(({ name, original }) => {
        window.history[name] = new Proxy(original, {
          apply: (target: (...args: Parameters<History['pushState']>) => void, thisArg: any, argArray: Parameters<History['pushState']>): void => {
            Reflect.apply(target, thisArg, argArray)
            listener()
          },
        })
      })
    },

    destroy: (): void => {
      window.removeEventListener('popstate', handleRoutingEvent)
      window.removeEventListener('hashchange', handleRoutingEvent)
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
    },
  }
}
