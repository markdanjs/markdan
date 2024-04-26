import type { MarkdanSchemaElement } from '@markdan/core'

export interface MarkdanViewBlock extends MarkdanSchemaElement {
  children?: MarkdanViewBlock[]
}

export function parseSchema(elements: MarkdanSchemaElement[]) {
  return elementsToBlocks(elements)
}

function elementsToBlocks(elements: MarkdanSchemaElement[], id = ''): MarkdanViewBlock[] {
  let element = id ? elements.find(b => b.id === id) : elements[0]

  if (!element) {
    throw new Error('Cannot parse elements.')
  }

  // 找到最顶层的 element
  if (!id) {
    while (element.groupIds?.length > 0) {
      const parentId = element.groupIds[0] as string
      element = elements.find(b => b.id === parentId)

      if (!element) {
        throw new Error(`找不到 id 为 "${parentId}" 的 Element`)
      }
    }
  }

  // 找到顶层 block 下面所有的元素
  const toBeResolvedElements = elements.filter(b => b.id === element.id || b.groupIds?.includes(element.id))
  const restElements = elements.filter(b => b.id !== element.id && !b.groupIds?.includes(element.id))

  const blocks = convertToNestedStructure(structuredClone(toBeResolvedElements))

  if (restElements.length > 0) {
    return blocks.concat(elementsToBlocks(restElements))
  }

  return blocks
}

function convertToNestedStructure(elements: MarkdanViewBlock[]): MarkdanViewBlock[] {
  const map: Record<MarkdanViewBlock['id'], MarkdanViewBlock> = {}
  const result: MarkdanViewBlock[] = []

  // Create a map of ids to their respective objects
  elements.forEach((item) => {
    map[item.id] = item
    item.children = []
  })

  // Populate children array of each object based on groupIds
  elements.forEach((item) => {
    const parentId = item.groupIds[item.groupIds.length - 1]
    const parent = map[parentId]
    if (parent) {
      parent.children!.push(item)
    } else {
      result.push(item) // If a parent is not found, add the item to result
    }
  })

  return result
}
