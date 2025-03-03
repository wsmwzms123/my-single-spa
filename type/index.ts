type AppLifecycleMethods = {
  bootstrap: () => void
  mount: () => void
  unmount: () => void
}

export interface App {
  name: string
  loadApp: () => AppLifecycleMethods | Promise<AppLifecycleMethods>
  active: string | ((location: Location) => boolean)
}
