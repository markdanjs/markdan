import type { MarkdanViewBlock } from '@markdan/engine'
import type { MarkdanContext } from './index'

export function registerEventHandler(ctx: MarkdanContext) {
  function handleMouseDown(e: MouseEvent) {
    ctx.selection.handleMouseDown(e)

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  function handleMouseMove(e: MouseEvent) {
    ctx.selection.handleMouseMove(e)
  }

  function handleMouseUp(e: MouseEvent) {
    ctx.selection.handleMouseUp(e)

    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  ctx.emitter.on('blocks:change', (viewBlocks: MarkdanViewBlock[]) => {
    ctx.viewBlocks = viewBlocks
  })

  ctx.emitter.on('editor:mouse:down', handleMouseDown)
  ctx.emitter.on('editor:mouse:up', handleMouseUp)
}
