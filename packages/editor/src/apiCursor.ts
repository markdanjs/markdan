import type { EditorSelectionRange, MarkdanContext } from '@markdan/core'
import { amendTop, getRangePosition } from '@markdan/helper'
import { CLASS_NAMES } from './config/dom.config'

export interface EditorCursorApi {
  addCursor: (ranges: Set<EditorSelectionRange>) => void
  onScroll(): void
}

function clear(ctx: MarkdanContext) {
  const {
    interface: {
      ui: {
        cursor,
      },
    },
  } = ctx
  const cursorList = cursor?.querySelectorAll(`.${CLASS_NAMES.editorCursor}`) ?? []
  const rangeList = cursor?.querySelectorAll(`.${CLASS_NAMES.editorRange}`) ?? []

  cursorList.forEach((cursor) => {
    cursor.remove()
  })

  rangeList.forEach((range) => {
    range.remove()
  })
}

function handleScroll(ctx: MarkdanContext) {
  const {
    interface: {
      ui: {
        cursor,
      },
      scrollbar: {
        horizontal,
        vertical,
      },
    },
  } = ctx
  const cursorList = cursor?.querySelectorAll<HTMLElement>(`.${CLASS_NAMES.editorCursor}`) ?? []
  const rangeList = cursor?.querySelectorAll<HTMLElement>(`.${CLASS_NAMES.editorRange}`) ?? []

  const x = horizontal.currentPosition
  const y = vertical.currentPosition

  cursorList.forEach((cursor) => {
    cursor.style.transform = `translate(${-x}px, ${-y}px)`
  })

  rangeList.forEach((range) => {
    range.style.transform = `translate(${-x}px, ${-y}px)`
  })
}

function addCursor(blockId: string, offset: number, ctx: MarkdanContext) {
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
      ui: {
        mainViewer,
        lineNumber,
        cursor,
      },
      scrollbar: {
        scrollY,
      },
    },
  } = ctx
  const { left, top } = getRangePosition(blockId, offset, mainViewer)

  const oCursor = document.createElement('div')
  oCursor.classList.add(CLASS_NAMES.editorCursor)

  const blockElement = elements.find(el => el.id === blockId)!

  const viewLineId = blockElement.groupIds[0] ?? blockId

  const element = renderedElements.find(e => e.id === viewLineId)!

  const t = amendTop(top - y, element.y - scrollY, element.lineHeight, element.height)

  oCursor.style.cssText = `left: ${left + lineNumber.getBoundingClientRect().width - x - 1}px; top: ${t}px; height: ${element.lineHeight}px;`

  cursor?.appendChild(oCursor)
}

/**
 * 渲染选区
 */
function renderRangeRectangles(range: EditorSelectionRange, ctx: MarkdanContext) {
  const {
    interface: {
      ui: { cursor, lineNumber },
    },
  } = ctx
  const lineNumberWidth = lineNumber.getBoundingClientRect().width

  ;(range.rectangles ?? []).forEach((item) => {
    const oRange = document.createElement('div')
    oRange.classList.add(CLASS_NAMES.editorRange)
    oRange.style.cssText = `left: ${item.x + lineNumberWidth}px; top: ${item.y}px; width: ${Math.max(8, item.width)}px; height: ${item.height}px;`

    cursor?.appendChild(oRange)
  })
}

export function createCursorApi(ctx: MarkdanContext): EditorCursorApi {
  return {
    addCursor: (ranges: Set<EditorSelectionRange>) => {
      clear(ctx)

      ranges.forEach((range) => {
        range.setRangeRectangle()
        addCursor(range.focusBlock, range.focusOffset, ctx)
        renderRangeRectangles(range, ctx)
      })
    },

    onScroll() {
      handleScroll(ctx)
    },
  }
}
