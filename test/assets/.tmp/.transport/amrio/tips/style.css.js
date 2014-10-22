define("amrio/tips/style.css", [ "./base.css" ], function() {
    require("./base.css");
    seajs.importStyle(".ui-tips{font-size:12px;border:1px red solid}.ui-tips-content{background-color:#fff}");
});