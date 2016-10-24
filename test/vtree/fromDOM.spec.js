import { avalon, vdom } from '../../src/vdom/compact'

import { fromDOM } from '../../src/vtree/fromDOM'

describe('fromDOM', function () {

    
     it('remove empty text node', function () {
            var f = document.createElement('div')
            f.style.cssText = 'color:red;'
            var a = document.createTextNode('xxx')
            var b = document.createElement('p')
            f.appendChild(a)
            f.appendChild(b)
            f.appendChild(document.createTextNode(''))
            f.appendChild(document.createTextNode('&nbsp;'))
            var aa = fromDOM(f)[0]
            expect(aa.children.length).toBe(3)
    })
    it('selectedIndex', function () {
            var div = document.createElement('div')
            div.innerHTML = heredoc(function () {
                /*
                 <select>
                 <option>1</option>
                 <option selected >2</option>
                 <option>3</option>
                 </select>
                 */
            })
            
            
            var root = fromDOM(div)[0]
            var select = root.children[0]
          
            expect(select.props.selectedIndex).toBe(1)
            expect(select.children.length).toBe(3)
           
           
    })
})
