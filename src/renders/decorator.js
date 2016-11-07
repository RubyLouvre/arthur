import { avalon, inBrowser } from '../seed/core'

import { Directive, protectedMenbers } from './Directive'

/**
 * 一个directive装饰器
 * @returns {directive}
 */

export function DirectiveDecorator(node, binding, scope, render) {
    var type = binding.type
    var decorator = avalon.directives[type]
    if (inBrowser) {
        var dom = avalon.vdom(node, 'toDOM')
        if (dom.nodeType === 1) {
            dom.removeAttribute(binding.attrName)
        }
        node.dom = dom
    }
    var callback = decorator.update ? function (value) {
        if (!render.mount && /css|visible|duplex/.test(type)) {
            render.callbacks.push(function () {
                decorator.update.call(directive, directive.node, value)
            })
        } else {
            decorator.update.call(directive, directive.node, value)
        }

    } : avalon.noop

    var directive = new Directive(scope, binding, callback)

    for (var key in decorator) {
        if (!protectedMenbers[key]) {
            directive[key] = decorator[key]
        }

    }
    directive.node = node
    if (typeof directive.init === 'function') { //这里可能会重写node, callback, type, name
        directive.init()
    }
    delete directive.value

    directive.update()
    return directive
}
