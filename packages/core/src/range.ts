import { type Rectangle, amendTop, setOriginalRange } from '@markdan/helper'
import type { MarkdanContext } from './apiCreateApp'

export class EditorSelectionRange {
  #ctx: MarkdanContext
  #rectangles: Rectangle[] = []

  constructor(
    public anchorBlock: string,
    public anchorOffset: number,
    public focusBlock: string,
    public focusOffset: number,
    ctx: MarkdanContext,
  ) {
    this.#ctx = ctx
    this.setRangeRectangle()
  }

  get uid() {
    return this.#ctx.config.uid
  }

  get rectangles() {
    return this.#rectangles
  }

  get isCollapsed() {
    return this.anchorBlock === this.focusBlock
      && this.anchorOffset === this.focusOffset
  }

  /**
   * 闭合选区，删除选区中的内容，并更新选区位置
   */
  collapse() {
    const {
      schema,
      emitter,
    } = this.#ctx
    const elements = schema.elements

    let anchorIdx = elements.findIndex(el => el.id === this.anchorBlock)
    let focusIdx = elements.findIndex(el => el.id === this.focusBlock)
    let { anchorBlock, anchorOffset, focusBlock, focusOffset } = this

    if (anchorIdx === focusIdx) {
      const element = elements[anchorIdx]
      const minOffset = Math.min(anchorOffset, focusOffset)

      schema.replace({
        ...element,
        content: element.content.slice(0, minOffset) + element.content.slice(Math.max(anchorOffset, focusOffset)),
      }, element.id)

      this.setStart(this.anchorBlock, minOffset)
      this.setEnd(this.anchorBlock, minOffset)

      emitter.emit('schema:change')
      emitter.emit('selection:change', this.#ctx.selection.ranges)

      return
    }

    if (anchorIdx > focusIdx) {
      [anchorIdx, focusIdx] = [focusIdx, anchorIdx];
      [anchorBlock, focusBlock] = [focusBlock, anchorBlock];
      [anchorOffset, focusOffset] = [focusOffset, anchorOffset]
    }

    const anchorElement = elements[anchorIdx]
    const focusElement = elements[focusIdx]

    // 删掉 [anchor, focus] 区间中的所有 element
    // 补充一个新拼接好的 element
    // 更新 focus view-line 中，后面所有的 elements 的 groupIds
    const anchorParentId = anchorElement.groupIds?.[0] ?? anchorElement.id
    const focusParentId = focusElement.groupIds?.[0] ?? focusElement.id
    const tailElements = elements.filter((el, index) => focusParentId === el.groupIds[0] && index > focusIdx)
    tailElements.forEach((el) => {
      el.groupIds = [...new Set(el.groupIds.map((id) => {
        return id === focusParentId
          ? anchorParentId
          : id === focusElement.id
            ? anchorElement.id
            : id
      }))]
    })

    schema.replace({
      ...anchorElement,
      content: anchorElement.content.slice(0, anchorOffset) + focusElement.content.slice(focusOffset),
    }, anchorElement.id)
    schema.splice(
      anchorIdx + 1, focusIdx - anchorIdx + 1,
      ...tailElements,
    )

    this.setRange(anchorElement.id, anchorOffset, anchorElement.id, anchorOffset)

    emitter.emit('schema:change')
    emitter.emit('selection:change', this.#ctx.selection.ranges)
  }

  setStart(block: string, offset: number): EditorSelectionRange {
    this.anchorBlock = block
    this.anchorOffset = offset
    this.setRangeRectangle()
    return this
  }

  setEnd(block: string, offset: number): EditorSelectionRange {
    this.focusBlock = block
    this.focusOffset = offset
    this.setRangeRectangle()
    return this
  }

  setRange(anchorBlock: string, anchorOffset: number, focusBlock: string, focusOffset: number): EditorSelectionRange {
    this.anchorBlock = anchorBlock
    this.anchorOffset = anchorOffset
    this.focusBlock = focusBlock
    this.focusOffset = focusOffset
    this.setRangeRectangle()
    return this
  }

  setRangeRectangle() {
    if (this.isCollapsed) {
      // 闭合选区无需渲染
      this.#rectangles = []
      return
    }

    const {
      config: {
        containerRect: {
          x,
          y,
        },
      },
      schema: { elements },
      interface: {
        ui: { mainViewer },
        scrollbar: {
          scrollX,
          scrollY,
        },
      },
      renderedElements,
    } = this.#ctx

    let {
      anchorBlock,
      anchorOffset,
      focusBlock,
      focusOffset,
    } = this

    let aIdx = elements.findIndex(item => item.id === anchorBlock)
    let fIdx = elements.findIndex(item => item.id === focusBlock)
    if (aIdx > fIdx || (aIdx === fIdx && anchorOffset > focusOffset)) {
      // 交换
      [
        anchorBlock,
        anchorOffset,
        focusBlock,
        focusOffset,
        aIdx,
        fIdx,
      ] = [focusBlock, focusOffset, anchorBlock, anchorOffset, fIdx, aIdx]
    }

    const rectangles: Rectangle[] = []

    const anchorBlockElement = elements[aIdx]
    const focusBlockElement = elements[fIdx]

    const startViewLineId = anchorBlockElement.groupIds[0] ?? anchorBlock
    const endViewLineId = focusBlockElement.groupIds[0] ?? focusBlock

    const startViewLineRenderedElement = renderedElements.find(b => b.id === startViewLineId)!
    const endViewLineRenderedElement = renderedElements.find(b => b.id === endViewLineId)!

    const anchorDom = mainViewer.querySelector<HTMLElement>(`[data-id="${anchorBlock}"]`)
    const focusDom = mainViewer.querySelector<HTMLElement>(`[data-id="${focusBlock}"]`)

    // 在同一行选取
    if (startViewLineId === endViewLineId) {
      if (anchorDom) {
        const originalRange = new Range()

        setOriginalRange(originalRange, anchorDom, anchorOffset)

        let { left: startLeft, top: startTop } = (anchorDom.firstChild?.textContent?.length ?? 0) === 0
          ? anchorDom.getBoundingClientRect()
          : originalRange.getBoundingClientRect()

        setOriginalRange(originalRange, focusDom!, focusOffset)

        let { left: endLeft } = (focusDom!.firstChild?.textContent?.length ?? 0) === 0
          ? focusDom!.getBoundingClientRect()
          : originalRange.getBoundingClientRect()

        startLeft = startLeft - x
        startTop = amendTop(startTop - y, startViewLineRenderedElement.y - scrollY, startViewLineRenderedElement.lineHeight, startViewLineRenderedElement.height)

        endLeft = endLeft - x

        rectangles.push({
          x: startLeft,
          y: startTop,
          width: Math.abs(startLeft - endLeft),
          height: startViewLineRenderedElement.lineHeight,
        })
      }

      this.#rectangles = rectangles
      return
    }

    // 跨行选取
    const originalRange = new Range()
    const startViewLine = mainViewer.querySelector<HTMLElement>(`[data-id="${startViewLineId}"]`)!
    const endViewLine = mainViewer.querySelector<HTMLElement>(`[data-id="${endViewLineId}"]`)!

    let start
    let end

    if (anchorDom) {
      setOriginalRange(originalRange, anchorDom, anchorOffset, 'Start')
      originalRange.setEnd(startViewLine, startViewLine.childNodes.length)

      const startRect = (anchorDom.firstChild?.textContent?.length ?? 0) === 0
        ? anchorDom.getBoundingClientRect()
        : originalRange.getBoundingClientRect()

      start = {
        x: startRect.x - x,
        y: startViewLineRenderedElement.y - scrollY,
        width: startRect.width,
        height: startViewLineRenderedElement.height,
      }
    }

    if (focusDom) {
      setOriginalRange(originalRange, focusDom, focusOffset, 'End')
      originalRange.setStart(endViewLine, 0)

      const endRect = (focusDom.firstChild?.textContent?.length ?? 0) === 0
        ? focusDom.getBoundingClientRect()
        : originalRange.getBoundingClientRect()

      end = {
        x: endRect.x - x,
        y: endViewLineRenderedElement.y - scrollY,
        width: endRect.width,
        height: endViewLineRenderedElement.height,
      }
    }

    if (start) {
      start.width = Math.max(10, start.width + 10) // 延长 10px 选择区
      rectangles.push(start)
    }
    if (end) {
      end.width = Math.max(10, end.width)
      rectangles.push(end)
    }

    const [sIdx, eIdx] = [
      renderedElements.findIndex(b => b.id === startViewLineRenderedElement.id),
      renderedElements.findIndex(b => b.id === endViewLineRenderedElement.id),
    ]

    renderedElements
      .slice(Math.min(sIdx, eIdx) + 1, Math.max(sIdx, eIdx))
      .map(({ x, y, width, height }) => {
        rectangles.push({
          x: x - scrollX,
          y: y - scrollY,
          width: width + 10, // 延长 10px 选择区
          height,
        })

        return null
      })
    // }

    this.#rectangles = rectangles
  }
}
