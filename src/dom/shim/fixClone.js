import {rcheckedType} from '../rcheckedType'

 /* istanbul ignore next */
function fixElement(dest, src) {
    if (dest.nodeType !== 1) {
        return
    }
    var nodeName = dest.nodeName.toLowerCase()
    if (nodeName === 'object') {
        if (dest.parentNode) {
            dest.outerHTML = src.outerHTML
        }

    } else if (nodeName === 'input' && rcheckedType.test(src.nodeName)) {

        dest.defaultChecked = dest.checked = src.checked

        if (dest.value !== src.value) {
            dest.value = src.value
        }

    } else if (nodeName === 'option') {
        dest.defaultSelected = dest.selected = src.defaultSelected
    } else if (nodeName === 'input' || nodeName === 'textarea') {
        dest.defaultValue = src.defaultValue
    }
}

 /* istanbul ignore next */
function getAll(context) {
    return typeof context.getElementsByTagName !== 'undefined' ?
            context.getElementsByTagName('*') :
            typeof context.querySelectorAll !== 'undefined' ?
            context.querySelectorAll('*') : []
}

 /* istanbul ignore next */
export function fixClone(src) {
    var target = src.cloneNode(true)
    var t = getAll(target)
    var s = getAll(src)
    for(var i = 0; i < s.length; i++){
          fixElement(t[i], s[i])
    }
    return target
}

