import { avalon } from '../seed/core'

var impDir = avalon.directive('important', {
    priority: 1,
    getScope: function (name, scope) {
        var v = avalon.vmodels[name]
        if (v)
            return v
        throw 'error'
    },
    update: function (node, scope, attrName) {
        var dom = avalon.vdom(node, 'toDOM')
        dom.removeAttribute(attrName)
        avalon(dom).removeClass('ms-controller')
        scope.$fire('onReady')
        scope.$element = node
        scope.$render = this
        delete scope.$events.onReady
    }
})

export var impCb = impDir.update