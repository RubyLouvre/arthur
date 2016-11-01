  avalon.directive('html', {
        update: function (node, value) {
            this.boss && this.boss.destroy()
           
            var segement =  this.boss = avalon.scan('<div>'+value+'</div>', this.vm)
            node.children = segement.root.children
            var dom = node.dom
            avalon.clearHTML(dom)

            dom.appendChild( avalon.vdom( node.children, 'toDOM'))
          
      
        },
        delay: true
    })