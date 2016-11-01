import { avalon, inBrowser } from '../seed/core'

import { Directive } from './Directive'

/**
 * 一个directive装饰器
 * @returns {directive}
 */
export function DirectiveDecorator(node, binding, scope) {
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
        decorator.update.call(this, node, value)
    } : avalon.noop
    var directive = new Directive(scope, binding, callback)
    if (decorator.diff) {
        directive.diff = decorator.diff
    }
    directive.node = node
    directive._destory = decorator.destory
    if (decorator.init) //这里可能会重写node, callback, type, name
        decorator.init(directive)
    delete directive.value

    directive.update()
    return directive
}
