import type { MarkdanContext, MarkdanSchema } from '@markdan/core'

import { parseSchema } from './view'
import { parseViewBlocks } from './render'

export function createEngineApi(ctx: MarkdanContext) {
  ctx.emitter.on('schema:change', (schema: MarkdanSchema) => {
    const viewBlocks = parseSchema(schema.elements)

    const renderBlocks = parseViewBlocks(viewBlocks, ctx)

    ctx.emitter.emit('blocks:change', viewBlocks, renderBlocks)
    ctx.emitter.emit('render', renderBlocks)
  })
}
