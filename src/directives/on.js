import { avalon, inBrowser } from '../seed/core'

import { addScope } from '../parser/index'
var rhandleName = /^__vmodel__\.[$\w\.]+$/
export function makeHandle(body) {
    if (rhandleName.test(body)) {
        body = body + '($event)'
    }
    body = body.replace(/__vmodel__\.([^(]+)\(([^)]*)\)/, function (a, b, c) {
        return '__vmodel__.' + b + '.call(__vmodel__' + (/\S/.test(c) ? ',' + c : '') + ')'
    })
    return body
}
avalon.directive('on', {
    beforeInit: function () {
        this.getter = avalon.noop
    },
    init: function () {
       
        var vdom = this.node

        var underline = this.name.replace('ms-on-', 'e').replace('-', '_')
        var uuid = underline + '_' + this.expr.
            replace(/\s/g, '').
            replace(/[^$a-z]/ig, function (e) {
                return e.charCodeAt(0)
            })
        var fn = avalon.eventListeners[uuid]
        if (!fn) {
            var arr = addScope(this.expr)
            var body = arr[0], filters = arr[1]
            body = makeHandle(body)
            
            if (filters) {
                filters = filters.replace(/__value__/g, '$event')
                filters.push('if($event.$return){\n\treturn;\n}')
            }
            var ret = [
                'try{',
                '\tvar __vmodel__ = this;',
                '\t' + filters,
                '\treturn ' + body,
                '}catch(e){avalon.log(e)}']
            fn = new Function('$event', ret.join('\n'))
            fn.uuid = uuid
            avalon.eventListeners[uuid] = fn
        }


        var dom = avalon.vdom(vdom, 'toDOM')
        dom._ms_context_ = this.vm
        this.eventType = this.param.replace(/\-(\d)$/, '')
        delete this.param
        avalon(dom).bind(this.eventType, fn)
    },
    beforeDestroy: function () {
        avalon(this.node.dom).unbind(this.eventType)
    }
})