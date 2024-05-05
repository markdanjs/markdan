import { type MarkdanContext } from '@markdan/core'
import { type Rectangle } from '@markdan/helper'

export interface MarkdanRenderedElement extends Rectangle {
  id: string
  lineHeight: number
  element: HTMLElement
}

export function parseRenderedElement(elements: Map<string, HTMLElement>, ctx: MarkdanContext): MarkdanRenderedElement[] {
  const {
    config: {
      containerRect: {
        x,
        y,
      },
      style: {
        lineHeight,
      },
    },
  } = ctx

  const renderElements = [...elements.entries()].map(([id, element]) => {
    const { width, height, left, top } = element.getBoundingClientRect()
    if (element.textContent === 'Heading 1') {
      return {
        id,
        x: left - x,
        y: top - y,
        width,
        height,
        lineHeight: 44,
        element,
      }
    }

    return {
      id,
      x: left - x,
      y: top - y,
      width,
      height,
      lineHeight,
      element,
    }
  })

  // @todo - 过滤已存在元素
  ctx.renderedElements = renderElements

  return renderElements
}

// export function parseViewBlocks(viewBlocks: MarkdanViewBlock[], { config }: MarkdanContext) {
//   const renderBlocks = viewBlocks.map(viewBlock => renderBlock(viewBlock, config))

//   return renderBlocks
// }

// function renderBlock(viewBlock: MarkdanViewBlock, config: MarkdanConfig): MarkdanRenderBlock {
//   const {
//     style: { lineHeight },
//   } = config

//   // @todo - 设置了换行渲染

//   const renderBlock = {
//     ...viewBlock,
//     top,
//     height: lineHeight,
//   }
//   top += parseInt(lineHeight)

//   return renderBlock
// }
