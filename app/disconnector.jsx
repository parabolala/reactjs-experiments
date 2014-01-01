/** 
 * @jsx React.DOM
 */

/**
 * Portselector component.
 * Takes two props:
 *   connection: object with attributes id and port_name.
 *   onDisconnect: callback with no args to call when disconnect is triggered.
 */
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
