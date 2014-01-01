/** 
 * @jsx React.DOM
 */

var packetLabels = {
    39: "requested_velocity"
};

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
        var packets = [39];
        this.props.roomba.SensorList(this.props.connection.id, packets,
                function(values) {
                    this.setState({values: values});
                }.bind(this),
                _errorHandler(function(error){
                    Log("Error fetching sensor value: " + error);
                }));
    },
    render: function() {
        if (this.state.enabled && !this.interval) {
            this.interval = setInterval(this.updateSensors, 5000);
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
            {items}
            </div>
            );
    }
});

