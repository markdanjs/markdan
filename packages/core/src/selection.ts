import { getBlockIdByNode, getBlockPositionByClick, getModifierKeys, isOnlyAltKey, isOnlyShiftKey, isPointInRect } from '@markdan/helper'
import type { MarkdanContext } from './apiCreateApp'

/**
 * Editor selection base on `viewBlocks`
 */
export interface EditorSelectionRange {
  uid: string
  anchorBlock: string
  anchorOffset: number
  focusBlock: string
  focusOffset: number
  _pos?: Array<{
    x: number
    y: number
    width: number
  }>
}

export class EditorSelection {
  #ctx: MarkdanContext
  #ranges = new Set<EditorSelectionRange>()
  #currentRange: EditorSelectionRange | null = null

  constructor(ctx: MarkdanContext) {
    this.#ctx = ctx
  }

  get ranges() {
    return this.#ranges
  }

  get uid() {
    return this.#ctx.config.uid
  }

  /**
   * Add range when mouse down
   */
  addRange(e: MouseEvent) {
    const keys = getModifierKeys(e)
    // 当前存在选区，按住 shift 键时为设置选区结束点
    if (this.#currentRange && isOnlyShiftKey(keys)) {
      this.setRange(e)
      return
    }

    if (isOnlyAltKey(keys)) {
      // 按住 alt 键执行多选：增加选区
      // 如果当前点击位置点击到某个选区，将会删除该选区（非 currentRange）
      const otherRange = this.#isClickRange(e)
      if (otherRange) {
        this.ranges.delete(otherRange)
        return
      }
    } else {
      // 单选：新增选区
      this.removeAllRanges()
      this.#currentRange = null
    }

    const { node, offset } = getBlockPositionByClick(e)

    const blockId = getBlockIdByNode(node)

    const range: EditorSelectionRange = {
      uid: this.uid,
      anchorBlock: blockId,
      anchorOffset: offset,
      focusBlock: blockId,
      focusOffset: offset,
    }
    this.ranges.add(range)
    this.#currentRange = range

    this.#ctx.emitter.emit('selection:change', this.ranges)
  }

  /**
   * Set range when mouse move or mouse up
   */
  setRange(e: MouseEvent) {
    if (!this.#currentRange) return
    // const keys = getModifierKeys(e)
    // if (isOnlyAltKey(keys)) {
    //   // 按住 alt 键执行多选：增加选区
    //   // 如果当前点击位置点击到某个选区，将会删除该选区（非 currentRange）
    //   const otherRange = this.#isClickRange(e)
    //   if (otherRange) {
    //     return
    //   }
    // }

    const { node, offset } = getBlockPositionByClick(e)
    // @todo - 在超出编辑器之后的 move 操作会报错
    const blockId = getBlockIdByNode(node)

    this.#currentRange.focusBlock = blockId
    this.#currentRange.focusOffset = offset

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

  isCollapse(range: EditorSelectionRange) {
    return range.anchorBlock === range.focusBlock
      && range.anchorOffset === range.focusOffset
  }

  /**
   * 检测用户是否点击到了某个选区
   */
  #isClickRange(e: MouseEvent): EditorSelectionRange | false {
    // const { node, offset } = getBlockPositionByClick(e)
    // const blockId = getBlockIdByNode(node)
    // const range = [...this.ranges].find(r => r.anchorBlock === blockId || r.focusBlock === blockId)

    const {
      config: {
        containerRect: {
          x,
          y,
        },
        style: { lineHeight },
      },
    } = this.#ctx

    const [left, top] = [
      e.clientX - x,
      e.clientY - y,
    ]

    const range = [...this.ranges].find((r) => {
      return r._pos!.some(p => isPointInRect({ left, top }, { height: parseInt(lineHeight), ...p }))
    })

    return range ?? false

    // if (!range) {
    //   return false
    // }

    // const { elements } = this.#ctx.schema
    // const [anchorIdx, focusIndex] = [
    //   elements.find(e => e.id === range.anchorBlock)!,
    //   elements.find(e => e.id === range.focusBlock)!,
    // ]

    // return anchorIdx <= focusIndex
    //   ? offset > range.anchorOffset
    //   : offset < range.focusOffset
    // console.log(this.ranges, blockId, offset, range)
    // return false
  }
}
