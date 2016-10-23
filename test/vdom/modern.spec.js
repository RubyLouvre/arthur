import {avalon, vdom, VText, VComment,VElement, VFragment } from '../../src/vdom/modern'
describe('vdom', function () {
    describe('VElement', function () {
        it('test', function () {
            var el = new VElement('p', { title: '111' }, [])
            expect(el).toInstanceOf(VElement)
            expect(el).not.toHaveProperty('toDOM')
            expect(el).not.toHaveProperty('toHTML')
            expect(el.toDOM().title).toBe('111')
            expect(el.toHTML().toLowerCase()).toBe('<p title="111"></p>')
            if (avalon.modern) {
                var circle = new VElement('circle', {}, [])
                expect(circle.toDOM().nodeName).toBe('circle')


                var template = new VElement('template', {}, [
                    new VText('111')
                ])
                expect(template.toDOM().nodeName).toBe('TEMPLATE')


            }
            var xmp = new VElement('xmp', { 'for': 'ddd', 'class': 'a b', style: 'border: 4px' }, [
                new VText('111')
            ])
            expect(xmp.toDOM().nodeName).toBe('XMP')
            expect(xmp.toDOM().htmlFor).toBe('ddd')
            expect(xmp.toDOM().className).toBe('a b')
            expect(xmp.toDOM().style.borderWidth).toMatch(/4/i)
            var noscript = new VElement('noscript', {}, [
                new VText('111')
            ])

            expect(noscript.toDOM().nodeName).toBe('NOSCRIPT')
            expect(noscript.toDOM().innerText).toBe('111')

            var style = new VElement('style', {}, [
                new VText('.blue{color:blue}')
            ])
            expect(style.toDOM().nodeName).toBe('STYLE')
            var script = new VElement('script', {}, [
                new VText('var a = 1')
            ])
            expect(script.toDOM().nodeName).toBe('SCRIPT')
            expect(script.toDOM().text).toBe('var a = 1')

            var input = new VElement('input', { type: 'password' }, [

            ], true)
            expect(input.toDOM().nodeName).toBe('INPUT')
            expect(input.toDOM().type).toBe('password')
            expect(input.toHTML()).toBe('<input type="password"/>')
            expect(vdom(input, 'toDOM').nodeName).toBe('INPUT')
        })

    })

    describe('VComment', function () {

        it('test', function () {
            var el = new VComment('aaa')
            expect(el).toInstanceOf(VComment)
            expect(el).not.toHaveProperty('toDOM')
            expect(el).not.toHaveProperty('toHTML')
            expect(el.nodeValue).toBe('aaa')
            expect(el.nodeName).toBe('#comment')
            expect(el.toDOM().nodeType).toBe(8)
            expect(el.toHTML()).toBe('<!--aaa-->')
            expect(vdom(el, 'toDOM')).toBe(el.dom)
        })
    })
    describe('VText', function () {

        it('test', function () {
            var el = new VText('aaa')
            expect(el).toInstanceOf(VText)
            expect(el).toHaveProperty('nodeValue')
            expect(vdom(el, 'toDOM')).toBe(el.dom)

            expect(avalon.domize(el)).toBe(el.dom)
        })
    })

    describe('VFragment', function () {

        it('test', function () {
            var el = new VFragment([])
            expect(el).toInstanceOf(VFragment)
            expect(el).not.toHaveProperty('toDOM')
            expect(el).not.toHaveProperty('toHTML')
            expect(el.children).toEqual([])
            expect(el.nodeName).toBe('#document-fragment')
            expect(el.toDOM().nodeType).toBe(11)
            expect(el.toHTML()).toBe('')
            expect(el.toDOM().nodeType).toBe(11)
            var hasChildren = new VFragment([
                new VElement('p', {}, [
                    new VText('ooooo')
                ])
            ])
            expect(hasChildren.toDOM().children.length).toBe(1)
            expect(hasChildren.toHTML()).toBe('<p>ooooo</p>')
            expect(vdom(el, 'toDOM')).toBe(el.dom)
        })
    })



    describe('vdom', function () {
        it('test', function () {
            var el = vdom(null, 'toHTML')
            expect(el).toBe('')
            var el2 = vdom(null, 'toDOM')
            expect(el2.nodeType).toBe(11)

         
        })
    })

})