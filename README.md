# amrio-seajs-builder
[amrio-seajs-builder](https://github.com/amriogit/amrio-seajs-builder) 是一个 [__seajs__](http://seajs.org/docs/) 模块构建命令工具，使用 grunt 作为基础，采用seajs 官方
推荐的 [grunt-cmd-transport](https://npmjs.org/package/grunt-cmd-transport)，
[grunt-cmd-concat](https://npmjs.org/package/grunt-cmd-concat) 构建模块进行构建。  
此模块的目的是为了进行更好的自定义构建，提供转换，合并，压缩 js、css 的一条龙功能，  
提供了命令参数进行更好的自定义构建，方便没有使用 spm 标准构建的项目进行自定义构建  
 
__此模块目前处于beta状态，可能会有bug哦！__

## 安装 amrio-seajs-builder
此模块需要全局安装，以便使用全局命令 asb
```
npm install -g amrio-seajs-builder
```

## 使用
使用 npm 全局安装完毕后，可以在命令行中使用：asb -h 查看该命令的帮助信息，
如果报错，请重新全局安装，直到命令行中 asb 命令可用

### 参数
-b, --build [path] 构建路径，必填项！  
-d, --dist [path] 部署路径，默认值: sea-modules  
-i, --include [option] 构建包含范围: self, relative, all；默认值: relative  

### 常规用法
```
asb -b amrio
```  
-b 参数是指定构建源文件路径的，这条命令会找到当前执行目录下的 amrio 文件夹，  
并且把里面所有的可以构建的模块文件使用 relative 的构建范围，  
构建至当前执行目录下的 sea-modules 文件夹里面，构建完毕后会在 sea-modules 目录下生成 amrio/** 文件

##### 构建到指定目录
```
asb -b amrio -d custom
```

##### 使用 all 构建范围构建到指定目录
```
asb -b amrio -d custom -i all
```

## 联系
* EMAIL [amriogm@gmail.com](mailto:amriogm@gmail.com)  
* QQ 841830150  
* github [https://github.com/amriogit/amrio-seajs-builder](https://github.com/amriogit/amrio-seajs-builder)
