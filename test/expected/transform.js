new function() {
    var define;
    define(function(require) {
        require("a");
    });
}();

define("mod/transform", [ " a " ], function(require, exports, module) {
    var define;
    define(function() {
        require("c");
    });
    require();
    require(a);
    require("");
    require(null);
    require("./a");
    require("./a", function() {});
    require(" a ");
    require("./a");
    require([ "a" ]);
    require([ "./{lang}" ]);
    require("./b");
    require.async();
    require.async(null);
    require.async([ null, "./a" ]);
    require.async([]);
    require.async([ b ]);
    require.async("b", function() {});
    require.async(" c ");
    require.async([ " a ", "b" ], function() {});
    require.async([ "./a", "b", "c" ]);
    require.async([ "c" ]);
    require.async([ "./a", "./b" ]);
});

require("a");

require("./a");

require.async("./a");

require.async("./{lang}");

define();

define("foo", [ " a " ], function(require) {
    require("b");
});

define("mod/transform", [], function(require) {
    require("b");
});

define("bar", [], null);
define("mod/a", [], function(require, exports, module) {
    module.exports = "a";
});
define("mod/b", [], function(require, exports, module) {
    module.exports = "b";
});