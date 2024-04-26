import { type MarkdanConfig, type MarkdanContext } from '@markdan/core'
import type { MarkdanViewBlock } from './view'

export interface MarkdanRenderBlock extends MarkdanViewBlock {
  top: number
  height: string
}

let top = 0

export function parseViewBlocks(viewBlocks: MarkdanViewBlock[], { config }: MarkdanContext) {
  const renderBlocks = viewBlocks.map(viewBlock => renderBlock(viewBlock, config))

  return renderBlocks
}

function renderBlock(viewBlock: MarkdanViewBlock, config: MarkdanConfig): MarkdanRenderBlock {
  const {
    style: { lineHeight },
  } = config

  // @todo - 设置了换行渲染

  return {
    ...viewBlock,
    top: (top += parseInt(lineHeight)),
    height: lineHeight,
  }
}
