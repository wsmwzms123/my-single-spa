import { APP_STATUS } from './type/app-status'
import { isPromise } from './utils'

export default class MiniSpa {
  private apps = new Map()

  constructor() {
   window.apps = this.apps
    this.addHashChangeEvent()
    this.historyOverride()
  }

  async registerApp(app) {
    if (this.apps.has(app.name)) {
      throw new Error(`app ${app.name} is already registered`)
    }

    this.apps.set(app.name, {
      loadApp: app.loadApp.bind(app),
      status: APP_STATUS.BEFORE_MOUNTED,
      unpacked: false,
      active: typeof app.active === 'function' ? app.active.bind(app) : () => app.active === location.pathname,
      bootstrap: null,
      mount: null,
      unmount: null,
    })
  }
  unRegisterApp(name: string) {
    if (this.apps.has(name)) {
      this.apps.delete(name)
    }
  }

  addHashChangeEvent() {
    ;['popstate', 'hashchange'].forEach((event) => {
      window.addEventListener(event, this.loadApp.bind(this), true)
    })
  }

  historyOverride() {
    ;['pushState', 'replaceState'].forEach((method) => {
      const original = window.history[method]
      window.history[method] = (...args) => {
        const result = original.apply(window.history, args)
        this.loadApp()
        return result
      }
    })
  }

  async appUnpack(app) {
    if (!app.unpacked) {
      let loadedApp = app.loadApp()
      const { unmount, mount, bootstrap } = isPromise(loadedApp) ? await loadedApp : loadedApp

      app.unmount = unmount
      app.mount = mount
      app.bootstrap = bootstrap
      app.unpacked = true
    }
  }

  async unmountApp() {
    for (const app of this.apps.values()) {
      if (app.status === APP_STATUS.MOUNTED  && !app.active()) {
        await this.appUnpack(app)

        await app.unmount()

        app.status = APP_STATUS.BEFORE_MOUNTED
      }
    }
  }

  async mountApp() {
    for (const app of this.apps.values()) {
      if (app.status === APP_STATUS.BEFORE_MOUNTED && app.active()) {
        await this.appUnpack(app)
        app?.bootstrap()
        await app.mount()
        app.status = APP_STATUS.MOUNTED
      }
    }
  }

  async loadApp() {
    await this.unmountApp()
    await this.mountApp()
  }

  start(): void {
    this.loadApp()
  }
}
