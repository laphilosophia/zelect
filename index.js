class Zelect {
    constructor(options, element) {
        this.namespace = '[data-component="select"]'

        this.el = document.querySelector(element) || document.querySelector(this.namespace)

        this.defaults = {
            children: [],
            className: ''
        }

        this.events = {
            mount: 'mount'
        }

        this.settings = Object.assign({}, this.defaults, options)

        this.zelect = null

        this.findNativeModel = this.findNativeModel.bind(this)
        this.createHtmlModel = this.createHtmlModel.bind(this)
        this.init = this.init.bind(this)
    }

    ready(fn) {
        if (typeof fn !== 'function') return

        if (document.readyState === 'interactive' || document.readyState === 'complete') {
            return fn()
        }

        document.addEventListener('DOMContentLoaded', fn, false)
    }

    string(str) {
        return str.toString()
    }

    getEvent(el) {
        return el.dataset.events.replace(/(^,+)|(,+$)/g, "").split(',').filter(el => el !== '')
    }

    addEvent(type, elem, detail) {
        if (!type) return

        elem = elem || window
        detail = detail || {}

        let event = new CustomEvent(type, {
            bubbles: true,
            cancelable: true,
            detail: detail
        })

        elem.dispatchEvent(event)
    }

    removeEvent(type, elem, fn) {
        elem.removeEventListener(type, fn)
    }

    setAttributes(el, attrs) {
        for (let key in attrs) {
            if (attrs.hasOwnProperty(key)) {
                el.setAttribute(key, attrs[key])
            }
        }
    }

    watch(watch, callback) {
        const handler = {
            get (target, prop, receiver) {
                callback(target, prop, receiver)

                const value = Reflect.get(target, prop, receiver)

                if (typeof value === 'object') {
                    return new Proxy(value, handler)
                }

                return value
            },
            set (target, prop, value) {
                callback(target, prop, value)

                return Reflect.set(target, prop, value)
            },
            del (target, prop) {
                callback(target, prop)

                return Reflect.deleteProperty(target, prop)
            }
        }

        return new Proxy(watch, handler)
    }

    findNativeModel() {
        const el = this.el
        const {
            children
        } = this.settings

        if (!el.options && (el.options).length === 0) return

        Object
            .entries(el.options)
            .map(([key, val]) => children
                .push({
                    value: key,
                    text: val.value
                })
            )
        Object.freeze(children)

        return {
            children
        }
    }

    removeNativeModel(el) {
        if (el) el.remove()
    }

    createPlaceholder(id, text) {
        let placeholder = document.createElement('span')

        placeholder.id = `zelect-placeholder--${(id).toString()}`
        placeholder.setAttribute('aria-label', 'Zelect Placeholder')
        placeholder.setAttribute('role', 'label')
        placeholder.title = `${(text).toString()}`
        placeholder.textContent = `${(text).toString()}`

        return placeholder
    }

    createHtmlModel() {
        const {
            el,
            string,
            createPlaceholder,
            removeNativeModel,
            addEvent,
            setAttributes
        } = this
        const {
            className
        } = this.settings
        const {
            children
        } = this.findNativeModel()
        const defaults = this.settings.children

        if (!el && el.length === 0) return

        let container = document.createElement('div')
        let list = document.createElement('nav')

        if (defaults.length) {
            let text = ''
            let id = className
            let items = []

            let first = children.findIndex(i => i.value !== '0')

            for (const child of children) {
                if (child.value === '0') {
                    (text = string(child.text))
                }
            }

            container.className = 'zelect ' + (className ? className : '')
            container.setAttribute('aria-role', 'select')

            setAttributes(list, {
                id: `zelect-list--${string(id)}`,
                role: 'listbox',
                'tabindex': 0,
                'aria-labelledby': `zelect-placeholder--${string(id)}`,
                'aria-activedescendant': `zelect-list-item--${string(first)}`
            })

            children.map(child => {
                if (child.value !== '0') {
                    let fragment = document.createDocumentFragment()
                    let item = document.createElement('span')

                    setAttributes(item, {
                        'id': `zelect-list-item--${string(child.value)}`,
                        'data-value': string(child.value),
                        'role': 'option',
                        'title': `${string(child.text)}`
                    })

                    item.textContent = string(child.text)

                    fragment.appendChild(item)

                    items.push(item)
                }
            })

            items.map(item => list.appendChild(item))

            list
                .querySelector(`#zelect-list-item--${string(first)}`)
                .setAttribute('aria-selected', true)

            container.appendChild(createPlaceholder(id, text))
            container.appendChild(list)

            el.parentNode.insertBefore(container, el.nextSibling)

            this.zelect = container

            removeNativeModel(el)

            addEvent(this.events.mount, this.zelect, 'zelect-mount')
        } else {
            console.error('error!')
        }
    }

    toggleHandler(event) {
        const { target } = event

        target.addEventListener('click', () => {
            if (target.classList.contains('is-active')) {
                target.classList.remove('is-active')
            } else {
                target.classList.add('is-active')
            }
        })
    }

    hoverHandler (elements) {
        elements.forEach(element => {
            element.addEventListener('mouseover', e => e.target.classList.add('is-hover'))
            element.addEventListener('mouseout', e => e.target.classList.remove('is-hover'))

            element.addEventListener('click', e => {
                const { target } = e

                target.setAttribute('aria-selected', true)

                Array.prototype.filter.call(target.parentNode.children, child => {
                    if (child !== target) {
                        child.removeAttribute('aria-selected')
                    }
                })
            })
        })
    }

    clickOutSide (object) {
        return document.addEventListener('click', event => {
            const el = event.target
            const target = document.querySelector(object)

            if (!el.closest(object)) {
                target.classList.remove('is-active')
            }
        })
    }

    init() {
        const {
            ready,
            createHtmlModel,
            toggleHandler,
            hoverHandler,
            clickOutSide
        } = this

        ready(() => {
            createHtmlModel()
        })

        document.addEventListener('mount', event => {
            const items = [...event.target.querySelectorAll('span[role="option"]')]
            toggleHandler(event)
            hoverHandler(items)
        })

        clickOutSide('.zelect')
    }
}

const zelect = new Zelect({
    className: 'zelector'
}, false)

zelect.init()
