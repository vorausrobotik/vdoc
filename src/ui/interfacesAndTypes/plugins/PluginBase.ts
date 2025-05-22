export interface PluginBaseI {
  active: boolean
  name: string
}

export type PluginBaseT<TFields> =
  | (PluginBaseI & { name: string; active: false } & { [K in keyof TFields]: TFields[K] | null })
  | (PluginBaseI & { name: string; active: true } & TFields)
