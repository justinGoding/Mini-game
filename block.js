const _BLOCK_COOLDOWN = 1;
const block_shapes={1: {x: 6, y: 6},
    2: {x: 6, y: 12},
    3: {x: 12, y: 6} }

class Ethereal_Block{
    constructor(){
        this.tag = "ethereal";
        this.transform = new Transform(new Vec2());
        if (gameEngine.mouse != null) {
            this.transform = new Transform(new Vec2(gameEngine.mouse.x, gameEngine.mouse.y));
        }
        this.cr = 0;
        this.mass = 0.0000001
        this.prev_pos = new Vec2();

        let key = Math.floor(Math.random() * 3 + 1);
        let block_shape = block_shapes[key];
        this.collider = new Collider(new AABB(this.transform.pos, block_shape.x, block_shape.y), true, false, false);

        this.spritesheet = ASSET_MANAGER.getAsset("./sprites/ice.png");

        let sprite_start_x = Math.floor(Math.random() * (32 - (this.collider.area.half.x * 2)));
        let sprite_start_y = Math.floor(Math.random() * (32 - (this.collider.area.half.y * 2)));
        this.animator = new Animator(this.spritesheet, sprite_start_x, sprite_start_y, this.collider.area.half.x * 2, this.collider.area.half.y * 2, 1, 1, true);
    }

    movement() {
        let pos = this.transform.pos;
        let collider = this.collider.area;
        let mouse_pos = new Vec2();
        if (gameEngine.mouse != null) {
            mouse_pos = convertToGamePos(gameEngine.mouse.x, gameEngine.mouse.y);
        }
        this.prev_pos = pos.clone();
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
            gameEngine.new_block_time = gameEngine.timer.gameTime + _BLOCK_COOLDOWN;
            gameEngine.has_ethereal = false;
        }
    }
    update(){
        this.movement();
        this.input();
    }

    draw(ctx){
        ctx.globalAlpha = 0.2;
        this.animator.drawFrame(gameEngine.clockTick, ctx, this.transform.pos.x, this.transform.pos.y, this.collider.area.half.x * 2, this.collider.area.half.y * 2);
        draw_rect(ctx, this.transform.pos.x, this.transform.pos.y, 
            this.collider.area.half.x * 2, this.collider.area.half.y * 2, false, true, 1);
        ctx.globalAlpha = 1.0;
    }
}

class Block{
    constructor(ethereal){
        this.tag = "tile";
        this.transform = ethereal.transform;
        this.transform.velocity = Vec2.scale(Vec2.diff(this.transform.pos, ethereal.prev_pos), 1/gameEngine.clockTick);
        this.movement();
        this.collider = ethereal.collider;
        this.gravity = new Gravity();
        this.max_speed = 300;
        this.min_speed = 0.3;
        
        this.spritesheet = ASSET_MANAGER.getAsset("./sprites/ice.png");
        this.animator = ethereal.animator;
    }

    update(){
        this.movement();
        this.animation();
    }

    movement() {
        let speed = Math.abs(this.transform.velocity.x);
        if (speed > this.max_speed) {
            this.transform.velocity.x *= this.max_speed / speed;
        }
        else if (speed < this.min_speed) {
            this.transform.velocity.x = 0;
        }
        speed = Math.abs(this.transform.velocity.y);
        if (speed > this.max_speed) {
            this.transform.velocity.y *= this.max_speed / speed;
        }
        else if (speed < this.min_speed) {
            this.transform.velocity.y = 0;
        }
    }


    animation() {
        this.animator.width = this.collider.area.half.x;
        this.animator.height = this.collider.area.half.y;
    }


    draw(ctx){
        this.animator.drawFrame(gameEngine.clockTick, ctx, this.transform.pos.x, this.transform.pos.y, this.collider.area.half.x * 2, this.collider.area.half.y * 2);
        draw_rect(ctx, this.transform.pos.x, this.transform.pos.y, 
            this.collider.area.half.x * 2, this.collider.area.half.y * 2, false, true, 1);
    }
}

class Bell {
    constructor() {
        this.transform = new Transform(new Vec2(80, 4));
        this.tag = "bell";
        this.collider = new Collider(new AABB(this.transform.pos, 4, 4), false, false, false);

        this.spritesheet = ASSET_MANAGER.getAsset("./sprites/bell.png");
        this.animator = new Animator(this.spritesheet, 0, 0, 16, 16, 1, 1, true);
    }

    update() {}

    activate() {
        gameEngine.victory = true;
    }

    draw(ctx) {
        this.animator.drawFrame(gameEngine.clockTick, ctx, this.transform.pos.x, this.transform.pos.y, this.collider.area.half.x * 2, this.collider.area.half.y * 2);
    }
}
