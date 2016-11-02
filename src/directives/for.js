import { avalon, createAnchor, createFragment, isObject, ap } from '../seed/core'

import { observeItemObject } from '../vmodel/share'
import { makeHandle } from './on'
import { addScope } from '../parser/index'


var rforAs = /\s+as\s+([$\w]+)/
var rident = /^[$a-zA-Z_][$a-zA-Z0-9_]*$/
var rinvalid = /^(null|undefined|NaN|window|this|\$index|\$id)$/
var rargs = /[$\w_]+/g
avalon.directive('for', {
    delay: true,
    priority: 3,
    parse: function (binding) {
        var str = binding.origExpr = binding.expr, asName
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
        binding.expr = arr[1]
        binding.keyName = kv[0]
        binding.valName = kv[1]
        binding.signature = avalon.makeHashCode('for')
        if (asName) {
            binding.asName = asName
        }
    },
    init: function (watcher) {
        var f = watcher.node

        "begin,end,parentChildren,forCb".replace(avalon.rword, function (name) {
            watcher[name] = f[name]
            delete f[name]
        })
        var cb = watcher.forCb
        if (typeof cb === 'string' && cb) {
            var arr = addScope(cb, 'for')
            var body = makeHandle(arr[0])
            watcher.forCb = new Function('$event', 'var __vmodel__ = this\nreturn ' + body)
        }

        f.children.push({
            nodeName: '#comment',
            nodeValue: watcher.signature
        })
        watcher.fragment = ['<div>', f.fragment, '<!--', watcher.signature, '--></div>'].join('')
        watcher.node = watcher.begin
        watcher.cache = {}
    },
    diff: function (newVal, oldVal) {
        var traceIds = createFragments(this, newVal)
        if (this.oldTrackIds === void 0)
            return true

        if (this.oldTrackIds !== traceIds) {
            this.oldTrackIds = traceIds
            return true
        }

    },
    update: function (node, value) {
        if (this.updating)
            return
        this.updating = true
        if (!this.preFragments) {
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
function createFragments(watcher, obj) {
    if (isObject(obj)) {
        var array = Array.isArray(obj)
        var ids = []
        var fragments = [], i = 0
        avalon.each(obj, function (key, value) {
            var k = array ? getTraceKey(value) : key
            fragments.push(new Fragment(k, value, i++))
            ids.push(k)
        })
        watcher.isArray = array
        if (watcher.fragments) {
            watcher.preFragments = watcher.fragments
            watcher.fragments = fragments
        } else {
            watcher.fragments = fragments
        }
        return ids.join(';;')
    } else {
        return NaN
    }
}


function mountList(watcher) {

    var args = watcher.fragments.map(function (fragment, index) {
        FragmentDecorator(fragment, watcher, index)
        saveInCache(watcher.cache, fragment)
        return fragment
    })
    var list = watcher.parentChildren
    var i = list.indexOf(watcher.begin)
    list.splice.apply(list, [i + 1, 0].concat(args))
}

function diffList(watcher) {

    var cache = watcher.cache
    var newCache = {}
    var fuzzy = []
    var list = watcher.preFragments
    var oldLen = list.length
    list.forEach(function (el) {
        el._destory = true
    })
    watcher.fragments.forEach(function (c, index) {
        var fragment = isInCache(cache, c.key)
        //取出之前的文档碎片
        if (fragment) {
            delete fragment._destory
            fragment.oldIndex = fragment.index
            fragment.index = index // 相当于 c.index
            fragment.vm[watcher.keyName] = watcher.isArray ? index : fragment.key
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
            fragment.vm[watcher.valName] = val
            fragment.vm[watcher.keyName] = watcher.isArray ? index : fragment.key
            delete fragment._destory
        } else {
            fragment = FragmentDecorator(c, watcher, c.index)
            list.push(fragment)
        }

        saveInCache(newCache, fragment)
    })

    watcher.fragments = list
    list.sort(function (a, b) {
        return a.index - b.index
    })
    var ch = watcher.parentChildren
    var i = ch.indexOf(watcher.begin)
    list.splice.apply(ch, [i + 1, oldLen].concat(list))

    watcher.cache = newCache
}
function updateList(watcher) {

    var before = watcher.begin.dom
    var parent = before.parentNode
    var list = watcher.fragments
    var end = watcher.end.dom
    for (var i = 0, item; item = list[i]; i++) {
        if (item._destory) {
            list.splice(i, 1)
            i--
            item.destory()
            continue
        }
        if (item.oldIndex !== item.index) {
            var f = item.move()
            parent.insertBefore(f, before.nextSibling)
        }
        before = item.split
    }
}

function Fragment(key, val, index) {
    this.nodeName = '#document-fragment'
    this.key = key
    this.val = val
    this.index = index
    this.children = []
}
Fragment.prototype = {
    destory: function () {
        this.move()
        this.boss.destroy()
        for (var i in this) {
            this[i] = null
        }
    },
    move: function () {
        var f = createFragment()
        this.children.forEach(function (el) {
            f.appendChild(avalon.vdom(el, 'toDOM'))
        })
        return f
    }
}
/**
 * 
 * @param {type} fragment
 * @param {type} watcher
 * @param {type} index
 * @returns { key, val, index, oldIndex, watcher, dom, split, boss, vm}
 */
function FragmentDecorator(fragment, watcher, index) {

    fragment.watcher = watcher
    fragment.vm = observeItemObject(watcher.vm, {
        data: new function () {
            var data = {}
            data[watcher.keyName] = watcher.isArray ? index : fragment.key
            data[watcher.valName] = fragment.val
            if (watcher.asName) {
                data[watcher.asName] = []
            }
            return data
        }
    })

    fragment.index = index

    fragment.boss = avalon.scan(watcher.fragment, fragment.vm, function () {
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

