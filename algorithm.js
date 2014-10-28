main()
    var filepaths = [f1, f2, f3, f4]
    for filepath in filepaths
        if(filepath is css)
            saveFile(readFile(filepath))
            break
        saveFile(filepath, concatModule(filepath))

saveFile(filepath, file)
    fs.write(filepath, file)

concatModule(filepath)
    let cacheFile = cache(filepath)
    if(cacheFile) 
        return cacheFile
    if(filepath.extname == '.css')
        concat = css2js(filepath)
    
    if(filepath.extname == '') filepath += '.js'

    if(filepath.extname == '.js')
        concat = jsConcat(filepath)

    cache(filepath, concat)

readFile(filepath)
    if(!exists(filepath)) 
        return null
    let findFile = fs.readFile(filepath)
    return findFile

css2js(uri)
    let id = uri
    return format(tpl, id, readFile(uri))

jsConcat(uri)
    let file = readFile(uri)
    let deps = parseDeps(file)
    if(deps.length > 0 )
        let depsData = getDeps(deps, uri)
    let id = uri.replace('.js', '')
    let result = transform(id, depsData.remain, file, depsData.modules)
    return result

getDeps(deps, basepath)
    basepath = dirname(basepath)
    let result = {
        remain: {},
        modules: {}
    }
    let asbID = ''
    for id in deps
        if(!isRel || isNotIncludeAll) 
            break
        if(isRel)
            asbID = toAsb(id, basepath)
        result.remain[asbID] = true
        result.modules[asbID] = concatModule(asbID)
    return result

transform(id, remain, module, moduleDeps)
    moduleDeps = cleanModule(moduleDeps)
    module = completeModule(id, remain, module)
    let concat = module + ';' + moduleDeps
    if(minify) 
        return minify(concat)
    return beauty(concat)