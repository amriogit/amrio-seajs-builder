define("login/index", [ "$", "angular", "amrio/tips/style.css", "amrio/tips/index", "amrio/tools/index" ], function(require, exports, module) {
    "use strict";
    var $ = require("$");
    var angular = require("angular");
    require("amrio/tips/style.css");
    var tips = require("amrio/tips/index");
    require("amrio/tools/index");
    var msgs = require("./error-msg");
    require("./style.css");
    module.exports = function() {
        tips.show("login success");
    };
    require("./nocmd");
    require("./nocmd");
    require("./nocmd");
});
define("login/error-msg", [ "amrio/tools/index" ], function(require, exports, module) {
    "use strict";
    require("amrio/tools/index");
    module.exports = {
        error: "error"
    };
});
define("login/style.css", [], function() {
    seajs.importStyle(".ui-tips{color:#eee;border:1px solid #666}");
});
(function() {
    console.log("这是一个 nocmd");
})();