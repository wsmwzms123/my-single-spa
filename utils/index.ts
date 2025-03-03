export const isPromise = (promise: unknown): promise is Promise<unknown> => {
  return !!promise && typeof (promise as Promise<unknown>).then === 'function'
}
