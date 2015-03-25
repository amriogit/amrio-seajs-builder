define("biz/login/index", [ "$", "angular", "amrio/tips/style.css", "amrio/tips/index", "amrio/tools/index" ], function(o, i, s) {
    "use strict";
    o("$"), o("angular");
    o("amrio/tips/style.css");
    var e = o("amrio/tips/index");
    o("amrio/tools/index");
    o("./error-msg");
    o("./style.css"), s.exports = function() {
        e.show("login success");
    }, o("./nocmd"), o("./nocmd"), o("./nocmd");
});
define("biz/login/error-msg", [ "amrio/tools/index" ], function(o, e, i) {
    "use strict";
    o("amrio/tools/index"), i.exports = {
        error: "error"
    };
});
define("biz/login/style.css", [], function() {
    seajs.importStyle(".ui-tips{color:#eee;border:1px solid #666}");
});
!function() {
    console.log("\u8fd9\u662f\u4e00\u4e2a nocmd");
}();