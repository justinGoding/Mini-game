class AABB {
    constructor(center, halfwidth_x, halfwidth_y) {
        this.center = center;
        this.half = {x: halfwidth_x, y: halfwidth_y};
    }
}

class Circle {
    constructor(center, radius) {
        this.center = center;
        this.radius = radius;
    }
}