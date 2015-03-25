# amrio-seajs-builder 

[![Build Status][travis-image]][travis-url] [![NPM version][npm-image]][npm-url] [![Downloads][download-image]][npm-url] [![Dependency Status][dependency-image]][dependency-url]

amrio-seajs-builder 一个 **CMD** 模块构建工具。   

>此项目的目的是为了把 `transport` 与 `concat` 任务融合在一起，减少中间文件产生，提升性能。避免过多概念，降低构建难度。

>运行原理与 [grunt-cmd-transport](https://www.npmjs.org/package/grunt-cmd-transport)、 [grunt-cmd-concat](https://www.npmjs.org/package/grunt-cmd-concat) 保持一致，并在这之上加了一些特性。
   
## 特性：  

* `transport` 和 `concat` 过程没有分离，采用递归查找出所有依赖。

* `transport` 产生的文件直接缓存在内存中，避免 `transport` 中间文件写入，提升了些性能？（100 多个文件，只减少了 1 秒左右）   

* 已经合并在一起的依赖不会再出现在入口模块的依赖数组里面了，入口模块的依赖数组里只会出现没有合并进来的依赖。
这样可以让文件看起来小一些，有些模块依赖几十个依赖项，`transport` 后又会产生把这几十个依赖放入依赖数组里，如果这些模块已经被合并，是没有必要重复出现在依赖数组里的（有 gzip，貌似重复也没太大关系，本人测试开启 gzip 这样做能减少 1K 左右）

目前只支持匿名模块的构建，如果已经是具名模块，则当做普通文件对待。
``` js
// 匿名模块会进行 transport concat 构建
define(function(require, exports, module){
    // code...
})

// 具名模块不会进行 transport concat 构建，只会当做普通 js 文件处理
define("biz/login/index", ["amrio/tips/style.css", "amrio/tips/index"], function(require, exports, module){
    // code...
})
```

PS: 非常感谢 [__seajs__](http://seajs.org) 和它配套的自定义构建工具 [grunt-cmd-transport](https://www.npmjs.org/package/grunt-cmd-transport)、 [grunt-cmd-concat](https://www.npmjs.org/package/grunt-cmd-concat)

## 安装 amrio-seajs-builder
此模块需要全局安装，以便使用全局命令 `asb`
```
npm install amrio-seajs-builder -g
```

##  命令行使用
使用 npm 全局安装完毕后，可以在命令行中使用：`asb -h` 查看该命令的帮助信息，
如果报错，请重新全局安装，直到命令行中 asb 命令可用

### 参数
`-s, --src <path> `构建路径，必填项！  
`-d, --dest <path> `部署路径 默认值：`./sea-modules`  
`-p, --paths <path>` 模块的基础查找路径 默认值：`./sea-modules`  
`--all` 构建模块范围，默认只构建相对模块 
`--no-minify` 关闭 `uglifyjs` 压缩  

### 用法
```
asb -s amrio
```  
`-s` 参数是指定构建源文件/文件夹的路径，这条命令会尝试找到当前执行 `asb` 命令目录下的 `amrio` 文件夹，并且把里面 `*.js` 模块文件进行构建。最后构建至默认部署路径 `sea-modules` 文件夹里面，构建完毕后会在 `sea-modules` 目录下生成 `amrio/**/*.js` 等文件

#### 指定构建文件/文件夹，多个需要用 “,” 分开
```
asb -s amrio,biz/mix/validation.js
```

#### 使用 all 构建范围构建到指定目录
使用 `--all` 意味着不光相对模块，顶级模块也会被合并进来
```
asb -s amrio --all
```

#### 使用 -p 指定构建时文件合并的基础查找路径，多个 paths 使用 “,” 分开查找模块路径的时候都会使用这些 `paths` 作为 base 路径进行查找
```
asb -s amrio -p ../../myLib,my-module,../sea-modules
```

#### 使用 -d 参数指定构建后产出的文件目录
```
asb -s amrio -d dist
```

#### 使用 --no-minify 参数指定构建文件不压缩
```
asb -s amrio --no-minify
```

# nodejs API

```
npm install amrio-seajs-builder --save
```

## 用法
```js
var asb = require('amrio-seajs-builder')

asb('amrio', {
    base: 'js',
    dest: 'sea-modules',
    paths: ['../my-modules', 'sea-modules', 'lib'],
    all: true,
    minify: true,
    exclude: ['$', 'angular'],
    parsers: {
    	'.less': lessHandler
    }
})
```

## API

### asb(src, options)
Type: `function(src, options)`  

构建模块的主方法

#### src
Type: `string`  

需要构建的模块文件夹或具体路径。目前只支持 .js 文件的构建

#### options

##### base
Type: `string`  
Default: `process.cwd()`

base 路径，这个配置的作用一般是拿来处理模块 id 用的，例如输入的 src 是 js/amrio 那么构建出来的模块 id 就是会像
`define('js/amrio/validation/rules', [...], factory)` 这样。如果不想带 js 前缀，那么就把 `base` 配成 js，这样
src 就只用填 amrio 就可以了。

##### dest
Type: `string`  
Default: `sea-module`

构建产的出路径

##### paths
Type: `array`  
Default: `[process.cwd()]`

模块查找的基础路径

##### all
Type: `boolean`  
Default: `false`

是否合并顶级模块，默认只合并相对模块

##### minify
Type: `boolean`  
Default: `true`

构建时是否压缩模块，默认开启

##### exclude
Type: `array || function(id, meta)`  
Default: `[]`

需要排除的模块，如果定义了 exclude 为数组，那么包含在数组里面的模块 id 就不会被处理了。
如果是 functuon 那么会有点不一样

###### function(id, meta)
Return Type: `boolean || null`  

如果方法返回的是布尔值，那么返回 true 就会不处理这个模块 id 了，反之亦然。

如果返回了 `null` 那么该 id 都不会出现在入口模块的依赖数组里了，
此设计是为了减少早已注册的模块 id 出现在其它模块的依赖数组里面。

例如：jquery 模块在加载的时候是最先定义的模块 id，那么后面的模块可以确保直接 require，那么 jquery 就可以不用出现在它们依赖数组里。

####### id
Type: `string`  

id 是当前模块要要找的依赖，可以通过判断 id 来动态的排除某些模块是否要被处理

####### meta
Type: `object`  

meta 是当前模块的元数据，包含了 `meta.id meta.uri meta.deps, meta.factory`。
可以利用它来进行一些辅助判断。

##### parsers
Type: `object`  
Default: `{'.js', function(meta), '.css', function(meta), '.tpl', function(meta)}`

模块解析器对象，此对象中包含的 `key` 是模块的后缀名，解析器是通过后缀名来处理模块。

这些 `parser(meta)` 接收一个参数 `meta`，包含了 `meta.id meta.uri`。此方法的返回值就是模块的 `factory`，后续的 `transport concat` 都基于它

用法
``` js
parsers: {
    '.css': function(meta) {
    	var cssTemplate = 'define("%s", [], function() { seajs.importStyle(%s); });'
        var source = null
        if (fs.existsSync(meta.uri)) {
            var source = fs.readFileSync(meta.uri).toString()
            source = new CleanCSS().minify(source).styles
            source = util.format(cssTemplate, meta.id, JSON.stringify(source))
        }
        return source
    }
}
```

##### copyOther
Type: `boolean`  
Default: `true`

是否复制其它非模块文件到构建目录中，默认开启。
此设计是为了确保模块的完整性，例如有些模块用到了一些图片、字体等。那么开启这个选项，就会同步复制这些文件，确保模块的完整性。

##### footer
Type: `string`  
Default: `\n`

concat 连接模块的 footer

##### uglify
Type: `object`  
Default: `{ ascii_only: true }`

`uglify.print_to_string` 时的选项，默认值是把中文等转成 `ascii` 字符，增加 `gzip` 的压缩率，避免中文乱码。
仅在 `minify: true` 时有效

##### onPost
Type: `function(file, destPath)`  
Default: `writeFile`

产出文件的发布函数，默认值是按照 `destPath` 路径写入 `file`

##### log
Type: `boolean || function(text)`  
Default: `false`

打印日志开关，如果配置的是一个方法，那么将执行它，参数 `text` 就是需要打印的日志。

## 联系
* EMAIL [amriogm@gmail.com](mailto:amriogm@gmail.com)  
* QQ 841830150  
* github [https://github.com/amriogit/amrio-seajs-builder](https://github.com/amriogit/amrio-seajs-builder)

[travis-image]: https://travis-ci.org/amriogit/amrio-seajs-builder.svg
[travis-url]: https://travis-ci.org/amriogit/amrio-seajs-builder
[npm-image]: https://badge.fury.io/js/amrio-seajs-builder.svg
[npm-url]: https://www.npmjs.com/package/amrio-seajs-builder
[dependency-image]: https://david-dm.org/amriogit/amrio-seajs-builder.svg
[dependency-url]: https://david-dm.org/amriogit/amrio-seajs-builder
[download-image]: http://img.shields.io/npm/dm/amrio-seajs-builder.svg