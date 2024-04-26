import type { MarkdanRenderBlock, MarkdanViewBlock } from '@markdan/engine'
import type { MarkdanContext } from './index'

export function registerEventHandler(ctx: MarkdanContext) {
  function handleMouseDown(e: MouseEvent) {
    ctx.selection.addRange(e)

    document.addEventListener('mousemove', handleMouseMove)
  }

  function handleMouseMove(e: MouseEvent) {
    ctx.selection.setRange(e)
  }

  function handleMouseUp(e: MouseEvent) {
    ctx.selection.setRange(e)

    document.removeEventListener('mousemove', handleMouseMove)
  }

  ctx.emitter.on('blocks:change', (viewBlocks: MarkdanViewBlock[], renderBlocks: MarkdanRenderBlock[]) => {
    ctx.viewBlocks = viewBlocks
    ctx.renderBlocks = renderBlocks
  })

  ctx.emitter.on('editor:mouse:down', handleMouseDown)
  ctx.emitter.on('editor:mouse:up', handleMouseUp)
}
