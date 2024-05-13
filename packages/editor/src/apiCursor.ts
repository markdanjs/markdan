import type { EditorSelectionRange, MarkdanContext } from '@markdan/core'
import { amendTop, getRangePosition } from '@markdan/helper'
import { CLASS_NAMES } from './config/dom.config'

let _el: HTMLElement | null
let _cursorWrapper: HTMLElement | null

function clear() {
  const cursorList = _cursorWrapper?.querySelectorAll(`.${CLASS_NAMES.editorCursor}`) ?? []
  const rangeList = _cursorWrapper?.querySelectorAll(`.${CLASS_NAMES.editorRange}`) ?? []

  cursorList.forEach((cursor) => {
    cursor.remove()
  })

  rangeList.forEach((range) => {
    range.remove()
  })
}

function addCursor(blockId: string, offset: number, el: HTMLElement, ctx: MarkdanContext) {
  const {
    config: {
      containerRect: {
        x,
        y,
      },
    },
    schema: { elements },
    renderedElements,
    interface: {
      scrollbar: {
        scrollY,
      },
    },
  } = ctx
  const { left, top } = getRangePosition(blockId, offset, el)
  // console.log(getRangePosition(blockId, offset, el))

  const oCursor = document.createElement('div')
  oCursor.classList.add(CLASS_NAMES.editorCursor)

  const blockElement = elements.find(el => el.id === blockId)!

  const viewLineId = blockElement.groupIds[0] ?? blockId

  const element = renderedElements.find(e => e.id === viewLineId)!

  const t = amendTop(top - y, element.y - scrollY, element.lineHeight, element.height)

  oCursor.style.cssText = `left: ${left - x - 1}px; top: ${t}px; height: ${element.lineHeight}px;`

  _cursorWrapper?.appendChild(oCursor)
}

/**
 * 渲染选区
 */
function renderRangeRectangles(range: EditorSelectionRange) {
  (range.rectangles ?? []).forEach((item) => {
    const oRange = document.createElement('div')
    oRange.classList.add(CLASS_NAMES.editorRange)
    oRange.style.cssText = `left: ${item.x}px; top: ${item.y}px; width: ${Math.max(8, item.width)}px; height: ${item.height}px;`

    _cursorWrapper?.appendChild(oRange)
  })
}

export function createCursorApi(el: HTMLElement, cursorWrapper: HTMLElement, ctx: MarkdanContext) {
  _el = el
  _cursorWrapper = cursorWrapper

  return {
    _el,
    _cursorWrapper,

    addCursor: (ranges: Set<EditorSelectionRange>) => {
      clear()

      ranges.forEach((range) => {
        range.setRangeRectangle()
        addCursor(range.focusBlock, range.focusOffset, el, ctx)
        renderRangeRectangles(range)
      })
    },
  }
}
