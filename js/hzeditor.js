(function (global) {
  function hzeditor(/** @type {HTMLCanvasElement} */ canvas, option = []) {
    if (!canvas.getContext) {
      return false
    }
    // 使canvas可以响应键盘事件
    canvas.tabIndex = 1
    /** @type {CanvasRenderingContext2D} */
    let ctx = canvas.getContext('2d')

    /**
     * 热区
     * @constructor
     * @param {Array} option 选项数组
     * @param {boolean} closed 是否闭合
     */
    function Zone(option = [], closed = true) {
      this.points = option.map(i => new Point(i))
      this.closed = closed
      if (this.points < 3) {
        this.closed = false
      }
      this.hovered = false
    }

    /**
     * 导出选项
     */
    Zone.prototype.toOption = function () {
      return this.points.map(p => p.toOption())
    }

    /**
     * 获取左上角的点
     */
    Zone.prototype.topLeft = function () {
      return this.points.reduce((p0, p1) => {
        let [x0, y0] = p0.toOption()
        let [x1, y1] = p1.toOption()
        if ((x0 * x0 + y0 * y0) < (x1 * x1 + y1 * y1)) {
          return p0
        } else {
          return p1
        }
      })
    }

    /**
     * 取消悬停
     */
    Zone.prototype.unhover = function () {
      this.hovered = false
      this.points.forEach(p => p.unhover())
    }

    /**
     * 悬停
     */
    Zone.prototype.hover = function () {
      this.hovered = true
      this.points.forEach(p => p.hover())
    }

    /**
     * 移动热区
     * @param {number} x 横向偏移量
     * @param {number} y 纵向偏移量
     */
    Zone.prototype.move = function (x, y) {
      this.points.forEach(p => p.move(x, y))
    }

    /**
     * 画热区
     */
    Zone.prototype.draw = function () {
      // 设置样式
      let hasError = this.isDistortion() || this.isOutOfBound()
      let fillStyle = '#c8d0d275'
      let strokeStyle = hasError ? '#ff0000' :
        this.hovered ? '#7a7bef' :
          '#0000ff'
      // 开始绘图
      ctx.save()
      // 画点
      this.points.forEach(p => p.draw())
      // 描边
      ctx.beginPath()
      this.points.forEach((a, b) => {
        if (b === 0) {
          ctx.moveTo(a.x, a.y)
        } else {
          ctx.lineTo(a.x, a.y)
        }
      })
      if (this.closed) {
        // 闭合路径
        ctx.closePath()
        // 填充
        ctx.fillStyle = fillStyle
        ctx.fill()
      }
      ctx.strokeStyle = strokeStyle
      ctx.stroke()
      ctx.restore()
    }

    /**
     * 是否被选中
     * @param {number} x 横坐标
     * @param {number} y 纵坐标
     */
    Zone.prototype.isSelected = function (x, y) {
      for (let point of this.points) {
        if (point.isSelected(x, y)) {
          return true
        }
      }
      ctx.save()
      ctx.beginPath()
      this.points.forEach((a, b) => {
        if (b === 0) {
          ctx.moveTo(a.x, a.y)
        } else {
          ctx.lineTo(a.x, a.y)
        }
      })
      if (ctx.isPointInPath(x, y)) {
        ctx.restore()
        return true
      }
      ctx.restore()
      return false
    }

    /**
     * 热区是否扭曲交叉
     * @returns {boolean} false否true是
     */
    Zone.prototype.isDistortion = function () {
      for (let i = 0; i < this.points.length; i++) {
        let p1 = this.points[i]
        let p2 = this.points[(i + 1) % this.points.length]
        for (let j = i; j < this.points.length; j++) {
          let q1 = this.points[j]
          let q2 = this.points[(j + 1) % this.points.length]
          let cc = isCrossing2(p1, p2, q1, q2)
          if ((j + 1) % this.points.length === i ||
            (i + 1) % this.points.length === j) {
            if (cc === 2) {
              return true
            }
          } else {
            if (cc === 1) {
              return true
            }
          }
        }
      }
      return false
    }

    /**
     * 热区是否超出界限
     * @returns {boolean} false否true是
     */
    Zone.prototype.isOutOfBound = function () {
      for (let point of this.points) {
        if (point.isOutOfBound()) {
          return true
        }
      }
      return false
    }

    /**
     * 超出界限时调整热区位置
     */
    Zone.prototype.adjustIfOutOfBound = function () {
      let x = 0
      let y = 0
      this.points.forEach(p => {
        let _x = 0
        let _y = 0
        if (p.x < 0) {
          _x = 0 - p.x
        } else if (p.x > canvas.width) {
          _x = canvas.width - p.x
        }
        if (p.y < 0) {
          _y = 0 - p.y
        } else if (p.y > canvas.height) {
          _y = canvas.height - p.y
        }
        if (Math.abs(x) < Math.abs(_x)) {
          x = _x
        }
        if (Math.abs(y) < Math.abs(_y)) {
          y = _y
        }
      })
      this.points.forEach(p => p.move(x, y))
    }

    /**
     * 点
     * @constructor
     * @param {Array} option 坐标数组
     */
    function Point(option) {
      /** @type {number} */
      this.x = option[0]
      /** @type {number} */
      this.y = option[1]
      this.r = 5
      this.hovered = false
    }

    /**
     * 取消悬停
     */
    Point.prototype.unhover = function () {
      this.hovered = false
    }

    /**
     * 悬停
     */
    Point.prototype.hover = function () {
      this.hovered = true
    }

    /**
     * 移动点
     * @param {number} x 横向偏移量
     * @param {number} y 纵向偏移量
     */
    Point.prototype.move = function (x, y) {
      this.x += x
      this.y += y
    }

    /**
     * 导出选项
     */
    Point.prototype.toOption = function () {
      return [this.x, this.y]
    }

    /**
     * 画点
     */
    Point.prototype.draw = function () {
      // 设置样式
      let strokeStyle = this.hovered ? '#7a7bef' :
        '#ff0000'
      let lineWidth = 2
      // 开始绘图
      ctx.save()
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
      ctx.strokeStyle = strokeStyle
      ctx.lineWidth = lineWidth
      ctx.stroke()
      ctx.restore()
    }

    /**
     * 是否被选中
     * @param {number} x 横坐标
     * @param {number} y 纵坐标
     */
    Point.prototype.isSelected = function (x, y) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
      ctx.lineWidth = 2
      if (ctx.isPointInPath(x, y)) {
        ctx.restore()
        return true
      }
      ctx.restore()
      return false
    }

    /**
     * 点是否超出界限
     * @returns {boolean} false否true是
     */
    Point.prototype.isOutOfBound = function () {
      return !(
        0 <= this.x && this.x <= canvas.width &&
        0 <= this.y && this.y <= canvas.height
      )
    }

    /**
     * 超出界限时调整点位置
     */
    Point.prototype.adjustIfOutOfBound = function () {
      if (this.x < 0) {
        this.x = 0
      } else if (this.x > canvas.width) {
        this.x = canvas.width
      }
      if (this.y < 0) {
        this.y = 0
      } else if (this.y > canvas.height) {
        this.y = canvas.height
      }
    }

    /**
     * 编辑器
     * @constructor
     * @param {Array} option 选项数组
     */
    function Editor(option = []) {
      /** @type {[Zone]} */
      this.zones = option.map(i => new Zone(i))
      this.ismousedown = false
      this.mousebegin = { x: 0, y: 0 }
      /** @type {Point} */
      this.focusPoint = null
      /** @type {Zone} */
      this.focusZone = null
      // 导出canvas
      this.canvas = canvas
    }

    /**
     * 导出选项
     */
    Editor.prototype.toOption = function () {
      return this.zones.map(z => z.toOption())
    }

    /**
     * 重置选项
     */
    Editor.prototype.setOption = function (option = []) {
      this.zones = option.map(i => new Zone(i))
    }

    /**
     * 添加热区
     */
    Editor.prototype.append = function () {
      const padding = 100
      const delta = 10
      let [x, y] = [10, 10]
      const check = () => this.zones.reduce((a, z) => a || (
        x === z.topLeft().toOption()[0] &&
        y === z.topLeft().toOption()[1]
      ), false)
      for (let i = 0; i < this.zones.length && check(); i++) {
        [x, y] = [
          (x + delta) % (canvas.width - padding),
          (y + delta) % (canvas.height - padding)
        ]
      }
      this.zones.unshift(new Zone([
        [x, y],
        [x + padding, y],
        [x + padding, y + padding],
        [x, y + padding],
      ]))
    }

    /**
     * 被选中的热区
     * @param {number} x 横坐标
     * @param {number} y 纵坐标
     * @param {boolean} unshift 是否将选中热区移动到队列开头
     * @returns {Zone}
     */
    Editor.prototype.selectedZone = function (x, y, unshift) {
      for (let i = 0; i < this.zones.length; i++) {
        let zone = this.zones[i]
        if (zone.isSelected(x, y)) {
          if (unshift) {
            // 将选中的热区移动到数组开头，以优先选中
            this.zones.splice(i, 1)
            this.zones.unshift(zone)
          }
          return zone
        }
      }
      return null
    }

    /**
     * 被选中的点
     * @param {[Point]} points 点数组
     * @param {number} x 横坐标
     * @param {number} y 纵坐标
     * @returns {Point}
     */
    Editor.prototype.selectedPoint = function (x, y, points) {
      points = points || this.zones.reduce((a, b) => a.concat(b.points), [])
      for (let point of points) {
        if (point.isSelected(x, y)) {
          return point
        }
      }
      return null
    }

    /**
     * 删除热区
     * @param {Zone} zone 热区
     * @returns {boolean}
     */
    Editor.prototype.deleteZone = function (zone) {
      for (let i = 0; i < this.zones.length; i++) {
        if (zone === this.zones[i]) {
          this.zones.splice(i, 1)
          return true
        }
      }
      return false
    }

    /**
     * 删除点
     * @param {Point} point 点
     * @returns {boolean}
     */
    Editor.prototype.deletePoint = function (point) {
      for (let zone of this.zones) {
        for (let i = 0; i < zone.points.length; i++) {
          if (point === zone.points[i]) {
            zone.points.splice(i, 1)
            return true
          }
        }
      }
      return false
    }

    /**
     * 取消悬停
     */
    Editor.prototype.unhover = function () {
      canvas.style.cursor = ''
      this.zones.forEach(z => z.unhover())
    }

    /**
     * 悬停
     * @param {number} x 横坐标
     * @param {number} y 纵坐标
     */
    Editor.prototype.hover = function (x, y) {
      this.unhover()
      let zone = this.selectedZone(x, y)
      if (zone) {
        canvas.style.cursor = 'pointer'
        let point = this.selectedPoint(x, y, zone.points)
        if (point) {
          point.hover()
          return
        }
        zone.hover()
      }
    }

    /**
     * 移动
     * @param {number} x 横坐标
     * @param {number} y 纵坐标
     */
    Editor.prototype.move = function (x, y) {
      if (this.focusZone) {
        canvas.style.cursor = 'move'
        if (this.focusPoint) {
          this.focusPoint.move(x - this.mousebegin.x, y - this.mousebegin.y)
          this.focusPoint.adjustIfOutOfBound()
          return
        }
        this.focusZone.move(x - this.mousebegin.x, y - this.mousebegin.y)
        this.focusZone.adjustIfOutOfBound()
      }
    }

    /**
     * 绘制canvas
     */
    Editor.prototype.draw = function () {
      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // 绘制背景
      let step = 10
      ctx.save()
      ctx.lineWidth = 0.5
      ctx.strokeStyle = 'lightGray'
      ctx.beginPath()
      for (var i = step + 0.5; i < canvas.width; i += step) {
        ctx.moveTo(i, 0)
        ctx.lineTo(i, canvas.height)
      }
      for (var i = step + 0.5; i < canvas.height; i += step) {
        ctx.moveTo(0, i)
        ctx.lineTo(canvas.width, i)
      }
      ctx.stroke()
      ctx.restore()
      // 绘制热区
      let _zones = [...this.zones]
      _zones.reverse().forEach(z => z.draw())
      // 设置动画
      window.requestAnimationFrame(this.draw.bind(this))
    }

    /**
     * 鼠标按下事件
     * @param {MouseEvent} e
     */
    Editor.prototype.mousedown = function (e) {
      let { x, y } = offsetXY(e)
      this.focusZone = this.selectedZone(x, y, true)
      if (this.focusZone) {
        this.focusPoint = this.selectedPoint(x, y, this.focusZone.points)
      }
      this.mousebegin = { x, y }
      this.ismousedown = true
    }

    /**
     * 鼠标移动事件
     * @param {MouseEvent} e
     */
    Editor.prototype.mousemove = function (e) {
      let { x, y } = offsetXY(e)
      this.hover(x, y)
      if (this.ismousedown) {
        this.move(x, y)
      }
      this.mousebegin = { x, y }
    }

    /**
     * 键盘按下事件
     * @param {MouseEvent} e
     */
    Editor.prototype.keydown = function (e) {
      // delete键
      if (e.keyCode === 46) {
        if (this.focusPoint) {
          if (this.deletePoint(this.focusPoint)) {
            this.focusPoint = null
            return
          }
        }
        if (this.focusZone) {
          if (this.deleteZone(this.focusZone)) {
            this.focusZone = null
            return
          }
        }
      }
    }

    /**
     * 鼠标抬起事件
     * @param {MouseEvent} e
     */
    Editor.prototype.mouseup = function (e) {
      this.ismousedown = false
      this.mousebegin = { x: 0, y: 0 }
    }

    /**
     * 双击事件
     * @param {MouseEvent} e
     */
    Editor.prototype.dblclick = function (e) {
      let { x, y } = offsetXY(e)
      let point = this.selectedPoint(x, y)
      if (point) {
        this.deletePoint(point)
        this.focusPoint = null
        return
      }
      for (let zone of this.zones) {
        for (let i = 0; i < zone.points.length; i++) {
          let p1 = zone.points[i]
          let p2 = zone.points[(i + 1) % zone.points.length]
          ctx.save()
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.lineWidth = 5
          if (ctx.isPointInStroke(x, y)) {
            ctx.restore()
            zone.points.splice(i + 1, 0, new Point([x, y]))
            canvas.style.cursor = 'pointer'
            return
          }
          ctx.restore()
        }
      }
    }

    let editor = new Editor(option)
    editor.draw()

    canvas.addEventListener('mousedown', editor.mousedown.bind(editor))
    canvas.addEventListener('keydown', editor.keydown.bind(editor))
    canvas.addEventListener('dblclick', editor.dblclick.bind(editor))
    // 注意：mouseup事件应该注册到window上
    window.addEventListener('mouseup', editor.mouseup.bind(editor))
    // mousemove注册到window上体验更好
    window.addEventListener('mousemove', editor.mousemove.bind(editor))

    return editor

    /**
     * 直线和线段之间的关系
     * @param {Point} p1 直线p上的点
     * @param {Point} p2 直线p上的点
     * @param {Point} q1 线段q起点
     * @param {Point} q2 线段q终点
     * @returns 0相离1相交2重合3一点重合
     */
    function isCrossing(p1, p2, q1, q2) {
      // 向量p1→p2
      let [x0, y0] = [p2.x - p1.x, p2.y - p1.y]
      // 向量p1→q1
      let [x1, y1] = [q1.x - p1.x, q1.y - p1.y]
      // 向量p1→q2
      let [x2, y2] = [q2.x - p1.x, q2.y - p1.y]
      // 直线向量L和向量P0→P1的叉积
      let cp1 = x0 * y1 - x1 * y0
      // 直线向量L和向量P0-P2的叉积
      let cp2 = x0 * y2 - x2 * y0
      if (cp1 * cp2 < 0) {
        return 1
      }
      if (cp1 === 0 && cp2 === 0) {
        return 2
      }
      if (cp1 === 0 || cp2 === 0) {
        return 3
      }
      return 0
    }

    /**
     * 线段与线段之间的关系
     * @param {Point} p1 线段p的起点
     * @param {Point} p2 线段p的终点
     * @param {Point} q1 线段q的起点
     * @param {Point} q2 线段q的终点
     * @returns 0相离1相交2重合3一点重合
     */
    function isCrossing2(p1, p2, q1, q2) {
      let cc1 = isCrossing(p1, p2, q1, q2)
      let cc2 = isCrossing(q1, q2, p1, p2)
      if (cc1 === 0 || cc2 === 0) {
        return 0
      }
      if (cc1 === 1 && cc2 === 1) {
        return 1
      }
      if (cc1 === 3 || cc2 === 3) {
        return 3
      }
      let [_p1, , , _p2] = [p1, p2, q1, q2].sort((a, b) => a.x - b.x || a.y - b.y)
      let a = _p2.x - _p1.x || _p2.y - _p1.y
      let b = Math.abs(p2.x - p1.x || p2.y - p1.y)
      let c = Math.abs(q2.x - q1.x || q2.y - q1.y)
      if (a > b + c) {
        return 0
      }
      if (a < b + c) {
        return 2
      }
      if (a === b + c) {
        return 3
      }
    }

    /**
     * 获取鼠标相对canvas的偏移量
     * @param {MouseEvent} e
     * @returns {{x:number,y:number}}
     */
    function offsetXY(e) {
      // 鼠标相对于窗口的位置减去元素相对于窗口的位置
      let x = e.clientX - canvas.getBoundingClientRect().left
      let y = e.clientY - canvas.getBoundingClientRect().top
      return { x, y }
    }
  }

  if (typeof define === "function" && define.amd) {
    define(() => {
      return hzeditor;
    });
  } else if (typeof exports === "object") {
    module.exports = hzeditor;
  } else {
    global.hzeditor = hzeditor;
  }
})(this);
