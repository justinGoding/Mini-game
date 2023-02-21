class Penguin{
    constructor(){
        // Game reference we pass in
        this.game = gameEngine;

        // Components
        this.tag = "player";
        this.transform = new Transform(new Vec2(16, 32), new Vec2(0,0), 1, new Vec2(0,0));
        this.health = new Health(4, 4);
        this.collider = new Collider(new Circle(this.transform.pos, 4), true, true, false);
        this.gravity = new Gravity();
        //this.kinematic = new Kinematic(1, this.transform.pos, this.transform.prev_pos, this.transform.velocity, 0, 0.01)

        // Reference to our spritesheet
        this.spritesheet = ASSET_MANAGER.getAsset("./sprites/penguin.png");
        this.damage_spritesheet = ASSET_MANAGER.getAsset("./sprites/damaged_penguin.png");
        

        // Some state variables
        this.facing = 0; // 0 = right, 1 = left
        this.state = state_enum.idle; // 0 = idle, 1 = walking
        this.dead = false;

        // Some movement variables
        this.acceleration = 280;
        this.max_speed = 100;
        this.min_speed = .3;
        this.cr = 0;

        // Flag variables
        this.air = true;

        // Animations
        this.animations = [];
        this.loadAnimations();
        this.took_damage = false;
    
    }

    // Set up our animations variable
    loadAnimations(){
        this.animations[0] = [];
        this.animations[1] = [];
        // Idle
        this.animations[0][0] = new Animator(this.spritesheet, 0, 0, 16, 16, 1, 1);
        // Walk right
        this.animations[1][0] = new Animator(this.spritesheet, 16, 0, 16, 16, 3, 0.33);
        // Walk left
        this.animations[1][1] = new Animator(this.spritesheet, 64, 0, 16, 16, 3, 0.33);
    }

    update(){
        if (this.invincible !== undefined) {
            update_invincibility(this);
        }
        console.log(this.state);
        this.movement(); 
    }

    draw(ctx){
        this.animation();
        if (this.took_damage) {
            this.animations[this.state][this.facing].spritesheet = this.damage_spritesheet;
        }
        else {
            this.animations[this.state][this.facing].spritesheet = this.spritesheet;
        }
        this.animations[this.state][this.facing].drawFrame(this.game.clockTick, ctx, this.transform.pos.x, this.transform.pos.y, 8, 8);
    }

   

    movement(){

        if (this.game.keys['a']) {
            this.transform.velocity.x -= this.acceleration * gameEngine.clockTick;
        }
        else if (this.game.keys["d"]) {
            this.transform.velocity.x += this.acceleration * gameEngine.clockTick;
        }
        if (this.game.keys["w"]) {
            this.transform.velocity.y -= this.acceleration * gameEngine.clockTick;
        }
        else if (this.game.keys["s"]) {
            this.transform.velocity.y += this.acceleration * gameEngine.clockTick;
        }

        let speed = Math.abs(this.transform.velocity.x);
        if (speed > this.max_speed) {
            this.transform.velocity.x *= this.max_speed / speed;
        }
        else if (speed < this.min_speed) {
            this.transform.velocity.x = 0;
        }

        if(this.game.keys[" "] && !this.air){
            this.air = true;
            this.transform.velocity.y = -150;
        }

        this.air = true;
    }

    animation() {
        // Figure out the direction for animation
        if(this.transform.velocity.x > 0.5){ // Facing right
            this.state = 1;
            this.facing = 0;
        }
        else if (this.transform.velocity.x < -0.5){ // Facing left
            this.state = 1;
            this.facing = 1;
        }
        else { // Facing forward
            this.state = 0;
            this.facing = 0;
        }

        if (this.invincible !== undefined) {
            this.took_damage = true;
        }
        else {
            this.took_damage = false;
        }
    }

    
}