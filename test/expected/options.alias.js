define("amrio/tips/index", [ "bootstrap" ], function(require, exports, module) {
    "use strict";
    var $ = require("biz/login/other");
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
define("biz/login/other", [], function(require, exports, module) {
    "use strict";
    require("./style.css");
    module.exports = {
        error: "other"
    };
});
define("biz/login/style.css", [], function() {
    seajs.importStyle(".ui-tips{color:#eee;border:1px solid #666}");
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
define("amrio/tools/index", [], function(require, exports, module) {
    "use strict";
    module.exports = {
        log: function() {
            console.log(arguments);
        }
    };
});