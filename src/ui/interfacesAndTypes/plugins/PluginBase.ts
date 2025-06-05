export interface PluginBaseI {
  active: boolean
  name: string
}

type OptionalNullable<T> = {
  [K in keyof T]?: T[K] | null
}

export type PluginBaseT<TFields> =
  | (PluginBaseI & { active: false } & OptionalNullable<TFields>)
  | (PluginBaseI & { active: true } & TFields)
