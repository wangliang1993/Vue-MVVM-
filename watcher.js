/**
 * 观察者：给需要变化的元素增加一个观察者，当数据变化后，指向性对应的方法
 */
class Watcher{
    constructor(vm, expr, cb) {
        this.vm = vm
        this.expr = expr
        this.cb = cb
        // 获取一下老的值
        this.value = this.get();
    }
    // 获取vm中的值
    getVal(vm, expr) {
        // 拆分成数组
        expr = expr.split('.');
        // 获取实例上对应的数据
        return expr.reduce((prev, next) => {
            // 返回结果是下一个prev
            return prev[next];
        },vm.$data);
    }
    // 获取老值
    get() {
        Dep.target = this
        let value = this.getVal(this.vm, this.expr);
        Dep.target = null
        return value;
    }
    // 对外暴露的方法
    update() {
        let newValue = this.getVal(this.vm, this.expr);
        let oldValue = this.value;
        if (newValue != oldValue) {
            // 调用对应的回调
            this.cb(newValue);
        }
    }
}