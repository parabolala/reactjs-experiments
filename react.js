/** 
 * @jsx React.DOM
 */

var PortSelector = React.createClass({
  getInitialState: function() {
    return {
      ports: []
    };
  },
  componentWillMount: function() {
    this.props.roomba.ListPorts(
        function(ports) {
            this.setState({
              ports: ports
            });
        }.bind(this), 
        function(e) {
          Log(e);
        }
    );
  },

  handleChange: function(port_name) {
    this.props.onPortSelected(port_name);
  },

  render: function() {
    var that = this;
    var portNodes = this.state.ports.map(function (port) {
      return (
        <tr key={port.name}><td className="text-right">
            <a href="#" onClick={function(){that.handleChange(port.name);}}>
            {port.name}
            <span className="port-connect btn btn-primary">Connect</span>
            </a>
        </td></tr>
      );
    });

    return (
      <div className="port-list">
        <h2 className="text-center">Available ports</h2>
            {portNodes.length ?
        <table className="table table-hover">
        <tbody>
            {portNodes}
        </tbody>
        </table>
        :
        "No ports found"}
      </div>
    );
  }
});

var Disconnector = React.createClass({
    render: function() {
        return (
            <div>
            <span>
              Connected to <strong>{this.props.connection.port}</strong>.
            </span>
            <button className="navbar-right btn-xs btn-danger" onClick={this.props.onDisconnect}>Disconnect</button>
            </div>
        );
    }
});

var packetLabels = {
    39: "requested_velocity"
};

var SensorsPanel = React.createClass({
    getInitialState: function() {
        this.interval = null;
        return {values: []};
    },

    componentWillMount: function() {
        this.interval = setInterval(this.updateSensors, 5000);
    },
    componentWillUnmount: function() {
        clearInterval(this.interval);
    },
    updateSensors: function() {
        var packets = [39];
        this.props.roomba.SensorList(this.props.connection.id, packets,
                function(values) {
                    this.setState({values: values});
                }.bind(this),
                function(error){
                    Log("Error fetching sensor value: " + error);
                });
    },
    render: function() {
        var items = this.state.values.map(function(sensor_data){
            var value = sensor_data.value;
            if (typeof(sensor_data.value) == 'undefined') {
                value = <span className="error">error getting value</span>
            }

            var label = packetLabels[sensor_data.packet_id];
            if (typeof(label) == "undefined") {
                label = sensor_data.packet_id + " (no name)";
            }

            return (
             <p key={sensor_data.packet_id}>
               <strong>{label}</strong>: {value}
             </p>
            );
        });
        return (
            <div><p><strong>Sensors</strong></p>
                {items}
            </div>
            );
    }
});

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

var ActuatorPanel = React.createClass({
    DIRECTIONS: ["up", "down", "left", "right"],
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
            return (<span key={dir} className={ pressed ? 'active' : '' } > { dir } </span>);
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

var ControlPanel = React.createClass({
  getInitialState: function() {
    return {
      roomba: null,
      connection: null
    };
  },
  componentWillMount: function() {
      this.setState({
          roomba: new RoombaAPIClient(this.props.url)
      });
  },
  setPortName: function(port_name) {
    if (!port_name) {
        this.state.roomba.Disconnect(this.state.connection.id,
            function() {
                this.setState({connection: null});
            }.bind(this),
            function(error) {
                Log("Error disconnecting: " + error);
            }.bind(this)
        );
    } else {
        this.state.roomba.Connect(port_name,
            function(connection_id) {
                this.setState({
                    connection: {
                        id: connection_id,
                        port: port_name
                    }
                });
            }.bind(this),
            function(error) {
                Log("Error opening port: " + error);
            }.bind(this));
    }
  },
  render: function() {
    return (
      <div className="control-panel">
        {this.state.connection 
            ?
            (
             <div className="panel panel-primary">
               <div className="panel-heading">
                 <Disconnector connection={this.state.connection} onDisconnect={this.setPortName.bind(this, "")} />
               </div>
               <SensorsPanel connection={this.state.connection} roomba={this.state.roomba}/>
               <ActuatorPanel connection={this.state.connection} roomba={this.state.roomba}/>
             </div>
            )
            :
            <PortSelector roomba={this.state.roomba} onPortSelected={this.setPortName} />
        }
        <div className="panel panel-default">
          <div className="panel-heading">Log</div>
          <pre className="log"></pre>
        </div>
      </div>
    );
  }
});

var Log = function(msg) {
    console.log(msg);
    $('.log')[0].innerHTML = (new Date()).toLocaleString() + ": " + msg + "\n" + $('.log')[0].innerHTML;
};

React.renderComponent(
  //<ControlPanel url="//localhost:8000/roomba" />,
  <ControlPanel url="//localhost:8000/roomba" />,
  document.getElementById('content')
);
