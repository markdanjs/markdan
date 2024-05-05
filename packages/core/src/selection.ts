import type { Rectangle } from '@markdan/helper'
import { amendTop, getBlockIdByNode, getBlockPositionByClick, getModifierKeys, getRangePosition, isMouseMoveOut, isOnlyAltKey, isOnlyShiftKey, isPointInRect } from '@markdan/helper'
import type { MarkdanViewBlock } from '@markdan/engine'
import type { MarkdanContext } from './apiCreateApp'

/**
 * Editor selection
 */
export interface EditorSelectionRange {
  uid: string
  anchorBlock: string
  anchorOffset: number
  focusBlock: string
  focusOffset: number
  _rectangles?: Rectangle[]
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

  get uid() {
    return this.#ctx.config.uid
  }

  addRange(
    anchorBlock: EditorSelectionRange['anchorBlock'],
    anchorOffset: EditorSelectionRange['anchorOffset'],
    focusBlock = anchorBlock,
    focusOffset = anchorOffset,
  ) {
    const range: EditorSelectionRange = {
      uid: this.uid,
      anchorBlock,
      anchorOffset,
      focusBlock,
      focusOffset,
    }
    this.ranges.add(range)
    this.#currentRange = range

    this.#setRangeRectangle()

    this.#ctx.emitter.emit('selection:change', this.ranges)
  }

  setRange(
    range: EditorSelectionRange,
    focusBlock: EditorSelectionRange['focusBlock'],
    focusOffset: EditorSelectionRange['focusOffset'],
  ) {
    range.focusBlock = focusBlock
    range.focusOffset = focusOffset
    this.#ctx.emitter.emit('selection:change', this.ranges)

    this.#setRangeRectangle()
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
   * 2. 同时按住 alt & shift 键，生成多选区（暂时不做）
   * 3. 仅按住 shift 键时，修改当前选区的结束点
   * 4. 无 alt | shift 按键操作时，清空所有选区，新增一个选区
   */
  handleMouseDown(e: MouseEvent) {
    const keys = getModifierKeys(e)
    const { node, offset } = getBlockPositionByClick(e)

    const block = getBlockIdByNode(node)
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
    } else if (isOnlyShiftKey(e)) {
      if (this.#currentRange) {
        this.setRange(this.#currentRange, block, offset)
      } else {
        this.addRange(block, offset)
      }
    } else if (keys.includes('alt') && keys.includes('shift')) {
      // @todo 同时按住 alt & shift 键，生成多选区
      this.addRange(block, offset)
    } else {
      this.removeAllRanges()
      this.addRange(block, offset)
    }
  }

  // @todo - range intersection
  handleMouseMove(e: MouseEvent) {
    if (!this.#currentRange) {
      return
    }

    if (isMouseMoveOut(this.#ctx.interface.mainViewer, e)) {
      const { block, offset } = this.#getPositionWhenMouseout(e)

      this.setRange(
        this.#currentRange,
        block,
        offset,
      )
      return
    }

    const { node, offset } = getBlockPositionByClick(e)

    const block = getBlockIdByNode(node)

    if (this.isClickCurrentWithAltKey) {
      this.isClickCurrentWithAltKey = false

      const { anchorBlock, anchorOffset } = this.#currentRange

      this.removeRange(this.#currentRange)
      this.addRange(anchorBlock, anchorOffset, block, offset)

      return
    }

    this.setRange(this.#currentRange, block, offset)
  }

  // @todo - range intersection
  handleMouseUp(e: MouseEvent) {
    if (this.isClickCurrentWithAltKey) {
      this.isClickCurrentWithAltKey = false
      return
    }
    if (!this.#currentRange) {
      return
    }

    if (isMouseMoveOut(this.#ctx.interface.mainViewer, e)) {
      const { block, offset } = this.#getPositionWhenMouseout(e)

      this.setRange(
        this.#currentRange,
        block,
        offset,
      )
      return
    }

    const { node, offset } = getBlockPositionByClick(e)

    const block = getBlockIdByNode(node)

    this.setRange(this.#currentRange, block, offset)
  }

  #setRangeRectangle() {
    const {
      config: {
        containerRect: {
          x,
          y,
        },
      },
      schema: { elements },
      interface: { mainViewer },
      renderedElements,
    } = this.#ctx

    const lineHeight = this.#ctx.config.style.lineHeight

    for (const range of this.ranges) {
      const rectangles: Rectangle[] = []
      if (EditorSelection.isCollapse(range)) {
        // 闭合选区无需渲染
        continue
      }
      const { anchorBlock, anchorOffset, focusBlock, focusOffset } = range

      const anchorBlockElement = elements.find(el => el.id === anchorBlock)!
      const focusBlockElement = elements.find(el => el.id === focusBlock)!

      const startViewLineId = anchorBlockElement.groupIds[0] ?? anchorBlock
      const endViewLineId = focusBlockElement.groupIds[0] ?? focusBlock

      const startViewLineRenderedElement = renderedElements.find(b => b.id === startViewLineId)!
      const endViewLineRenderedElement = renderedElements.find(b => b.id === endViewLineId)!

      let { left: startLeft, top: startTop } = getRangePosition(anchorBlock, anchorOffset, mainViewer)
      let { left: endLeft, top: endTop } = getRangePosition(focusBlock, focusOffset, mainViewer)

      startLeft = startLeft - x
      startTop = amendTop(startTop - y, startViewLineRenderedElement.y, lineHeight/** @todo - 这个值并不适用所有场景 */, startViewLineRenderedElement.height)

      endLeft = endLeft - x
      endTop = amendTop(endTop - y, endViewLineRenderedElement.y, lineHeight/** @todo - 这个值并不适用所有场景 */, endViewLineRenderedElement.height)

      if (startTop === endTop) {
        // 在同一行选取
        rectangles.push({
          x: Math.min(startLeft, endLeft),
          y: startTop,
          width: Math.abs(startLeft - endLeft),
          height: startViewLineRenderedElement.lineHeight,
        })
      } else {
        // 跨行选取
        const startViewLine = mainViewer.querySelector<HTMLElement>(`[data-id="${startViewLineId}"]`)!
        const endViewLine = mainViewer.querySelector<HTMLElement>(`[data-id="${endViewLineId}"]`)!

        let startViewLineRect = startViewLine.getBoundingClientRect()
        let endViewLineRect = endViewLine.getBoundingClientRect()

        let start
        let end

        if (startTop > endTop) {
          // 交换
          [startViewLineRect, endViewLineRect] = [endViewLineRect, startViewLineRect]
          start = {
            x: endLeft,
            y: endTop,
            width: startViewLineRect.width - endLeft,
            height: startViewLineRect.height,
          }
          end = {
            x: 0,
            y: startTop,
            width: startLeft,
            height: endViewLineRect.height,
          }
        } else {
          start = {
            x: startLeft,
            y: startTop,
            width: startViewLineRect.width - startLeft,
            height: startViewLineRect.height,
          }
          end = {
            x: 0,
            y: endTop,
            width: endLeft,
            height: endViewLineRect.height,
          }
        }

        start.width += 10 // 延长 10px 选择区
        rectangles.push(start, end)

        const [sIdx, eIdx] = [
          renderedElements.findIndex(b => b.id === startViewLine.dataset.id),
          renderedElements.findIndex(b => b.id === endViewLine.dataset.id),
        ]

        renderedElements
          .slice(Math.min(sIdx, eIdx) + 1, Math.max(sIdx, eIdx))
          .map(({ x, y, width, height }) => {
            rectangles.push({
              x,
              y,
              width: width + 10, // 延长 10px 选择区
              height,
            })

            return null
          })
      }

      range._rectangles = rectangles
    }
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
    } = this.#ctx

    const [left, top] = [
      e.clientX - x,
      e.clientY - y,
    ]

    const range = [...this.ranges].find((r) => {
      return (r._rectangles ?? []).some(rect => isPointInRect({ x: left, y: top }, rect))
    })

    return range ?? false
  }

  #getPositionWhenMouseout(e: MouseEvent) {
    const oMainViewer = this.#ctx.interface.mainViewer
    const { anchorBlock } = this.#currentRange!
    const el = this.#ctx.schema.elements.find(i => i.id === anchorBlock)
    if (!el) {
      throw new Error('Cannot find anchor block\'s element.')
    }
    const viewLine = el.groupIds[0] ?? anchorBlock

    const renderedElements = this.#ctx.renderedElements
    const viewLienRenderBlock = this.#ctx.renderedElements.find(b => b.id === viewLine)
    if (!viewLienRenderBlock) {
      throw new Error('Cannot find render block.')
    }

    const rect = oMainViewer.getBoundingClientRect()

    const tMin = viewLienRenderBlock.y
    const tMax = tMin + viewLienRenderBlock.height

    const top = e.clientY - rect.top
    const left = e.clientX - rect.left

    let focusBlock: EditorSelectionRange['focusBlock']
    let focusOffset = 0

    if (top < tMin) {
      // 往上选取
      focusBlock = (renderedElements.find(b => top >= b.y && top <= b.y + b.height) ?? renderedElements[0]).id
    } else if (top > tMax) {
      // 往下选取
      focusBlock = ([...renderedElements].reverse().find(b => top >= b.y && top <= b.y + b.height) ?? renderedElements.at(-1)!).id
    } else {
      // 当前行
      focusBlock = viewLine
    }

    // 鼠标位置超出编辑器右侧
    if (left >= rect.width) {
      let lastBlock: MarkdanViewBlock = this.#ctx.viewBlocks.find(b => b.id === focusBlock)!

      while (lastBlock.children?.length) {
        lastBlock = lastBlock.children.at(-1)!
      }
      focusOffset = lastBlock.content.length
    }

    return {
      block: focusBlock,
      offset: focusOffset,
    }
  }

  #isRangeIntersection(
    {
      anchorBlock: anchorBlock1,
      // anchorOffset: anchorOffset1,
      focusBlock: focusBlock1,
      // focusOffset: focusOffset1,
    }: EditorSelectionRange,
    {
      anchorBlock: anchorBlock2,
      // anchorOffset: anchorOffset2,
      focusBlock: focusBlock2,
      // focusOffset: focusOffset2,
    }: EditorSelectionRange,
  ) {
    const {
      schema: { elements },
    } = this.#ctx

    let [anchorIdx1, focusIdx1, anchorIdx2, focusIdx2] = Array(4)

    let i = elements.length - 1

    while (i >= 0) {
      const { id } = elements[i]

      id === anchorBlock1 && (anchorIdx1 = i)
      id === anchorBlock2 && (anchorIdx2 = i)
      id === focusBlock1 && (focusIdx1 = i)
      id === focusBlock2 && (focusIdx2 = i)

      if ([anchorIdx1, focusIdx1, anchorIdx2, focusIdx2].every(v => v !== undefined)) {
        break
      }
      i--
    }
  }

  static isCollapse(range: EditorSelectionRange) {
    return range.anchorBlock === range.focusBlock
      && range.anchorOffset === range.focusOffset
  }
}
