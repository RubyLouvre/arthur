import { avalon, inBrowser } from '../seed/core'

import { Watcher } from '../vmodel/watcher'

/**
 * 一个watcher装饰器
 * @returns {watcher}
 */
export function DirectiveDecorator(node, binding, scope) {
    var type = binding.type
    var directive = avalon.directives[type]
    if (inBrowser) {
        var dom = avalon.vdom(node, 'toDOM')
        if (dom.nodeType === 1) {
            dom.removeAttribute(binding.attrName)
        }
        node.dom = dom
    }
    var callback = directive.update ? function (value) {
        directive.update.call(this, node, value)
    } : avalon.noop
    var watcher = new Watcher(scope, binding, callback)
    if (directive.diff) {
        watcher.diff = directive.diff
    }
    watcher.node = node
    watcher._destory = directive.destory
    if (directive.init) //这里可能会重写node, callback, type, name
        directive.init(watcher)
    delete watcher.value

    watcher.update()
    return watcher
}
