define("biz/login/index", [ "../../amrio/tips/index", "../../amrio/tips/style.css", "../../amrio/tips/helper", "amrio/tools/index", "./error-msg", "./style.css" ], function(require, exports, module) {
    "use strict";
    var tips = require("../../amrio/tips/index");
    var msgs = require("./error-msg");
    require("./style.css");
    module.exports = function() {
        tips.show("login success");
    };
});

define("amrio/tips/index", [ "amrio/tips/helper", "amrio/tools/index" ], function(require, exports, module) {
    "use strict";
    require("amrio/tips/style.css");
    require("amrio/tips/helper");
    var tools = require("amrio/tools/index");
    module.exports = {
        show: function(text) {
            text && tools.log(text);
        }
    };
});

define("amrio/tips/style.css", [], function() {
    seajs.importStyle(".ui-tips{font-size:12px;border:1px red solid}.ui-tips-content{background-color:#fff}");
});

define("amrio/tips/helper", [], function(require, exports, module) {
    "use strict";
    module.exports = {
        helper: {}
    };
});

define("biz/login/error-msg", [], function(require, exports, module) {
    "use strict";
    module.exports = {
        error: "error"
    };
});

define("biz/login/style.css", [], function() {
    seajs.importStyle(".ui-tips{color:#eee;border:1px #666 solid}");
});
