import {
  hasOwn,
  isArray,
  isString,
} from '@markdan/shared'

const CLASS_NAME_PREFIX = 'mdan-'

export const ClassName = {
  'paragraph': `${CLASS_NAME_PREFIX}p`,
  'ul-list': `${CLASS_NAME_PREFIX}ul-list`,
  'list-item': `${CLASS_NAME_PREFIX}list-item`,
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options: Record<string, any> = {},
): HTMLElementTagNameMap[K] {
  const oEl = document.createElement(tagName)

  if (options.class) {
    oEl.setAttribute(
      'class',
      isArray(options.class)
        ? options.class.join(' ')
        : isString(options.class)
          ? options.class
          : '',
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { class: _class, ...props } = options

  Object.entries(props).forEach(([key, value]) => {
    oEl.setAttribute(key, `${value}`)
  })

  return oEl
}

export function createClassName(name: keyof typeof ClassName | string): string {
  return hasOwn(ClassName, name)
    ? ClassName[name]
    : `${CLASS_NAME_PREFIX}${name}`
}

export function hasClassName(el: Element, name: string): boolean {
  const className = createClassName(name)

  return el.classList.contains(className)
}
