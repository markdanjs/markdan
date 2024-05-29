import { isArray } from './utils'

const platform = /Mac/i.test(navigator.userAgent)
  ? 'Mac'
  : 'Windows'

const isMac = platform === 'Mac'

export function getModifierKeys(e: MouseEvent | KeyboardEvent) {
  const { altKey, shiftKey, ctrlKey, metaKey } = e

  const keys = []

  altKey && keys.push('altKey')
  shiftKey && keys.push('shiftKey')

  if (ctrlKey) {
    !isMac && keys.push('ctrlKey')
  }
  isMac && metaKey && keys.push('ctrlKey')

  return keys
}

export function isOnlyAltKey(e: string[] | MouseEvent | KeyboardEvent) {
  const keys = isArray(e) ? e : getModifierKeys(e)

  return keys.length === 1 && keys[0] === 'altKey'
}

export function isOnlyShiftKey(e: string[] | MouseEvent | KeyboardEvent) {
  const keys = isArray(e) ? e : getModifierKeys(e)

  return keys.length === 1 && keys[0] === 'shiftKey'
}

export function isOnlyCtrlKey(e: string[] | MouseEvent | KeyboardEvent) {
  const keys = isArray(e) ? e : getModifierKeys(e)

  return keys.length === 1 && keys[0] === 'ctrlKey'
}

export function isBothCtrlAndShiftKeys(e: string[] | MouseEvent | KeyboardEvent) {
  const keys = isArray(e) ? e : getModifierKeys(e)

  return keys.length === 2 && keys.every(key => key === 'ctrlKey' || key === 'shiftKey')
}
