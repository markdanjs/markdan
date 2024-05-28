export function clickOutside(el: HTMLElement, callback?: (...args: any[]) => any): void {
  document.addEventListener('click', handleClick)

  function handleClick(e: MouseEvent) {
    const target = e.target as HTMLElement

    if (!el.contains(target)) {
      callback?.()
      document.removeEventListener('click', handleClick)
    }
  }
}
