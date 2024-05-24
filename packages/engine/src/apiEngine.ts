import type { MarkdanContext } from '@markdan/core'

import { parseSchema } from './view'

export function createEngineApi(ctx: MarkdanContext) {
  ctx.emitter.on('schema:change', () => {
    const affectedViewLines = parseSchema(ctx)

    ctx.emitter.emit('blocks:change', ctx.viewBlocks)
    ctx.emitter.emit('render', affectedViewLines)
  })
}
