
import { avalon } from '../../seed/core'
import { rcheckedType } from '../../dom/rcheckedType'
import { updateDataEvents } from './updateDataEvents.compact'
import { updateDataHack } from './updateDataHack'
import { updateModel } from './updateDataHandle'
import { updateView } from './updateView.compact'
import addField from './addValidateField'

var rchangeFilter = /\|\s*change\b/
var rdebounceFilter = /\|\s*debounce(?:\(([^)]+)\))?/
var duplexDir = 'ms-duplex'


avalon.directive('duplex', {
    priority: 2000,
    beforeInit: function () {
        var expr = this.expr
        if (rchangeFilter.test(expr)) {
            this.isChanged = true
            expr = expr.replace(rchangeFilter, '')
        }
        var match = expr.match(rdebounceFilter)
        if (match) {
            expr = expr.replace(rdebounceFilter, '')
            if (!this.isChanged) {
                this.debounceTime = parseInt(match[1], 10) || 300
            }
        }
        this.expr = expr

    },
    init: function () {
        var expr = this.expr
        var node = this.node
        var etype = node.props.type
        //处理数据转换器
        var parsers = this.param, dtype
        var isChecked = false
        parsers = parsers ? parsers.split('-').map(function (a) {
            if (a === 'checked') {
                isChecked = true
            }
            return a
        }) : []

        if (rcheckedType.test(etype) && isChecked) {
            //如果是radio, checkbox,判定用户使用了checked格式函数没有
            parsers = []
            dtype = 'radio'
        }
        this.parser = parsers
        if (!/input|textarea|select/.test(node.nodeName)) {
            if ('contenteditable' in node.props) {
                dtype = 'contenteditable'
            }
        } else if (!dtype) {
            dtype = node.nodeName === 'select' ? 'select' :
                etype === 'checkbox' ? 'checkbox' :
                    etype === 'radio' ? 'radio' :
                        'input'
        }
        this.dtype = dtype
        var isChanged = false, debounceTime = 0
        //判定是否使用了 change debounce 过滤器
        if (dtype === 'input' || dtype === 'contenteditable') {
            this.isString = true
        } else {
            delete this.isChange
            delete this.debounceTime
        }
        this.userCb = node.props['data-duplex-changed']

    },
    diff: function (newVal, oldVal) {
        if (this.compareVal === void 0 || newVal + '' !== this.compareVal) {

            this.compareVal = newVal + ''
            return true
        }
    },
    update: function (vdom, value) {
        var dom = vdom.dom
        if (!dom.__ms_duplex__) {
            dom.__ms_duplex__ = this
            //绑定事件
            updateModelEvents(dom, this)
            //添加验证
            addField(dom, this)
        }
        var data = this
        //如果不支持input.value的Object.defineProperty的属性支持,
        //需要通过轮询同步, chrome 42及以下版本需要这个hack
        if (data.isString
            && !avalon.msie
            && updateModelHack === false
            && !dom.valueHijack) {

            dom.valueHijack = updateModel
            var intervalID = setInterval(function () {
                if (!avalon.contains(avalon.root, dom)) {
                    clearInterval(intervalID)
                } else {
                    dom.valueHijack({ type: 'poll' })
                }
            }, 30)
        }
        //更新视图
        updateView[data.dtype].call(data)

    }
})

function parseValue(val) {
    for (var i = 0, k; k = this.parsers[i++];) {
        var fn = avalon.parsers[k]
        if (fn) {
            val = fn.call(this, val)
        }
    }
    return val
}