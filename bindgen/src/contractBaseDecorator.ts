//@ts-nocheck
import {
    ASTBuilder,
    ClassDeclaration,
    CommonFlags,
    FieldDeclaration,
    ImportStatement,
    MethodDeclaration,
    NamedTypeNode,
    NodeKind,
    Source,
    SourceKind
} from "assemblyscript/dist/assemblyscript.js"
import {SimpleParser, TransformVisitor} from "visitor-as"
import {isEntry, isLibrary} from "visitor-as/dist/utils.js"
import {addElrondWasmASImportToSourceIfMissing} from "./utils/parseUtils.js"
import {AbiEndpoint} from "./utils/abi/abiEndpoint.js"
import {AbiEndpointMutability} from "./utils/abi/abiEndpointMutability.js"
import {AbiEndpointInput} from "./utils/abi/abiEndpointInput.js"
import {AbiEndpointOutput} from "./utils/abi/abiEndpointOutput.js"
import {AbiConstructor} from "./utils/abi/abiConstructor.js"

export class ContractBaseExporter extends TransformVisitor {

    newImports: string[] = []

    private userCallbacksToImplement: MethodDeclaration[] = []
    private classSeen: ClassDeclaration | null = null

    visitClassDeclaration(node: ClassDeclaration): ClassDeclaration {
        const isContractBase = node.range.source.sourceKind === SourceKind.LIBRARY && ContractBaseExporter.hasContractBaseDecorator(node)

        if (isContractBase) {
            if (this.classSeen !== null) {
                return node
            }

            if (ASTBuilder.build(node.name) !== "ContractBase") {
                this.classesExtended.push(node.extendsType)
            }

            this.classSeen = node

            this.visit(node.members)

            node.members = node.members.filter(n => {
                if (n.constructor.name === 'Da') { //TODO : why instanceof FieldDeclaration is false?
                    const name = ASTBuilder.build(n.name)
                    return name !== 'callbacks'
                }

                return true
            })

            const callbacksClass = SimpleParser.parseTopLevelStatement(
                `
                class CallbacksClass {
                    
                }
                `
            ) as ClassDeclaration

            for (const callback of this.userCallbacksToImplement) {
                const callbackName = ASTBuilder.build(callback.name)

                let declaration = `${callbackName}(`
                let body = 'const args = new ManagedArgBuffer();\n'
                callback.signature.parameters.forEach((param, index) => {
                    const paramName = ASTBuilder.build(param.name)
                    const paramType = ASTBuilder.build(param.type)
                    if (!paramType.includes(`CallbackResult<`)) {
                        //this.newImports.push(paramType)
                        declaration += `${paramName}: ${paramType}${index === callback.signature.parameters.length - 1 ? '' : ', '}`
                        body += `args.pushArg(${paramName});\n`
                    }
                })

                declaration += `): CallbackClosure`
                body += `return new CallbackClosure("${callbackName}", args);`
                const callbackMethod = SimpleParser.parseClassMember(
                    `
                    ${declaration} {
                        ${body}
                    }
                    `,
                    callbacksClass
                )

                console.log({pushedCallback: `
                    ${declaration} {
                        ${body}
                    }
                    `})

                callbacksClass.members.push(callbackMethod)
            }

            const contractBaseCallbacksMethod = SimpleParser.parseClassMember(
                `get callbacks(): CallbacksClass {
                    return new CallbacksClass
                }`,
                node
            )

            node.range.source.statements.push(callbacksClass)

            node.members.push(contractBaseCallbacksMethod)
        }

        return node
    }

    visitSource(node: Source, userCallbacks: MethodDeclaration[]): Source {
        this.userCallbacksToImplement = userCallbacks

        const newSource = super.visitSource(node)

        this.newImports.forEach((importToAdd) => {
            addElrondWasmASImportToSourceIfMissing(newSource, importToAdd)
        })

        return newSource
    }

    static hasContractBaseDecorator(node: ClassDeclaration): boolean {
        const decorators = node.decorators ?? []
        const decoratorsNames = decorators.map(d => ASTBuilder.build(d.name))

        return decoratorsNames.includes('base')
    }

}
