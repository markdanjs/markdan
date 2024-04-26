import type { EditorSelectionRange, MarkdanContext } from '@markdan/core'
import { CLASS_NAMES } from './config/dom.config'

let _el: HTMLElement | null
let _cursorWrapper: HTMLElement | null
const timer = new Set<NodeJS.Timer>()

function getPosition(blockId: string, offset: number, ctx: MarkdanContext) {
  const n = _el?.querySelector(`[data-id="${blockId}"]`)

  if (!n) {
    throw new Error(`Cannot find node by block id(${blockId})`)
  }

  const range = new Range()

  range.setStart(n.firstChild!, offset)
  range.setEnd(n.firstChild!, offset)

  const { left, top } = range.getBoundingClientRect()
  const { config: { containerRect: { x, y } } } = ctx

  return { left: left - x, top: top - y }
}

function getViewLine(blockId: string): HTMLElement {
  let n = _el?.querySelector(`[data-id="${blockId}"]`)

  if (!n) {
    throw new Error(`Cannot find node by block id(${blockId})`)
  }

  // 找到距离他最近的 view-line Node
  while (n && !(n as HTMLElement).classList.contains('view-line')) {
    n = n.parentNode as Element
  }

  return n as HTMLElement
}

function clear() {
  const cursorList = _cursorWrapper?.querySelectorAll(`.${CLASS_NAMES.editorCursor}`) ?? []
  const rangeList = _cursorWrapper?.querySelectorAll(`.${CLASS_NAMES.editorRange}`) ?? []

  cursorList.forEach((cursor) => {
    cursor.remove()
  })

  timer.forEach(t => clearInterval(t))

  rangeList.forEach((range) => {
    range.remove()
  })
}

function addCursor(blockId: string, offset: number, ctx: MarkdanContext) {
  const { left, top } = getPosition(blockId, offset, ctx)
  const oCursor = document.createElement('div')
  oCursor.classList.add(CLASS_NAMES.editorCursor, 'is-visible')

  oCursor.style.cssText = `left: ${left - 1}px; top: ${top}px;`

  const t = setInterval(() => {
    oCursor.classList.toggle('is-visible')
  }, 700)
  timer.add(t)

  _cursorWrapper?.appendChild(oCursor)
}

/**
 * 渲染选区
 */
function renderRange(range: EditorSelectionRange, ctx: MarkdanContext) {
  const { anchorBlock, anchorOffset, focusBlock, focusOffset } = range
  if (anchorBlock === focusBlock && anchorOffset === focusOffset) {
    // 闭合选区无需渲染
    return
  }

  const { left: startLeft, top: startTop } = getPosition(anchorBlock, anchorOffset, ctx)
  const { left: endLeft, top: endTop } = getPosition(focusBlock, focusOffset, ctx)

  const list = []

  if (startTop === endTop) {
    // 在同一行选取
    list.push({
      x: Math.min(startLeft, endLeft),
      y: startTop,
      width: Math.abs(startLeft - endLeft),
    })
  } else {
    // 跨行选取
    let startViewLine = getViewLine(anchorBlock)
    let endViewLine = getViewLine(focusBlock)

    let start
    let end

    if (startTop > endTop) {
      // 交换
      [startViewLine, endViewLine] = [endViewLine, startViewLine]
      start = {
        x: endLeft,
        y: endTop,
        width: startViewLine.getBoundingClientRect().width - endLeft,
      }
      end = {
        x: 0,
        y: startTop,
        width: startLeft,
      }
    } else {
      start = {
        x: startLeft,
        y: startTop,
        width: startViewLine.getBoundingClientRect().width - startLeft,
      }
      end = {
        x: 0,
        y: endTop,
        width: endLeft,
      }
    }

    list.push(start, end)

    const [sIdx, eIdx] = [
      ctx.renderBlocks.findIndex(b => b.id === startViewLine.dataset.id),
      ctx.renderBlocks.findIndex(b => b.id === endViewLine.dataset.id),
    ]
    const viewLineIds = ctx.renderBlocks.slice(sIdx + 1, eIdx).map(b => b.id)

    viewLineIds.map((id) => {
      const el = document.querySelector(`[data-id="${id}"]`)
      if (el) {
        const { top, width } = el.getBoundingClientRect()
        list.push({
          x: 0,
          y: top - ctx.config.containerRect.y,
          width,
        })
      }

      return null
    })
  }

  list.forEach((item) => {
    const oRange = document.createElement('div')
    oRange.classList.add(CLASS_NAMES.editorRange)
    oRange.style.cssText = `left: ${item.x}px; top: ${item.y}px; width: ${item.width}px`

    _cursorWrapper?.appendChild(oRange)
  })

  range._pos = list
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
        renderRange(range, ctx)
        addCursor(range.focusBlock, range.focusOffset, ctx)
      })
    },
  }
}
