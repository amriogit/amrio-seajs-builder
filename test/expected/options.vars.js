define("mod/a", [], function(require, exports, module) {
    require("./b");
    module.exports = "a";
});
define("mod/b", [], function(require, exports, module) {
    module.exports = "b";
});