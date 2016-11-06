
import { avalon } from '../seed/core'

var cssDir = avalon.directive('css', {
    diff: function (newVal, oldVal) {
        if (Object(newVal) === newVal) {
            newVal = newVal.$model || newVal//安全的遍历VBscript
            if (Array.isArray(newVal)) {//转换成对象
                var b = {}
                newVal.forEach(function (el) {
                    el && avalon.shadowCopy(b, el)
                })
                newVal = b
                avalon.warn(this.type,'指令的值不建议使用数组形式了！')
            }
            var props = this.node.props
            for(var i in newVal){
                if(!!newVal[i] === false){
                   delete props[i]
                }else{
                   props[i] = newVal[i]
                }
            }
            var hasChange = false
            var patch = {}
            if (!oldVal) {//如果一开始为空
                patch = newVal
                hasChange = true
            } else {
                
                for (var i in newVal) {//diff差异点
                    if (newVal[i] !== oldVal[i]) {
                        hasChange = true
                    }
                    patch[i] = newVal[i]
                }
                for (var i in oldVal) {
                    if (!(i in patch)) {
                        hasChange = true
                        patch[i] = ''
                    }
                }
            }
            if (hasChange) {
                this.value = patch
                return true
            }
        }
        return false
    },
    update: function (vdom, value) {
        var dom = vdom.dom
        if (dom && dom.nodeType === 1) {
            var wrap = avalon(dom)
            for (var name in value) {
                wrap.css(name, value[name])
            }
        }
    }
})

export var cssDiff = cssDir.diff