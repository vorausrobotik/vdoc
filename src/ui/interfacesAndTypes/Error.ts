import { AxiosError } from 'axios'

export interface FastAPIErrorResponse {
  message: string
}
export type FastAPIAxiosErrorT = AxiosError<FastAPIErrorResponse>
