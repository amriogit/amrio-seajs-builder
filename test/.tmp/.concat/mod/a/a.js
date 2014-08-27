define("mod/a/a", [ "./a.css", "./index.tpl", "mod/b/b", "lala/bo" ], function(require, exports, module) {
    require("./a.css");
    require("mod/b/b.css");
    require.async("./index.tpl");
    require("./index.tpl");
    var b = require("mod/b/b");
    console.log(b);
    require("lala/bo");
    return "a";
});

define("mod/a/a.css", [], function() {
    seajs.importStyle("body{background-color:#eee}");
});

define("mod/b/b.css", [], function() {
    seajs.importStyle("body{background-color:#f0e}");
});

define("mod/a/index.tpl", [], '<!doctype html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <title>Document</title>\n</head>\n<body>\n    \n</body>\n</html>');

define([], function(require, exports, module) {
    return "b";
});

define("lala/bo", [], function() {
    console.log("bo");
});
