const _GRAVITY_ACCELERATION = 150;
const _AIR_DENSITY = 0;
const _WIND_SPEED = 0;
const _GROUND_PLANE = 128;

function physics_test_init() {
    let units = [];
    let pos_x = 0.0;
    let pos_y = 0.0;
    for (i = 0; i < 1500; i++) {
        pos_x = (Math.random() * 256) + 256;
        pos_y = (Math.random() * 25) + 25;

        let particle = new Particle(true);
        particle.v_pos = new Vec2(pos_x, pos_y);
        particle.f_radius = Math.random() * 10;
        units.push(particle);
    }
    for (i = 0; i < 10; i++)
    {
        pos_x = (Math.random() * 512) + 256;
        pos_y = (Math.random() * 384) + 192;

        let particle = new Particle(false);
        particle.v_pos = new Vec2(pos_x, pos_y);
        particle.v_prev_pos = particle.v_pos;
        particle.f_radius = 50;
        particle.f_mass = 100;
        particle.color = "gray";
        units.push(particle);
    }

    return units;
}

// Returns whether two collider areas a and b are overlapping
function testAABBAABB(a, b) {
    if (Math.abs(a.center.x - b.center.x) > (a.half.x + b.half.x)) { return false; }
    if (Math.abs(a.center.y - b.center.y) > (a.half.y + b.half.y)) { return false; }
    return true;
}

// Gets the overlap of two collider areas a and b
function get_AABBAABB_overlap(a, b, ac = a.center, bc = b.center) {
    let ox = a.half.x + b.half.x - Math.abs(ac.x - bc.x);
    let oy = a.half.y + b.half.y - Math.abs(ac.y - bc.y);
    return {x: ox, y: oy};
}

// Prevents overlap between two entities a and b if both should prevent overlap
function prevent_overlap(a, b) {
    // Checks b has colliders, blocks movement, if a or b has moved since the last frame,
    // and if they are overlapping, if any of those conditions are false it exits early
    if (b.collider === undefined || !b.collider.block_move) return;
    if (a.transform.pos == a.transform.prev_pos &&
        b.transform.pos == b.transform.prev_pos) return;
    
    let overlap = get_AABBAABB_overlap(a.collider.area, b.collider.area)
    if (overlap.x <= 0 || overlap.y <= 0) return;

    // Gets the overlap between a and b on the previous time step
    let prev_overlap = get_AABBAABB_overlap(a.collider.area, b.collider.area, a.transform.prev_pos, b.transform.prev_pos);

    // If the overlap is horizontal
    if (prev_overlap.y > prev_overlap.x) {
        // If a is on the left push a to the left and b to the right
        if (a.transform.pos.x < b.transform.pos.x) {
            a.transform.pos.x -= overlap.x;
        }
        // If a is on the right push a to the right and b to the left
        else {
            a.transform.pos.x += overlap.x;
        }
        a.transform.velocity.x = 0;
    }
    // If the overlap is vertical
    else if (prev_overlap.x > prev_overlap.y) {
        // If a is above, push a up and b down
        if (a.transform.pos.y < b.transform.pos.y) {
            a.transform.pos.y -= overlap.y;
            a.transform.velocity.y = 0;
            a.air = false;
        }
        // If a below, push a down and b up
        else {
            a.transform.pos.y += overlap.y;
            a.transform.velocity.y = 0;
        }
    }
    // If the overlap is perfectly diagonal
    else {
        let relative_velocity = Vec2.diff(a.transform.velocity, b.transform.velocity);
        // If the relative velocity is greater in the horizontal component then favor
        // pushing the objects out in the vertical direction
        if (Math.abs(relative_velocity.x) > Math.abs(relative_velocity.y)) {
            if (a.transform.pos.y < b.transform.pos.y) {
                a.transform.pos.y -= overlap.y;
            }
            else {
                a.transform.pos.y += overlap.y;
            }
        }
        // If the speed is greater in the vertical then favor pushing in the horizontal
        else {
            if (a.transform.pos.x < b.transform.pos.x) {
                a.transform.pos.x -= overlap.x;
            }
            else {
                a.transform.pos.x += overlap.x;
            }
        }
    }
}

// Checks for and handles collision between characters and tiles
function character_tile_collisions(entities) {

    let characters = entities.get("player");

    for (character of characters) {
        if (character.collider !== undefined && character.collider.block_move) {
            for (tile of entities.get("tile")) {
                prevent_overlap(character, tile);
            }
        }
    }
}

function player_enemy_collisions(entities){
    
    let characters = entities.get("player").concat(entities.get("enemy"));

    for (player of entities.get("player")){
        for (character of characters){
            if(character.tag != "player"){
                if (character.collider !== undefined && testAABBAABB(player.collider.area, character.collider.area)) {
                    console.log("PLAYER HIT");
                    hit(player, character);
                }
            }
        }
    }
}

function kinematic_ground_collisions(entity) {
    let dt = gameEngine.clockTick;
    
    let kinematic = entity.kinematic;
    let transform = entity.transform;
    let pos = entity.transform.pos;
    let prev_pos = entity.transform.prev_pos;
    let collider = entity.collider.area;

    // Check for collisions with ground plane
    if (pos.y >= (_GROUND_PLANE - collider.half.y)) {
        let normal = new Vec2(0, -1);
        let relative_velocity = transform.velocity.clone();
        let rvn = relative_velocity.dot(normal);    // The component of the relative velocity in the direction of the collision unit normal vector
        // Check to see if the particle is moving toward the ground
        if (rvn < 0.0) {
            let impulse = -rvn * (kinematic._RESTITUTION + 1) * kinematic.f_mass;
            let impact_force = normal.clone();
            impact_force.multiply(impulse / dt)
            kinematic.v_impact_forces.add(impact_force);

            pos.y = _GROUND_PLANE - collider.half.y;

            /*
            pos.x = ((_GROUND_PLANE - collider.half.y + prev_pos.y) 
                            / (pos.y - prev_pos.y) * 
                            (pos.x - prev_pos.x)) + 
                            prev_pos.x;
            */

            entity.air = false;
            kinematic.b_collision = true;
        }
    }
    // Check for collisions with horizontal bounds
    if (pos.x >= 160 - collider.half.x) {
        let normal = new Vec2(-1, 0);
        let relative_velocity = transform.velocity.clone();
        let rvn = relative_velocity.dot(normal);    // The component of the relative velocity in the direction of the collision unit normal vector
        // Check to see if the particle is moving toward the ground
        if (rvn < 0.0) {
            let impulse = -rvn * (kinematic._RESTITUTION + 1) * kinematic.f_mass;
            let impact_force = normal.clone();
            impact_force.multiply(impulse / dt)
            kinematic.v_impact_forces.add(impact_force);

            pos.x = 160 - collider.half.x;

            kinematic.b_collision = true;
        }
    }
    else if (pos.x < collider.half.x) {
        let normal = new Vec2(1, 0);
        let relative_velocity = transform.velocity.clone();
        let rvn = relative_velocity.dot(normal);    // The component of the relative velocity in the direction of the collision unit normal vector
        // Check to see if the particle is moving toward the ground
        if (rvn < 0.0) {
            let impulse = -rvn * (kinematic._RESTITUTION + 1) * kinematic.f_mass;
            let impact_force = normal.clone();
            impact_force.multiply(impulse / dt)
            kinematic.v_impact_forces.add(impact_force);

            pos.x = collider.half.x;

            kinematic.b_collision = true;
        }
    }
}

function kinematic_entity_collisions(entity, entities) {
    let length = entities.length;
    let j = entities.indexOf(entity) + 1;
    if (entity.transform.pos.x != entity.transform.prev_pos.x || entity.transform.pos.y != entity.transform.prev_pos.y) {
        for (; j < length; j++) {
            let b = entities[j];
            kinematic_AABBAABB(entity, b);
        }
    }
    
}

function kinematic_AABBAABB(a, b) {
    if (testAABBAABB(a.collider.area, b.collider.area)) {
        let dt = gameEngine.clockTick;
        let distance = Vec2.diff(a.kinematic.v_pos, b.kinematic.v_pos);
        distance.normalize();
        if (Math.abs(distance.x) != Math.abs(distance.y)) {
            distance.x = Math.round(distance.x);
            distance.y = Math.round(distance.y);
        }
        let normal = distance.clone();
        let relative_velocity = Vec2.diff(a.kinematic.v_velocity, b.kinematic.v_velocity);
        let vrn = relative_velocity.dot(normal);

        if (vrn < 0.0) {
            let avg_restitution = (a.kinematic._RESTITUTION + b.kinematic._RESTITUTION) / 2;
            let impulse = -vrn * (avg_restitution + 1) / (1 / a.kinematic.f_mass + 1 /  b.kinematic.f_mass);
            let impact_force = normal.clone();
            impact_force.multiply(impulse / dt);
            a.kinematic.v_impact_forces.add(impact_force);
            impact_force.multiply(-1);
            b.kinematic.v_impact_forces.add(impact_force);

            prevent_overlap(a, b);
            a.kinematic.b_collision = true;
            b.kinematic.b_collision = true;
        }
    }
}

 // Computes all the forces acting on the particle
function calc_loads(entity) {
    let k = entity.kinematic;
    let collider = entity.collider.area;
    // Reset forces:
    k.v_forces.x = 0.0;
    k.v_forces.y = 0.0;

    // Aggregate forces:
    if (k.b_collision) {
        // Add impact forces only (if any)
        k.v_forces.add(k.v_impact_forces);
    }
    
    // Gravity
    k.v_forces.add(k.v_gravity);

    // Friction
    if (!entity.air) {
        let friction = Math.sign(entity.transform.velocity.x) * 0.1;
        if (Math.abs(entity.transform.velocity.x) < Math.abs(friction)) {
            entity.transform.velocity.x = 0;
        }
        else {
            entity.transform.velocity.x -= Math.sign(entity.transform.velocity.x) * 0.1;
        }
    }
    
}

function update_body_euler(entity) {
    let t = entity.transform;
    let k = entity.kinematic;
    let dt = gameEngine.clockTick;
    // Integrate equation of motion:
    let acceleration = Vec2.scale(k.v_forces, 1 / k.f_mass);

    let delta_velocity = Vec2.scale(acceleration, dt);
    t.velocity.add(delta_velocity);

    let displacement = Vec2.scale(k.v_velocity, dt);
    t.prev_pos.x = t.pos.x;
    t.prev_pos.y = t.pos.y;
    t.pos.add(displacement);

    // Misc. calculations:
    k.f_speed = Math.sqrt(k.v_velocity.get_magnitude_squared());
}

function update_kinematics(entities) {
    for (entity of entities) {
        entity.kinematic.b_collision = false;
        // Reset aggregate impact force
        entity.kinematic.v_impact_forces.x = 0;
        entity.kinematic.v_impact_forces.y = 0;
        kinematic_ground_collisions(entity);
        calc_loads(entity);
        update_body_euler(entity);
    }
}

function tile_tile_collisions(entities) {
    let count = entities.length;
    for (i = count - 1; i >= 0; i--) {
        for (j = count - 1; j >= 0; j--) {
            let a = entities[i];
            let b = entities[j];
            if (a != b) {
                prevent_overlap(a, b);
            }
        }
    }
}

function physics(entities) {
    update_kinematics(entities.get("kinematic"));
    character_tile_collisions(entities);
    tile_tile_collisions(entities.get("tile"));
}

class Test_Block {
    constructor(x, y, x_width, y_width) {
        this.tag = "tile";
        this.transform = new Transform(new Vec2(x, y));
        this.transform.prev_pos = this.transform.pos;
        this.collider = new Collider(new AABB(this.transform.pos, x_width, y_width), true, true, false);
    }

    update() {}

    draw(ctx) {
        draw_rect(ctx, this.transform.pos.x, this.transform.pos.y, this.collider.area.half.x * 2, this.collider.area.half.y * 2, false, true, 1);
    }

}