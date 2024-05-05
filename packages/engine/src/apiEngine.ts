import type { MarkdanContext, MarkdanSchema } from '@markdan/core'

import { parseSchema } from './view'

export function createEngineApi(ctx: MarkdanContext) {
  ctx.emitter.on('schema:change', (schema: MarkdanSchema) => {
    const viewBlocks = parseSchema(schema.elements)

    ctx.emitter.emit('blocks:change', viewBlocks)
    ctx.emitter.emit('render', viewBlocks)
  })
}
