import { avalon, config } from '../seed/core'
export function parseInterpolate(dir) {
    var rlineSp = /\n\r?/g
    var str = dir.nodeValue.trim().replace(rlineSp, '')
    var tokens = []
    do {//aaa{{@bbb}}ccc
        var index = str.indexOf(config.openTag)
        index = index === -1 ? str.length : index
        var value = str.slice(0, index)
        if (/\S/.test(value)) {
            tokens.push(avalon.quote(avalon._decode(value)))
        }
        str = str.slice(index + config.openTag.length)
        if (str) {
            index = str.indexOf(config.closeTag)
            var value = str.slice(0, index)
            tokens.push('(' + avalon.unescapeHTML(value) + ')')

            str = str.slice(index + config.closeTag.length)
        }
    } while (str.length)
    if (tokens.length === 1) {
       tokens[0] = tokens[0].slice(1, -1)
    }
    console.log(tokens)
    return [{
        expr: tokens.join('+'),
        name: 'nodeValue',
        type: 'nodeValue'
    }]
}