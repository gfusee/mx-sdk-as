import {
    ASTBuilder,
    ImportStatement,
    Parser,
    Source,
    Tokenizer,
    NodeKind
  } from "assemblyscript/dist/assemblyscript.js";

export function parseImport(source: Source, text: string): ImportStatement {
    const parser = new Parser()
    parser.parseFile(source.text, "index.ts", true)
    const importStatement = parser.parseTopLevelStatement(new Tokenizer(new Source(source.sourceKind, source.normalizedPath, text))) as ImportStatement

    if (importStatement === null) {
        throw new Error('null statement')
    }

    return importStatement
}

export function getSourceElrondWasmASImports(source: Source): string[] {
    const imports = source.statements.filter(s => s instanceof ImportStatement && s.path.value.includes('elrond-wasm-as')) as ImportStatement[]

    return imports.flatMap(i => i.declarations?.map(d => ASTBuilder.build(d)) ?? [])
}

export function addElrondWasmASImportToSourceIfMissing(source: Source, value: string) {
    const genericRegex = /(.+)<(.+)>/g
    const matches = genericRegex.exec(value)
    if (matches !== null) {
        const genericsTypesRaw = value.substring(value.indexOf('<') + 1, value.length - 1)
        const genericTypesRegex = /(\w+(?:<.+>)*)/g
        const typesMatches = genericsTypesRaw.matchAll(genericTypesRegex)
        let type = typesMatches.next()
        while (!type.done) {
            addElrondWasmASImportToSourceIfMissing(source, type.value[0])
            type = typesMatches.next()
        }

        return
    }
    const imports = getSourceElrondWasmASImports(source)

    if (!imports.includes(value) && !isTypeUserImported(source, value)) {
        const newImport = parseImport(source, `import { ${value} } from "@gfusee/elrond-wasm-as"`)
        source.statements.unshift(newImport)
    }
}

function isTypeUserImported(source: Source, type: string): boolean {
    const imports = source.statements.filter((s) => s.kind === NodeKind.IMPORT) as ImportStatement[]

    for (const i of imports) {
        let isTypeImported = false
        for (const declaration of i.declarations) {
            if (ASTBuilder.build(declaration) === type) {
                isTypeImported = true
                break
            }
        }
        if (isTypeImported) {
            return ASTBuilder.build(i.path) !== '"@gfusee/elrond-wasm-as"'
        }
    }

    return false
}

export function removeAllElrondWasmImports(source: Source) {
    source.statements = source.statements.filter(s => !(s instanceof ImportStatement && s.path.value.includes('elrond-wasm-as'))) as ImportStatement[]
}
