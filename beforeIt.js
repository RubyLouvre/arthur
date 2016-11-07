function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
}

//if (typeof HTMLElement !== 'undefined' && !HTMLElement.prototype.click) {
//    HTMLElement.prototype.click = function() {
//      var ev = document.createEvent('MouseEvent');
//      ev.initMouseEvent(
//          'click',
//          /*bubble*/true, /*cancelable*/true,
//          window, null,
//          0, 0, 0, 0, /*coordinates*/
//          false, false, false, false, /*modifier keys*/
//          0/*button=left*/, null
//      );
//      this.dispatchEvent(ev);
//    };
//}
function fireClick(el) {
    if (el.click) {
        el.click()
    }else {
//https://developer.mozilla.org/samples/domref/dispatchEvent.html
        var evt = document.createEvent('MouseEvents')
        evt.initMouseEvent('click', true, true, window,
                0, 0, 0, 0, 0, false, false, false, false, 0, null);
        !el.dispatchEvent(evt);
    }
}