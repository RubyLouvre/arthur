import { avalon } from '../../src/seed/core'
import '../../src/dom/css/compact'

describe('css', function () {
    it('test', function () {
         var $root = avalon(avalon.root)
        expect( $root.position() ).toEqual({
            top: 0,
            left: 0
        })
        expect( $root.offsetParent()[0] ).toBe(avalon.root)
        expect( $root.css('color', 'red') ).toBe($root)
        expect( $root.css('color') ).toMatch(/red|rgb\(255,\s*0,\s*0\)/)
        $root.css('color', '')
        expect( avalon.root.style.color ).toBe('')
        expect( $root.offset() ).toEqual({left: 0, top: 0})
        
       expect( $root.css('opacity') ).toBe('1')
        $root.css('opacity','0.5')
        expect( $root.css('opacity') ).toBe('0.5')
        expect( $root.css('top') ).toBe('0px')
        expect( $root.css('left') ).toBe('0px')
    })

})
