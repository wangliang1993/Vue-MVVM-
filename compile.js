class Compile{
    constructor(el, vm) {
        this.el = this.isElementNode(el) ? el : document.querySelector(el);
        this.vm = vm;
        if (this.el) {
            // 能获取到这个元素，开始编译
            // 1.先把真实的dom转移到内存中
            let fragment = this.nodeToFragment(this.el);
            // 2.编译，提取想要的元素节点和文本节点 v-model  {{}}
            this.compile(fragment);
            // 3.把编译好的fragmant放回界面中
            this.el.appendChild(fragment);
        }
    }

    /**
     * 辅助方法
     */
    // 判断是否是元素节点
    isElementNode(node) {
        return node.nodeType === 1;
    }
    // 判断是不是指令
    isDirective(name) {
        return name.includes('v-');
    }


     /**
      * 核心方法
      */
     // 节点转换成文档碎片
     nodeToFragment(el) {
         // 创建文档碎片
        let fragment = document.createDocumentFragment();
        // 保存el中遍历的每个顶层元素
        let firstChild;
        // 遍历添加到文档碎片中
        while(firstChild = el.firstChild) {
            fragment.appendChild(firstChild);
        }
        // 返回内存中节点
        return fragment;
     }
     // 编译核心方法
     compile(fragment) {
         // 拿到每个第一层节点
        let childNodes = fragment.childNodes;
        // 遍历节点
        Array.from(childNodes).forEach(node => {
            if (this.isElementNode(node)) {
                // 编译元素
                this.compileElement(node);
                // 是元素节点，递归继续深入子节点
                this.compile(node);
            } else {
                // 编译文本
                this.compileText(node);
            }
        });
     }
     // 编译元素
     compileElement(node) {
        // 带 v-model
        // 去除当前节点的属性
        let attrs = node.attributes;
        Array.from(attrs).forEach(attr => {
            // 判断属性名称是否包含v-
            let attrName = attr.name
            if (this.isDirective(attrName)) {
                // 取到对应的值放到节点中
                let expr = attr.value
                // 获取类型
                let [,type] = attrName.split('-');
                // 在vm中取对应的值放到节点中
                CompileUtil[type](node, this.vm, expr);
            }
        });
     }
     // 编译文本
     compileText(node) {
        // 带 {{}}
        // 获取文本内容
        let expr = node.textContent;  
        // 定义正则对象
        let reg = /\{\{([^}]+)\}\}/g;
        if (reg.test(expr)) {
            // 在vm中取对应的值放到节点中
            CompileUtil['text'](node, this.vm, expr);
        }
     }
}

CompileUtil = {
    // 获取vm中的值
    getVal(vm, expr) {
        // 拆分成数组
        expr = expr.split('.');
        // 获取实例上对应的数据
        return expr.reduce((prev, next) => {
            // 返回结果是下一个prev
            return prev[next];
        },vm.$data);
    },
    // 获取文本中的值
    getTextVal(vm, expr) {
        return expr.replace(/\{\{([^}]+)\}\}/g, (...arguments) => {
            return this.getVal(vm, arguments[1]);
        });
    },
    // input事件改变的时候给变量赋值
    setVal(vm, expr, value) {
        expr = expr.split('.');
        return expr.reduce((prev, next, cueerntIndex) => {
            // 当前索引等于数组长度-1
            if (cueerntIndex === expr.length - 1) {
                 prev[next] = value;
            }
            // 返回结果是下一个prev
            return prev[next];
        },vm.$data);
    },
    // 文本处理
    text(node, vm, expr) {
        let updateFn = this.updater['textUpdater'];
        let value = this.getTextVal(vm, expr);
        expr.replace(/\{\{([^}]+)\}\}/g, (...arguments) => {
            // 加监控，数据变化了，调用watcher的ccallback
            new Watcher(vm, arguments[1], (newValue) => {
                // 数据变化，文本几点需要重新获取依赖的数据，更新文本中的内容
                updateFn && updateFn(node, this.getTextVal(vm, expr));
            });
        });
        updateFn && updateFn(node, value);
    },
    // 输入框处理
    model(node, vm, expr) {
        let updateFn = this.updater['modelUpdater'];
        // 加监控，数据变化了，调用watcher的ccallback
        new Watcher(vm, expr, (newValue) => {
            // 当值变化后会调用callback将新的值传递过来
            updateFn && updateFn(node, this.getVal(vm, expr));
        });
        node.addEventListener('input', (e) => {
            let newValue = e.target.value;
            this.setVal(vm, expr, newValue);
        });
        updateFn && updateFn(node, this.getVal(vm, expr));
    },
    updater: {
        // 文本更新
        textUpdater(node, value) {
            node.textContent = value;
        },
        // 输入框更新
        modelUpdater(node, value) {
            node.value = value;
        }
    }
}