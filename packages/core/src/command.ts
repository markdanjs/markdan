import type { EditorSelection } from './selection'
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

  execute(selection: EditorSelection, elements: MarkdanSchemaElement[], ...args: any[]) {
    return this.command(selection, elements, ...args)
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
      command.execute(ctx.selection, ctx.schema.elements, ...args)
    },
  }
}

export function deleteContentCommand(selection: EditorSelection, _elements: MarkdanSchemaElement[]) {
  selection.ranges.forEach((range) => {
    if (!range.isCollapsed) {
      range.collapse()
    }
    // @todo
  })
}

export function breakLine(_selection: EditorSelection, _elements: MarkdanSchemaElement[]) {}
