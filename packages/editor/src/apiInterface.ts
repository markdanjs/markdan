/*!
 * 构建编辑器界面相关
 */

import type { MarkdanContext } from '@markdan/core'
import { CLASS_NAMES } from './config/dom.config'
import './style.css'
import { createCursorApi } from './apiCursor'
import { createRendererApi } from './apiRenderer'
import { type ScrollBarApi, createScrollbar } from './scrollbar'
import { type LineNumberAPI, createLineNumber } from './lineNumber'

export interface MarkdanInterface {
  mainViewer: HTMLElement
  scrollbar: ScrollBarApi
  lineNumber: LineNumberAPI
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

function initObserver(elements: Element[], callback?: (...args: any[]) => any) {
  const observer = new ResizeObserver((_entries) => {
    callback && callback()
  })

  elements.forEach((el) => {
    observer.observe(el)
  })
}

/**
 * ```markdown
 * markdan
 *  - toolbar
 *  - main
 *    - line-number
 *    - container
 *      - cursor
 *      - scrollbar
 *  - footer?
 * ```
 */
export function createEditorInterfaceApi(el: HTMLElement, ctx: MarkdanContext): MarkdanInterface {
  const cssText = Object.entries(ctx.config.style).reduce((acc, curr) => {
    return `${acc}--${curr[0].replace(/[A-Z]/, $1 => `-${$1.toLowerCase()}`)}: ${typeof curr[1] === 'string' ? curr[1] : `${curr[1]}px`};`
  }, '')
  const oCursor = document.createElement('div')
  const oScrollBar = document.createElement('div')

  const oContainer = document.createElement('div')
  oContainer.classList.add(CLASS_NAMES.editorContainer)

  const oToolbar = document.createElement('header')
  oToolbar.className = CLASS_NAMES.editorToolbar

  const oMain = document.createElement('main')
  oMain.className = CLASS_NAMES.editorMain

  const oMarkdan = document.createElement('div')
  oMarkdan.classList.add(CLASS_NAMES.editor, ctx.config.theme)
  oMarkdan.style.cssText = cssText

  const oFooter = document.createElement('footer')
  oFooter.className = CLASS_NAMES.editorFooter

  // const _options = Object.assign({}, options)

  const oMainViewer = createMainViewer(ctx)
  const cursor = createCursorApi(oContainer, oCursor, ctx)
  const scrollbar = createScrollbar(oScrollBar, ctx)
  const lineNumber = createLineNumber(ctx)

  oContainer.appendChild(oCursor)
  oContainer.appendChild(oScrollBar)
  oContainer.appendChild(oMainViewer)

  lineNumber.mount(oMain)
  oMain.appendChild(oContainer)

  oToolbar.innerHTML = '<div style="width: 24px; height: 24px;">x</div>'
  oFooter.innerHTML = '<div>字符数</div>'

  oMarkdan.appendChild(oToolbar)
  oMarkdan.appendChild(oMain)
  oMarkdan.appendChild(oFooter)

  el.appendChild(oMarkdan)
  el.style.overflow = 'hidden'

  setTimeout(() => {
    scrollbar.update(ctx)
    oMain.addEventListener('wheel', (e) => {
      ctx.emitter.emit('editor:scroll', e)
    })
    lineNumber.update()
  })

  const renderer = createRendererApi(oMainViewer, ctx)

  // 更新容器位置尺寸信息
  ctx.config.containerRect = oContainer.getBoundingClientRect()
  initObserver([document.documentElement, el], () => {
    // 更新容器位置尺寸信息
    const containerRect = ctx.config.containerRect = oContainer.getBoundingClientRect()

    const {
      config: {
        style,
        originalOptions,
      },
    } = ctx

    const width = originalOptions.style?.width ?? style.width
    const height = originalOptions.style?.height ?? style.height
    const newStyle = ctx.config.style = normalizeStyle({
      ...style,
      width,
      height,
    }, containerRect.width, containerRect.height)

    oMarkdan.style.cssText = Object.entries(newStyle).reduce((acc, curr) => {
      return `${acc}--${curr[0].replace(/[A-Z]/, $1 => `-${$1.toLowerCase()}`)}: ${typeof curr[1] === 'string' ? curr[1] : `${curr[1]}px`};`
    }, '')
  })

  ctx.emitter.on('selection:change', cursor.addCursor)
  ctx.emitter.on('selection:change', lineNumber.setActive)
  ctx.emitter.on('render', renderer.render)

  return {
    mainViewer: oMainViewer,
    scrollbar,
    lineNumber,
  } as MarkdanInterface
}
