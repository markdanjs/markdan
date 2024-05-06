import type { MarkdanContext, MarkdanSchemaElement } from '@markdan/core'
import type { MarkdanViewBlock } from '@markdan/engine'
import { parseRenderedElement } from 'packages/engine/src/render'

export function createRendererApi(el: HTMLElement, ctx: MarkdanContext) {
  return {
    render(_blocks: MarkdanViewBlock[]) {
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
