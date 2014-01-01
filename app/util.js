var _errorHandler = function(string_handler){
    return function(e) {
        var s = e.status + ' ' + e.statusText;
        if (e.status == 500 && e.responseJSON) {
            s += ": " + e.responseJSON.reason;
        }
        string_handler(s);
    };
};

var Log = function(msg) {
    console.log(msg);
    var d = new Date();
    $('.log')[0].innerHTML = d.toLocaleString() + ": " + 
                             msg + "\n" + $('.log')[0].innerHTML;
};

