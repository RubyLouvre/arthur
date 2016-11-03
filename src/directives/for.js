import { avalon, createAnchor, createFragment, isObject, ap } from '../seed/core'

import { observeItemObject } from '../vmodel/share'
import { makeHandle } from './on'
import { VFragment } from '../vdom/VFragment'

import { addScope } from '../parser/index'


var rforAs = /\s+as\s+([$\w]+)/
var rident = /^[$a-zA-Z_][$a-zA-Z0-9_]*$/
var rinvalid = /^(null|undefined|NaN|window|this|\$index|\$id)$/
var rargs = /[$\w_]+/g
avalon.directive('for', {
    delay: true,
    priority: 3,
    beforeInit: function () {
        var str = this.expr, asName
        str = str.replace(rforAs, function (a, b) {
            /* istanbul ignore if */
            if (!rident.test(b) || rinvalid.test(b)) {
                avalon.error('alias ' + b + ' is invalid --- must be a valid JS identifier which is not a reserved name.')
            } else {
                asName = b
            }
            return ''
        })

        var arr = str.split(' in ')
        var kv = arr[0].match(rargs)
        if (kv.length === 1) {//确保avalon._each的回调有三个参数
            kv.unshift('$key')
        }
        this.expr = arr[1]
        this.keyName = kv[0]
        this.valName = kv[1]
        this.signature = avalon.makeHashCode('for')
        if (asName) {
            this.asName = asName
        }
    },
    init: function () {
        var f = this.node
        var me = this
        "begin,end,parentChildren,forCb".replace(avalon.rword, function (name) {
            me[name] = f[name]
            delete f[name]
        })
        var cb = this.forCb
        if (typeof cb === 'string' && cb) {
            var arr = addScope(cb, 'for')
            var body = makeHandle(arr[0])
            this.forCb = new Function('$event', 'var __vmodel__ = this\nreturn ' + body)
        }

        f.children.push({
            nodeName: '#comment',
            nodeValue: this.signature
        })
        this.fragment = ['<div>', f.fragment, '<!--', this.signature, '--></div>'].join('')
        this.node = this.begin
        this.cache = {}
    },
    diff: function (newVal, oldVal) {

        if (this.updating) {
            return
        }
        this.updating = true
        var traceIds = createFragments(this, newVal)
        if (this.oldTrackIds === void 0)
            return true

        if (this.oldTrackIds !== traceIds) {
            this.oldTrackIds = traceIds
            return true
        }

    },
    update: function () {

        if (!this.preFragments) {
            this.fragments = this.fragments || []
            mountList(this)
        } else {
            diffList(this)
            updateList(this)
        }

        if (this.forCb) {
            this.forCb.call(this.vm, {
                type: 'rendered',
                target: this.begin.dom,
                signature: this.signature
            })
        }
        delete this.updating
    }
})

function getTraceKey(item) {
    var type = typeof item
    return item && type === 'object' ? item.$hashcode : type + ':' + item
}

//创建一组fragment的虚拟DOM
function createFragments(instance, obj) {
    if (isObject(obj)) {
        var array = Array.isArray(obj)
        var ids = []
        var fragments = [], i = 0
        avalon.each(obj, function (key, value) {
            var k = array ? getTraceKey(value) : key
            fragments.push(new VFragment([], k, value, i++))
            ids.push(k)
        })
        instance.isArray = array
        if (instance.fragments) {
            instance.preFragments = instance.fragments
            instance.fragments = fragments
        } else {
            instance.fragments = fragments
        }
        return ids.join(';;')
    } else {
        return NaN
    }
}


function mountList(instance) {

    var args = instance.fragments.map(function (fragment, index) {
        FragmentDecorator(fragment, instance, index)
        saveInCache(instance.cache, fragment)
        return fragment
    })
    var list = instance.parentChildren
    var i = list.indexOf(instance.begin)
    list.splice.apply(list, [i + 1, 0].concat(args))

}

function diffList(instance) {

    var cache = instance.cache
    var newCache = {}
    var fuzzy = []
    var list = instance.preFragments

    list.forEach(function (el) {
        el._destory = true
    })
    instance.fragments.forEach(function (c, index) {
        var fragment = isInCache(cache, c.key)
        //取出之前的文档碎片
        if (fragment) {
            delete fragment._destory
            fragment.oldIndex = fragment.index
            fragment.index = index // 相当于 c.index
          //  fragment.vm[instance.valName] = c.val ??
            fragment.vm[instance.keyName] = instance.isArray ? index : fragment.key
            saveInCache(newCache, fragment)
        } else {
            //如果找不到就进行模糊搜索
            fuzzy.push(c)
        }
    })
    fuzzy.forEach(function (c) {
        var fragment = fuzzyMatchCache(cache, c.key)
        if (fragment) {//重复利用
            fragment.oldIndex = fragment.index
            fragment.key = c.key
            var val = fragment.val = c.val
            var index = fragment.index = c.index

            fragment.vm[instance.valName] = val
            fragment.vm[instance.keyName] = instance.isArray ? index : fragment.key
            delete fragment._destory
        } else {
            fragment = FragmentDecorator(c, instance, c.index)
            list.push(fragment)
        }

        saveInCache(newCache, fragment)
    })

    instance.fragments = list
    list.sort(function (a, b) {
        return a.index - b.index
    })

    instance.cache = newCache
}
function updateList(instance) {
    var before = instance.begin.dom
    var parent = before.parentNode
    var list = instance.fragments
    var end = instance.end.dom
    for (var i = 0, item; item = list[i]; i++) {
        if (item._destory) {
            list.splice(i, 1)
            i--
            item.destory()
            continue
        }
        if (item.oldIndex !== item.index) {
            var f = item.toFragment()
            parent.insertBefore(f, before.nextSibling || end)
        }
        before = item.split
    }
    var ch = instance.parentChildren
    var startIndex = ch.indexOf(instance.begin)
    var endIndex = ch.indexOf(instance.end)

    list.splice.apply(ch, [startIndex + 1, endIndex - startIndex].concat(list))
}


/**
 * 
 * @param {type} fragment
 * @param {type} this
 * @param {type} index
 * @returns { key, val, index, oldIndex, this, dom, split, boss, vm}
 */
function FragmentDecorator(fragment, instance, index) {

    fragment.this = instance
    fragment.vm = observeItemObject(instance.vm, {
        data: new function () {
            var data = {}
            data[instance.keyName] = instance.isArray ? index : fragment.key
            data[instance.valName] = fragment.val
            if (instance.asName) {
                data[instance.asName] = []
            }
            return data
        }
    })

    fragment.index = index

    fragment.boss = avalon.scan(instance.fragment, fragment.vm, function () {
        var oldRoot = this.root
        ap.push.apply(fragment.children, oldRoot.children)
        this.root = fragment
    })
    return fragment
}
// 新位置: 旧位置
function isInCache(cache, id) {
    var c = cache[id]
    if (c) {
        var arr = c.arr
        /* istanbul ignore if*/
        if (arr) {
            var r = arr.pop()
            if (!arr.length) {
                c.arr = 0
            }
            return r
        }
        delete cache[id]
        return c
    }
}
//[1,1,1] number1 number1_ number1__
function saveInCache(cache, component) {
    var trackId = component.key
    if (!cache[trackId]) {
        cache[trackId] = component
    } else {
        var c = cache[trackId]
        var arr = c.arr || (c.arr = [])
        arr.push(component)
    }
}

var rfuzzy = /^(string|number|boolean)/
var rkfuzzy = /^_*(string|number|boolean)/
function fuzzyMatchCache(cache) {
    var key
    for (var id in cache) {
        var key = id
        break
    }
    if (key) {
        return isInCache(cache, key)
    }
}

