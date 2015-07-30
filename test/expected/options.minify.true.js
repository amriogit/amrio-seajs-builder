define("biz/login/index",["$","angular","bootstrap"],function(o,e,i){"use strict";o("$"),o("angular");o("amrio/tips/style.css");var s=o("amrio/tips/index");o("amrio/tools/index");o("./error-msg");o("./style.css"),i.exports=function(){s.show("login success")},o("./nocmd"),o("./nocmd"),o("./nocmd")});
define("amrio/tips/style.css",[],function(){seajs.importStyle(".ui-tips{font-size:12px;border:1px solid red}.ui-tips-content{background-color:#fff}")});
define("amrio/tips/index",["$","bootstrap"],function(o,e,i){"use strict";o("$"),o("bootstrap");o("./style.css"),o("./helper");var t=o("amrio/tools/index");i.exports={show:function(o){o&&t.log(o)}}});
define("amrio/tips/helper",[],function(o,e,i){"use strict";i.exports={helper:{}}});
define("amrio/tools/index",[],function(o,i,t){"use strict";t.exports={log:function(){console.log(arguments)}}});
define("biz/login/error-msg",[],function(o,i,e){"use strict";o("amrio/tools/index"),e.exports={error:"error"}});
define("biz/login/style.css",[],function(){seajs.importStyle(".ui-tips{color:#eee;border:1px solid #666}")});
!function(){console.log("\u8fd9\u662f\u4e00\u4e2a nocmd")}();