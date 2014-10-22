define("amrio/tips/style-debug.css", [ "./base-debug.css" ], function() {
    require("./base-debug.css");
    seajs.importStyle(".ui-tips{font-size:12px;border:1px red solid}.ui-tips-content{background-color:#fff}");
});