/* amrio-seajs-builder 2014-08-27 16:53:40 */
define("mod/a/a",["./a.css","./index.tpl","mod/b/b","lala/bo"],function(a){a("./a.css"),a("mod/b/b.css"),a.async("./index.tpl"),a("./index.tpl");var b=a("mod/b/b");return console.log(b),a("lala/bo"),"a"}),define("mod/a/a.css",[],function(){seajs.importStyle("body{background-color:#eee}")}),define("mod/b/b.css",[],function(){seajs.importStyle("body{background-color:#f0e}")}),define("mod/a/index.tpl",[],'<!doctype html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <title>Document</title>\n</head>\n<body>\n    \n</body>\n</html>'),define([],function(){return"b"}),define("lala/bo",[],function(){console.log("bo")}),define("mod/b/b",[],function(){return"b"}),define("lala/bo",[],function(){console.log("bo")});