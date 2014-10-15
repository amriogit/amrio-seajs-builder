define("amrio/tips/index-debug", [ "./style-debug.css", "./helper-debug", "amrio/tools/index-debug" ], function(require, exports, module) {
    "use strict";
    require("./style-debug.css");
    require("./helper-debug");
    var tools = require("amrio/tools/index-debug");
    module.exports = {
        show: function(text) {
            text && tools.log(text);
        }
    };
});

define("amrio/tips/style-debug.css", [], function() {
    seajs.importStyle(".ui-tips{font-size:12px;border:1px red solid}.ui-tips-content{background-color:#fff}");
});

define("amrio/tips/helper-debug", [], function(require, exports, module) {
    "use strict";
    module.exports = {
        helper: {}
    };
});
