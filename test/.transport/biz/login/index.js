define("biz/login/index", [ "../../amrio/tips/index", "../../amrio/tips/style.css", "../../amrio/tips/helper", "amrio/tools/index", "./error-msg", "./style.css" ], function(require, exports, module) {
    "use strict";
    var tips = require("../../amrio/tips/index");
    var msgs = require("./error-msg");
    require("./style.css");
    module.exports = function() {
        tips.show("login success");
    };
});