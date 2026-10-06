import { AxiosError, type AxiosResponse } from 'axios'
import { describe, expect, test } from 'vitest'
import { apiErrorMessage } from '@/helpers/APIFunctions'

describe('apiErrorMessage', () => {
  test('returns the message vdoc answered with', () => {
    const error = new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
      data: { message: 'Project not found' },
    } as AxiosResponse)
    expect(apiErrorMessage(error)).toBe('Project not found')
  })

  test('falls back to the message of an error vdoc did not answer', () => {
    expect(apiErrorMessage(new AxiosError('Network Error'))).toBe('Network Error')
    expect(apiErrorMessage(new Error('Boom'))).toBe('Boom')
  })

  test('describes a thrown value that is not an error', () => {
    expect(apiErrorMessage('Boom')).toBe('An unknown error occurred.')
    expect(apiErrorMessage(undefined)).toBe('An unknown error occurred.')
  })
})
