import type { EditorSelectionRange, MarkdanContext } from '@markdan/core'
import { amendTop, createElement, getRangePosition } from '@markdan/helper'
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
        scrollX,
        scrollY,
      },
    },
  } = ctx
  const cursorList = cursor?.querySelectorAll<HTMLElement>(`.${CLASS_NAMES.editorCursor}`) ?? []
  const rangeList = cursor?.querySelectorAll<HTMLElement>(`.${CLASS_NAMES.editorRange}`) ?? []

  cursorList.forEach((cursor) => {
    cursor.style.transform = `translate(${-scrollX}px, ${-scrollY}px)`
  })

  rangeList.forEach((range) => {
    range.style.transform = `translate(${-scrollX}px, ${-scrollY}px)`
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
        scrollX,
        scrollY,
      },
    },
  } = ctx
  const { left, top } = getRangePosition(blockId, offset, mainViewer)
  const viewLeft = left - x
  const viewTop = top - y

  // console.log({ left, top, x: left - scrollX, y: top - scrollY, viewTop, viewLeft })

  const viewLineId = elements.find(el => el.id === blockId)?.groupIds?.[0] ?? blockId
  const element = renderedElements.find(e => e.id === viewLineId)!
  // console.log({ viewTopScrollY: viewTop + scrollY, elY: element.y })

  const t = amendTop(viewTop + scrollY, element.y, element.lineHeight, element.height)

  const oCursor = createElement('div', { class: CLASS_NAMES.editorCursor })
  oCursor.style.cssText = `left: ${viewLeft + lineNumber.getBoundingClientRect().width + scrollX - 1}px;`
    + `top: ${t}px;`
    + `height: ${element.lineHeight}px;`
    + `transform: translate(${-scrollX}px, ${-scrollY}px)`

  cursor?.appendChild(oCursor)
}

/**
 * 渲染选区
 */
function renderRangeRectangles(range: EditorSelectionRange, ctx: MarkdanContext) {
  const {
    interface: {
      ui: { cursor, lineNumber },
      scrollbar: { scrollX, scrollY },
    },
  } = ctx
  const lineNumberWidth = lineNumber.getBoundingClientRect().width

  ;(range.rectangles ?? []).forEach((item) => {
    const oRange = document.createElement('div')
    oRange.classList.add(CLASS_NAMES.editorRange)
    oRange.style.cssText = `left: ${item.x + lineNumberWidth + scrollX}px;`
      + `top: ${item.y + scrollY}px;`
      + `width: ${Math.max(8, item.width)}px;`
      + `height: ${item.height}px;`
      + `transform: translate(${-scrollX}px, ${-scrollY}px)`

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
