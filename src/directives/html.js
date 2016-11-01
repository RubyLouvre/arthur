  avalon.directive('html', {
        update: function (node, value) {
            this.boss && this.boss.destroy()
           
            this.boss = avalon.scan('<div>'+value+'</div>', this.vm, function(){
                var oldRoot = this.root
                node.children = oldRoot.children
                this.root = node
                avalon.clearHTML(node.dom)
            })
       
      
        },
        delay: true
    })