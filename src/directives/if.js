import { avalon, createAnchor } from '../seed/core'

avalon.directive('if', {
    delay: true,
    priority: 5,
    init: function (watcher) {
        watcher.placeholder = createAnchor('if')
        watcher.isShow = true
        var props = watcher.node.props
        delete props['ms-if']
        delete props[':if']
        watcher.fragment = avalon.vdom(watcher.node, 'toHTML')

    },
    diff: function (newValue, oldValue) {
        var n = !!newValue
        if (oldValue === void 0 || n !== oldValue) {
            this.value = n
            return true
        }
    },
    update: function (vdom, value) {
        if (this.isShow === value)
            return
        this.isShow = value
        var placeholder = this.placeholder
        if (value) {
            var p = placeholder.parentNode
            var boss = this.boss = avalon.scan(this.fragment, this.vm)
            vdom.children = boss.root.children
            vdom.dom = boss.root.dom
            p && p.replaceChild(vdom.dom, placeholder)

        } else {//移除DOM
            this.boss && this.boss.destroy()
            var dom = vdom.dom
            if (!dom.parentNode || dom.parentNode.nodeType === 11) {
                vdom.dom = placeholder
            } else {
                var p = dom.parentNode
                p.replaceChild(placeholder, dom)
            }
        }
    }
})

