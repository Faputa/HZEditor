class Panel {
    constructor(zones) {
        this.canvas = document.getElementById('tutorial')
        this.ctx = canvas.getContext('2d')
        this.zones = zones || []
    }
    draw() {
        this.zones.forEach(zone => zone.draw())
    }
}

class Zone {
    constructor(points) {
        this.points = points || []
    }
    draw() {
    }
}

class Point {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
    draw() {
    }
}