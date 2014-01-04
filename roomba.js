var RoombaAPIClient = function(base_url) {
    this.base_url = base_url;
};

RoombaAPIClient.prototype.Request = function(type, path, success, error, data) {
    var opts = {
      type: type,
      url: this.base_url + "/" + path,
      dataType: 'json',
      mimeType: 'textPlain',
      success: success,
      error: error
    };
    if (data) {
        opts.data = data;
    }
    $.ajax(opts);
};

RoombaAPIClient.prototype.Drive = function(connection_id, velocity, radius, 
                                           success, error) {
    data = {velocity: velocity, radius: radius};
    Log("driving: v:" + data.velocity + " r:" + data.radius);
    this.Request("PUT", "connection/" + connection_id + "/control/drive",
                 success, error, JSON.stringify(data));
};

RoombaAPIClient.prototype.ListPorts = function(success, error) {
    var _success = function(response_data) {
        success(response_data.ports);
    };

    this.Request("GET", "ports", _success, error);
};

RoombaAPIClient.prototype.Connect = function(port_name, success, error) {
    var _success = function(response_data) {
        success(response_data.connection_id);
    };
    this.Request("POST", "ports/" + port_name, _success, error);
}

RoombaAPIClient.prototype.Disconnect = function(connection_id, success, error) {
    this.Request("DELETE", "connection/" + connection_id, success, error);
}

RoombaAPIClient.prototype.Sensor = function(connection_id, packet_id, success, error) {
    var _success = function(response_data) {
        success({packet_id: packet_id,
                 value: decodeSensorValue(packet_id, response_data.value)});
    };

    this.Request("GET", "connection/" + connection_id + "/sensor/" + packet_id,
            _success, error);
};

RoombaAPIClient.prototype.SensorList = function(connection_id, packet_ids, success, error) {
    var _success = function(response_data) {
        var results = [];
        for (var i = 0; i < response_data.values.length; i++){ 
            results[i] = {packet_id: packet_ids[i],
                          value: decodeSensorValue(packet_ids[i],
                                           response_data.values[i])};
        }
        success(results);
    };

    qs = $.param({"packet_id": packet_ids}, true);
    this.Request("GET", "connection/" + connection_id + "/sensor/list?" + qs,
            _success, error);
};


var packetShape = {
    25: {
        signed: false,
    },
    26: {
        signed: false,
    },
    39: {
        signed: true
    }
};
        


var conversionMap = {
    1: {
        true: function(dv) { return dv.getInt8(0); },
        false: function(dv) { return dv.getUint8(0); }
    },
    2: {
        true: function(dv) { return dv.getInt16(0, false); },
        false: function(dv) { return dv.getUint16(0, false); }
    }
};

//var encodeInt16ToBase64 = function(i) {
//    if (!(-256 <= i && i <= 255)) {
//        return;
//    }
//    var ab = new ArrayBuffer(2);
//    var tab = new Int16Array(ab);
//
//    tab[0] = i;
//
//    var str = "";
//
//    var bytes = new Uint8Array(ab);
//
//    for (var j = 0; j < bytes.byteLength; j++) {
//        str += String.fromCharCode(bytes[j]);
//    }
//    return btoa(str);
//}


var decodeSensorValue = function(packet_id, b64data) {
    var raw = atob(b64data);
    var raw_len = raw.length;

    var signed = packetShape[packet_id].signed;
    var ab = new ArrayBuffer(raw_len);
    var byteView = new Uint8Array(ab);
    
    for (var i = 0; i < raw_len; i++) {
        byteView[i] = raw.charCodeAt(i);
    }

    var convType = conversionMap[raw_len][signed];

    if (typeof(convType) == 'undefined') {
        console.log("No conversion type for " + raw_len + " " + (
                    signed ? "signed" : "unsigned") + "bytes value");
        return undefined;
    }

    var dv = new DataView(ab);
    return convType(dv);
};
