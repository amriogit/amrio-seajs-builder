define("mod/a/a", [ "./a.css", "mod/b/b.css", "./index.tpl", "mod/b/b", "lala/bo" ], function(require, exports, module) {
    require("./a.css");
    require("mod/b/b.css");
    require.async("./index.tpl");
    require("./index.tpl");
    var b = require("mod/b/b");
    console.log(b);
    require("lala/bo");
    return "a";
});