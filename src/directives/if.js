import { avalon, createAnchor } from '../seed/core'

avalon.directive('if', {
    delay: true,
    priority: 5,
    init: function () {
        this.placeholder = createAnchor('if')
        this.isShow = true
        var props = this.node.props
        delete props['ms-if']
        delete props[':if']
        this.fragment = avalon.vdom(this.node, 'toHTML')

    },
    diff: function (newVal, oldVal) {
        var n = !!newVal
        if (oldVal === void 0 || n !== oldVal) {
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

