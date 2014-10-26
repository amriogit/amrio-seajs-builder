# amrio-seajs-builder
amrio-seajs-builder 是一个合并前端 **CMD** 模块的工具，目前只是用来和 seajs 配套使用。   

这个项目没有使用 [grunt-cmd-transport](https://www.npmjs.org/package/grunt-cmd-transport) 
和 
 [grunt-cmd-concat](https://www.npmjs.org/package/grunt-cmd-concat) 进行自定义构建,   
而是使用了 [cmd-util](https://www.npmjs.org/package/cmd-util) 这个更为灵活的构建工具。   
   
   
##### 这个模块与上面构建方案的不同之处：  

* transport 和 concat 过程没有分离，采用线性查找所有依赖，然后合并进来，避免产生无用文件   

* 分析文件合并后的 AST，置空其它依赖模块的依赖数组，把这些依赖数组去重后只放入入口模块的依赖数组里，进一步减小文件后合并大小   

* 分析文件合并后的 AST 并删除重复的模块，   
重复`define(id, deps, factory)`的模块用`;`号代替掉了，如果不是使用`define`严格包裹的模块可能会发生错误，因为只是简单的把`define(id, deps, factory)`变成空语句`;`   

* 采用了缓存策略，提升 transport，concat 的性能   
 
非常感谢 [__seajs__](http://seajs.org) 和它配套的自定义构建工具

## 安装 amrio-seajs-builder
此模块需要全局安装，以便使用全局命令 `asb`
```
npm install -g amrio-seajs-builder
```

## 使用
使用 npm 全局安装完毕后，可以在命令行中使用：`asb -h` 查看该命令的帮助信息，
如果报错，请重新全局安装，直到命令行中 asb 命令可用

### 参数
`-s, --src <path> `构建路径，必填项！  
`-d, --dest <path> `部署路径 默认值：`./sea-modules`  
`-p, --paths <path>` 顶级模块查找的基础 `paths` 路径，和 `node_modules`的作用一样 默认值：`./sea-modules`  
`-all` 构建模块范围，默认只构建相对模块，指定此参数后顶级模块和相对模块都会被合并进来  

### 常规用法
```
asb -s amrio
```  
`-s` 参数是指定构建源文件/文件夹的路径，这条命令会尝试找到当前执行 `abs` 命令目录下的 `./amrio` 文件夹，   
并且把里面 `.js, .css` 模块文件使用默认构建范围（相对模块）进行构建。   
最后构建至默认部署路径 `./sea-modules` 文件夹里面，   
构建完毕后会在 `sea-modules` 目录下生成 `amrio/**.{js,css}` 文件

#### 常规构建
```
asb -s amrio
```
#### 构建指定文件/文件夹，多个需要用 “,” 分开
```
asb -s amrio,biz/mix/validation.js
```

#### 使用 all 构建范围构建到指定目录
```
asb -s amrio -d ../../custom --all
```

#### 使用 -p 指定构建时文件合并的基础查找路径，和 nodejs 的 node_modules 功能类似，多个 paths 使用 “,” 分开
```
asb -s amrio -p ../../myLib,my-module,../sea-modules
```

### nodejs API
```js
var builder = require('amrio-seajs-builder')

builder({
    src: 'amrio',
    dest: './sea-modules',
    paths: ['../my-modules', 'sea-modules', 'lib'],
    all: true,
    minify: false
})
```

## 联系
* EMAIL [amriogm@gmail.com](mailto:amriogm@gmail.com)  
* QQ 841830150  
* github [https://github.com/amriogit/amrio-seajs-builder](https://github.com/amriogit/amrio-seajs-builder)