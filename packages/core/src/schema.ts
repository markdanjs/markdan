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
  const affectedElements = new Set<[string, 'add' | 'delete', (string[] | number)?]>()

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

    affectedElements.add([element.id, 'add', Math.max(0, idx - 1)])

    return element
  }

  function appendAfter<T extends MarkdanSchemaElement>(element: T, id: T['id']): T {
    const idx = elements.findIndex(i => i.id === id)
    if (idx === -1) {
      throw new Error(`Cannot find element(${id})`)
    }
    elements.splice(idx, 0, element)

    affectedElements.add([element.id, 'add', idx])

    return element
  }

  function append<T extends MarkdanSchemaElement>(element: T): T {
    elements.push(element)

    affectedElements.add([element.id, 'add', elements.length - 2])

    return element
  }

  function splice<T extends MarkdanSchemaElement>(start: number, deleteCount: number, ...items: T[]) {
    elements.slice(start, start + deleteCount).forEach((element) => {
      affectedElements.add([element.id, 'delete', element.groupIds])
    })
    elements.splice(start, deleteCount, ...items)
    items.forEach((item, index) => {
      affectedElements.add([item.id, 'add', start + index - 1])
    })
  }

  return {
    elements,
    affectedElements,

    createElement,
    append,
    appendBefore,
    appendAfter,
    splice,
  }
}

export type MarkdanSchema = ReturnType<typeof createSchemaApi>
