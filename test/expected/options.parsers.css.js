define("biz/login/index", [ "$", "angular", "amrio/tips/style.css", "amrio/tips/index", "amrio/tools/index" ], function(require, exports, module) {
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
define("biz/login/error-msg", [ "amrio/tools/index" ], function(require, exports, module) {
    "use strict";
    require("amrio/tools/index");
    module.exports = {
        error: "error"
    };
});
define("biz/login/style.css", [], function() {
    seajs.importStyle(".ui-tips{\r\n    color: #eee;\r\n    border: 1px #666 solid;\r\n}");
});
(function() {
    console.log("这是一个 nocmd");
})();