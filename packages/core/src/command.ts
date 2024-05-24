import { createRandomId } from '@markdan/helper'
import type { MarkdanContext, MarkdanSchemaElement } from '.'

export interface MarkdanCommand {
  registerCommand(name: string, command: CommandHandler): Command
  executeCommand(cmdName: string, ...args: any[]): void
}

export type CommandHandler = (...args: any[]) => any

class Command {
  static DEFAULT = 'default'
  static UNAVAILABLE = 'unavailable'
  static EXECUTED = 'executed'

  constructor(protected name: string, protected command: CommandHandler) {}

  getState() {}

  execute(ctx: MarkdanContext, ...args: any[]) {
    return this.command(ctx, ...args)
  }
}

export function createCommandApi(ctx: MarkdanContext): MarkdanCommand {
  const commands = new Map<string, Command>()

  return {
    registerCommand(name: string, command: CommandHandler) {
      if (commands.has(name)) {
        throw new Error(`Command '${name}' is already exists.`)
      }
      const cmd = new Command(name, command)
      commands.set(name, cmd)

      return cmd
    },

    executeCommand(cmdName: string, ...args: any[]) {
      const command = commands.get(cmdName)
      if (!command) {
        throw new Error(`Command '${command}' it not exists.`)
      }
      // if (!command.getState()) {
      //   //
      // }
      command.execute(ctx, ...args)
    },
  }
}

/**
 * 删除选区内容
 */
export function deleteContentCommand(ctx: MarkdanContext) {
  const { schema } = ctx
  const { elements } = schema
  ctx.selection.ranges.forEach((range) => {
    if (!range.isCollapsed) {
      range.collapse()
    } else {
      const { anchorBlock, anchorOffset } = range
      const idx = elements.findIndex(el => el.id === anchorBlock)
      if (idx === -1) {
        throw new Error('获取选区元素失败')
      }
      const element = elements[idx]

      if (anchorOffset !== 0) {
        schema.splice(idx, 1, {
          ...elements[idx],
          content: `${element.content.slice(0, anchorOffset - 1)}${element.content.slice(anchorOffset)}`,
        })

        range.setRange(anchorBlock, anchorOffset - 1, anchorBlock, anchorOffset - 1)
      } else {
        if (idx === 0) return

        // 删除前一个元素的最后一个字符，并且把当前元素以及它的后代都增加一项父级
        let prevElementIdx = idx - 1
        let prevElement = elements[prevElementIdx]
        while (prevElement.content === '' && prevElementIdx >= 0) {
          prevElement = elements[--prevElementIdx]
        }

        const prevElementContentLength = prevElement.content.length

        schema.splice(prevElementIdx, 1, {
          ...prevElement,
          content: `${prevElement.content.slice(0, -1)}${element.content.slice(anchorOffset)}`,
        })

        range.setRange(prevElement.id, prevElementContentLength - 1, prevElement.id, prevElementContentLength - 1)

        schema.splice(prevElementIdx + 1, idx - (prevElementIdx + 1) + 1)
      }
    }
  })

  ctx.emitter.emit('schema:change')
  ctx.emitter.emit('selection:change', ctx.selection.ranges)
}

/**
 * 换行
 */
export function breakLineCommand(ctx: MarkdanContext) {
  // 删除选区内容
  ctx.selection.ranges.forEach((range) => {
    if (!range.isCollapsed) {
      range.collapse()
    }
  })

  // 拆分成两行
  const { schema } = ctx
  const { elements } = schema

  ctx.selection.ranges.forEach((range) => {
    // 新起行继承原行的所有父级信息
    const idx = elements.findIndex(el => el.id === range.anchorBlock)
    if (idx === -1) {
      throw new Error('获取选区位置元素失败')
    }
    const {
      id,
      content,
      groupIds,
    } = elements[idx]

    const parentId = groupIds?.[0] ?? id
    const tailElements = elements.filter((el, index) => index > idx && el.groupIds[0] === parentId)

    if (content.slice(range.focusOffset) === '' && tailElements.length === 0) {
      // 后面内容为空，直接起一个新行
      schema.splice(idx, 1, {
        ...elements[idx],
        content: content.slice(0, range.anchorOffset),
      })

      const newLine = ctx.schema.createElement('paragraph', [], '')

      schema.splice(idx + 1, Math.max(0, tailElements.length - 1), newLine)
      range.setRange(newLine.id, 0, newLine.id, 0)
    } else {
      const map = new Map<string, string>([[id, createRandomId()]])

      const additionalElements = groupIds.reduce((prev, groupId) => {
        const el = elements.find(e => e.id === groupId)
        if (!el) {
          throw new Error('获取选区位置父级元素失败')
        }
        map.set(groupId, createRandomId())
        return prev.concat({
          ...el,
          id: map.get(groupId)!,
          groupIds: el.groupIds.map(i => map.get(i) ?? i),
          content: '',
        })
      }, [] as MarkdanSchemaElement[])

      const newLines = [
        ...additionalElements,
        // 折断的元素
        {
          ...elements[idx],
          id: map.get(id)!,
          content: content.slice(range.focusOffset),
          groupIds: groupIds.map(i => map.get(i) ?? i),
        },
        ...tailElements.map((el) => {
          el.groupIds = el.groupIds.map(i => map.get(i) ?? i)
          return el
        }),
      ]

      schema.splice(idx, 1, {
        ...elements[idx],
        content: content.slice(0, range.anchorOffset),
      })

      schema.splice(idx + 1, Math.max(0, tailElements.length - 1), ...newLines)
      range.setRange(map.get(id)!, 0, map.get(id)!, 0)
    }
  })

  ctx.emitter.emit('schema:change')
  ctx.emitter.emit('selection:change', ctx.selection.ranges)

  ctx.interface.renderer.scrollIfCurrentRangeOutOfViewer()
}
