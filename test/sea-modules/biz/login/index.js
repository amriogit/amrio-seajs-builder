define("biz/login/index", [], function(require, exports, module) {
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
define("amrio/tips/style.css", [], function() {
    seajs.importStyle('@import url("./base.css");\n\n.ui-tips{\n    font-size: 12px;\n    border: 1px #f00 solid;\n}\n.ui-tips-content{\n    background-color: #fff;\n}');
});
define("amrio/tips/index", [], function(require, exports, module) {
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
define("biz/login/error-msg", [], function(require, exports, module) {
    "use strict";
    require("amrio/tools/index");
    module.exports = {
        error: "error"
    };
});
define("biz/login/style.css", [], function() {
    seajs.importStyle(".ui-tips{\n    color: #eee;\n    border: 1px #666 solid;\n}");
});
(function() {
    console.log("这是一个 nocmd");
})();