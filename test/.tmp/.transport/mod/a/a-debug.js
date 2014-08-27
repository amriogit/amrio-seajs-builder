define("mod/a/a-debug", [ "./a-debug.css", "mod/b/b-debug.css", "./index-debug.tpl", "mod/b/b-debug", "lala/bo-debug" ], function(require, exports, module) {
    require("./a-debug.css");
    require("mod/b/b-debug.css");
    require.async("./index-debug.tpl");
    require("./index-debug.tpl");
    var b = require("mod/b/b-debug");
    console.log(b);
    require("lala/bo-debug");
    return "a";
});