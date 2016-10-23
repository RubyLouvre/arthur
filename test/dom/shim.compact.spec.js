import { avalon } from '../../src/dom/shim/compact'
import  '../../src/dom/ready/compact'

describe('shim', function () {
    it('avalon.cloneNode', function () {
       //注意,不要复制html元素 
            var div = document.createElement('map')
            var map = avalon.cloneNode(div)
    
            expect(map.nodeName).toBe('MAP')
    })

    it('avalon.contains', function (done) {
        avalon.ready(function(){
              expect( avalon.contains(avalon.root, document.body) ).toBe(true)
              done()
        })
    })
})
