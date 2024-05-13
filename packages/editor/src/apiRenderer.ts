import type { EditorSelectionRange, MarkdanContext, MarkdanSchemaElement } from '@markdan/core'
import type { MarkdanViewBlock } from '@markdan/engine'
import { parseRenderedElement } from 'packages/engine/src/render'

export function createRendererApi(el: HTMLElement, ctx: MarkdanContext) {
  return {
    render(_blocks: MarkdanViewBlock[]) {
      // @todo - 清除 HTML
      el.innerHTML = ''
      const domMapper = new Map([['root', el]])
      const viewLineElements = new Map<string, HTMLElement>()
      ctx.schema.elements.map((element) => {
        const oDom = renderElement(element, ctx)
        if (!element.groupIds.length) {
          oDom.className = 'view-line'
          domMapper.get('root')?.appendChild(oDom)

          viewLineElements.set(element.id, oDom)
        } else {
          domMapper.get(element.groupIds.at(-1)!)?.appendChild(oDom)
        }

        domMapper.set(element.id, oDom)

        return false
      })

      document.body.clientWidth // eslint-disable-line no-unused-expressions

      parseRenderedElement(viewLineElements, ctx)
    },
  }
}

export function renderElement(element: MarkdanSchemaElement, _ctx: MarkdanContext) {
  // @todo - 调用插件生成 Dom
  const oDom = document.createElement(element.groupIds.length ? 'span' : element.content === 'Heading 1' ? 'h1' : 'div')

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

  // const startIdx = elements.findIndex(el => el.id === startViewLineId)
}
