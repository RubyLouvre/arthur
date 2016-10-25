import { avalon, msie } from '../seed/core'
import { clearString, stringPool, fill, rfill } from '../vtree/clearString'

var keyMap = avalon.oneObject("break,case,catch,continue,debugger,default,delete,do,else,false," +
    "finally,for,function,if,in,instanceof,new,null,return,switch,this," +
    "throw,true,try,typeof,var,void,while,with," + /* 关键字*/
    "abstract,boolean,byte,char,class,const,double,enum,export,extends," +
    "final,float,goto,implements,import,int,interface,long,native," +
    "package,private,protected,public,short,static,super,synchronized," +
    "throws,transient,volatile")
export var skipMap = avalon.mix({
    Math: 1,
    Date: 1,
    $event: 1,
    __vmodel__: 1
}, keyMap)
var rguide = /(^|[^\w\u00c0-\uFFFF_])(@|##)(?=[$\w])/g
var ruselessSp = /\s*(\.|\|)\s*/g
var rlocal = /[$a-z_][$\.\w\_]*/gi
var rregexp = /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\\\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/g
export function addScope(expr) {
    stringPool.map = {}
    var body = expr.trim().replace(rregexp, dig)//移除所有正则
    body = clearString(body)      //移除所有字符串
    body = body.replace(ruselessSp, '$1').//移除.|两端空白
        replace(rguide, '$1__vmodel__.').//转换@与##
        replace(rlocal, function (a, b) {
            var arr = a.split('.')
            if (!skipMap[arr[0]]) {
                return '__vmodel__.' + a
            }
            return a
        }).replace(rfill, fill).replace(rfill, fill)
    return body
}
export function createGetter(expr) {
    var body = addScope(expr)
    try {
        return new Function('__vmodel__', 'return ' + body + ';')
    } catch (e) {
        avalon.log('parse getter: ', expr, body, ' error')
        return avalon.noop
    }
}

/**
 * 生成表达式设值函数
 * @param  {String}  expr
 */
export function createSetter(expr) {
    var body = addScope(expr)
    if (!startWith(body, '__vmodel__.')) {
        body = ' __vmodel__.' + body
    }
    body = 'try{ ' + body + ' = __value__}catch(e){}'
    try {
        return new Function('__vmodel__', '__value__', body + ';')
    } catch (e) {
        avalon.log('parse setter: ', expr, ' error')
        return avalon.noop
    }
}