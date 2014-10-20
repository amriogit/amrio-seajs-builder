define("amrio/tips/index", [ "./helper", "amrio/tools/index" ], function(require, exports, module) {
    "use strict";
    // require('./style.css')
    require("./helper");
    var tools = require("amrio/tools/index");
    module.exports = {
        show: function(text) {
            text && tools.log(text);
        }
    };
});