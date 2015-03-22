define("biz/login/error-msg", [], function(require, exports, module) {
    "use strict";
    require("amrio/tools/index");
    module.exports = {
        error: "error"
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