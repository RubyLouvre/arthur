import { avalon } from '../../seed/core'
import { rcheckedType } from '../../dom/rcheckedType'

var rchangeFilter = /\|\s*change\b/
var rdebounceFilter = /\|\s*debounce(?:\(([^)]+)\))?/
export function duplexBeforeInit() {
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
}
export function duplexInit() {
    var expr = this.expr
    var node = this.node
    var etype = node.props.type
    this.parseValue = parseValue
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
}
export function duplexDiff(newVal, oldVal) {
    if (this.compareVal === void 0 || newVal + '' !== this.compareVal) {
        this.compareVal = newVal + ''
        return true
    }
}


export function duplexValidate(node, vnode) {
    var field = node.__ms_duplex__
    var rules = vnode['ms-rules']
    if (rules && !field.validator) {
        while (node && node.nodeType === 1) {
            var validator = node._ms_validator_

            if (validator) {
                field.rules = rules
                field.validator = validator

                if (avalon.Array.ensure(validator.fields, field)) {
                    validator.addField(field)
                }
                break
            }
            node = node.parentNode
        }
    }
}


export var valueHijack = false
try { //#272 IE9-IE11, firefox

    var setters = {}
    var aproto = HTMLInputElement.prototype
    var bproto = HTMLTextAreaElement.prototype
    var newSetter = function (value) { // jshint ignore:line
        setters[this.tagName].call(this, value)
        var data = this.__ms_duplex__
        if (!this.caret && data && data.isString) {
            data.update.call(this, { type: 'setter' })
        }
    }
    var inputProto = HTMLInputElement.prototype
    Object.getOwnPropertyNames(inputProto) //故意引发IE6-8等浏览器报错
    setters['INPUT'] = Object.getOwnPropertyDescriptor(aproto, 'value').set

    Object.defineProperty(aproto, 'value', {
        set: newSetter
    })
    setters['TEXTAREA'] = Object.getOwnPropertyDescriptor(bproto, 'value').set
    Object.defineProperty(bproto, 'value', {
        set: newSetter
    })
    valueHijack = true
} catch (e) {
    //在chrome 43中 ms-duplex终于不需要使用定时器实现双向绑定了
    // http://updates.html5rocks.com/2015/04/DOM-attributes-now-on-the-prototype
    // https://docs.google.com/document/d/1jwA8mtClwxI-QJuHT7872Z0pxpZz8PBkf2bGAbsUtqs/edit?pli=1
}

function parseValue(val) {
    for (var i = 0, k; k = this.parsers[i++];) {
        var fn = avalon.parsers[k]
        if (fn) {
            val = fn.call(this, val)
        }
    }
    return val
}

export var updateView = {
    input: function () {//处理单个value值处理
        this.dom.value = this.value
    },
    radio: function () {//处理单个checked属性
        var checked
        if (this.isChecked) {
            checked = !!this.value
        } else {
            checked = this.value + '' === this.dom.value
        }
        var dom = this.dom
      
      dom.checked = checked
       
    },
    checkbox: function () {//处理多个checked属性
        var checked = false
        var dom = this.dom
        var value = dom.value
        for (var i = 0; i < this.value.length; i++) {
            var el = this.value[i]
            if (el + '' === value) {
                checked = true
            }
        }
        dom.checked = checked
    },
    select: function () {//处理子级的selected属性
        var a = Array.isArray(this.value) ?
            this.value.map(String) : this.value + ''
        avalon(this.dom).val(a)
    },
    contenteditable: function () {//处理单个innerHTML
        this.dom.innerHTML = this.value
        this.duplex.call(this.dom)
    }
}
