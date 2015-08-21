define("mod/require", [ "   a      ", "   a " ], function(require, exports, module) {
    require();
    require(a);
    require("");
    require(null);
    require("a ", function() {});
    require("   a      ");
    require("   a ");
    require("./a");
    require([ "a" ]);
    require([ "./{lang}" ]);
    require("./b");
    require.async();
    require.async(null);
    require.async([ null, "a" ]);
    require.async([]);
    require.async([ b ]);
    require.async("b", function() {});
    require.async("   c    ");
    require.async([ "      a", "b" ], function() {});
    require.async([ "a", "b", "c" ]);
    require.async([ "c" ]);
    require.async([ "a", "./b" ]);
});
define("mod/a", [], function(require, exports, module) {
    module.exports = "a";
});
define("mod/b", [], function(require, exports, module) {
    module.exports = "b";
});