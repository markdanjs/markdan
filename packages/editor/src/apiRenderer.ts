import type { MarkdanContext } from '@markdan/core'
import type { MarkdanRenderBlock, MarkdanViewBlock } from '@markdan/engine'
import { isArray } from '@markdan/helper'

export function createRendererApi(el: HTMLElement, ctx: MarkdanContext) {
  return {
    render(blocks: MarkdanRenderBlock[]) {
      blocks.map((block) => {
        el.appendChild(renderBlockToDom(block, ctx))
        return null
      })
    },
  }
}

export function renderBlockToDom(block: MarkdanRenderBlock, ctx: MarkdanContext): HTMLElement {
  const oViewLine = document.createElement('div')
  oViewLine.className = 'view-line'

  oViewLine.setAttribute('data-id', block.id)
  oViewLine.style.cssText = `top: ${block.top}px; height: ${block.height};`

  if (block.content) {
    oViewLine.textContent = block.content
  }

  if (isArray(block.children) && block.children.length) {
    renderBlockChildren(block.children, oViewLine, ctx)
  }

  return oViewLine
}

export function renderBlockChildren(blocks: MarkdanViewBlock[], parentNode: HTMLElement, ctx: MarkdanContext) {
  blocks.map((block) => {
    const oEl = document.createElement('span')
    oEl.setAttribute('data-id', block.id)

    if (block.content) {
      oEl.textContent = block.content
    }

    if (isArray(block.children) && block.children.length) {
      renderBlockChildren(block.children, oEl, ctx)
    }

    parentNode.appendChild(oEl)

    return null
  })
}
