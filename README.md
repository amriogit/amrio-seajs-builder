# amrio-seajs-builder 

[![Build Status][travis-image]][travis-url] [![NPM version][npm-image]][npm-url] [![Downloads][download-image]][npm-url] [![Dependency Status][dependency-image]][dependency-url]

amrio-seajs-builder 一个 **CMD** 模块构建工具。   

>降低 `CMD` 构建难度，与 `seajs.config` 保持一致配置，会配置 `seajs` 就会构建。

## 特性：  

* `seajs` 能处理的模块，`amrio-seajs-builder` 也可以

* `transport` `concat` 不分离，递归查找所有依赖，合并所有能合并的文件，非 `CMD` 模块也可以合并

* `transport` `concat` 紧密结合，依赖合并不易错，并且可以定制合并排除策略

* 移除依赖列表中已经成功合并的依赖，避免依赖数量过多导致依赖列表过长，文件体积增大

* 内置 `Uglify-js` 压缩器，配合 `connector` 可以一行一行的显示模块，可以更直观的检查压缩后的代码

### 注意

仅支持未 `transport` 过的模块的构建，普通非 `CMD` 文件也可以被当作依赖进行合并压缩操作。

``` js
// 这种情况属于未 `transport`，会分析方法中的依赖，然后合并压缩
define(function(require, exports, module){
    // code...
})

// 这种情况也属于未 `transport`，
// 依赖会直接从依赖列表中获取，不再分析方法里的依赖，最后也会进行合并压缩
define(['amrio/tips/style.css', 'amrio/tips/index'], function(require, exports, module){
    // code...
})

// 这种情况也属于未 `transport`，
// 不会修改当前已有的 id，依赖通过分析方法获得，最后合并压缩
define('id', function(require, exports, module){
    // code...
})

// 这属于已 `transport` 的模块，不会做依赖分析，不会合并，只会被压缩
define('biz/login/index', ['amrio/tips/style.css', 'amrio/tips/index'], function(require, exports, module){
    // code...
})

// 这种情况属于未 `transport`，
// 但因为没有检测到名叫 require 的实参，所以并不会分析合并依赖
// 因为 require 实参被改名，这样会被认为是已经压缩过的代码，不会进行压缩处理
define(function(r, exports, module){
    // code...
})

// 这种情况属于未 `transport`，
// 但因为没有检测到名叫 require 的实参，所以并不会分析合并依赖
// 因为 require 实参不存在，这样会被认为是未压缩过的代码，会进行压缩处理
define(function(){
    // code...
})

// 非模块不做处理，只会被当作依赖被合并压缩
(function() {
    // code...
})()
```

# 安装 amrio-seajs-builder

如需使用全局命令 `asb`，请全局安装

```
npm i amrio-seajs-builder -g
```

#  命令行使用
使用 npm 全局安装完毕后，可以在命令行中使用：`asb -h` 查看该命令的帮助信息，
如果报错，请重新全局安装，直到命令行中 asb 命令可用

## 参数
``` bash
Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -s, --src <path>       src path required
    -d, --dest <path>      dest path. defaults ./dist
    -c, --cwd <path>       same seajs.config.cwd. defaults ./
    -b, --base <path>      same seajs.config.base. defaults ./
    -a, --alias <object>   same seajs.config.alias
    -p, --paths <object>   same seajs.config.paths
    -v, --vars <object>    same seajs.config.vars
    -e, --exclude <array>  exclude module
    --config <path>        specify a config file. defaults ./asb.config.js
    --all                  concat relative and top
    --no-log               disable log
    --no-minify            disable minify
    --no-copy-other        copy other files, like *.{css,png,...}
``` 

## 用法

```
// -s 参数指定了需要构建的文件路径，支持 glob 格式输入，多个使用逗号分隔

asb -s amrio/**/*.js
asb -s amrio/**/*.js,biz/**/*.js
```

```
// 使用 -d 参数指定构建后产出的文件目录

asb -s amrio/**/*.js -d dist
```

```
// 使用 -p 指定构建的 paths 选项
// 和 seajs.config.paths 的作用一致，多个使用逗号分开

asb -s amrio/**/*.js -p biz:./biz,amrio:./amrio
```

```
// 使用 -a 指定构建的 alias 选项
// 和 seajs.config.alias 的作用一致，多个使用逗号分开

asb -s amrio/**/*.js -a $:jquery/1.7.2/jqeury,angular:angular/1.1.5/angular
```

```
// 使用 --all 意味着相对模块、顶级模块都会被合并

asb -s amrio/**/*.js --all
```

```
// 使用 --config 来配置命令行，默认会查找当前目录下的 `./asb.config.js` 文件，
// 文件里定义的参数可以被命令行参数覆盖
// 具体可配置参数请参考下面的 Node API

asb -s amrio/**/*.js --config ./config/asb.config.js
```

# Node API

## 安装
```
npm i amrio-seajs-builder --save
```

## 例子

```js
var asb = require('amrio-seajs-builder')

asb('amrio/tips/index.js', {
    dest: './dist',
    cwd: './',
    base: './sea-modules',
    alias: {
        $: 'jquery/1.7.2/jquery'
    },
    paths: {
        biz: './biz',
        amrio: './amrio'
    },
    vars: {
        lang: 'cn'
    },
    all: true,
    log: true,
    minify: true,
    exclude: ["$", "angular", "bootstrap"]

}).then(function() {
    console.log('Build finish')
})
```

## asb(src, options)

模块构建主方法

* `src` {String || Array[String]} 需要构建的文件路径，可以输入一个 glob 格式的字符串或字符串数组
* `options` {Object} 构建参数，见下文
* `return` {Promise} 构建完成后的回调

## options

### cwd
Type: `String`  
Default: `./`

和 seajs.config.cwd 的作用一样，用于解析相对路径，seajs.use('./main') 时就是使用 `cwd` 去 resolve

可以和 `paths` 配合使用来查找处于不同位置的模块，例如：

``` js
asb(src, {
    cwd: './js',
    base: './js/sea-modules',
    paths: {
        biz: './biz'
    }
})

// 配置了 biz paths 时 resolve 的 uri 是个相对路径，所以基于 cwd 解析
resolve('biz/mod') === './js/biz/mod.js'

// 没有配置 paths 的 amrio resolve 的 uri 是顶级路径，所以基于 base 解析
resolve('amrio/mod') === './js/sea-modules/amrio/mod.js'
```

### base
Type: `String` 
Default: `./`

和 seajs.config.base 的作用一样，是顶级模块的基础查找路径

### alias
Type: `Object`  
Default: `{}`

和 seajs.config.alias 的作用一样，作为 id 的别名，构建出的模块也是使用 alias 解析值作为模块 id

例如：
``` js
asb('$', {
    alias: {
        $: 'jquery/1.7.2/jquery'
    }
})

// 构建结果
define('jquery/1.7.2/jquery', [...], factory)
```

### paths
Type: `Object`  
Default: `{}`

和 seajs.config.paths 的作用一样，用作配置一个模块的路径

### vars
Type: `Object`  
Default: `{}`

和 seajs.config.vars 的作用一样，可以在 id 中插变量，例如：
``` js
asb(src, {
    vars: {
        lang: 'en'
    }
})

resolve('amrio/lang/{lang}') === 'amrio/lang/en'
```

### map
Type: `Array`  
Default: `[]`

和 seajs.config.map 的作用一样，可以改变模块的查找路径

### dest
Type: `String`  
Default: `./dist`

构建产的出路径

### all
Type: `Boolean`  
Default: `false`

是否合并顶级模块，默认只合并相对模块

### exclude
Type: `Array || Function(id)`  
Default: `[]`

需要排除的模块

为 {Array} 时，会检查包含在数组里面的 id，如果存在则不会进行合并操作

为 {Function} 时，每个模块的依赖 id 会作为参数传进来，可以返回 `true` 或 `null`

* 返回 `true` 则排除模块
* 返回 `null` 除了排除模块外，也从依赖列表里删除该 `id`
    * 这对排除一些公共模块很有用，例如每个模块都依赖了 `$`，但它早已加载，这时就可以把它从依赖列表里删除掉，直接 require 就好，这样依赖列表会少些，减少文件体积，减少无用 resolve

### connector
Type: `String`  
Default: `\n`

concat 连接模块的 connector`[code...].join(connector)`），让合并出来的文件有条理。

### copyOther
Type: `Boolean`  
Default: `true`

是否复制其它非模块文件到构建目录中，默认开启。
此设计是为了确保模块的完整性，例如有些模块用到了一些图片、字体等。那么开启这个选项，就会同步复制这些文件，确保模块的完整性。

### minify
Type: `Boolean`  
Default: `true`

构建时是否压缩模块，默认开启

### uglify
Type: `Object`  
Default: 
``` js
uglify: {
    compress: {
        warnings: false
    },
    beautify: {
        ascii_only: true
    }
}
```

仅在 `minify: true` 时有效

默认使用 `ascii_only`，增加 `gzip` 的压缩率，避免中文乱码
还可以使用 `Uglify-js` 的其它配置，例如 `drop_console`，`global_defs` 等选项

### onPost
Type: `Function(module, dest, resolve, reject)`  
Default: `writeFile`

产出文件的发布函数，默认值是按照 `dest` 路径保存 `module.result` 构建后的结果。处理完毕后调用 `resolve`，出错则调用 `reject`

### log
Type: `Boolean`  
Default: `false`

打印日志开关，默认关闭

# 静态方法
## asb.parsers.add(ext, parser)

添加一个模块解析器

用法
``` js
// 使用后缀名来选择需要使用的解析器，
// 默认传入 module 对象，和 promise 的 resolve、reject 函数
asb.parsers.add('.css', function(module, resolve, reject) {

    // asb.parsers 自带一个文件读取方法，返回一个 promise
    asb.parsers.readFile(module.uri).then(function(file) {
        file = new CleanCSS().minify(file).styles
        file = util.format(cssTemplate, module.id, JSON.stringify(file))
        
        // 处理完毕后调用 resolve，否则将一直等待
        resolve(file)
    }).catch(reject)
})
```

# 致谢
非常感谢 [__seajs__](http://seajs.org) 和它配套的自定义构建工具 [grunt-cmd-transport](https://www.npmjs.org/package/grunt-cmd-transport)、 [grunt-cmd-concat](https://www.npmjs.org/package/grunt-cmd-concat)


# 联系
* EMAIL [amriogm@gmail.com](mailto:amriogm@gmail.com)  
* github [https://github.com/amriogit/amrio-seajs-builder](https://github.com/amriogit/amrio-seajs-builder)

[travis-image]: https://travis-ci.org/amriogit/amrio-seajs-builder.svg
[travis-url]: https://travis-ci.org/amriogit/amrio-seajs-builder
[npm-image]: https://badge.fury.io/js/amrio-seajs-builder.svg
[npm-url]: https://www.npmjs.com/package/amrio-seajs-builder
[dependency-image]: https://david-dm.org/amriogit/amrio-seajs-builder.svg
[dependency-url]: https://david-dm.org/amriogit/amrio-seajs-builder
[download-image]: http://img.shields.io/npm/dm/amrio-seajs-builder.svg