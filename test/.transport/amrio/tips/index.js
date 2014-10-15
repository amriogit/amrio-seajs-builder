define("amrio/tips/index", [ "./style.css", "./helper", "amrio/tools/index" ], function(require, exports, module) {
    "use strict";
    require("./style.css");
    require("./helper");
    var tools = require("amrio/tools/index");
    module.exports = {
        show: function(text) {
            text && tools.log(text);
        }
    };
});