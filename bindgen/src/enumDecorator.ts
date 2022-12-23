import {
  ASTBuilder,
  ClassDeclaration,
  EnumDeclaration,
  NamespaceDeclaration,
  Source,
  Statement
} from "assemblyscript/dist/assemblyscript.js";
import {SimpleParser, TransformVisitor} from "visitor-as";
import {addElrondWasmASImportToSourceIfMissing} from './utils/parseUtils.js'
import {AbiEnumType} from "./utils/abi/abiEnumType.js";
import {AbiEnumTypeVariant} from "./utils/abi/abiEnumTypeVariant.js";

export class EnumExporter extends TransformVisitor {

  static classSeen: string[] = []

  statementsToDelete: Statement[] = []
  newTopLevelStatements: Statement[] = []
  newImports: string[] = []
  abiEnumTypes: { [key: string]: AbiEnumType }[] = []

  visitEnumDeclaration(node: EnumDeclaration, isDefault?: boolean | undefined): EnumDeclaration {
    if (EnumExporter.hasStructDecorator(node)) {
      const className = ASTBuilder.build(node.name)

      if (EnumExporter.classSeen.includes(className)) {
        return
      } else {
        EnumExporter.classSeen.push(className)
      }

      this.statementsToDelete.push(node)

      this.newImports = [
          "ElrondU8",
          "ElrondString",
          "ElrondUnsignedNumber",
          "BigUint",
          "NestedEncodeOutput",
          "numberToBytes",
          "bytesToSize",
          "ManagedType",
          "ManagedUtils",
          "smallIntFinishUnsigned",
          "enableSecondDebugBreakpoint",
          "checkIfDebugBreakpointEnabled"
      ]

      const enumClassText = `
      @unmanaged
      export class ${className} extends ManagedType {
      
        get value(): u8 {
            return changetype<u32>(this) as u8 - 1
        }

        get utils(): ${className}.Utils {
          return ${className}.Utils.fromValue(this)
        }
        
        get payloadSize(): ElrondU32 {
          return ElrondU32.fromValue(1)
        }
        
        get shouldBeInstantiatedOnHeap(): boolean {
          return false
        }
        
        getHandle(): i32 {
            throw new Error('TODO getHandle (${className})')
        }
        
        toU64(): u64 {
            return this.value as u64
        }

        static fromValue(value: u8): ${className} {
          return changetype<${className}>(value as u32 + 1)
        }
        
        static dummy(): ${className} {
            return changetype<${className}>(0)
        }

        @operator("==")
        static equals(a: ${className}, b: ${className}): bool {
          return a.value == b.value;
        }

        @operator("!=")
        static notEquals(a: ${className}, b: ${className}): bool {
          return !(a == b);
        }
      }
      `

      const enumClassNode = SimpleParser.parseTopLevelStatement(enumClassText) as ClassDeclaration

      let fromRawValueToFieldBodyText = `
      let enumValue: ${className};
      let isInitialized = false;
      `

      node.values.forEach((v, index) => {
        const valueName = ASTBuilder.build(v.name)
        const getterText = `
        static get ${valueName}(): ${className} {
          return ${className}.fromValue(${index});
        }
        `

        const getterNode = SimpleParser.parseClassMember(getterText, enumClassNode)

        enumClassNode.members.push(getterNode)

        fromRawValueToFieldBodyText += `
        ${index > 0 ? 'else' : ''} if (value == ${index}) {
          enumValue = ${className}.${valueName};
          isInitialized = true;
        }\n
        `
      })

      fromRawValueToFieldBodyText += `
      if (!isInitialized) {
        throw new Error('TODO : error unknown enum value');
      }
      `

      const utilsClassNode = SimpleParser.parseTopLevelStatement(`
      @final @unmanaged
      export class Utils extends ManagedUtils<${className}> {
        
        get sizeOf(): i32 {
            return 1
        }

        static fromValue(value: ${className}): Utils {
            return changetype<Utils>(value)
        }

        get value(): ${className} {
            return changetype<${className}>(this)
        }

        storeAtBuffer(key: ElrondString): void {
            BigUint.fromU64(this.value.toU64()).utils.storeAtBuffer(key)
        }

        signalError(): void {
            this.toBigUint().utils.signalError()
        }

        finish(): void {
            //@ts-ignore
            smallIntFinishUnsigned(<i64>this.value.value)
        }

        encodeTop(): ElrondString {
            return ElrondString.fromBytes(numberToBytes<u64>(this.value.toU64()))
        }

        encodeNested<T extends NestedEncodeOutput>(output: T): void {
            const bytesLength: i32 = this.sizeOf

            const bytes = bytesToSize(numberToBytes(this.value.value), bytesLength)

            output.write(bytes)
        }

        toString(): string {
            return ""
        }

        toBigUint(): BigUint {
            return BigUint.fromU64(this.value.toU64())
        }

        toBytes(): Uint8Array {
            return numberToBytes(this.value.value)
        }

        toByteWriter<R>(retainedPtr: i32[], writer: (retainedPtr: i32[], bytes: Uint8Array) => R): R {
            const bytes = this.toBytes()
            return writer(retainedPtr, bytes) // TODO : free bytes from memory
        }

        fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): ${className} {
            const bytes = new Uint8Array(this.sizeOf)
            reader(retainedPtr, bytes)
            const result = this.fromBytes(bytes)
            
            return result
        }

        fromValue(value: u32): ${className} {
            return ElrondU8.fromValue(value)
        }

        fromHandle(handle: i32): ${className} {
            throw new Error('TODO : error no handle (ElrondUXX)')
        }

        fromStorage(key: ElrondString): ${className} {
            const bytes = getBytesFromStorage(key)
            return this.fromBytes(bytes)
        }

        fromRawValueToField(value: u8): ${className} {
          ${fromRawValueToFieldBodyText}
          
          return enumValue;
        }

        fromArgumentIndex(index: i32): ${className} {
          return this.fromRawValueToField(ElrondU8.dummy().utils.fromArgumentIndex(input).value);
        }

        decodeTop(buffer: ElrondString): ${className} {
          return this.fromRawValueToField(ElrondU8.dummy().utils.decodeTop(buffer).value);
        }

        decodeNested(input: ManagedBufferNestedDecodeInput): ${className} {
          return this.fromRawValueToField(ElrondU8.dummy().utils.decodeNested(input).value);
        }

        fromBytes(bytes: Uint8Array): ${className} {
          return this.fromRawValueToField(ElrondU8.dummy().utils.fromBytes(bytes).value);
        }
      }`) as ClassDeclaration

      this.newTopLevelStatements.push(enumClassNode)

      let utilsNamespaceNode = SimpleParser.parseTopLevelStatement(`export namespace ${className} {}`) as NamespaceDeclaration
      utilsNamespaceNode.members.push(utilsClassNode)

      this.newTopLevelStatements.push(utilsNamespaceNode);
      const abiEnum: { [key : string]: AbiEnumType } = {};
      abiEnum[className] = new AbiEnumType(
          node.values.map((value, index) => {
              return new AbiEnumTypeVariant(
                  ASTBuilder.build(value.name),
                  index
              )
          })
      )

      this.abiEnumTypes.push(abiEnum)
    }

    return node
  }

  visitSource(source: Source): Source {
    const newSource = super.visitSource(source)

    for (const statement of this.statementsToDelete) {
      newSource.statements = newSource.statements.filter(s => s !== statement)
    }

    for (const newImport of this.newImports) {
      addElrondWasmASImportToSourceIfMissing(source, newImport)
    }

    for (const statement of this.newTopLevelStatements) {
      newSource.statements.push(statement)
    }

    return newSource
  }

  static hasStructDecorator(node: EnumDeclaration): boolean {
    let decorators = node.decorators ?? []

    return decorators.map(d => ASTBuilder.build(d.name)).includes('enumtype')
  }

}
