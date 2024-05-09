import type { MarkdanContext } from '@markdan/core'
import { CLASS_NAMES } from './config/dom.config'

export interface LineNumberAPI {
  isMounted: boolean
  lineNumberContainer: HTMLElement
  lineNumberWrapper: HTMLElement
  readonly maxLineNumber: number
  readonly width: number
  mount(el: HTMLElement): void
  render(): void
  update(): void
  setActive(): void
}

export function createLineNumber(ctx: MarkdanContext): LineNumberAPI {
  const oLineNumberContainer = document.createElement('div')
  oLineNumberContainer.className = CLASS_NAMES.editorLineNumber

  const oLineNumberWrapper = document.createElement('div')
  oLineNumberWrapper.className = 'wrapper'

  oLineNumberContainer.appendChild(oLineNumberWrapper)

  const lineNumberApi = {
    isMounted: false,
    lineNumberContainer: oLineNumberContainer,
    lineNumberWrapper: oLineNumberWrapper,

    get maxLineNumber() {
      return ctx.schema.elements.filter(el => el.groupIds.length === 0).length
    },

    get width() {
      return 0
    },

    mount(el: HTMLElement) {
      if (this.isMounted) return
      el.appendChild(oLineNumberContainer)
      this.isMounted = true
    },

    render() {
      const oFrag = document.createDocumentFragment()
      ctx.renderedElements.map((element, index) => {
        const oNumber = document.createElement('span')
        oNumber.setAttribute('data-line-number', element.id)
        oNumber.textContent = `${index + 1}`
        oFrag.appendChild(oNumber)
        oNumber.style.top = `${element.y}px`
        oNumber.style.lineHeight = `${element.lineHeight}px`
        return false
      })
      oLineNumberWrapper.appendChild(oFrag)
    },

    update() {
      oLineNumberWrapper.style.width = `${Math.ceil(Math.log10(this.maxLineNumber))}ch`
      this.render()
    },

    setActive() {
      const id = ctx.selection.focusViewLine
      if (!id) return

      const oNumbers: HTMLElement[] = [].slice.apply(oLineNumberWrapper.children)

      oNumbers.map((number) => {
        number.classList[number.getAttribute('data-line-number') === id ? 'add' : 'remove']('active')
        return false
      })
    },
  }

  lineNumberApi.render()

  return lineNumberApi
}
