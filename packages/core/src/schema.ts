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

export interface AffectedElement {
  id: string
  behavior: 'add' | 'change' | 'delete'
  prevIndex?: number
  groupIds?: string[]
}

export function createSchemaApi() {
  const elements: MarkdanSchemaElement[] = []
  const affectedElements = new Set<AffectedElement>()

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
    elements.splice(idx, 0, element)

    affectedElements.add({
      id: element.id,
      behavior: 'add',
      prevIndex: Math.max(0, idx - 1),
    })

    return element
  }

  function appendAfter<T extends MarkdanSchemaElement>(element: T, id: T['id']): T {
    const idx = elements.findIndex(i => i.id === id)
    if (idx === -1) {
      throw new Error(`Cannot find element(${id})`)
    }
    elements.splice(Math.min(elements.length, idx + 1), 0, element)

    affectedElements.add({
      id: element.id,
      behavior: 'add',
      prevIndex: idx,
    })

    return element
  }

  function append<T extends MarkdanSchemaElement>(element: T): T {
    elements.push(element)

    affectedElements.add({
      id: element.id,
      behavior: 'add',
      prevIndex: elements.length - 2,
    })

    return element
  }

  function replace<T extends MarkdanSchemaElement>(element: T, id: T['id']): T {
    const idx = elements.findIndex(item => item.id === id)
    if (idx === -1) {
      throw new Error('数据结构错误')
    }
    elements.splice(idx, 1, element)

    affectedElements.add({
      id: element.id,
      behavior: 'change',
    })

    return element
  }

  function splice<T extends MarkdanSchemaElement>(start: number, deleteCount: number, ...items: T[]) {
    const deleteIds = new Set()
    elements.slice(start, start + deleteCount).forEach((element) => {
      if (!deleteIds.has(element.id) && !element.groupIds.some(id => deleteIds.has(id))) {
        deleteIds.add(element.id)
        affectedElements.add({
          id: element.id,
          behavior: 'delete',
          groupIds: element.groupIds,
        })
      }
    })
    elements.splice(start, deleteCount, ...items)
    items.forEach((item, index) => {
      affectedElements.add({
        id: item.id,
        behavior: 'add',
        prevIndex: start + index - 1,
      })
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
    replace,
  }
}

export type MarkdanSchema = ReturnType<typeof createSchemaApi>
