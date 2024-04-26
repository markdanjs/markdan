/**
 * EventEmitter
 */

export type EventType = string | symbol

export type EventHandler = (...args: any[]) => void

class EventEmitter {
  static defaultMaxListener = Infinity

  #maxListener = Infinity
  #events: Map<EventType, Set<EventHandler>> = new Map()

  constructor(maxListener = Infinity) {
    this.#maxListener = maxListener
  }

  get events() {
    return this.#events
  }

  get eventNames() {
    return [...this.events.keys()] as const
  }

  get maxListener() {
    return this.#maxListener
      ? this.#maxListener
      : EventEmitter.defaultMaxListener
  }

  set maxListener(maxListener: number) {
    this.#maxListener = maxListener
  }

  on<K extends EventType>(type: K, handler: EventHandler) {
    let listeners = this.#events.get(type)
    if (!listeners) {
      listeners = new Set()
      this.#events.set(type, listeners)
    }

    if (listeners.size >= this.maxListener) {
      throw new RangeError(`The number of listening events exceeds the maximum limit. (${this.maxListener})`)
    }

    listeners.add(handler)
  }

  once<K extends EventType>(type: K, handler: EventHandler) {
    const wrap: EventHandler = (...args) => {
      handler(...args)
      this.off(type, wrap)
    }

    this.on(type, wrap)
  }

  emit<K extends EventType>(type: K, ...args: any[]) {
    const listeners = this.events.get(type)
    listeners?.forEach((listener) => {
      listener.apply(this, args)
    })
  }

  off<K extends EventType>(type: K, handler?: EventHandler) {
    if (!handler) {
      this.events.delete(type)
      return
    }

    const listeners = this.events.get(type)
    if (listeners) {
      listeners.delete(handler)

      if (listeners.size === 0) {
        this.events.delete(type)
      }
    }
  }

  clear(): void {
    this.events.clear()
  }
}

export default EventEmitter
