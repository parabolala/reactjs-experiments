/** 
 * @jsx React.DOM
 */


/**
 * Portselector component.
 * Takes two props:
 *   roomba: RoombaAPIClient instance.
 *   onPortSelected: callback with a single argument - selected port name.
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
            if (e.status == 404) {
                Log("Error 404 while requesting ports. Backend not available.");
            } else {
                _errorHandler(Log)(e);
            }
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
            {portNodes.length ?
        <div className="panel panel-default">
        <div className="panel-heading">Available ports</div>
        <table className="table table-hover">
        <tbody>
            {portNodes}
        </tbody>
        </table>
        </div>
        :
        <div className="panel panel-danger">
          <div className="panel-heading">Error</div>
          <div className="panel-body">
            No ports found
          </div>
        </div>
            }
      </div>
    );
  }
});
