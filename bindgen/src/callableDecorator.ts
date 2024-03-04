import {
  ASTBuilder,
  ClassDeclaration,
  CommonFlags,
  FieldDeclaration,
  MethodDeclaration,
  Source
} from "assemblyscript/dist/assemblyscript.js";
import {SimpleParser, TransformVisitor} from "visitor-as";
import {addMxSdkASImportToSourceIfMissing} from './utils/parseUtils.js'

export class CallableExporter extends TransformVisitor {

  static classSeen: string[] = []

  newImports: string[] = []

  visitFieldDeclaration(node: FieldDeclaration): FieldDeclaration {
    throw 'TODO : no field allowed'
  }

  visitMethodDeclaration(node: MethodDeclaration): MethodDeclaration {
    if (!node.is(CommonFlags.ABSTRACT)) {
      throw 'TODO : method should be abstract'
    }

    const returnType = ASTBuilder.build(node.signature.returnType)

    if (!returnType.startsWith("ContractCall")) {
      throw 'TODO : wrong return type'
    }

    let body = `{
    const call = ContractCall.new${returnType.replace('ContractCall', '')}(
      this.address,
      ManagedBuffer.fromString("${ASTBuilder.build(node.name)}")
    );
    `

    node.signature.parameters.forEach(param => {
      body += `call.pushEndpointArg<${ASTBuilder.build(param.type)}>(${ASTBuilder.build(param.name)});\n`
    })

    body += `
    return call;
    }
    `

    node.flags &= ~CommonFlags.ABSTRACT

    node.body = SimpleParser.parseStatement(body, false)

    return node
  }

  visitClassDeclaration(node: ClassDeclaration): ClassDeclaration {
    const isCallableContract = CallableExporter.hasCallableDecorator(node)

    if (isCallableContract) {
      if (ASTBuilder.build(node.extendsType) !== "CallableContract") {
        throw 'TODO : class should extends ContractCall'
      }

      this.newImports.push(
          ...[
              "ManagedBuffer"
          ]
      )

      node.flags &= ~CommonFlags.ABSTRACT

      this.visit(node.members)
    }


    return node
  }

  visitSource(source: Source): Source {
    const newSource = super.visitSource(source)

    for (const newImport of this.newImports) {
      addMxSdkASImportToSourceIfMissing(source, newImport)
    }

    return newSource
  }

  static hasCallableDecorator(node: ClassDeclaration): boolean {
    let decorators = node.decorators ?? []

    return decorators.map(d => ASTBuilder.build(d.name)).includes('callable')
  }

}
