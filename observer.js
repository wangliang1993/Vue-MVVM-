class Observer{
    constructor(data) {
        this.observer(data);
    }
    // 对数据的原有属性添加 get和set方法
    observer(data) {
        // 判断数据不存在，或者不是对象
        if (!data || typeof data !== 'object') {
            return;
        }
        // 将数据 一一劫持
        Object.keys(data).forEach(key => {
            // 劫持(数据响应式)
            this.defineReactive(data, key, data[key]);
            this.observer(data[key]);
        });

    }
    // 定义响应式
    defineReactive(data, key, value) {
        let _this = this;
        let dep = new Dep(); // 每个变化的数据都会对应一个数组，这个数组是存放所有更新的操作
        // 在获取对象某个值得时候加点东西
        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: true,
            get() {
                Dep.target && dep.addSub(Dep.target)
                return value;
            },
            set(newValue) {
                if (newValue != value) {
                    // 如果数据是对象，在做一次劫持
                    _this.observer(newValue);
                    value = newValue;
                    dep.notify();  //通知所有，数据更新
                }
            }
        })
    }
}

/**
 * 发布订阅
 */
class Dep{
    constructor() {
        // 订阅的数组
        this.subs = []
    }
    //添加订阅
    addSub(watcher) {
        this.subs.push(watcher);
    }
    // 通知所有
    notify() {
        this.subs.forEach(watcher => {
            watcher.update();
        });
    }
}