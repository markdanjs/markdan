export function debounce(fn: (...args: any[]) => any, wait: number, triggerNow = true) {
  let t: NodeJS.Timer | undefined
  let thisArg: any

  const debounced = function(this: any, ...args: any[]) {
    let res
    thisArg = this

    if (t) {
      clearTimeout(t)
    }

    if (triggerNow) {
      const exec = !t

      t = setTimeout(() => {
        t = undefined
      }, wait)

      if (exec) {
        res = fn.apply(thisArg, args)
      }
    } else {
      t = setTimeout(() => {
        res = fn.apply(thisArg, args)
      }, wait)
    }
    return res
  }

  debounced.remove = function() {
    if (t) {
      clearTimeout(t)
      t = undefined
    }
  }

  return debounced
}

export function throttle<T extends Function>(fn: T, delay: number, triggerNow: boolean) {
  let t: NodeJS.Timer | undefined
  let beginTime = performance.now()
  let thisArg: any

  return function(this: any, ...args: any[]) {
    thisArg = this
    let res: any
    const curTime = performance.now()

    if (triggerNow) {
      triggerNow = false
      beginTime = curTime
      return fn.apply(thisArg, args)
    }

    t && clearTimeout(t)

    if (curTime - beginTime >= delay) {
      res = fn.apply(thisArg, args)
      beginTime = curTime
    } else {
      t = setTimeout(() => {
        res = fn.apply(thisArg, args)
      }, delay)
    }
    return res
  }
}
