define("amrio/tips/index", [ "$", "bootstrap", "amrio/tools/index" ], function(require, exports, module) {
    "use strict";
    var $ = require("$");
    var bootstrap = require("bootstrap");
    require("./style.css");
    require("./helper");
    var tools = require("amrio/tools/index");
    module.exports = {
        show: function(text) {
            text && tools.log(text);
        }
    };
});
define("amrio/tips/style.css", [], function() {
    seajs.importStyle(".ui-tips{font-size:12px;border:1px solid red}.ui-tips-content{background-color:#fff}");
});
define("amrio/tips/helper", [], function(require, exports, module) {
    "use strict";
    module.exports = {
        helper: {}
    };
});