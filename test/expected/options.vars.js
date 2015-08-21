define("mod/vars", [], function(require, exports, module) {
    require("./b");
    module.exports = "vars";
});
define("mod/b", [], function(require, exports, module) {
    module.exports = "b";
});