//@ts-nocheck
import {
    ASTBuilder,
    ClassDeclaration,
    CommonFlags,
    FieldDeclaration,
    MethodDeclaration,
    NamedTypeNode,
    Source,
    SourceKind
} from "assemblyscript/dist/assemblyscript.js"
import {SimpleParser, TransformVisitor} from "visitor-as"
import {isEntry} from "visitor-as/dist/utils.js"
import {addElrondWasmASImportToSourceIfMissing} from "./utils/parseUtils.js"
import {AbiEndpoint} from "./utils/abi/abiEndpoint.js"
import {AbiEndpointMutability} from "./utils/abi/abiEndpointMutability.js"
import {AbiEndpointInput} from "./utils/abi/abiEndpointInput.js"
import {AbiEndpointOutput} from "./utils/abi/abiEndpointOutput.js"
import {AbiConstructor} from "./utils/abi/abiConstructor.js"

export class ContractExporter extends TransformVisitor {

    exportedEndpoints: string[] = []
    newImports: string[] = []

    newMethods: string[] = []

    abiConstructor: AbiEndpoint = new AbiConstructor([], [])
    abiEndpoints: AbiEndpoint[] = []

    get className(): string {
        if (this.classSeen === null) {
            throw new Error('className is null')
        }
        return ASTBuilder.build(this.classSeen.name)
    }

    private classSeen: ClassDeclaration | null = null
    private hasInitExportedFunction: boolean = false

    private allUserClasses: ClassDeclaration[] = []
    private classesExtended: NamedTypeNode[] = []

    visitFieldDeclaration(node: FieldDeclaration): FieldDeclaration {
        if (node.is(CommonFlags.PRIVATE) || node.is(CommonFlags.PROTECTED)) {
            //TODO : verify that type is nullable and default assigned to null
            return node
        }
        let name = ASTBuilder.build(node.name)
        let typeName = ASTBuilder.build(node.type!)

        if (!node.is(CommonFlags.DEFINITELY_ASSIGNED)) {
            node.flags |= CommonFlags.DEFINITELY_ASSIGNED
        }

        node.name.text = `__${name}`

        this.newImports.push("Mapping")

        this.newMethods.push(
            `
            get ${name}(): ${typeName} {
              return (new Mapping<${typeName}>(new StorageKey(ElrondString.fromString('${name}')))).get()
            }
            `
        )

        this.newMethods.push(
            `
            set ${name}(value: ${typeName}): void {
                (new Mapping<${typeName}>(new StorageKey(ElrondString.fromString('${name}')))).set(value)
            }
            `
        )

        return node
    }

    visitMethodDeclaration(node: MethodDeclaration): MethodDeclaration {
        const isView = ContractExporter.hasViewDecorator(node)

        if (node.is(CommonFlags.PRIVATE) || node.is(CommonFlags.PROTECTED)) {
            if (isView) {
                throw 'TODO : non public method cannot be annotated as view'
            }

            return node
        }

        if (node.is(CommonFlags.ABSTRACT)) {
            if (ASTBuilder.build(node.signature.returnType).includes('Mapping')) {
                this.parseStorageMethod(node, this.classSeen)
                return node
            } else {
                throw new Error('TODO : unknown abstract method type')
            }
        }

        let name = ASTBuilder.build(node.name)
        const isConstructor = name === 'constructor'

        if (isConstructor) {
            if (isView) {
                throw 'TODO : constructor cannot be annotated as view'
            }

            const initName = 'init'
            let nodeText = ASTBuilder.build(node)
            nodeText = nodeText.replace(/constructor\((.*)\)/, 'init($1): void')
            nodeText = nodeText.replace(/super\((.*)\)\s*;?/, '')
            this.newMethods.push(nodeText)
            name = initName
            this.hasInitExportedFunction = true

            this.classSeen.members = this.classSeen.members.filter((m) => m !== node)
        }

        const returnTypeName = ASTBuilder.build(node.signature.returnType)
        const params = node.signature.parameters

        const isOnlyOwner = ContractExporter.hasOnlyOwnerDecorator(node)
        let endpointCall = ''
        if (isOnlyOwner) {
            endpointCall = `
            contract.blockchain.assertCallerIsContractOwner();
            `
        }
        let argHasOptionalValue = false

        if (params.length == 0) {
            endpointCall = `contract.${name}()`
        } else {
            params.forEach((param, index, _) => {
                let paramName = ASTBuilder.build(param.name)
                let paramType = ASTBuilder.build(param.type)
                if (paramType.includes('OptionalValue<')) {
                    if (!argHasOptionalValue) {
                        endpointCall += `
                const numArguments = ArgumentApi.getNumberOfArguments();\n
                `
                        argHasOptionalValue = true
                    }

                    endpointCall += `
              let ${paramName}: ${paramType} = BaseManagedType.dummy<${paramType}>()
              if (numArguments >= ${index + 1}) {
                ${paramName} = ${paramName}.utils.fromArgumentIndex(${index})
              } else {
                ${paramName} = ${paramName}.utils.fromNull()
              }
              `
                } else {
                    if (paramType.includes('MultiValueEncoded<')) {
                        if (index === params.length - 1) {
                            endpointCall += `
                            const ${paramName} = BaseManagedType.dummy<${paramType}>().utils.fromArgumentIndex(${index})
                            `
                        } else {
                            throw new Error('TODO : MultiValueEncoded should be the last argument')
                        }
                    } else {
                        if (argHasOptionalValue) {
                            throw new Error('TODO : error OptionalValue required')
                        } else {
                            this.newImports.push(paramType)

                            endpointCall = endpointCall + `
                const ${paramName}: ${paramType} = BaseManagedType.dummy<${paramType}>().utils.fromArgumentIndex(${index});
                `
                        }
                    }
                }

            })

            endpointCall = endpointCall + `contract.${name}(` + params.map(p => ASTBuilder.build(p.name)).join(', ') + ')'
        }

        endpointCall = endpointCall + (returnTypeName == 'void' || returnTypeName.length == 0 ? ';' : '.utils.finish();')

        let expression = `
        const contract = __initContract();
        ${endpointCall}
        `

        this.exportedEndpoints.push(`
        export function ${name}(): void {
            ${expression}
        }
        `)

        if (isConstructor) {
            this.abiConstructor = new AbiConstructor(
                params.map(param => new AbiEndpointInput(
                    ASTBuilder.build(param.name),
                    ASTBuilder.build(param.type)
                )),
                []
            )
        } else {
            this.abiEndpoints.push(
                new AbiEndpoint(
                    name,
                    isOnlyOwner ? true : undefined,
                    isView ? AbiEndpointMutability.READONLY : AbiEndpointMutability.MUTABLE,
                    isView ? undefined : ["*"],
                    params.map(param => new AbiEndpointInput(
                        ASTBuilder.build(param.name),
                        ASTBuilder.build(param.type)
                    )),
                    [
                        new AbiEndpointOutput(
                            returnTypeName
                        )
                    ]
                )
            )
        }

        return node
    }

    visitClassDeclaration(node: ClassDeclaration): ClassDeclaration {
        if (node.range.source.sourceKind === SourceKind.USER || node.range.source.sourceKind === SourceKind.USER_ENTRY) {
            const allUserClassesNames = this.allUserClasses.map((c) => ASTBuilder.build(c.name))
            if (!allUserClassesNames.includes(ASTBuilder.build(node.name))) {
                this.allUserClasses.push(node)
            }
        }

        const isContract = isEntry(node) && ContractExporter.hasContractDecorator(node)
        const isModule = !isEntry(node) && ContractExporter.hasModuleDecorator(node) //TODO : Make @module unnecessary?

        if (isContract || isModule) {
            if (this.classSeen !== null) {
                return node
            }

            if (node.extendsType === null) {
                throw new Error('TODO : contract class should extends something')
            }

            if (ASTBuilder.build(node.extendsType) !== "ContractBase") {
                this.classesExtended.push(node.extendsType)
            }

            this.classSeen = node

            node.flags &= ~CommonFlags.ABSTRACT

            const requiredImports = ["ElrondString", "ArgumentApi", "ContractBase", "StorageKey", "BaseManagedType"].concat(this.newImports)

            for (const requiredImport of requiredImports) {
                this.newImports.push(requiredImport)
            }

            this.visit(node.members)

            node.members = node.members.filter(n => {
                if (n instanceof MethodDeclaration) {
                    const name = ASTBuilder.build(n.name)
                    return name !== 'constructor'
                }

                return true
            })

            this.newMethods.forEach(m => {
                let declaration = SimpleParser.parseClassMember(
                    m,
                    node
                )

                node.members.push(declaration)
            })
        }

        return node
    }

    commit() {
        let extendedClassesNames = this.classesExtended.map((c) => ASTBuilder.build(c))
        let allUserClassesIndex = 0
        while (allUserClassesIndex < this.allUserClasses.length) {
            const c = this.allUserClasses[allUserClassesIndex]
            const cName = ASTBuilder.build(c.name)
            while (extendedClassesNames.includes(cName)) {
                allUserClassesIndex = -1 //reset loop
                const exporter = new ContractExporter()

                exporter.visitSource(c.range.source)
                extendedClassesNames.push(...exporter.classesExtended.map((newClass) => {
                    return ASTBuilder.build(newClass)
                }))
                this.exportedEndpoints.push(...exporter.exportedEndpoints)
                this.abiEndpoints.push(...exporter.abiEndpoints)
                this.newImports.push(...exporter.newImports)
                extendedClassesNames = extendedClassesNames.filter((name) =>
                    name !== cName
                )
            }
            allUserClassesIndex++
        }

        this.exportedEndpoints.push(
            `
          @global
          let __CURRENT_CONTRACT: ${this.className} | null = null
          `
        )
        this.exportedEndpoints.push(
            `
          @inline
          function __initContract(): ${this.className} {
              __CURRENT_CONTRACT = new ${this.className}();
              return __CURRENT_CONTRACT!;
          }
            `
        )

        if (!this.hasInitExportedFunction) {
            this.exportedEndpoints.push(
                `
                export function init(): void {}
                `
            )
        }

        this.classSeen.range.source.statements.push(...this.exportedEndpoints.map((s) => SimpleParser.parseTopLevelStatement(s)))

        this.newImports.forEach((importToAdd) => {
            addElrondWasmASImportToSourceIfMissing(this.classSeen.range.source, importToAdd)
        })
    }

    private parseStorageMethod(node: MethodDeclaration, classDeclaration: ClassDeclaration) {
        const name = ASTBuilder.build(node.name)
        const storageName = ContractExporter.parseStorageDecoratorIfAny(node) ?? name

        classDeclaration.members = classDeclaration.members.filter(m => m !== node)

        const returnTypeName = ASTBuilder.build(node.signature.returnType)

        let newSignatureParameters = ''
        let additionnalsKeysAppend = ''
        node.signature.parameters.forEach((p, index) => {
            const paramName = ASTBuilder.build(p.name)
            const typeName = ASTBuilder.build(p.type)
            const isLast = index + 1 === node.signature.parameters.length

            newSignatureParameters += `${paramName}: ${typeName}` + (isLast ? '' : ', ')
            additionnalsKeysAppend += `key.appendItem<${typeName}>(${paramName});`
        })

        let newBody = `
      const key = new StorageKey(ElrondString.fromString('${storageName}'));
      ${additionnalsKeysAppend}
      const result = instantiate<${returnTypeName}>(key);\n
      `

        this.newMethods.push(`
      ${name}(${newSignatureParameters}): ${returnTypeName} {
        ${newBody}

        return result
      }
      `)
    }

    // Allow to register classes in this.allUserClasses via visitClassDeclaration
    visitUserNonEntrySource(node: Source) {
        super.visitSource(node)
    }

    visitSource(node: Source): Source {
        const newSource = super.visitSource(node)

        this.newImports.forEach((importToAdd) => {
            addElrondWasmASImportToSourceIfMissing(newSource, importToAdd)
        })

        return newSource
    }

    static hasContractDecorator(node: ClassDeclaration): boolean {
        const decorators = node.decorators ?? []
        const decoratorsNames = decorators.map(d => ASTBuilder.build(d.name))

        return decoratorsNames.includes('contract')
    }

    static hasModuleDecorator(node: ClassDeclaration): boolean {
        const decorators = node.decorators ?? []
        const decoratorsNames = decorators.map(d => ASTBuilder.build(d.name))

        return decoratorsNames.includes('module')
    }

    static hasOnlyOwnerDecorator(node: MethodDeclaration): boolean {
        let decorators = node.decorators ?? []

        return decorators.map(d => ASTBuilder.build(d.name)).includes('onlyOwner')
    }

    static hasViewDecorator(node: MethodDeclaration): boolean {
        let decorators = node.decorators ?? []

        return decorators.map(d => ASTBuilder.build(d.name)).includes('view')
    }

    static parseStorageDecoratorIfAny(node: MethodDeclaration): string | undefined {
        let decorators = node.decorators ?? []

        const decorator = decorators.find(d => ASTBuilder.build(d.name) === 'storage')

        if (decorator === undefined || decorator.args === null) {
            return undefined
        }

        if (decorator.args.length !== 1) {
            throw new Error("The storage decorator only accepts one argument")
        }

        const storageName = ASTBuilder.build(decorator.args[0])

        if (!ContractExporter.isStorageNameValid(storageName)) {
            throw new Error("Invalid characters in the storage's name")
        }

        return storageName
    }

    static isStorageNameValid(name: string): boolean {
        const regex = /^[A-Za-z0-9_.]+$/;
        return regex.test(name);
    }
}
