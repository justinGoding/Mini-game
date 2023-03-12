class Cannon {
    constructor() {
        this.pos = new Vec2(215, 120);
        this.new_angle();
        this.angle = 3.402;
        this.angle_vector = new Vec2(Math.cos(this.angle), Math.sin(this.angle));
        this.length = 30;

        this.next_cannonball = 5;

        this.spritesheet = ASSET_MANAGER.getAsset("./sprites/cannon.png");
        this.animator = new Animator(this.spritesheet, 0, 0, 48, 32, 5, .33, false);
    }

    update() {
        this.aim();
        this.loading_cannon();
        if (this.ready) {
            this.fire();
            this.new_angle();
        }
    }

    loading_cannon() {
        let time = gameEngine.timer.gameTime;
        if (gameEngine.timer.gameTime >= this.next_cannonball) {
            this.ready = true;
            this.next_cannonball = time + 5;
        }
        else if (gameEngine.timer.gameTime >= this.next_cannonball - 1) {
            this.firing = true;
        }
    }

    fire() {
        this.angle_vector = new Vec2(Math.cos(this.angle), Math.sin(this.angle));
        let muzzle_pos = Vec2.sum(this.pos, Vec2.scale(this.angle_vector, this.length));

        let power = 300
        let cannonball = new Cannonball(muzzle_pos, this.angle_vector, power);
        gameEngine.addEntity(cannonball);
        this.ready = false;
    }

    new_angle() {
        this.target_angle = Math.random() * .333 + 3.402;
        this.aim_speed = (this.target_angle - this.angle) / 5;
    }

    aim() {
        if (this.target_angle - this.angle > this.aim_speed) {
            this.angle += this.aim_speed * gameEngine.clockTick;
        }
        else {
            this.angle = this.target_angle;
        }
    }

    draw(ctx) {
        if (!this.firing) {
            this.animator.elapsedTime = 0;
        }

        this.animator.drawRotatedFrame(gameEngine.clockTick, ctx, this.pos.x, this.pos.y + 5, this.angle)

        if (this.animator.done) {
            this.animator.done = false;
            this.animator.elapsedTime = 0;
            this.firing = false;
        }
    }
}

class Cannonball {
    constructor(muzzle_pos, angle_vector, power) {
        this.tag = "tile"
        this.gravity = true;
        this.transform = new Transform(muzzle_pos);
        this.transform.velocity = Vec2.scale(angle_vector, power);

        this.collider = new Collider(new Circle(this.transform.pos, 3), true, false, false)
        this.mass = 4;
        this.cr = 0;
        this.lifespan = gameEngine.timer.gameTime + 4;

        this.spritesheet = ASSET_MANAGER.getAsset("./sprites/ball.png");
        this.animator = new Animator(this.spritesheet, 0, 0, 8, 8, 1, .33, true);
    }

    update() {
        this.check_lifespan();
    }

    check_lifespan() {
        if (gameEngine.timer.gameTime >= this.lifespan) {
            this.collider = undefined;
            this.removeFromWorld = true;
        }
    }

    draw(ctx) {
        this.animator.drawFrame(gameEngine.clockTick, ctx, this.transform.pos.x, this.transform.pos.y);
    }
}