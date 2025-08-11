// Build-time version constants injected by Vite
declare const __BUILD_SHA__: string
declare const __BUILD_TIME__: string

export const BUILD_SHA = __BUILD_SHA__
export const BUILD_TIME = __BUILD_TIME__

export const VERSION_INFO = {
  sha: BUILD_SHA,
  buildTime: BUILD_TIME
}