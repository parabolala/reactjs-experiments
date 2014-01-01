/** 
 * @jsx React.DOM
 */

var down  = 0x01;
var right = 0x02;
var up    = 0x04;
var left  = 0x08;

function keycodeMask(keycode) {
    if (37 <= keycode && keycode <= 40) {
        return 1 << (40 - keycode);
    } else {
        return 0;
    }
}

/**
 * ActuatorPanel component.
 * Takes two props:
 *   connection: object with attributes id and port_name.
 *   roomba: RoombaAPIClient instance.
 */
var ActuatorPanel = React.createClass({
    DIRECTIONS: ["left", "up", "down", "right"],
    DIRECTION_KEYS: {up: up, down: down, left: left, right: right},
    getInitialState: function() {
        var state = {
            pressed_state: 0
        };
        return state;
    },
    press: function(keycode) {
        this.updatePressedState(
            this.state.pressed_state | keycodeMask(keycode)
        );
    },
    unpress: function(keycode) {
        this.updatePressedState(
            this.state.pressed_state & ~(keycodeMask(keycode))
        );
    },
    updatePressedState: function(new_state) {
        if (this.state.pressed_state != new_state) {
            this.setState({pressed_state: new_state});
        }
    },
    componentWillMount: function() {
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
        var arrows = this.DIRECTIONS.map(function(dir) {
            var pressed = this.state.pressed_state & this.DIRECTION_KEYS[dir];
            var glyph_class = "glyphicon-" + (pressed ? "arrow" : "chevron") + "-" + dir;
            var classes = "glyphicon " + glyph_class;
            if (pressed) {
                classes += " active"
            }

            return (
                <span key={dir} className={classes}></span>
            );
        }.bind(this));

        var drive_params = this.getVelocityAndRadius();
        this.props.roomba.Drive(
                this.props.connection.id,
                drive_params.velocity,
                drive_params.radius,
                function() {},
                function(err) { Log("drive error: " + err.responseJSON.reason); });

        return (
            <div>
            { arrows }
            </div>
        );
    },
    getVelocityAndRadius: function() {
        var value = this.state.pressed_state;
        var radius = 32767;

        var up = this.DIRECTION_KEYS.up;
        var down = this.DIRECTION_KEYS.down;
        var left = this.DIRECTION_KEYS.left;
        var right = this.DIRECTION_KEYS.right;

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
});
