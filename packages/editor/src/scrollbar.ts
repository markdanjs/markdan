import type { MarkdanContext } from '@markdan/core'
import { CLASS_NAMES } from './config/dom.config'

export type ScrollBarType =
  | 'horizontal' // 水平滚动条，当设置自动换行时，不会出现
  | 'vertical' // 垂直滚动条

export interface ScrollBarApi {
  vertical: ScrollBar
  horizontal: ScrollBar
  readonly scrollX: number
  readonly scrollY: number
  scroll(x: number, y?: number): void
  scrollBy(x: number, y?: number): void
  update(ctx?: MarkdanContext): void
}

export class ScrollBar {
  #ctx: MarkdanContext

  visible = false
  isRendered = false

  /** 可视区长度 */
  #visualLength = 0
  /** 内容长度 */
  #contentLength = 0
  /** 当前位置 */
  #currentPosition = 0

  track: HTMLElement | null = null
  slider: HTMLElement | null = null

  #startDragPosition = 0

  constructor(public type: ScrollBarType, ctx: MarkdanContext) {
    this.#ctx = ctx
  }

  /** 滑块长度 */
  get sliderSize() {
    if (this.#contentLength <= this.#visualLength) {
      return 0
    }

    return this.#visualLength ** 2 / this.#contentLength
  }

  /** 滑块位置 */
  get sliderPosition() {
    return Math.max(0, Math.min(
      this.type === 'vertical'
        ? this.#visualLength - this.sliderSize
        : this.#visualLength - this.sliderSize - 16,
      this.currentPosition * this.#visualLength / this.#contentLength),
    )
  }

  /** 视图滚动位置 */
  get currentPosition() {
    return this.#currentPosition
  }

  set currentPosition(position: number) {
    this.#currentPosition = Math.max(0, Math.min(position, this.#contentLength - this.#visualLength))

    if (this.slider) {
      this.slider.style.transform = `${this.type === 'vertical' ? 'translateY' : 'translateX'}(${this.sliderPosition}px)`
    }

    this.#ctx.emitter.emit('scrollbar:change', this.currentPosition, this.type)
  }

  render(el: HTMLElement) {
    if (this.isRendered) return

    this.update()

    const oScrollBar = document.createElement('div')
    oScrollBar.classList.add(CLASS_NAMES.editorScrollbar, this.type)

    const oTrack = this.track = this.#renderTrack()
    const oSlider = this.slider = this.#renderSlider()

    oScrollBar.appendChild(oTrack)
    oScrollBar.appendChild(oSlider)

    el.appendChild(oScrollBar)

    this.isRendered = true

    setTimeout(() => {
      oScrollBar.addEventListener('mousedown', this.#handleMouseDown.bind(this))
    })
  }

  #renderTrack() {
    const oTrack = document.createElement('div')
    oTrack.className = 'track'

    return oTrack
  }

  #renderSlider() {
    const oSlider = document.createElement('div')
    oSlider.className = 'slider'

    return oSlider
  }

  /**
   * 更新最大宽度（horizontal）/ 高度(vertical)
   */
  update(ctx?: MarkdanContext) {
    if (!this.isRendered) return

    if (ctx) {
      this.#ctx = ctx
    }

    const {
      config: {
        containerRect: {
          width,
          height,
        },
      },
      interface: {
        mainViewer,
      },
    } = this.#ctx

    const { width: contentWidth = 0, height: contentHeight = 0 } = mainViewer?.getBoundingClientRect() ?? {}

    if (this.type === 'vertical') {
      this.#visualLength = height
      this.#contentLength = contentHeight <= height
        ? height
        // 内容高度 + (可视高度 - lineHeight)
        : contentHeight + height - this.#ctx.config.style.lineHeight

      this.slider!.style.cssText = `height: ${this.sliderSize}px`
    } else {
      this.#visualLength = width
      this.#contentLength = contentWidth + 16 + 16 // +16 padding right + 16 scrollbar size

      this.slider!.style.cssText = `width: ${this.sliderSize}px`
    }
  }

  scroll(position: number) {
    this.currentPosition = position
  }

  scrollBy(diff: number) {
    this.currentPosition += diff
  }

  #handleMouseDown(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    const {
      config: {
        containerRect: {
          left,
          top,
        },
      },
    } = this.#ctx

    const position = this.type === 'vertical'
      ? e.clientY - top
      : e.clientX - left

    this.#startDragPosition = position

    const isClickSlider = position >= this.sliderPosition && position <= this.sliderPosition + this.sliderSize

    if (!isClickSlider) {
      this.scroll(this.#contentLength * (position - this.sliderSize / 2) / this.#visualLength)
    }

    const handleMouseMove = (e: MouseEvent) => {
      this.#handleDrag(e)
    }

    const handleMouseUp = (e: MouseEvent) => {
      this.#handleDrag(e)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  #handleDrag(e: MouseEvent) {
    const {
      config: {
        containerRect: {
          left,
          top,
        },
      },
    } = this.#ctx

    const position = this.type === 'vertical'
      ? e.clientY - top
      : e.clientX - left

    const diff = position - this.#startDragPosition

    this.scrollBy(this.#contentLength * diff / this.#visualLength)

    this.#startDragPosition = position
  }
}

export function createScrollbar(el: HTMLElement, ctx: MarkdanContext): ScrollBarApi {
  const vertical = new ScrollBar('vertical', ctx)
  const horizontal = new ScrollBar('horizontal', ctx)

  vertical.render(el)
  horizontal.render(el)

  return {
    vertical,
    horizontal,

    get scrollX() {
      return horizontal.currentPosition
    },

    get scrollY() {
      return vertical.currentPosition
    },

    scroll(x, y) {
      if (x !== undefined) {
        horizontal.scroll(x)
      }
      if (y !== undefined) {
        horizontal.scroll(y)
      }
    },

    scrollBy(x, y = 0) {
      horizontal.scrollBy(x)
      horizontal.scrollBy(y)
    },

    update(ctx?: MarkdanContext) {
      vertical.update(ctx)
      horizontal.update(ctx)
    },
  } as ScrollBarApi
}
