import type { EditorSelectionRange, MarkdanContext, MarkdanSchemaElement } from '@markdan/core'
import type { AffectedViewLine, MarkdanViewBlock } from '@markdan/engine'
import { patchRenderedElements } from '@markdan/engine'
import { CLASS_NAMES } from './config/dom.config'

export interface EditorRenderer {
  render(affectedViewLines: Set<AffectedViewLine>): void
  virtualScrollRender(): void
  onScroll(options: ScrollEventOptions): void
  scrollIfCurrentRangeOutOfViewer(): void
}

export interface ScrollEventOptions {
  x?: number
  y?: number
  action?: 'scroll' | 'scrollBy'
}

function getIndexes(elements: Array<{ y: number } & Record<any, any>>, min: number, max: number) {
  let minIndex = -1
  let maxIndex = -1

  elements.some(({ y }, index) => {
    if (minIndex === -1 && y >= min) {
      minIndex = index

      return false
    }
    if (y <= max && y > maxIndex) {
      maxIndex = index
      return false
    }
    return true
  })

  return [minIndex, maxIndex]
}

export function createRendererApi(el: HTMLElement, ctx: MarkdanContext): EditorRenderer {
  return {
    render(affectedViewLines: Set<AffectedViewLine>) {
      const {
        renderedElements,
        interface: {
          ui: { mainViewer },
        },
        viewBlocks,
      } = ctx
      const viewLineElements = new Set<[HTMLElement | null, ...AffectedViewLine]>()

      affectedViewLines.forEach(([viewLineId, behavior, previewId]) => {
        if (behavior === 'delete') {
          viewLineElements.add([null, viewLineId, behavior, previewId])
          return
        }

        const el = renderedElements.find(el => el.id === viewLineId)
        if (el) {
          el.element.remove()
          // @todo - diff
        }
        const viewBlock = viewBlocks.find(el => el.id === viewLineId)
        if (!viewBlock) {
          throw new Error('view blocks 结构错误')
        }

        const oContainer = renderElement(viewBlock, ctx)
        oContainer.className = 'view-line'
        mainViewer.appendChild(oContainer)
        if (viewBlock.children?.length) {
          renderChildren(viewBlock.children, oContainer, ctx)
        }
        viewLineElements.add([oContainer, viewBlock.id, behavior, previewId])
      })

      document.body.clientWidth // eslint-disable-line no-unused-expressions
      patchRenderedElements(viewLineElements, ctx)
      this.virtualScrollRender()
    },

    virtualScrollRender() {
      const {
        config: {
          containerRect: {
            height,
          },
        },
        interface: {
          scrollbar: { scrollY },
        },
        renderedElements,
      } = ctx

      const bufferSize = 2

      let [minIndex, maxIndex] = getIndexes(renderedElements, scrollY, scrollY + height)
      minIndex = Math.max(0, minIndex - bufferSize)
      maxIndex = Math.min(renderedElements.length, maxIndex + bufferSize)

      const elements = renderedElements.slice(minIndex, maxIndex)
      el.innerHTML = ''
      el.style.paddingTop = `${elements[0]?.y ?? 0}px`

      elements.map((element) => {
        el.appendChild(element.element)
        element.element.style.top = `${element.y}px`
        // 设置容器最大的宽度
        ctx.config.maxWidth = Math.max(ctx.config.maxWidth, element.width)

        return false
      })
    },

    onScroll({ x, y, action }: ScrollEventOptions) {
      if (x === undefined && y === undefined) {
        // 由滚动条内部发起的事件
      } else {
        ctx.interface.scrollbar[action === 'scrollBy' ? 'scrollBy' : 'scroll'](x, y)
      }

      const {
        interface: {
          scrollbar: {
            scrollX,
            scrollY,
            prevScrollY,
          },
        },
      } = ctx

      if (prevScrollY !== scrollY) {
        this.virtualScrollRender()
      }

      ctx.interface.ui.mainViewer.style.transform = `translate(-${scrollX}px, -${scrollY}px)`
      ctx.interface.ui.lineNumber.querySelector<HTMLElement>(`.${CLASS_NAMES.editorLineNumber}`)!.style.transform = `translateY(-${scrollY}px)`
    },

    scrollIfCurrentRangeOutOfViewer() {
      const {
        selection: { currentRange },
        config: {
          containerRect: { x, y, width, height },
          style: { lineHeight },
        },
      } = ctx

      if (!currentRange?.isCollapsed) return

      const oRange = ctx.interface.ui.cursor.querySelector<HTMLElement>(`[data-anchor-block="${currentRange.anchorBlock}"][data-anchor-offset="${currentRange.anchorOffset}"][data-focus-block="${currentRange.focusBlock}"][data-focus-offset="${currentRange.focusOffset}"]`)

      if (!oRange) return

      const rect = oRange.getBoundingClientRect()

      const left = rect.left - x + 1
      const top = rect.top - y

      ctx.emitter.emit('scrollbar:change', {
        x: left > width ? (left - width) : left < 0 ? left : 0,
        y: top > height - lineHeight ? lineHeight : top < 0 ? top : 0,
        action: 'scrollBy',
      })
    },
  }
}

function renderChildren(viewBlocks: MarkdanViewBlock[], container: HTMLElement, ctx: MarkdanContext) {
  for (let i = 0; i < viewBlocks.length; i++) {
    const el = renderElement(viewBlocks[i], ctx)
    container.appendChild(el)

    if (viewBlocks[i].children) {
      renderChildren(viewBlocks[i].children!, el, ctx)
    }
  }
}

export function renderElement(element: MarkdanSchemaElement, _ctx: MarkdanContext) {
  // @todo - 调用插件生成 Dom
  const oDom = document.createElement(element.groupIds.length ? 'span' : 'div')

  oDom.setAttribute('data-id', element.id)

  if (element.content) {
    oDom.textContent = element.content
  }

  return oDom
}

type ValueScope =
  | 'All'
  | 'ViewLine'
  | 'Range'
/**
 * 获取编辑器内容
 */
export function getValue(ctx: MarkdanContext, scope: 'ViewLine', startViewLineId: string, endViewLineId?: string): string
export function getValue(ctx: MarkdanContext, scope: 'Range', ranges: EditorSelectionRange[]): string
export function getValue(ctx: MarkdanContext, scope: 'All'): string
export function getValue(ctx: MarkdanContext, scope: ValueScope, ...args: any[]): string {
  switch (scope) {
    case 'ViewLine':
      return getValueByViewLine(ctx, args[0], args[1])
    case 'Range':
      return ''
    case 'All':
    default:
      return ''
  }
}

function getValueByViewLine(ctx: MarkdanContext, startViewLineId: string, endViewLineId?: string): string {
  // @todo - 调用插件解析内容
  const {
    schema: {
      elements,
    },
  } = ctx
  const startElements = elements.filter(el => el.id === startViewLineId || el.groupIds[0] === startViewLineId)
  if (startElements.length === 0) return ''

  const startValue = startElements.reduce((acc, element) => {
    return `${acc}${element.content}`
  }, '')

  if (!endViewLineId) return startValue

  const endElements = elements.filter(el => el.id === startViewLineId || el.groupIds[0] === startViewLineId)

  const endValue = endElements.reduce((acc, element) => {
    return `${acc}${element.content}`
  }, '')

  const startIdx = elements.findIndex(el => el === startElements[0])
  const endIdx = elements.findIndex(el => el === endElements[0])

  const middleElements = elements.slice(
    startIdx > endIdx ? elements.findIndex(el => el === endElements.at(-1)) : elements.findIndex(el => el === startElements.at(-1)),
    startIdx > endIdx ? startIdx : endIdx,
  )
  const middleValue = middleElements.reduce((acc, element) => {
    return `${acc}${element.content}`
  }, '')

  if (startIdx > endIdx) {
    return `${endValue}${middleValue}${startValue}`
  }

  return `${startValue}${middleValue}${endValue}`
}
