export interface Point {
  x: number
  y: number
}
export interface Rectangle extends Point {
  width: number
  height: number
}

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

export function isPointInRect(point: Point, { x, y, width, height }: Rectangle): boolean {
  return point.x >= x
    && point.x <= x + width
    && point.y >= y
    && point.y <= y + height
}

export function isMouseMoveOut(el: HTMLElement, e: MouseEvent) {
  const { x, y, width, height } = el.getBoundingClientRect()

  const { clientX, clientY } = e

  return !isPointInRect({
    x: clientX,
    y: clientY,
  }, {
    x,
    y,
    width,
    height,
  })
}

export function getRangePosition(blockId: string, offset: number, el: HTMLElement) {
  const n = el.querySelector(`[data-id="${blockId}"]`)

  if (!n) {
    throw new Error(`Cannot find node by block id(${blockId})`)
  }

  const range = new Range()

  range.setStart(n.firstChild!, offset)
  range.setEnd(n.firstChild!, offset)

  return range.getBoundingClientRect()
}

/**
 * 修正选区中的 top 值，消除 DOM 的差异
 */
export function amendTop(top: number, viewLineTop: number, lineHeight: number | string, max: number) {
  if (top <= viewLineTop) return viewLineTop

  const height = typeof lineHeight === 'string' ? parseInt(lineHeight) : lineHeight
  const half = height / 2

  let vTop = viewLineTop
  while (vTop < max && top > vTop + half) {
    vTop += height
  }

  return vTop
}
