// This game shell was happily modified from Googler Seth Ladd's "Bad Aliens" game and his Google IO talk in 2011

class GameEngine {
    constructor(options) {
        // What you will use to draw
        // Documentation: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
        this.ctx = null;

        // Everything that will be updated and drawn each frame
        this.entities = [];
        this.entity_map = new Map([
            ["player", []],
            ["tile", []],
            ["ethereal", []],
        ]);
        this.new_block_time = 1;
        this.has_ethereal = false;

        this.victory = false;

        // Information on the input
        this.click = null;
        this.mouse = null;
        this.wheel = null;
        this.keys = {};

        // Options and the Details
        this.options = options || {
            debugging: false,
        };
    };

    init(ctx) {
        this.ctx = ctx;
        this.startInput();
        this.timer = new Timer();
    };

    start() {
        this.load_level();
        console.log("Started")
        this.running = true;
        const gameLoop = () => {
            this.loop();
            requestAnimFrame(gameLoop, this.ctx.canvas);
        };
        gameLoop();
    };

    startInput() {
        const getXandY = e => ({
            x: e.clientX - this.ctx.canvas.getBoundingClientRect().left,
            y: e.clientY - this.ctx.canvas.getBoundingClientRect().top
        });
        
        this.ctx.canvas.addEventListener("mousemove", e => {
            if (this.options.debugging) {
                console.log("MOUSE_MOVE", getXandY(e));
            }
            this.mouse = getXandY(e);
        });

        this.ctx.canvas.addEventListener("click", e => {
            if (this.options.debugging) {
                console.log("CLICK", getXandY(e));
            }
            this.click = getXandY(e);
        });

        this.ctx.canvas.addEventListener("wheel", e => {
            if (this.options.debugging) {
                console.log("WHEEL", getXandY(e), e.wheelDelta);
            }
            e.preventDefault(); // Prevent Scrolling
            this.wheel = e;
        });

        this.ctx.canvas.addEventListener("contextmenu", e => {
            if (this.options.debugging) {
                console.log("RIGHT_CLICK", getXandY(e));
            }
            e.preventDefault(); // Prevent Context Menu
            this.rightclick = getXandY(e);
        });

        this.ctx.canvas.addEventListener("keydown", event => this.keys[event.key] = true);
        this.ctx.canvas.addEventListener("keyup", event => this.keys[event.key] = false);
    };

    addEntity(entity) {
        this.entities.push(entity);

        if (entity.tag !== undefined) {
            if (this.entity_map.get(entity.tag) === undefined) {
                this.entity_map.set(entity.tag, [entity]);
            }
            else {
                this.entity_map.get(entity.tag).push(entity);
            }
        }
        if (entity.kinematic !== undefined) {
            this.entity_map.get("kinematic").push(entity);
        }
    };

    draw() {
        // Clear the whole canvas with transparent color (rgba(0, 0, 0, 0))
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Draw latest things first
        for (let i =  0; i < this.entities.length; i++) {
            this.entities[i].draw(this.ctx, this);
            if(document.getElementById("debug").checked){
                if (this.entities[i].collider !== undefined) {
                    if (this.entities[i].collider.area instanceof AABB) {
                        draw_rect(this.ctx, this.entities[i].transform.pos.x, this.entities[i].transform.pos.y, 
                            this.entities[i].collider.area.half.x * 2, this.entities[i].collider.area.half.y * 2, false, true, 1);
                    }
                    else if (this.entities[i].collider.area instanceof Circle) {
                        draw_circle(this.ctx, this.entities[i].transform.pos.x, this.entities[i].transform.pos.y,
                            this.entities[i].collider.area.radius, false, true, 1);
                    }
                }
            }
        }
        

        let fps = Math.round(1 / this.clockTick);
        let text = "fps: " + fps.toString();
        this.ctx.fillText(text, 980, 20);
        this.ctx.stroke();

        if (this.victory == true) {
            this.win_screen.drawFrame(gameEngine.clockTick, this.ctx, _WALL_PLANE / 2, _GROUND_PLANE / 2, _WALL_PLANE, _GROUND_PLANE);
            this.running = false;
        }
        if (this.entity_map.get("player").length == 0) {
            this.death_screen.drawFrame(gameEngine.clockTick, this.ctx, _WALL_PLANE / 2, _GROUND_PLANE / 2, _WALL_PLANE, _GROUND_PLANE);
            this.running = false;
        }
    };

    update() {
        let entitiesCount = this.entities.length;

        for (let i = 0; i < entitiesCount; i++) {
            let entity = this.entities[i];

            if (!entity.removeFromWorld) {
                entity.update();
            }
        }

        for (let i = this.entities.length - 1; i >= 0; --i) {
            if (this.entities[i].removeFromWorld) {
                if(this.entities[i].tag != undefined){
                    let index = this.entity_map.get(this.entities[i].tag).indexOf(this.entities[i]);
                    this.entity_map.get(this.entities[i].tag).splice(index, 1);
                }
                this.entities.splice(i, 1);
            }
        }

        this.s_blocks();
        physics(this.entity_map);
    };

    loop() {
        this.clockTick = this.timer.tick();
        if (this.running) {
            this.update();
        }
        this.draw();

        this.click = null;
    };

    s_blocks() {
        if (this.timer.gameTime >= this.new_block_time && !this.has_ethereal)
        {
            this.addEntity(new Ethereal_Block());
            this.has_ethereal = true;
        }
    }

    load_level() {
        this.player = new Penguin();
        gameEngine.addEntity(this.player);

        this.bell = new Bell();
        this.addEntity(this.bell);

        let start_block = new Block(new Ethereal_Block());
        start_block.collider.area.half.x = 12;
        start_block.collider.area.half.y = 12;
        start_block.transform.pos.x = 16;
        start_block.transform.pos.y = _GROUND_PLANE - 6;
        start_block.transform.velocity.set(0, 0);
        this.addEntity(start_block);

        this.win_spritesheet = ASSET_MANAGER.getAsset("./sprites/win_screen.png");
        this.death_spritesheet = ASSET_MANAGER.getAsset("./sprites/death.png");
        this.win_screen = new Animator(this.win_spritesheet, 0, 0, 640, 512, 1, 1, true);
        this.death_screen = new Animator(this.death_spritesheet, 0, 0, 640, 512, 1, 1, true);
    }

};

// KV Le was here :)