define("amrio/tips/index",["$","bootstrap"],function(o,e,t){"use strict";o("$"),o("bootstrap");o("./style.css"),o("./helper");var r=o("amrio/tools/index");t.exports={show:function(o){o&&r.log(o)}}});

define("amrio/tips/style.css",[],function(){seajs.importStyle('@import url("./base.css");\r\n\r\n.ui-tips{\r\n    font-size: 12px;\r\n    border: 1px #f00 solid;\r\n}\r\n.ui-tips-content{\r\n    background-color: #fff;\r\n}')});define("amrio/tips/helper",[],function(e,o,r){"use strict";r.exports={helper:{}}});define("amrio/tools/index",[],function(o,e,t){"use strict";t.exports={log:function(){console.log(arguments)}}});