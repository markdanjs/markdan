import type { Point, Rectangle } from '@markdan/helper'
import { getBlockIdByNode, getBlockPositionByClick, getIntersectionArea, getModifierKeys, isOnlyAltKey, isOnlyShiftKey, isPointInRect, isRectContainRect, isRectCross } from '@markdan/helper'
import type { MarkdanContext } from './apiCreateApp'
import { EditorSelectionRange } from './range'

function getMouseOverElement(point: Point, ctx: MarkdanContext) {
  const {
    config: {
      containerRect,
      lastTop,
      scrollbarSize,
    },
    interface: {
      scrollbar: {
        scrollX,
        scrollY,
      },
    },
    schema: { elements },
    renderedElements,
    emitter,
  } = ctx

  const x = point.x - containerRect.x + scrollX
  const y = point.y - containerRect.y + scrollY

  const overViewLine = y > lastTop
    ? renderedElements.at(-1)
    : y <= 0
      ? renderedElements[0]
      : renderedElements.find(item => y >= item.y && y <= item.y + item.height)

  if (!overViewLine) {
    throw new Error('程序出错')
  }

  const isOutOfContainer = !isPointInRect(point, {
    x: containerRect.x,
    y: containerRect.y,
    width: containerRect.width - scrollbarSize - 4,
    height: containerRect.height - scrollbarSize - 4,
  })
  const isOutOfViewLine = !isPointInRect({ x, y }, overViewLine)

  if (isOutOfContainer) {
    // 当前鼠标没在容器内部，让容器滚动
    emitter.emit('scrollbar:change', {
      x: scrollbarSize * 2 * (point.x > containerRect.x + containerRect.width - scrollbarSize ? 1 : point.x < containerRect.x ? -1 : 0),
      y: scrollbarSize * 2 * (point.y > containerRect.height - containerRect.y - scrollbarSize ? 1 : point.y < containerRect.y ? -1 : 0),
      action: 'scrollBy',
    })
  }

  if (isOutOfContainer || isOutOfViewLine) {
    let idx = elements.findIndex(item => overViewLine.id === item.id)
    if (idx === -1) {
      throw new Error('程序出错')
    }

    if (x < overViewLine.x) {
      // 选前面
      return {
        block: overViewLine.id,
        offset: 0,
      }
    }
    let block = elements[idx]
    while (elements[idx + 1]?.groupIds[0] === overViewLine.id) {
      block = elements[++idx]
    }

    return {
      block: block.id,
      offset: block.content.length,
    }
  }

  const { node, offset } = getBlockPositionByClick({
    x: point.x,
    y: point.y,
  })

  const block = getBlockIdByNode(node)

  return {
    block,
    offset,
  }
}

export class EditorSelection {
  #ctx: MarkdanContext
  #ranges = new Set<EditorSelectionRange>()
  #currentRange: EditorSelectionRange | null = null

  // 按住 alt 键点击了当前选区
  isClickCurrentWithAltKey = false

  constructor(ctx: MarkdanContext) {
    this.#ctx = ctx
  }

  get ranges() {
    return this.#ranges
  }

  get currentRange() {
    return this.#currentRange
  }

  get focusViewLine() {
    const currentRange = this.#currentRange
    if (!currentRange) {
      return undefined
    }
    const element = this.#ctx.schema.elements.find(e => e.id === currentRange.focusBlock)

    if (!element) {
      return undefined
    }

    return element.groupIds?.[0] ?? element.id
  }

  get isOnlyOneCollapsedRange() {
    const ranges = [...this.ranges]
    return ranges.length === 1 && ranges[0].isCollapsed
  }

  addRange(
    anchorBlock: EditorSelectionRange['anchorBlock'],
    anchorOffset: EditorSelectionRange['anchorOffset'],
    focusBlock = anchorBlock,
    focusOffset = anchorOffset,
  ) {
    const range = new EditorSelectionRange(anchorBlock, anchorOffset, focusBlock, focusOffset, this.#ctx)
    this.ranges.add(range)
    this.#currentRange = range

    this.#ctx.emitter.emit('selection:change', this.ranges)
  }

  setRange(
    focusBlock: EditorSelectionRange['focusBlock'],
    focusOffset: EditorSelectionRange['focusOffset'],
  ) {
    this.#currentRange?.setEnd(focusBlock, focusOffset)
    this.#ctx.emitter.emit('selection:change', this.ranges)
  }

  removeAllRanges() {
    this.ranges.clear()

    this.#ctx.emitter.emit('selection:change', this.ranges)
  }

  removeRange(range: EditorSelectionRange) {
    this.ranges.delete(range)

    this.#ctx.emitter.emit('selection:change', this.ranges)
  }

  /**
   * 1. 仅按住 alt 键时
   *    - 增加一个新选区操作；
   *    - 点击非当前选区时，删除该选区；
   *    - 点击当前选区时，将操作交给 move up，如果发生 move，则重选（以最小位置为起始点）。否则不处理;
   * 2. 同时按住 alt & shift 键，生成多选区（@todo - 暂时不做）
   * 3. 仅按住 shift 键时，修改当前选区的结束点
   * 4. 无 alt | shift 按键操作时，清空所有选区，新增一个选区
   */
  handleMouseDown(e: MouseEvent) {
    const keys = getModifierKeys(e)

    const { block, offset } = getMouseOverElement({
      x: e.clientX,
      y: e.clientY,
    }, this.#ctx)

    if (isOnlyAltKey(keys)) {
      const clickRange = this.#isClickRange(e)

      if (clickRange === this.#currentRange) {
        this.isClickCurrentWithAltKey = true
        return
      }
      if (clickRange) {
        this.removeRange(clickRange)
        return
      }

      this.addRange(block, offset)
      this.#ctx.interface.renderer.scrollIfCurrentRangeOutOfViewer()
    } else if (isOnlyShiftKey(e)) {
      if (this.#currentRange) {
        this.setRange(block, offset)
      } else {
        this.addRange(block, offset)
      }
      this.#ctx.interface.renderer.scrollIfCurrentRangeOutOfViewer()
    } else if (keys.includes('alt') && keys.includes('shift')) {
      // @todo 同时按住 alt & shift 键，生成多选区
      this.addRange(block, offset)
      this.#ctx.interface.renderer.scrollIfCurrentRangeOutOfViewer()
    } else {
      this.removeAllRanges()
      this.addRange(block, offset)
      this.#ctx.interface.renderer.scrollIfCurrentRangeOutOfViewer()
    }
  }

  handleMouseMove(e: MouseEvent) {
    if (!this.#currentRange) {
      return
    }

    const { block, offset } = getMouseOverElement({
      x: e.clientX,
      y: e.clientY,
    }, this.#ctx)

    if (this.isClickCurrentWithAltKey) {
      this.isClickCurrentWithAltKey = false

      const { anchorBlock, anchorOffset } = this.#currentRange

      this.removeRange(this.#currentRange)
      this.addRange(anchorBlock, anchorOffset, block, offset)
    } else {
      this.setRange(block, offset)
    }

    const ranges = this.#getIntersectionRanges()
    ranges.map((r) => {
      return this.removeRange(r)
    })
  }

  handleMouseUp(e: MouseEvent) {
    if (this.isClickCurrentWithAltKey) {
      this.isClickCurrentWithAltKey = false
      return
    }
    if (!this.#currentRange) {
      return
    }

    const { block, offset } = getMouseOverElement({
      x: e.clientX,
      y: e.clientY,
    }, this.#ctx)

    this.setRange(block, offset)
  }

  /**
   * 检测用户是否点击到了某个选区
   */
  #isClickRange(e: MouseEvent): EditorSelectionRange | false {
    const {
      config: {
        containerRect: {
          x,
          y,
        },
      },
      interface: {
        scrollbar: {
          scrollX,
          scrollY,
        },
      },
    } = this.#ctx

    const [left, top] = [
      e.clientX - x - scrollX,
      e.clientY - y - scrollY,
    ]

    const range = [...this.ranges].find((r) => {
      return (r.rectangles ?? []).some(rect => isPointInRect({ x: left, y: top }, rect))
    })

    return range ?? false
  }

  #getIntersectionRanges() {
    const currentRange = this.#currentRange
    const ranges = [...this.ranges].filter(r => r !== currentRange)

    const currentRectangles = currentRange?.rectangles || []

    if (currentRectangles.length === 0) return []

    return ranges.filter(({ rectangles }) => {
      return rectangles?.some(rect => EditorSelection.isRectIntersection(rect, currentRectangles))
    })
  }

  static isRectIntersection(rect1: Rectangle, rects: Rectangle[]): boolean {
    return rects.some((rect2) => {
      return (isRectCross(rect1, rect2) || isRectContainRect(rect1, rect2))
        && getIntersectionArea(rect1, rect2) > 1
    })
  }
}
