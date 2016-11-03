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
        var scope = this.scope
        var dom = avalon.vdom(node, 'toDOM')
        dom.removeAttribute(this.attrName)
        avalon(dom).removeClass('ms-controller')
        scope.$fire('onReady')
        scope.$element = node
        scope.$render = this.render
        delete scope.$events.onReady
    }
})

export var impCb = impDir.callback