import { AxiosError } from 'axios'

export interface FastAPIErrorResponse {
  detail: string
}
export type FastAPIAxiosErrorT = AxiosError<FastAPIErrorResponse>
