import type { MarkdanViewBlock } from '@markdan/engine'
import type { ScrollBarType } from 'packages/editor/src/scrollbar'
import type { Point } from '@markdan/helper'
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

  let wheelStartPoint: Point = { x: 0, y: 0 }
  function handleEditorScroll(e: WheelEvent) {
    e.stopPropagation()
    e.preventDefault()

    const { deltaX, deltaY, clientX, clientY } = e

    if (deltaX !== 0 && deltaY !== 0) {
      // 触控板操作
      const diffX = Math.abs(clientX - wheelStartPoint.x)
      const diffY = Math.abs(clientY - wheelStartPoint.y)

      if (diffY > diffX) {
        ctx.interface.scrollbar.horizontal.scrollBy(deltaX)
      } else {
        ctx.interface.scrollbar.vertical.scrollBy(deltaY)
      }

      wheelStartPoint = { x: clientX, y: clientY }
    } else if (deltaX !== 0) {
      ctx.interface.scrollbar.horizontal.scrollBy(deltaX)
    } else if (deltaY !== 0) {
      ctx.interface.scrollbar.vertical.scrollBy(deltaY)
    }
  }

  function handleScrollBarChange(_position: number, type: ScrollBarType) {
    ctx.interface.mainViewer.style.transform = `translate(-${ctx.interface.scrollbar.scrollX}px, -${ctx.interface.scrollbar.scrollY}px)`

    if (type === 'vertical') {
      // @todo - 更新DOM渲染内容
    }

    // 更新选区位置
    ctx.emitter.emit('selection:change', ctx.selection.ranges)
  }

  ctx.emitter.on('blocks:change', (viewBlocks: MarkdanViewBlock[]) => {
    ctx.viewBlocks = viewBlocks
  })

  ctx.emitter.on('editor:mouse:down', handleMouseDown)
  ctx.emitter.on('editor:mouse:up', handleMouseUp)

  ctx.emitter.on('editor:scroll', handleEditorScroll)
  ctx.emitter.on('scrollbar:change', handleScrollBarChange)
}
