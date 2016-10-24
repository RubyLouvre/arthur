/**
 * 虚拟DOM的4大构造器
 */
import { avalon, createFragment } from '../seed/core'
import { VText } from './VText'
import { VComment } from './VComment'
import { VElement } from './VElement.modern'
import { VFragment } from './VFragment'
export {
   VText, VComment,VElement,VFragment
}
var vdom = avalon.vdom = avalon.vdomAdaptor = function (obj, method) {
    if (!obj) {//obj在ms-for循环里面可能是null
        return method === "toHTML" ? '' : createFragment()
    }
    switch (obj.nodeName) {
        case '#text':
            return VText.prototype[method].call(obj)
        case '#comment':
            return VComment.prototype[method].call(obj)
        case '#document-fragment':
            return VFragment.prototype[method].call(obj)
        case void(0):
            return (new VFragment(obj))[method]() 
        default:
            return VElement.prototype[method].call(obj)
    }
}


export {vdom, avalon}

avalon.domize = function (a) {
    return avalon.vdom(a, 'toDOM')
}
