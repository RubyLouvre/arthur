import { avalon } from '../seed/core'

var impDir = avalon.directive('important', {
    priority: 1,
    getScope: function (name, scope) {
        var v = avalon.vmodels[name]
        if (v)
            return v
        return scope
    },
    callback: function () {
        var node = this.node
        var dom = avalon.vdom(node, 'toDOM')
        dom.removeAttribute(this.attrName)
        avalon(dom).removeClass('ms-controller')
        this.scope.$fire('onReady')
        delete this.scope.$events.onReady
    }
})

export var impCb = impDir.callback