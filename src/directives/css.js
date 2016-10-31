
import { avalon } from '../seed/core'

var cssDir = avalon.directive('css', {
    diff: function (newValue, oldValue) {
        if (Object(newValue) === newValue) {
            newValue = newValue.$model || newValue//安全的遍历VBscript
            if (Array.isArray(newValue)) {//转换成对象
                var b = {}
                newValue.forEach(function (el) {
                    el && avalon.shadowCopy(b, el)
                })
                newValue = b
            }
            var hasChange = false
            if (!oldValue) {//如果一开始为空
                this.value = newValue
                hasChange = true
            } else {
                var patch = {}
                for (var i in newValue) {//diff差异点
                    if (newValue[i] !== oldValue[i]) {
                        hasChange = true
                    }
                    patch[i] = a[i]
                }
                for (var i in oldValue) {
                    if (!(i in patch)) {
                        hasChange = true
                        patch[i] = ''
                    }
                }
                this.value = patch
            }

            if (hasChange) {
                var props = this.node.props
                avalon.mix(props.style || (props.style = {}), this.value)
                return true
                //  if(name === 'ms-effect'){
                //      src[name] = a
                //  }
                //  update(src, this.update)
            }
        }
        return false
        //  delete copy[name]//释放内存
    },
    update: function (vdom, change) {
        var dom = vdom.dom
        if (dom && dom.nodeType === 1) {
            var wrap = avalon(dom)
            //  vdom.dynamic['ms-css'] = 1
            //  var change = vdom['ms-css']
            for (var name in change) {
                wrap.css(name, change[name])
            }
        }
    }
})

export var cssDiff = cssDir.diff