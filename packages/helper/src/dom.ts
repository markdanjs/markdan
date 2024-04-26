/**
 * 通过 editor 点击位置，分析选中的 block 位置，以及确定点击的是哪个字符
 */
export function getBlockPositionByClick(e: MouseEvent, _mode = '?') {
  let range
  let textNode: Node
  let offset: number

  const doc: Document & Record<string, any> = document

  if (doc.caretPositionFromPoint) {
    range = doc.caretPositionFromPoint(e.clientX, e.clientY)
    textNode = range.offsetNode
    offset = range.offset
  } else if (doc.caretRangeFromPoint) {
    // 使用 WebKit 专有回退方法
    range = doc.caretRangeFromPoint(e.clientX, e.clientY)!
    textNode = range.startContainer
    offset = range.startOffset
  } else {
    throw new Error('Your browse is not supported.')
  }

  if (!textNode) {
    throw new Error('Your browse is not supported.')
  }

  return {
    node: textNode,
    offset,
  }
}

export function getBlockIdByNode(node: Node) {
  const n = (node.nodeType === 3 ? node.parentNode : node) as HTMLElement

  const id = n?.dataset?.id

  if (!id) {
    throw new TypeError('Cannot find node')
  }

  return id
}

export function isPointInRect({ left, top }: { left: number; top: number }, { x, y, width, height }: { x: number; y: number; width: number; height: number }): boolean {
  return left >= x
    && left <= x + width
    && top >= y
    && top <= y + height
}
