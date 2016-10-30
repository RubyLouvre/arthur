import { avalon } from '../seed/core'

avalon.directive('important', {
    getScope: function (name, scope) {
        var v = avalon.vmodels[name]
        if (v)
            return v
        return scope
    },
    callback: function () {
        var node = this.node
        var dom = avalon.vdom(node, 'toDOM')
        dom.removeAttribute('ms-important')
        dom.removeAttribute(':important')
        avalon(dom).removeClass('ms-controller')
        this.scope.$fire('onReady')
        delete this.scope.$events.onReady
    }
})