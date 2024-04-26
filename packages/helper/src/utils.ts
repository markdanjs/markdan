export const hyphenToCamel = (input: string) => {
  return `${input}`.split('-').reduce((acc, curr) => {
    return `${acc}${curr.slice(0, 1).toUpperCase()}${curr.slice(1)}`
  })
}

export const isArray = (arr: unknown): arr is Array<unknown> => Array.isArray(arr)

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ-abcdefghijklmnopqrstuvwxyz_01234567890'
export const createRandomId = () => {
  let id = ''

  for (let i = 0; i < 10; i++) {
    id += `${characters.charAt(Math.floor(Math.random() * characters.length))}`
  }

  const length = Math.round(Math.random() * 10)
  return `${id.slice(0, length)}${Date.now()}${id.slice(length)}`
}
