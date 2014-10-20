define("amrio/tips/index-debug", [ "./helper-debug", "amrio/tools/index-debug" ], function(require, exports, module) {
    "use strict";
    // require('./style.css')
    require("./helper-debug");
    var tools = require("amrio/tools/index-debug");
    module.exports = {
        show: function(text) {
            text && tools.log(text);
        }
    };
});