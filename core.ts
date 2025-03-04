import { AppStatus, AppConfig, MicroApp, activeWhen } from './type'
import { HistoryController, createHistoryController } from './history'
import { isPromise } from './utils'

export  default class MiniSpa {
  private static miniSpa: MiniSpa
  private apps: Map<string, MicroApp> = new Map()
  private historyController: HistoryController
  private isStarted = false

  static  getInstance(): MiniSpa {
    if (!(this.miniSpa instanceof MiniSpa)) this.miniSpa = new MiniSpa()
      return this.miniSpa
  }
  
  private constructor() {
    this.historyController = createHistoryController(this.loadApps.bind(this))
  }

  public registerApp(config: AppConfig): void {
    if (this.apps.has(config.name)) {
      throw new Error(`Application ${config.name} is already registered`)
    }

    if (typeof config.active === 'string') {
      const path = config.active
      config.active = (location = window.location) => location.pathname === path
    }

    this.apps.set(config.name, {
      ...config,
      status: AppStatus.BEFORE_BOOTSTRAP,
    })
  }

  public unregisterApp(name: string): void {
    if (!this.apps.has(name)) {
      console.warn(`Application ${name} is not registered`)
      return
    }

    const app = this.apps.get(name)!
    if (app.status === AppStatus.MOUNTED) {
      console.warn(`Cannot unregister mounted app ${name}`)
      return
    }

    this.apps.delete(name)
  }


  public async start(): Promise<void> {
    if (this.isStarted) {
      console.warn('MiniSpa is already started')
      return
    }

    this.historyController.start()
    await this.loadApps()
    this.isStarted = true
  }

  public async destroy(): Promise<void> {
    this.historyController.destroy()
    await this.unmountAllApps()
    this.apps.clear()
    this.isStarted = false
  }

  private async loadApps(): Promise<void> {
    try {
      await this.unmountInactiveApps()
      await this.mountActiveApps()
    } catch (error) {
      console.error('Error loading apps:', error)
      this.handleError(error as Error)
    }
  }

  private async unmountInactiveApps(): Promise<void> {
    const unmountPromises = Array.from(this.apps.values())
      .filter((app) => app.status === AppStatus.MOUNTED && !(app.active as activeWhen)())
      .map((app) => this.unmountApp(app))

    await Promise.all(unmountPromises)
  }

  private async mountActiveApps(): Promise<void> {
    const mountPromises = Array.from(this.apps.values())
      .filter((app) => app.status === AppStatus.BEFORE_BOOTSTRAP && (app.active as activeWhen)())
      .map((app) => this.mountApp(app))

    await Promise.all(mountPromises)
  }

  private async mountApp(app: MicroApp): Promise<void> {
    try {
      app.status = AppStatus.BEFORE_BOOTSTRAP

      if (!app.lifecycle) {
        const lifecycle = app.loadApp()
        app.lifecycle = isPromise(lifecycle) ? await lifecycle : lifecycle
      }

      app.status = AppStatus.BEFORE_MOUNT
      await app.lifecycle?.bootstrap?.()
      await app.lifecycle.mount()
      app.status = AppStatus.MOUNTED
    } catch (error) {
      app.status = AppStatus.ERROR
      app.error = error as Error
      this.handleError(error as Error)
    }
  }

  private async unmountApp(app: MicroApp): Promise<void> {
    try {
      app.status = AppStatus.UNMOUNTING
      await app.lifecycle?.unmount()
      app.status = AppStatus.BEFORE_BOOTSTRAP
    } catch (error) {
      app.status = AppStatus.ERROR
      app.error = error as Error
      this.handleError(error as Error)
    }
  }

  getAppStatus() {
    
  }

  private async unmountAllApps(): Promise<void> {
    const unmountPromises = Array.from(this.apps.values())
      .filter((app) => app.status === AppStatus.MOUNTED)
      .map((app) => this.unmountApp(app))

    await Promise.all(unmountPromises)
  }

  private handleError(error: Error): void {
    console.error('Micro app error:', error)
  }
}
