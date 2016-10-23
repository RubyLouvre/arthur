import { avalon } from '../../src/dom/shim/compact'

describe('shim', function () {
    it('avalon.cloneNode', function () {
        expect(avalon.cloneNode(avalon.root).nodeName).toBe('HTML')
    })
    it('avalon.contains', function () {
        expect(avalon.contains(avalon.root, document.body)).toBe(true)
    })
})
