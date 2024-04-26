import { createRandomId } from '@markdan/helper'

export interface MarkdanSchemaElement {
  id: string
  version: number
  versionNonce: number
  updated: number
  isDeleted: boolean

  type: string /** ElementType */
  groupIds: string[]
  content: string
}

let version = 1

export function createSchemaApi() {
  const elements: MarkdanSchemaElement[] = []

  function createElement<T extends string>(type: T, groupIds: string[] = [], content = ''): MarkdanSchemaElement {
    return {
      id: createRandomId(),
      type,
      groupIds,
      content,
      version: version++,
      versionNonce: Math.random() * 10,
      updated: Date.now(),
      isDeleted: false,
    }
  }

  function appendBefore<T extends MarkdanSchemaElement>(element: T, id: T['id']): T {
    const idx = elements.findIndex(i => i.id === id)
    if (idx === -1) {
      throw new Error(`Cannot find element(${id})`)
    }
    elements.splice(Math.max(0, idx - 1), 0, element)

    return element
  }

  function appendAfter<T extends MarkdanSchemaElement>(element: T, id: T['id']): T {
    const idx = elements.findIndex(i => i.id === id)
    if (idx === -1) {
      throw new Error(`Cannot find element(${id})`)
    }
    elements.splice(idx, 0, element)

    return element
  }

  function append<T extends MarkdanSchemaElement>(element: T): T {
    elements.push(element)

    return element
  }

  return {
    elements,

    createElement,
    append,
    appendBefore,
    appendAfter,
  }
}

export type MarkdanSchema = ReturnType<typeof createSchemaApi>
