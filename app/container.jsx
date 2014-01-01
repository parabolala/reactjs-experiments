/** 
 * @jsx React.DOM
 */


/**
 * ControlPanel component.
 * Takes one prop: 
 *   url: string base URL for roomba API client requests.
 */
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
            _errorHandler(function(error) {
                Log("Error disconnecting: " + error);
            }.bind(this))
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
            _errorHandler(function(error) {
                Log("Error opening port: " + error);
            }.bind(this))
        );
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
