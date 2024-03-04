import {
    ASTBuilder,
    ImportStatement,
    ClassDeclaration,
    EnumDeclaration,
    TypeDeclaration,
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

export function getSourceMxSdkASImports(source: Source): string[] {
    const imports = source.statements.filter(s => s instanceof ImportStatement && s.path.value.includes('mx-sdk-as')) as ImportStatement[]

    return imports.flatMap(i => i.declarations?.map(d => ASTBuilder.build(d)) ?? [])
}

export function addMxSdkASImportToSourceIfMissing(source: Source, value: string) {
    const genericRegex = /(.+)<(.+)>/g
    const matches = genericRegex.exec(value)
    if (matches !== null) {
        const genericsTypesRaw = value.substring(value.indexOf('<') + 1, value.length - 1)
        const genericTypesRegex = /(\w+(?:<.+>)*)/g
        const typesMatches = genericsTypesRaw.matchAll(genericTypesRegex)
        let type = typesMatches.next()
        while (!type.done) {
            addMxSdkASImportToSourceIfMissing(source, type.value[0])
            type = typesMatches.next()
        }

        return
    }
    const imports = getSourceMxSdkASImports(source)

    if (!imports.includes(value) && !isTypeUserImported(source, value)) {
        const newImport = parseImport(source, `import { ${value} } from "@gfusee/mx-sdk-as"`)
        source.statements.unshift(newImport)
    }
}

function isTypeUserImported(source: Source, type: string): boolean {
    const typeDeclaration = source.statements.find(s => {
        const isTypeDeclaration = s.kind === NodeKind.CLASS || s.kind === NodeKind.ENUMDECLARATION || s.kind === NodeKind.TYPEDECLARATION

        if (isTypeDeclaration) {
            const name = ASTBuilder.build((s as (ClassDeclaration | EnumDeclaration | TypeDeclaration)).name)

            if (name === type) {
                return true
            }
        }

        return false
    })

    if (typeDeclaration !== undefined) {
        return true
    }

    const imports = source.statements.filter(s => s.kind === NodeKind.IMPORT) as ImportStatement[]

    for (const i of imports) {
        let isTypeImported = false
        for (const declaration of i.declarations) {
            if (ASTBuilder.build(declaration) === type) {
                isTypeImported = true
                break
            }
        }
        if (isTypeImported) {
            return ASTBuilder.build(i.path) !== '"@gfusee/mx-sdk-as"'
        }
    }

    return false
}

export function removeAllMxSdkAsImports(source: Source) {
    source.statements = source.statements.filter(s => !(s instanceof ImportStatement && s.path.value.includes('mx-sdk-as'))) as ImportStatement[]
}
