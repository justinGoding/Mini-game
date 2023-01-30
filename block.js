const block_shapes={1: {x: 8, y: 8},
    2: {x: 4, y: 16},
    3: {x: 16, y: 4} }

class Ethereal_Block{
    constructor(){
        this.tag = "ethereal";
        this.transform = new Transform(new Vec2(gameEngine.mouse.x, gameEngine.mouse.y));

        let key = Math.floor(Math.random() * 3 + 1);
        let block_shape = block_shapes[key];
        this.collider = new Collider(new AABB(this.transform.pos, block_shape.x, block_shape.y), true, false, false);
    }

    movement() {
        let pos = this.transform.pos;
        let collider = this.collider.area;
        let mouse_pos = convertToGamePos(gameEngine.mouse.x, gameEngine.mouse.y);
        pos.x = mouse_pos.x
        pos.y = mouse_pos.y;

        if (pos.y >= (_GROUND_PLANE - collider.half.y))
        {
            pos.y = _GROUND_PLANE - collider.half.y;
        }
        if (pos.x >= 160 - collider.half.x)
        {
            pos.x = 160 - collider.half.x;
        }
        else if (pos.x < collider.half.x)
        {
            pos.x = collider.half.x;
        }
    }

    input() {
        if (gameEngine.click) {
            gameEngine.addEntity(new Block(this));
            this.removeFromWorld = true;
            gameEngine.new_block_time = gameEngine.timer.gameTime + 3;
            gameEngine.has_ethereal = false;
        }
    }
    update(){
        this.movement();
        this.input();
    }

    draw(ctx){
        draw_rect(ctx, this.transform.pos.x, this.transform.pos.y, this.collider.area.half.x * 2, this.collider.area.half.y * 2, false, true, 1);
    }
}

class Block{
    constructor(ethereal){
        this.tag = "tile";
        this.transform = ethereal.transform;
        this.collider = ethereal.collider;
        this.kinematic = new Kinematic(10, this.transform.pos, this.transform.prev_pos, this.transform.velocity, 0, 0.3);
    }

    update(){

    }

    draw(ctx){
        draw_rect(ctx, this.transform.pos.x, this.transform.pos.y, this.collider.area.half.x * 2, this.collider.area.half.y * 2, true, true, 1);
    }
}
