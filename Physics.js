const _GRAVITY = 280;
const _GROUND_PLANE = 128;
const _WALL_PLANE = 160;
const _FRICTION = 100;
const _MELT_RATE = 0.6;

function physics_test_init() {
    let units = [];
    let pos_x = 0.0;
    let pos_y = 0.0;
    for (let i = 0; i < 1500; i++) {
        pos_x = (Math.random() * 256) + 256;
        pos_y = (Math.random() * 25) + 25;

        let particle = new Particle(true);
        particle.v_pos = new Vec2(pos_x, pos_y);
        particle.f_radius = Math.random() * 10;
        units.push(particle);
    }
    for (let i = 0; i < 10; i++)
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

function physics(entities) {
    let movement_map = update_pos();
    border_collisions(entities);
    character_tile_collisions(entities);
    tile_tile_collisions(entities);
    ethereal_collisions(entities);
    player_bell_collisions(entities);
}


// Update the position of all entities and add them to the movement map if they moved
function update_pos() {
    let movement_map = new Map([]);
    
    for (let entity of gameEngine.entities) {
        if (entity.transform !== undefined) {
            entity.transform.prev_pos = entity.transform.pos.clone();

            if (entity.gravity !== undefined) {

                // entity.gravity.velocity += _GRAVITY * gameEngine.clockTick;
                // entity.transform.velocity.y += entity.gravity.velocity;
                entity.transform.velocity.y += _GRAVITY * gameEngine.clockTick;

            }

            if (entity.transform.velocity.x != 0.0 || entity.transform.velocity.y != 0.0) {
                let displacement = Vec2.scale(entity.transform.velocity, gameEngine.clockTick);
                entity.transform.pos.add(displacement);
                
                if (entity.tag !== undefined) {
                    if (movement_map.get(entity.tag) === undefined) {
                        movement_map.set(entity.tag, [entity]);
                    }
                    else {
                        movement_map.get(entity.tag).push(entity);
                    }
                }
            }
        }
    }

    return movement_map;
}

function border_collisions(movement_map) {
    let entities = [];
    if (movement_map.get("player") !== undefined) {
        entities = entities.concat(movement_map.get("player"));
    }
    if (movement_map.get("tile") !== undefined) {
        entities = entities.concat(movement_map.get("tile"));
    } 

    
    for (let entity of entities) {
        let collider = entity.collider.area;
        if (collider !== undefined) {

            if (collider instanceof AABB) {
                if (collider.center.y + collider.half.y >= _GROUND_PLANE) {
                    collider.center.y = _GROUND_PLANE - collider.half.y;
                    bounce(entity, new Vec2(0, -1), entity.cr);
                    if (entity.transform !== undefined) {
                        entity.transform.velocity.x -= Math.sign(entity.transform.velocity.x) * _FRICTION * gameEngine.clockTick;
                    }

                    if (entity instanceof Block) {
                        let melt = _MELT_RATE * gameEngine.clockTick;
                        entity.collider.area.half.y -= melt;
                        entity.collider.area.center.y += melt + 0.001;

                        if (entity.collider.area.half.y < 0.2) {
                            entity.removeFromWorld = true;
                        }
                    }
                }

                if (collider.center.x + collider.half.x >= _WALL_PLANE) {
                    collider.center.x = _WALL_PLANE - collider.half.x;
                    bounce(entity, new Vec2(-1, 0), entity.cr);
                }
                else if (collider.center.x - collider.half.x <= 0) {
                    collider.center.x = collider.half.x;
                    bounce(entity, new Vec2(1, 0), entity.cr);
                }
            }
            else if (collider instanceof Circle) {
                if (collider.center.y + collider.radius >= _GROUND_PLANE) {
                    collider.center.y = _GROUND_PLANE - collider.radius;
                    bounce(entity, new Vec2(0, -1), entity.cr);
                    entity.transform.velocity.x -= Math.sign(entity.transform.velocity.x) * _FRICTION * gameEngine.clockTick;
                    entity.air = false;

                    if (entity instanceof Penguin) {
                        if(!document.getElementById("debug").checked){
                            entity.health.current--;
                            entity.transform.velocity.y = -160;
                            entity.gravity.velocity = 0;
                            entity.invincible = new Invincible();
                            if (entity.health.current <= 0) {
                                entity.removeFromWorld = true;
                            }
                        }
                    }
                }

                if (collider.center.x + collider.radius >= _WALL_PLANE) {
                    collider.center.x = _WALL_PLANE - collider.radius;
                    bounce(entity, new Vec2(-1, 0), entity.cr);
                } 
                else if (collider.center.x - collider.radius <= 0) {
                    collider.center.x = collider.radius;
                    bounce(entity, new Vec2(1, 0), entity.cr);
                }
            }
        }   
    }
}


// Checks for and handles collision between characters and tiles
function character_tile_collisions(entities) {

    let characters = [];
    if (entities.get("player") !== undefined) {
        characters = characters.concat(entities.get("player"));
    }
    if (entities.get("enemy") !== undefined) {
        characters = characters.concat(entities.get("enemy"));
    }

    for (let character of characters) {
        if (character.collider !== undefined) {
            for (let tile of gameEngine.entity_map.get("tile")) {
                if (tile.collider.block_move) {
                    prevent_overlap(character, tile);
                }
            }
        }
    }
}


function tile_tile_collisions(entities) {
    let tiles = [];
    if (entities.get("tile") !== undefined) {
        tiles = tiles.concat(entities.get("tile"));
    }

    for (let a of tiles) {
        for (let b of tiles) {
            if (a != b) {
                prevent_overlap(a, b);
            }
        }
    }
}

function ethereal_collisions(entities) {
    let ethereals = [];
    if (entities.get("ethereal") !== undefined) {
        ethereals = ethereals.concat(entities.get("ethereal"));
    }

    let physicals = [];
    if (entities.get("player") !== undefined) {
        physicals = physicals.concat(entities.get("player"));
    }
    if (entities.get("tile") !== undefined) {
        physicals = physicals.concat(entities.get("tile"));
    }

    for (let ethereal of ethereals) {
        for (let physical of physicals) {
            prevent_overlap(ethereal, physical);
        }
    }
}


function player_bell_collisions(entities) {
    if (test_overlap(gameEngine.player.collider.area, gameEngine.bell.collider.area)) {
        gameEngine.bell.activate();
    }
}

// Checks for overlap between two Entities a and b and returns a boolean
function test_overlap(a, b) {
    if (a instanceof AABB && b instanceof AABB) {
        return test_AABBs(a, b).test;
    }
    else if (a instanceof Circle && b instanceof Circle)
    {
        return test_Circles(a, b).test;
    }
    else {
        if (a instanceof Circle && b instanceof AABB) {
            return test_Circle_AABB(a, b).test;
        }
        else if (a instanceof AABB && b instanceof Circle) {
            return test_Circle_AABB(b, a).test;
        }
    }

    return false;
}


// Gets the overlap of two AABBs a and b
function test_AABBs(a, b, ac = a.center, bc = b.center) {
    let ox = a.half.x + b.half.x - Math.abs(ac.x - bc.x);
    let oy = a.half.y + b.half.y - Math.abs(ac.y - bc.y);
    return {test: (ox > 0 && oy > 0), overlap: new Vec2(ox, oy)};
}

// Tests for overlap and returns distance vector of two Circles a and b
function test_Circles(a, b) {
    let distance = Vec2.diff(a.center, b.center);
    let distance_squared = distance.dot(distance);

    let radii_sum = a.radius + b.radius;
    return {test: distance_squared <= radii_sum * radii_sum, distance: distance};
}

// Tests for overlap and returns distance vector and square distance between a Circle c and AABB b
function test_Circle_AABB(c, b) {

    // Find point p on AABB closest to sphere center
    let point = closest_point_on_AABB_to_point(b, c.center);
    let distance = Vec2.diff(c.center, point);
    let distance_squared = distance.dot(distance);

    return {test: (distance_squared < c.radius * c.radius), 
        distance_v: distance, 
        sqdist: distance_squared,
        point: point};
}

// Tests if a point p is inside an area a
function test_point_inside(p, a) {
    if (a instanceof AABB) {
        return sqdist_point_AABB(p, a) <= 0;
    }
    else if (a instanceof Circle) {
        return sqdist_point_circle(p, a) <= 0;
    }
}

// Prevents overlap between two Entities a and b
function prevent_overlap(a, b) {
    let test;
    if (a.collider.area instanceof AABB && b.collider.area instanceof AABB) {
        test = test_AABBs(a.collider.area, b.collider.area);
        if(test.test) {
           let normal = prevent_overlap_AABBs(a, b, test.overlap);

            if (a.tag !== "ethereal") {
                if (normal !== undefined) {
                    collision_bounce(a, normal, a.cr, b);
                    if (a.air !== undefined && normal.y == -1) {
                        a.air = false;
                        a.transform.velocity.x -= Math.sign(a.transform.velocity.x) * _FRICTION * gameEngine.clockTick;
                    }
            
                    if (b.air !== undefined && normal.y == 1) {
                        b.air = false;
                        b.transform.velocity.x -= Math.sign(b.transform.velocity.x) * _FRICTION * gameEngine.clockTick;
                    }
                }
            }
        }
    }
    else if (a.collider.area instanceof Circle && b.collider.area instanceof Circle)
    {
        test = test_Circles(a.collider.area, b.collider.area);
        if (test.test) {
            let normal = prevent_overlap_circles(a, b, test.distance);

            if (normal !== undefined) {
                collision_bounce(a, normal, a.cr, b);
                if (a.air !== undefined && Math.round(normal.y) == -1) {
                    a.air = false;
                }
                if (b.air !== undefined && Math.round(normal.y) == 1) {
                    b.air = false;
                }
            }
        }
    }
    else {
        let circle;
        let box;
        if (a.collider.area instanceof Circle && b.collider.area instanceof AABB) {
            circle = a;
            box = b;
        }
        else if (a.collider.area instanceof AABB && b.collider.area instanceof Circle) {
            circle = b;
            box = a;
        }

        test = test_Circle_AABB(circle.collider.area, box.collider.area);
        if (test.test) {
            let normal = prevent_overlap_circle_AABB(circle, box, test.distance_v, test.sqdist, test.point);

            if (box.tag !== "ethereal") {
                if (normal !== undefined) {
                    collision_bounce(circle, normal, circle.cr, box);
                    if (circle.air !== undefined && Math.round(normal.y) == -1) {
                        circle.air = false;
                        circle.transform.velocity.x -= Math.sign(circle.transform.velocity.x) * _FRICTION * gameEngine.clockTick;
                    }
                }
            }
        }
    }

    return test.test;
}

// Prevents AABB-AABB overlap between two Entities a and b 
function prevent_overlap_AABBs(a, b, overlap) {
    // Gets the overlap between a and b on the previous time step
    let a_pos = a.collider.area.center;
    let b_pos = b.collider.area.center;
    let a_prev_pos = a.transform !== undefined ? a.transform.prev_pos : a.collider.area.center;
    let b_prev_pos = b.transform !== undefined ? b.transform.prev_pos : b.collider.area.center;

    let prev_overlap = test_AABBs(a.collider.area, b.collider.area, a_prev_pos, b_prev_pos).overlap;

    let normal;
    let scalar_overlap;
    // If the overlap is horizontal
    if (prev_overlap.y > prev_overlap.x) {
        // If a is on the left push a to the left and b to the right
        if (a_pos.x < b_pos.x) {
            normal = new Vec2(-1, 0);
        }
        // If a is on the right push a to the right and b to the left
        else {
            normal = new Vec2(1, 0);
        }
        scalar_overlap = overlap.x;
    }
    // If the overlap is vertical
    else if (prev_overlap.x > prev_overlap.y) {
        // If a is above, push a up and b down
        if (a_pos.y < b_pos.y) {
            normal = new Vec2(0, -1);

            if (a.gravity !== undefined) {
                a.gravity.velocity = 0.0;
                a.air = false;
            }
        }
        // If a below, push a down and b up
        else {
            normal = new Vec2(0, 1);
            if (b.gravity !== undefined) {
                b.gravity.velocity = 0.0;
                b.air = false;
            }
        }
        scalar_overlap = overlap.y;
    }
    // If the overlap is perfectly diagonal
    else {
        normal = Vec2.diff(a_pos, b_pos);
        normal.normalize();
        scalar_overlap = overlap.compute_magnitude();
    }

    let speed_a;
    let speed_b;
    if (a.tag == "ethereal") {
        speed_a = 1;
        speed_b = 0;
    }
    else {
        speed_a = a.transform !== undefined ? a.transform.velocity.dot(a.transform.velocity) : 0;
        speed_b = b.transform !== undefined ? b.transform.velocity.dot(b.transform.velocity) : 0;
    }

    if (speed_a == 0 && speed_b == 0) {
        return;
    }

    let ratio_a = speed_a / (speed_a + speed_b);
    let ratio_b = speed_b / (speed_a + speed_b);

    a.collider.area.center.add(Vec2.scale(normal, scalar_overlap * ratio_a));
    b.collider.area.center.minus(Vec2.scale(normal, scalar_overlap * ratio_b));

    return normal;
}

function prevent_overlap_circles(a, b, distance_vector) {
    let circle_a = a.collider.area;
    let circle_b = b.collider.area;

    let distance = distance_vector.compute_magnitude();
    let overlap = circle_a.radius + circle_b.radius - distance;

    let speed_a = a.transform !== undefined ? a.transform.velocity.dot(a.transform.velocity) : 0;
    let speed_b = b.transform !== undefined ? b.transform.velocity.dot(b.transform.velocity) : 0;

    if (speed_a == 0 && speed_b == 0) {
        return;
    }
    let ratio_a = speed_a / (speed_a + speed_b);
    let ratio_b = speed_b / (speed_a + speed_b);

    let normal = distance_vector;
    normal.normalize();
    circle_a.center.add(Vec2.scale(normal, overlap * ratio_a));
    circle_b.center.minus(Vec2.scale(normal, overlap * ratio_b));

    return normal;
}

function prevent_overlap_circle_AABB(c, b, distance_vector, sq_dist, point) {
    let circle = c.collider.area;
    let box = b.collider.area;

    let overlap = 0;
    if (sq_dist != 0) {
        overlap = circle.radius - Math.sqrt(sq_dist);
    }
    else {
        distance_vector = distance_vector_to_closest_edge_on_AABB_from_point(point, box);
        overlap = distance_vector.compute_magnitude() + circle.radius;
    }

    let speed_c;
    let speed_b;
    if (b.tag == "ethereal") {
        speed_b = 1;
        speed_c = 0;
    } else {
        speed_c = c.transform !== undefined ? c.transform.velocity.dot(c.transform.velocity) : 0;
        speed_b = b.transform !== undefined ? b.transform.velocity.dot(b.transform.velocity) : 0;
    }

    if (speed_c == 0 && speed_b == 0) {
        return;
    }

    let ratio_c = speed_c / (speed_c + speed_b);
    let ratio_b = speed_b / (speed_c + speed_b);

    let normal = distance_vector;
    normal.normalize();
    
    circle.center.add(Vec2.scale(normal, overlap * ratio_c));
    box.center.minus(Vec2.scale(normal, overlap * ratio_b));

    return normal;
}

// Computes the square distance between a point p and an AABB b
function sqdist_point_AABB(p, b) {
    // For each axis count any excess distance outside box extents
    let b_min = new Vec2(b.center.x - b.half.x, b.center.y - b.half.y);
    let b_max = new Vec2(b.center.x + b.half.x, b.center.y + b.half.y);

    let sqdist = 0.0;
    if (p.x < b_min.x) { sqdist += (b_min.x - p.x) * (b_min.x - p.x); }
    if (p.x > b_max.x) { sqdist += (p.x - b_max.x) * (p.x - b_max.x); }

    if (p.y < b_min.y) { sqdist += (b_min.y - p.y) * (b_min.y - p.y); }
    if (p.y > b_max.y) { sqdist += (p.y - b_max.y) * (p.y - b_max.y); }

    return sqdist;
}


function sqdist_point_circle(p, c) {
    let distance_vector = Vec2.diff(p, c.center);
    let sqdist = distance_vector.dot(distance_vector);

    return sqdist - (c.radius * c.radius);
}


// Given point p, return the poin q on AABB b that is closest to p
function closest_point_on_AABB_to_point(b, p) {
    let min = new Vec2(b.center.x - b.half.x, b.center.y - b.half.y);
    let max = new Vec2(b.center.x + b.half.x, b.center.y + b.half.y);

    // For each coordinate axis, if the point cooordinate value
    // outside the box, clamp it to the box
    let q = p.clone();
    q.x = Math.max(q.x, min.x);
    q.x = Math.min(q.x, max.x);

    q.y = Math.max(q.y, min.y);
    q.y = Math.min(q.y, max.y);

    return q;
}

function distance_vector_to_closest_edge_on_AABB_from_point(p, b) {
    let min = new Vec2(b.center.x - b.half.x, b.center.y - b.half.y);
    let max = new Vec2(b.center.x + b.half.x, b.center.y + b.half.y);

    let v = new Vec2();
    v.x = Math.abs(min.x - p.x) <= Math.abs(max.x - p.x) ? min.x : max.x;
    v.y = Math.abs(min.y - p.y) <= Math.abs(max.y - p.y) ? min.y : max.y;

    let q = p.clone();
    if (Math.abs(v.x - p.x) <= Math.abs(v.y - p.y)) {
        q.x = v.x;
    }
    else {
        q.y = v.y;
    }

    return Vec2.diff(q, p);
}

function bounce(entity, normal, cr, impact_entity) {
    cr = cr == undefined ? 0.2 : cr;
    let dn = entity.transform.velocity.dot(normal);
    let transformation = Vec2.scale(normal, (1 + cr) * dn);

    if (impact_entity !== undefined) {
        let mass1 = entity.mass !== undefined ? entity.mass : 1;
        let mass2 = impact_entity.mass !== undefined ? impact_entity.mass : 1;
        let relative_velocity = Vec2.diff(entity.transform.velocity, impact_entity.transform.velocity);

        let j = ( -(1+cr) * (relative_velocity.dot(normal)) ) / ( (normal.dot(normal)) * (1 / mass1 + 1 / mass2) );

        entity.transform.add(Vec2.scale(normal, j / mass1));
    }
    entity.transform.velocity.minus(transformation);

    if (entity.gravity !== undefined) {
        entity.gravity.velocity -= transformation.y;
        if (entity.gravity.velocity < 0) { entity.gravity.velocity = 0; }
    }
}

function collision_bounce(entity, normal, cr, impact_entity) {
    cr = cr == undefined ? 0.8 : cr;

    let mass1 = entity.mass !== undefined ? entity.mass : 1;
    let mass2 = impact_entity.mass !== undefined ? impact_entity.mass : 1;
    let relative_velocity = Vec2.diff(entity.transform.velocity, impact_entity.transform.velocity);

    let vrn = relative_velocity.dot(normal);

    if (vrn > 0) { return; }

    let j = ( -(1+cr) * (vrn) ) / ( (normal.dot(normal)) * (1 / mass1 + 1 / mass2) );

    let impulse = Vec2.scale(normal, j / mass1);

    if (Math.abs(impulse.x) < 0.5 && Math.abs(impulse.y) < 0.5) { return; }

    entity.transform.velocity.add(impulse);

    impulse = Vec2.scale(normal, j / mass2);
    impact_entity.transform.velocity.minus(impulse);
    

    if (entity.gravity !== undefined) {
        if (impulse.y < 0 ) {
            entity.gravity.velocity += impulse.y;
        }
        if (entity.gravity.velocity < 0) { entity.gravity.velocity = 0; }
    }
    if (impact_entity.gravity !== undefined) {
        if (impulse.y > 0 ) {
            impact_entity.gravity.velocity -= impulse.y;
        }
        if (impact_entity.gravity.velocity < 0) { impact_entity.gravity.velocity = 0; }
    }
}

function sq_distance(a, b) {
    let distance_v = Vec2.diff(a, b);
    return distance_v.dot(distance_v);
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