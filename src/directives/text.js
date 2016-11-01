import { avalon } from '../seed/core'


avalon.directive('text', {
    delay: true,
    init: function (watcher) {
        var node = watcher.node
        if (node.isVoidTag) {
            avalon.error('自闭合元素不能使用ms-text')
        }
        var child = { nodeName: '#text', nodeValue: watcher.value }
        node.children = [
            child
        ]
        avalon.vdom(child,'toDOM')
        watcher.node = child
        var type = 'nodeValue'
        watcher.type = watcher.name = type
        var directive = avalon.directives[type]
        watcher.callback = function (value) {
            directive.update.call(this, watcher.node, value)
        }
    }
})
