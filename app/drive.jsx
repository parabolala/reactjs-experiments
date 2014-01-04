/** 
 * @jsx React.DOM
 */

var down  = 0x01;
var right = 0x02;
var up    = 0x04;
var left  = 0x08;

var DIRECTIONS = ["left", "up", "down", "right"]
var DIRECTION_KEYS = {up: up, down: down, left: left, right: right}

/**
 * Converts keycodes in range 37-40 to mask-able values 1, 2, 4, 8.
 * Args:
 *   keycode: int.
 * Returns:
 *   mask corresponding to give keycode.
 */
var keycodeMask = function(keycode) {
    if (37 <= keycode && keycode <= 40) {
        return 1 << (40 - keycode);
    } else {
        return 0;
    }
}

/** 
 * Converts a bitmask of currently pressed keys to a pair of velocity and radius.
 *
 * Args:
 *   values: bitmask of pressed keys, as returned by keycodeMask.
 * Returns:
 *   An object with two fields: radius and velocity.
 */
var getVelocityAndRadius = function(value) {
    var radius = 32767;

    var up = DIRECTION_KEYS.up;
    var down = DIRECTION_KEYS.down;
    var left = DIRECTION_KEYS.left;
    var right = DIRECTION_KEYS.right;

    if (value & up) {
        speed = 300;
    } else if (value & down) {
        speed = -300;
    } else {
        if (value & (left | right)) {
            speed = 200;
        } else {
            speed = 0;
            radius = 0;
        }
    }

    if (value & right) {
        if (value & (up | down)) {
            radius = -200;
        } else {
            radius = -1;
        }
    } else if (value & left) {
        if (value & (up | down)) {
            radius = 200;
        } else {
            radius = 1;
        }
    }

    return {
        velocity: speed,
        radius: radius
    };
}
/**
 * ActuatorPanel component.
 * Takes two props:
 *   connection: object with attributes id and port_name.
 *   roomba: RoombaAPIClient instance.
 */
var ActuatorPanel = React.createClass({
    getInitialState: function() {
        var state = {
            // Pressed state for UI. May lag behind actual state.
            pressed_state: 0
        };
        return state;
    },
    press: function(keycode) {
        this.updatePressedState(
            this.getRealPressedState() | keycodeMask(keycode)
        );
    },
    unpress: function(keycode) {
        Log("unpressed " + keycodeMask(keycode));
        this.updatePressedState(
            this.getRealPressedState() & ~(keycodeMask(keycode))
        );
    },
    getRealPressedState: function() {
        var state = this.pendingPressedState;
        if (state == null) {
            state = this.state.pressed_state;
        }
        return state;
    },
    updatePressedState: function(new_state) {
        Log("requested_state " + new_state);
        if (this.pendingPressedState == null) {
            // Batch all the key presses for 0.2s.
            setTimeout(function() {
                var requested_state = this.pendingPressedState;
                this.pendingPressedState = null;
                Log("current_state " + this.state.pressed_state);
                if (this.state.pressed_state != requested_state) {
                    this.setState({pressed_state: requested_state});
                }
            }.bind(this), 200);
        }
        this.pendingPressedState = new_state;
    },
    componentWillMount: function() {
        this.initialRender = true;

        $(document).keydown(function(e) {
            if (keycodeMask(e.keyCode)) {
                this.press(e.keyCode);
                return false;
            }
            return true;
        }.bind(this));

        $(document).keyup(function(e) {
            if (keycodeMask(e.keyCode)) {
                this.unpress(e.keyCode);
                return false;
            }
            return true;
        }.bind(this));
    },
    componentWillUnmount: function() {
        $(document).off("keydown");
        $(document).off("keyup");
    },
    render: function() {
        var arrows = DIRECTIONS.map(function(dir) {
            var pressed = this.state.pressed_state & DIRECTION_KEYS[dir];
            var glyph_class = "glyphicon-" + (pressed ? "arrow" : "chevron") + "-" + dir;
            var classes = "glyphicon " + glyph_class;
            if (pressed) {
                classes += " active"
            }

            return (
                <span key={dir} className={classes}></span>
            );
        }.bind(this));

        if (!this.initialRender) {
            var drive_params = getVelocityAndRadius(this.state.pressed_state);
            this.props.roomba.Drive(
                    this.props.connection.id,
                    drive_params.velocity,
                    drive_params.radius,
                    function() {},
                    function(err) { Log("drive error: " + err.responseJSON.reason); });
        } else {
            this.initialRender = false;
        };

        return (
            <div>
            { arrows }
            </div>
        );
    },
});
