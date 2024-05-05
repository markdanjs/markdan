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

// export function renderBlockToDom(block: MarkdanRenderBlock, ctx: MarkdanContext): HTMLElement {
//   const oViewLine = document.createElement('div')
//   oViewLine.className = 'view-line'

//   oViewLine.setAttribute('data-id', block.id)
//   oViewLine.style.cssText = `top: ${block.top}px; height: ${block.height};`

//   if (block.content) {
//     oViewLine.textContent = block.content
//   }

//   if (isArray(block.children) && block.children.length) {
//     renderBlockChildren(block.children, oViewLine, ctx)
//   }

//   return oViewLine
// }

// export function renderBlockChildren(blocks: MarkdanViewBlock[], parentNode: HTMLElement, ctx: MarkdanContext) {
//   blocks.map((block) => {
//     const oEl = document.createElement('span')
//     oEl.setAttribute('data-id', block.id)

//     if (block.content) {
//       oEl.textContent = block.content
//     }

//     if (isArray(block.children) && block.children.length) {
//       renderBlockChildren(block.children, oEl, ctx)
//     }

//     parentNode.appendChild(oEl)

//     return null
//   })
// }
