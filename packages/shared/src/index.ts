const toTypeString = Object.prototype.toString

export const isArray = (val: unknown): val is Array<any> => {
  return toTypeString.call(val) === '[object Array]'
}

export const isPlainObject = (val: unknown): val is Record<any, any> => {
  return toTypeString.call(val) === '[object Object]'
}

export const isString = (val: unknown): val is string => {
  return typeof val === 'string'
}

const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (
  val: object,
  key: string | symbol,
): key is keyof typeof val => hasOwnProperty.call(val, key)
