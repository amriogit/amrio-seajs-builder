define("amrio/tips/style-debug.css", [ "./base-debug.css" ], function() {
    seajs.importStyle(".ui-tips{font-size:12px;border:1px red solid}.ui-tips-content{background-color:#fff}");
});

define("amrio/tips/base-debug.css", [], function() {
    seajs.importStyle(".base{color:#333}");
});
