export interface IntegrationBaseI {
  active: boolean
  name: string
}

export type IntegrationBaseT<TFields> =
  | (IntegrationBaseI & { name: string; active: false } & { [K in keyof TFields]: TFields[K] | null })
  | (IntegrationBaseI & { name: string; active: true } & TFields)
