# amrio-seajs-builder changelog

## 2.0.0

- 使用全异步操作，采用 promise 接口，遵照 `seajs` 的模块查找机制，产生了一些破坏性的改变，使用旧版本迁移时需要注意
- 遵照 `seajs` 在浏览器端的模块查找机制，不使用之前的 `paths` 机制查找模块，`paths` 机制存在顺序问题，且有多个 `paths` 值时解析模块路径性能较差
- 与 `seajs` 一致，可配置 `paths、alias、vars、map` 来处理模块查找路径
- `asb.parsers.add(ext, handle)` 新的解析器添加接口，废除之前直接写在选项中的 parsers 配置（因为每次 asb 执行都是一个新的实例，但 `parsers` 都是全局使用，并不需要每次都配置）
- 更严谨的依赖分析和代码转换，凡是 `seajs` 能解析、执行的模块 `amrio-seajs-builder` 都支持
- 命令行同步更新，支持读取配置文件来简化参数书写

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