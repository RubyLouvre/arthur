import { avalon, vdom } from '../../src/vdom/compact'

import { fromString } from '../../src/vtree/fromString'

describe('fromString', function () {

    it('makeTbody', function () {
        var str = heredoc(function () {
                /*
                 <table ms-controller="render1">
                 <tr id='tbodyChild' ms-for="el in @arr"><td>222</td></tr>
                 </table>
                 <span>222</span> <span>  </span>
                 */
            })
            var nodes = fromString(str)
            var f = avalon.vdom(nodes, 'toDOM')
            expect(f.childNodes.length).toBe(3)
            var table = f.childNodes[0]
            expect(table.getElementsByTagName('tbody').length).toBe(1)
    })
    it('自动移除option下面的标签', function () {
            var str = heredoc(function () {
                /*
                 <select ms-controller="render2">
                 <option><span>111</span><i>222</i></option>
                 <option><span><span>222</span></span></option>
                 </select>
                 */
            })
            var select = fromString(str)[0]

            expect(select.children[0].children[0].nodeValue).toBe('111222')
            expect(select.children[1].children[0].nodeValue).toBe('222')

        })
         it('将textarea里面的内容变成value', function () {
            var str = heredoc(function () {
                /*
                 <textarea ms-controller="render3"><span>333</span></textarea>
                 
                 */
            })
            var textarea = fromString(str)[0]
            expect(textarea.props.type).toBe('textarea')
            expect(textarea.children.length).toBe(1)
            expect(textarea.props.value).toBe('<span>333</span>')

        })
        
        it('将script/noscript/xmp/template的内容变成文本节点', function () {
            var str = heredoc(function () {
                /*
                 <div ms-controller="render4">
                 <script><span>111</span></script>
                 <noscript><span>222</span></noscript>
                 <xmp><span>333</span></xmp>
                 <template><span>444</span></template>
                 <style>body{color:12px;}</style>
                 </div>
                 */
            })
            var div = fromString(str)[0]

            expect(div.children.length).toBe(5)
            var c = div.children
            expect(c[0].children[0].nodeValue).toBe('<span>111</span>')
            expect(c[1].children[0].nodeValue).toBe('<span>222</span>')
            expect(c[2].children[0].nodeValue).toBe('<span>333</span>')
            expect(c[3].children[0].nodeValue).toBe('<span>444</span>')
            expect(c[4].children[0].nodeValue).toBe('body{color:12px;}')
        })
})

