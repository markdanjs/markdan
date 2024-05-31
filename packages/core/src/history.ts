import { debounce } from '@markdan/helper'
import type { EditorSelectionRange, MarkdanContext, MarkdanSchemaElement } from '.'

export type HistoryAction = 'add' | 'change' | 'delete'

export interface HistoryRecordItem {
  action: HistoryAction
  element: MarkdanSchemaElement
  oldElement?: MarkdanSchemaElement
  /**
   * - 当 action 为 'add' 时，这个就是 element 前面的元素的 index
   * - 当 action 为 'delete' 时，这个就是 element 当时被截取时开始的 index，加上 offset 才是真实的 index 值
   */
  index?: number
  /**
   * delete 时的 index 与 offset
   * ```js
   * elements.slice(start, start + deleteCount).forEach((element, index) => {})
   * ```
   * - HistoryRecordItem.index === start
   * - HistoryRecordItem.offset === index
   */
  offset?: number
  ranges: Pick<EditorSelectionRange, 'id' | 'anchorBlock' | 'anchorOffset' | 'focusBlock' | 'focusOffset'>[]
  currentRangeId?: EditorSelectionRange['id']
}

interface EditorHistoryStack {
  records: HistoryRecordItem[]
  ranges: Pick<EditorSelectionRange, 'id' | 'anchorBlock' | 'anchorOffset' | 'focusBlock' | 'focusOffset'>[]
  currentRangeId?: EditorSelectionRange['id']
}

/**
 * 记录 schema 和 selection 的变化
 */
export class EditorHistory {
  #ctx: MarkdanContext

  #stacks: EditorHistoryStack[] = []

  #tempRecords: HistoryRecordItem[] = []

  #freeStacks: EditorHistoryStack[] = []

  currentIndex = -1

  /** 收集记录间隔 */
  duration = 200

  created = false

  constructor(ctx: MarkdanContext, duration = 200) {
    this.#ctx = ctx
    this.duration = duration
  }

  get stacks() {
    return this.#stacks
  }

  init() {
    if (this.created) return
    // 初始化 - 必须保留一个空行
    const ctx = this.#ctx
    const element = ctx.schema.createElement('paragraph', [], '')

    ctx.schema.append(element)
    ctx.selection.addRange(element.id, 0, element.id, 0, false)
    ctx.emitter.emit('schema:change')
    ctx.emitter.emit('selection:change', this.#ctx.selection.ranges)
    this.created = true
  }

  #collect = debounce(() => {
    this.stacks.push({
      records: this.#tempRecords,
      ranges: [...this.#ctx.selection.ranges.values()].map(({ id, anchorBlock, anchorOffset, focusBlock, focusOffset }) => ({ id, anchorBlock, anchorOffset, focusBlock, focusOffset })),
      currentRangeId: this.#ctx.selection.currentRange?.id,
    })
    this.currentIndex = this.stacks.length - 1
    this.#tempRecords = []
  }, this.duration, false)

  record(records: HistoryRecordItem[] = []): EditorHistory {
    this.#freeStacks.length = 0

    this.#tempRecords = this.#tempRecords.concat(records)
    this.#collect()

    return this
  }

  undo() {
    if (this.currentIndex > 0) {
      const stack = this.stacks.pop()!
      this.currentIndex--
      this.#freeStacks.unshift(stack)

      const { schema, emitter, selection } = this.#ctx
      const { records } = stack

      schema.setTrace(false)

      let i = records.length - 1

      while (i >= 0) {
        const record = records[i]

        switch (record.action) {
          case 'add':
            schema.splice(record.index! + 1, 1)
            break
          case 'change':
            schema.replace(record.oldElement!, record.element.id)
            break
          case 'delete':
            schema.splice(record.index!, 0, record.element)
            break
        }

        i--
      }

      selection.removeAllRanges()
      const { ranges, currentRangeId } = records[0]
      ranges.forEach((item) => {
        const range = selection.addRange(item.anchorBlock, item.anchorOffset, item.focusBlock, item.focusOffset, false)
        range.id = item.id

        if (currentRangeId) {
          selection.currentRange = range
        }
      })

      schema.setTrace(true)

      emitter.emit('schema:change')
      emitter.emit('selection:change', this.#ctx.selection.ranges)
    }

    return this
  }

  redo() {
    if (this.#freeStacks.length > 0) {
      const {
        schema,
        selection,
        emitter,
      } = this.#ctx

      const stack = this.#freeStacks.shift()!
      const { records, ranges, currentRangeId } = stack

      schema.setTrace(false)
      records.forEach((record) => {
        switch (record.action) {
          case 'add':
            schema.splice(record.index! + 1, 0, record.element)
            break
          case 'change':
            schema.replace(record.element, record.oldElement!.id)
            break
          case 'delete':
            schema.splice(record.index! - record.offset! + 1, 1)
            break
        }
      })

      selection.removeAllRanges()

      ranges.forEach((item) => {
        const range = selection.addRange(item.anchorBlock, item.anchorOffset, item.focusBlock, item.focusOffset, false)
        range.id = item.id

        if (currentRangeId) {
          selection.currentRange = range
        }
      })

      this.#stacks.push(stack)
      this.currentIndex++

      schema.setTrace(true)

      emitter.emit('schema:change')
      emitter.emit('selection:change', this.#ctx.selection.ranges)
    }
    return this
  }
}
