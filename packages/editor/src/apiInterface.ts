/*!
 * 构建编辑器界面相关
 */

import type { MarkdanConfig, MarkdanContext } from '@markdan/core'
import { CLASS_NAMES } from './config/dom.config'
import './style.css'
import { createCursorApi } from './apiCursor'
import { createRendererApi } from './apiRenderer'

export interface MarkdanInterface {}

export interface MarkdanInterfaceStyle {
  width: string
  height: string
  fontSize: string
  lineHeight: string
}

export interface MarkdanInterfaceOptions {
  style: MarkdanInterfaceStyle
}

export function normalizeStyle(style: MarkdanInterfaceStyle, config: MarkdanConfig) {
  let { width, height } = style

  const reg = /\d+%$/

  width = reg.test(width)
    ? `${config.containerRect.width * parseInt(width) / 100}px`
    : width

  height = reg.test(height)
    ? `${config.containerRect.height * parseInt(height) / 100}px`
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

  oMainViewer.addEventListener('mouseup', (e: MouseEvent) => {
    ctx.emitter.emit('editor:mouse:up', e)
  })

  return oMainViewer
}

export function createEditorInterfaceApi(el: HTMLElement, options: MarkdanInterfaceOptions, ctx: MarkdanContext) {
  const cssText = Object.entries(options.style).reduce((acc, curr) => {
    return `${acc}--${curr[0].replace(/[A-Z]/, $1 => `-${$1.toLowerCase()}`)}: ${curr[1]};`
  }, '')

  const oCursor = document.createElement('div')

  const oContainer = document.createElement('div')

  oContainer.className = CLASS_NAMES.editorContainer
  oContainer.style.cssText = cssText

  // const _options = Object.assign({}, options)

  const oMainViewer = createMainViewer(ctx)
  const cursor = createCursorApi(oContainer, oCursor, ctx)

  // // @todo - test
  // oMainViewer.innerHTML = `
  //   <div class="view-line" data-id="1">oContainer.className = <span data-id="2" style="color: red">CLASS_<span data-id="3" style="color: blue">NAMES</span>.</span><span data-id="4">editorContainer</span></div>
  //   <div class="view-line" data-id="5">oContainer.style.cssText = cssText</div>
  //   <div class="view-line" data-id="6">const _options = Object.assign({}, options)</div>
  //   <div class="view-line" data-id="7">const oMainViewer = createMainViewer()</div>
  // `

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
