import { avalon, createFragment } from '../seed/core'

export function VFragment(a) {
    this.nodeName = '#document-fragment'
    this.children = a
}

VFragment.prototype = {
    constructor: VFragment,
    toDOM: function () {
        if (this.dom)
            return this.dom
        var f = createFragment()
        var c = this.children || []
        //IE6-11 docment-fragment都没有children属性 
        for (var i = 0, el; el = c[i++];) {
            f.appendChild(avalon.vdom(el, 'toDOM'))
        }
        this.split = f.lastChild
        return this.dom = f
    },
    toHTML: function () {
       var c = this.children || []
        return c.map(function (a) {
            return avalon.vdom(a, 'toHTML')
        }).join('')
    }
}