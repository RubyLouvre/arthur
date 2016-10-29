
import { avalon, window, document, msie } from '../../seed/core'
import { propMap } from './propMap'
import { isVML } from './isVML'
import { compactParseJSON } from './parseJSON.compact'

var rsvg = /^\[object SVG\w*Element\]$/
var ramp = /&amp;/g

export function updateAttrs(node, vnode) {
    /* istanbul ignore if*/
    if (!node || node.nodeType !== 1) {
        return
    }
    vnode.dynamic['ms-attr'] = 1
    var attrs = vnode['ms-attr']
    for (var attrName in attrs) {
        var val = attrs[attrName]
        // 处理路径属性
        /* istanbul ignore if*/
        try {
            if (attrName === 'href' || attrName === 'src') {
                if (msie < 8) {
                    val = String(val).replace(ramp, '&') //处理IE67自动转义的问题
                }
                node[attrName] = val
                //处理HTML5 data-*属性
            } else if (attrName.indexOf('data-') === 0) {
                node.setAttribute(attrName, val)

            } else {
                var propName = propMap[attrName] || attrName
                /* istanbul ignore if */
                if (typeof node[propName] === 'boolean') {
                    node[propName] = !!val
                    //布尔属性必须使用el.xxx = true|false方式设值
                    //如果为false, IE全系列下相当于setAttribute(xxx,''),
                    //会影响到样式,需要进一步处理
                }

                if (val === false) {//移除属性
                    node.removeAttribute(propName)
                    continue
                }
                //SVG只能使用setAttribute(xxx, yyy), VML只能使用node.xxx = yyy ,
                //HTML的固有属性必须node.xxx = yyy
                var isInnate = rsvg.test(node) ? false :
                    (!avalon.modern && isVML(node)) ? true :
                        isInnateProps(node.nodeName, attrName)
            
                /* istanbul ignore next */
                if (isInnate) {
                    node[propName] = val + ''
                } else {
                    node.setAttribute(attrName, val)
                }
            }
        } catch (e) {
            // 对象不支持此属性或方法 src https://github.com/ecomfe/zrender 
            // 未知名称。\/n
            // e.message大概这样,需要trim
            //IE6-8,元素节点不支持其他元素节点的内置属性,如src, href, for
            avalon.log(String(e.message).trim(), attrName, val)
        }
    }
}
var innateMap = {}
function isInnateProps(nodeName, attrName) {
    var key = nodeName + ":" + attrName
    if (key in innateMap) {
        return innateMap[key]
    }
    return innateMap[key] = (attrName in document.createElement(nodeName))
}
try {
    avalon.parseJSON = JSON.parse
} catch (e) {
    /* istanbul ignore next */
    avalon.parseJSON = compactParseJSON
}

avalon.fn.attr = function (name, value) {
    if (arguments.length === 2) {
        this[0].setAttribute(name, value)
        return this
    } else {
        return this[0].getAttribute(name)
    }
}

