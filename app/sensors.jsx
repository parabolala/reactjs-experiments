/**
 * @jsx React.DOM
 */

var packetLabels = {
    25: "battery_charge",
    26: "battery_capacity",
    39: "requested_velocity"
};

getPacketFromState = function(state, packet_id) {
    for (i in state.values) {
        var reading = state.values[i];
        if (reading.packet_id == packet_id)
            return reading.value;
    }
    return null;
}

/**
 * ProgressBar component.
 * Takes two props:
 *   current_value:
 *   max_value: 
 *   min_value: 
 *   warning_thresh: 
 *   danger_thresh:
 */
var ProgressBar = React.createClass({
    render: function() {
        var max = this.props.max_value;
        var current_abs = this.props.current_value;
        var min = this.props.min_value || 0;
        var warning = this.props.warning_thresh || 30;
        var danger = this.props.danger_thresh || 5;

        var style = "success";
        var current = 0;
        if (max - min != 0) {
            current = ((current_abs - min) /
                       (max - min)) * 100;
        }

        if (current <= warning) {
            style = "warning";
        }
        if (current <= danger) {
            style = "danger";
        }
        return (
            <div className="progress">
              <div className={"progress-bar progress-bar-" + style} role="progressbar" aria-valuenow={current_abs} aria-valuemin={min} aria-valuemax={max} style={{width: current + "%"}}>
                <span className="sr-only">{ current }% Complete</span>
              </div>
            </div>
               );
    }
});

/**
 * SensorsPanel component.
 * Takes two props:
 *   connection: object with attributes id and port_name.
 *   roomba: RoombaAPIClient instance.
 */
var SensorsPanel = React.createClass({
    getInitialState: function() {
        this.interval = null;
        return {
            values: [],
            enabled: false
        };
    },
    toggle: function() {
        this.setState({enabled: !this.state.enabled});
    },
    updateSensors: function() {
        var packets = [25, 26, 39];
        this.props.roomba.SensorList(this.props.connection.id, packets,
                function(values) {
                    this.setState({values: values});
                }.bind(this),
                _errorHandler(function(error){
                    Log("Error fetching sensor value: " + error);
                }));
    },
    componentWillUnmount: function() { 
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    },
    render: function() {
        if (this.state.enabled && !this.interval) {
            this.interval = setInterval(this.updateSensors, 1000);
            this.updateSensors()
        } else if (!this.state.enabled && this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

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
        var that = this;

        var battery_bar = null;
        if (this.state.values) {
            curr = getPacketFromState(this.state, 25);
            max = getPacketFromState(this.state, 26);
            battery_bar = (
                <ProgressBar current_value={curr} max_value={max} />
            );
        }
        return (
            <div><p><strong>Sensors</strong>:
            <a href="#" onClick={function(){that.toggle();}}>
              auto-refresh:
              {
                  this.state.enabled
                  ?
                  <span className="glyphicon glyphicon-ok-circle"></span>
                  :
                  <span className="glyphicon glyphicon-ban-circle"></span>
              }
            </a>
            </p>
            { battery_bar }
            { items }
            </div>
            );
    }
});

