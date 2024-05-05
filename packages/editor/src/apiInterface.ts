/*!
 * 构建编辑器界面相关
 */

import type { MarkdanContext } from '@markdan/core'
import { CLASS_NAMES } from './config/dom.config'
import './style.css'
import { createCursorApi } from './apiCursor'
import { createRendererApi } from './apiRenderer'

export interface MarkdanInterface {
  mainViewer: HTMLElement
}

export interface MarkdanInterfaceStyle {
  width: string
  height: string
  fontFamily: string
  fontSize: number
  lineHeight: number
}

export type MarkdanInterfaceTheme = 'light' | 'dark'

export interface MarkdanInterfaceOptions {
  theme: MarkdanInterfaceTheme
  style: MarkdanInterfaceStyle
  lineNumber: boolean
}

export function normalizeStyle(style: MarkdanInterfaceStyle, cw: number, ch: number) {
  let { width, height } = style

  const reg = /\d+%$/

  width = reg.test(width)
    ? `${cw * parseInt(width) / 100}px`
    : width

  height = reg.test(height)
    ? `${ch * parseInt(height) / 100}px`
    : height

  return {
    ...style,
    width,
    height,
  }
}

function createMainViewer(ctx: MarkdanContext) {
  const oMainViewer = document.createElement('div')

  oMainViewer.classList.add(CLASS_NAMES.editorViewer)

  oMainViewer.style.cssText = `
  
  `

  oMainViewer.addEventListener('mousedown', (e: MouseEvent) => {
    ctx.emitter.emit('editor:mouse:down', e)
  })

  return oMainViewer
}

export function createEditorInterfaceApi(el: HTMLElement, ctx: MarkdanContext): MarkdanInterface {
  const cssText = Object.entries(ctx.config.style).reduce((acc, curr) => {
    return `${acc}--${curr[0].replace(/[A-Z]/, $1 => `-${$1.toLowerCase()}`)}: ${typeof curr[1] === 'string' ? curr[1] : `${curr[1]}px`};`
  }, '')

  const oCursor = document.createElement('div')

  const oContainer = document.createElement('div')

  oContainer.classList.add(CLASS_NAMES.editorContainer, ctx.config.theme)
  oContainer.style.cssText = cssText

  // const _options = Object.assign({}, options)

  const oMainViewer = createMainViewer(ctx)
  const cursor = createCursorApi(oContainer, oCursor, ctx)

  oContainer.appendChild(oCursor)
  oContainer.appendChild(oMainViewer)
  el.appendChild(oContainer)

  const renderer = createRendererApi(oMainViewer, ctx)

  ctx.emitter.on('selection:change', cursor.addCursor)
  ctx.emitter.on('render', renderer.render)

  return {
    mainViewer: oMainViewer,

    // addCursor(blockId: string, offset: number) {

    // },
  } as MarkdanInterface
}
