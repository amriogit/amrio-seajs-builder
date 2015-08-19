# amrio-seajs-builder changelog

## 1.1.0

- 使用全异步操作，采用 promise 接口，一些破坏性的改变，使用旧版本迁移时需要注意
- 路径查找机制使用 seajs 在浏览器端的方式，可配置 paths、alias、vars、map 来处理路径
- 不再支持之前的 paths 基础查找路径功能，该功能转由 base 选项实现，但是只能指定一个路径，默认为当前路径，与 seajs.data.base 的作用一致
- 新增 cwd 配置，作用与 seajs.data.cwd 一致，默认为当前路径
- asb.parsers.add(ext, handle) 新的解析器添加接口，废除之前直接写在选项中的 parsers 配置（因为每次 asb 执行都是一个新的实例，但 parsers 都是全局使用，并不需要每次都配置）

## 1.0.1

- 修改了 module 类的实现，采用 module-manager 类来操作 module，避免缓存模块相互影响，每个 module-manager 都独自管理配置参数和缓存对象。
- 完善了相对模块查找机制，直接使用本模块作为查找基础路径，不再受 paths 配置影响
- 优化 meta.factory 的查找机制，优先使用预定义的 factory 来解析，主要是为了编写 gulp 插件时可以使用 file.contents，避免二次查找。
- 完善 README.md。

## 1.0.0

- 发布第一个稳定版本
- 完善编程 API 文档
- 加入 parsers 自定义选项
- 更好用的 exclude 配置项