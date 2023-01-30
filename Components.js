class Transform {
    constructor(pos, prev_pos, scale = 1, velocity = new Vec2(0, 0),
     acceleration  = new Vec2(0, 0), facing = new Vec2(0, 0), angle = 0) {
        this.pos = pos;
        this.prev_pos = new Vec2(pos.x, pos.y);
        this.scale = scale;
        this.velocity = velocity;
        this.acceleration = acceleration;
        this.facing = facing;
        this.angle = angle;
    }
}

class Lifespan {
    constructor(lifespan, frame_created) {
        this.lifespan = lifespan;
        this.frame_created = frame_created;
    }
}

class Health {
    constructor(max, current) {
        this.max = max;
        this.current = current;
    }
}

class Input {
    constructor() {
        this.up = false;
        this.down = false;
        this.left = false;
        this.right = false;
        this.attack = false;
    }
}

class Collider {
    constructor(area, block_move, block_vision, block_jump) {
        this.area = area;
        this.block_move = block_move;
        this.block_vision = block_vision;
        this.block_jump = block_jump;
    }
}

class Patrol_AI {
    constructor(patrol_points, current_position) {
        this.patrol_points = patrol_points;
        this.current_position = current_position;
    }
}

class Invincible{
    // Active = we are invincible
    constructor(invincibility_duration = 0.15, flicker_duration = 0.1, active = false, inverted = false){
        Object.assign(this, {invincibility_duration, flicker_duration, active, inverted});
        this.current_invincibility_duration = invincibility_duration;
        this.current_flicker_duration = flicker_duration;
    }

}

class Kinematic {
    constructor(mass, pos, prev_pos, velocity, _DRAG_COEFFICIENT = 0.06, _RESTITUTION = 0.01) {
        this.f_mass = mass;                         // Total mass                                   
        this.v_pos = pos;                    // Position
        this.v_prev_pos = prev_pos;              // Position on the previous time step
        this.v_velocity = velocity;               // Velocity
        this.f_speed = 0.0;                         // Speed (magnitude of the velocity)
        this.v_forces = new Vec2();                 // Total force acting on the particle
        this.v_impact_forces = new Vec2();          // Total forces from an impact acting on the particle                     
        this.v_gravity = new Vec2(0,                // Gravity force vector
            this.f_mass * _GRAVITY_ACCELERATION);
        this._DRAG_COEFFICIENT = _DRAG_COEFFICIENT;
        this._RESTITUTION = _RESTITUTION;
        this.b_collision = false;                   // Whether the particle has collided with something
    }
}