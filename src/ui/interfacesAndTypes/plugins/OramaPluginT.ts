import { PluginBaseT } from './PluginBase'

type OramaDictionaryT = {
  search_placeholder?: string
  chat_placeholder?: string
  no_results_found?: string
  no_results_found_for?: string
  suggestions?: string[]
  see_all?: string
  add_more?: string
  clear_chat?: string
  error_message?: string
  disclaimer?: string
  start_your_search?: string
  init_error_search?: string
  init_error_chat?: string
  chat_button_label?: string
  search_button_label?: string
}

type OramaPluginFields = {
  endpoint: string
  api_key: string
  disable_chat: boolean
  facet_property?: string
  dictionary?: OramaDictionaryT
}

export type OramaPluginT = PluginBaseT<OramaPluginFields>

export default OramaPluginT
