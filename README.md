# amrio-seajs-builder
[amrio-seajs-builder](https://github.com/amriogit/amrio-seajs-builder) 是一个 [__seajs__](http://seajs.org/docs/) 模块构建命令工具，使用 grunt 作为基础，采用seajs 官方
推荐的 [grunt-cmd-transport](https://npmjs.org/package/grunt-cmd-transport)，
[grunt-cmd-concat](https://npmjs.org/package/grunt-cmd-concat) 构建模块进行构建。  
此模块的目的是为了进行更好的自定义构建，提供转换，合并，压缩 js、css 的整合功能，  
提供了命令参数进行更好的自定义构建，方便没有使用 spm 标准构建的项目进行自定义构建  
此模块要求使用者有一定的 seajs 构建经验，里面有些选项是 seajs 构建工具中的选项，可以作为此模块的文档补充
 
__此模块目前只有本人在使用而已，不保证能满足你的需求！__

非常感谢 [__seajs__](http://seajs.org) 和它配套的自定义构建工具

## 安装 amrio-seajs-builder
此模块需要全局安装，以便使用全局命令 asb
```
npm install -g amrio-seajs-builder
```

## 使用
使用 npm 全局安装完毕后，可以在命令行中使用：asb -h 查看该命令的帮助信息，
如果报错，请重新全局安装，直到命令行中 asb 命令可用

### 参数
-b, --build <path> 构建路径，必填项！  
-d, --dist <path> 部署路径 默认值：./sea-modules  
-i, --include <include> 构建包含范围 默认值：relative  
-p, --paths <path> paths 路径 默认值：./sea-modules  
-a, --alias <path> alias 别名文件路径 默认值：./package.json  
--force 强制执行  

### 常规用法
```
asb -b amrio
```  
-b 参数是指定构建源文件/文件夹的路径，这条命令会找到当前执行 abs 目录下的 ./amrio 文件夹，  
并且把里面所有的可以构建的模块文件使用 (默认值：relative) 的构建范围，  
构建至当前执行目录下的 ./sea-modules(默认值) 文件夹里面，构建完毕后会在 sea-modules 目录下生成 amrio/** 文件

##### 常规构建
```
asb -b amrio
```
##### 构建指定文件/文件夹，多个需要用 “,” 分开
```
asb -b amrio,biz/mix/validation.js
```

##### 使用 all 构建范围构建到指定目录
```
asb -b amrio -d custom -i all
```

##### 使用 -p 指定构建时文件合并的基础查找路径，和 nodejs 的 node_modules 功能相同，多个 paths 使用 “,” 分开
```
asb -b amrio -p ../../myLib,sea-modules
```

##### 使用 -a 指定构建时使用的 alias 文件，默认值是当前目录下的 ./package.json
```
asb -b amrio -i ../myAlias.json

../myAlias.json 文件格式

{
    "jquery": "amrio/jqeury/jquery",
    "$": "amrio/jqeury/jquery"
}
```

## 联系
* EMAIL [amriogm@gmail.com](mailto:amriogm@gmail.com)  
* QQ 841830150  
* github [https://github.com/amriogit/amrio-seajs-builder](https://github.com/amriogit/amrio-seajs-builder)