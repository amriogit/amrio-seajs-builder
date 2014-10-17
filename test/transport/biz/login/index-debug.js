define("biz/login/index-debug", [ "amrio/tips/index-debug", "amrio/tips/style-debug.css", "amrio/tips/helper-debug", "amrio/tools/index-debug", "./error-msg-debug", "./style-debug.css" ], function(require, exports, module) {
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