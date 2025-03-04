export enum AppStatus {
  BEFORE_BOOTSTRAP = 'BEFORE_BOOTSTRAP',
  BOOTSTRAPPED = 'BOOTSTRAPPED',
  BEFORE_MOUNT = 'BEFORE_MOUNT',
  MOUNTED = 'MOUNTED',
  UNMOUNTING = 'UNMOUNTING',
  ERROR = 'ERROR'
}

type LifecycleFn = {
  bootstrap?: () => Promise<void> | void;
  mount: () => Promise<void> | void;
  unmount: () => Promise<void> | void;
};
export type activeWhen = (location?: Location ) => boolean

export interface AppConfig  {
  name: string;
  loadApp: () => Promise<LifecycleFn> | LifecycleFn;
  active: string | activeWhen;
  customProps?: Record<string, unknown>;
};


export type MicroApp = {
  status: AppStatus;
  lifecycle?: LifecycleFn;
  error?: Error;
} & AppConfig

