define("biz/login/index-debug", [ "amrio/tips/index-debug", "amrio/tips/helper-debug", "amrio/tools/index-debug", "./error-msg-debug", "./style-debug.css" ], function(require, exports, module) {
    "use strict";
    var tips = require("amrio/tips/index-debug");
    require("amrio/tips/style-debug.css");
    require("amrio/tools/index-debug");
    var msgs = require("./error-msg-debug");
    require("./style-debug.css");
    module.exports = function() {
        tips.show("login success");
    };
});

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

define("amrio/tools/index-debug", [], function(require, exports, module) {
    "use strict";
    module.exports = {
        log: function() {
            console.log(arguments);
        }
    };
});

define("biz/login/error-msg-debug", [], function(require, exports, module) {
    "use strict";
    module.exports = {
        error: "error"
    };
});

define("biz/login/style-debug.css", [], function() {
    seajs.importStyle(".ui-tips{color:#eee;border:1px #666 solid}");
});
