import {
    ASTBuilder,
    ClassDeclaration,
    FieldDeclaration,
    MethodDeclaration,
    NamespaceDeclaration,
    CommonFlags,
    Source
} from "assemblyscript/dist/assemblyscript.js";
import {SimpleParser, TransformVisitor} from "visitor-as";
import {addMxSdkASImportToSourceIfMissing} from "./utils/parseUtils.js";
import {AbiStructType} from "./utils/abi/abiStructType.js";
import {AbiStructTypeField} from "./utils/abi/abiStructTypeField.js";

const heapIndexClassName = "_HeapIndex"

export class StructExporter extends TransformVisitor {

    static classSeen: string[] = []

    newImports: string[] = []
    fields: FieldDeclaration[] = []
    abiStructTypes: { [key: string]: AbiStructType }[] = []

    visitFieldDeclaration(node: FieldDeclaration): FieldDeclaration {
        this.fields.push(node)

        return node
    }

    visitMethodDeclaration(node: MethodDeclaration): MethodDeclaration {
        return node
    }

    visitClassDeclaration(node: ClassDeclaration): ClassDeclaration {
        if (StructExporter.hasStructDecorator(node)) {
            const className = ASTBuilder.build(node.name)

            if (StructExporter.classSeen.includes(className)) {
                return node
            } else {
                StructExporter.classSeen.push(className)
            }

            this.fields = []

            const requiredImports = [
                "ManagedBuffer",
                "ManagedU32",
                "BaseManagedType",
                "ManagedType",
                "BaseManagedUtils",
                "ManagedUtils",
                "ManagedBufferNestedDecodeInput",
                "NestedEncodeOutput",
                "bytesToSize",
                "__frameworkRetainClosureValue",
                "__frameworkGetRetainedClosureValue",
                "enableSecondDebugBreakpoint",
                "checkIfDebugBreakpointEnabled",
                "checkIfSecondDebugBreakpointEnabled"
            ]

            this.newImports = requiredImports

            const dummyClass = SimpleParser.parseTopLevelStatement(`
            @unmanaged
            class DummyClass extends BaseManagedType {}
            `) as ClassDeclaration

            node.extendsType = dummyClass.extendsType
            node.decorators = dummyClass.decorators

            this.visit(node.members)

            if (this.fields.length == 0) {
                throw `no field in class ${className}`
            }

            let payloadSizeSum = 'let size: u32 = 0'
            let toByteWriterMethodFields = ''
            let fromByteReaderMethodFields = ''

            let appends = ''
            this.fields.forEach((f, index) => {
                const name = ASTBuilder.build(f.name)
                const type = ASTBuilder.build(f.type)
                appends += `
                    this.value.${name}.utils.encodeNested(output);
                `
                payloadSizeSum += `
                    const dummy${name} = ManagedType.dummy<${type}>();
                    size += dummy${name}.payloadSize.value;
                `

                toByteWriterMethodFields += `
                  this.value.${name}.utils.toByteWriter<void>([changetype<i32>(index), changetype<i32>(payloadBytes), changetype<i32>(this.value.${name})], (retainedPtr, bytes) => {
                    const indexRef = changetype<${heapIndexClassName}>(retainedPtr[0]);
                    const payloadBytesRef = changetype<Uint8Array>(retainedPtr[1]);
                    const valueRef = changetype<${type}>(retainedPtr[2]);
                    
                    payloadBytesRef.set(bytes, indexRef.value)
                    
                    indexRef.value += valueRef.payloadSize.value;
                  });
                `

                fromByteReaderMethodFields += `
                  this.value.${name} = ManagedType.dummy<${type}>().utils.fromByteReader([changetype<i32>(index), changetype<i32>(arr)], (retainedPtr, bytes) => {
                    const indexRef = changetype<${heapIndexClassName}>(retainedPtr[0]);
                    const arrRef = changetype<Uint8Array>(retainedPtr[1]);
                    
                    const nextIndex = indexRef.value + bytes.length;
                    
                    bytes.set(arrRef.subarray(indexRef.value, nextIndex))
                    
                    indexRef.value = nextIndex;
                  });
                `
            })

            const shouldBeInstantiatedOnHeapGetter = `
            get shouldBeInstantiatedOnHeap(): boolean {
                return true
            }
            `

            const payloadSizeGetter = `
        get payloadSize(): ManagedU32 {
            ${payloadSizeSum} 
            return ManagedU32.fromValue(size)
        }
      ` //TODO : cache payloadSize??

            const toByteWriterMethod = `
        toByteWriter<R>(retainedPtr: i32[], writer: (retainedPtr: i32[], bytes: Uint8Array) => R): R {
            const payloadBytes = new Uint8Array(this.value.payloadSize.value);
            const index = new ${heapIndexClassName}(0);
            ${toByteWriterMethodFields}
            return writer(retainedPtr, payloadBytes);
        }
      `

            const fromByteReaderMethod = `
        fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): ${className} {
            const arr = new Uint8Array(this.value.payloadSize.value);
            reader(retainedPtr, arr);
            const index = new ${heapIndexClassName}(0);
            ${fromByteReaderMethodFields}
            
            return this.value
        }
      `

            const fromBytesMethod = `
            fromBytes<${className}>(bytes: Uint8Array): ${className} {
                return BaseManagedUtils.defaultFromBytes(this, bytes)
            }
            `

            const utilsClassNode = SimpleParser.parseTopLevelStatement(`
                @final @unmanaged
                export class Utils extends BaseManagedUtils<${className}> {}
            `) as ClassDeclaration

            const staticFromValue = `
            static fromValue(value: ${className}): Utils {
                return new Utils(value)
            }
            `

            const encodeNestedMethod = `
      encodeNested<T extends NestedEncodeOutput>(output: T): void {
        ${appends}
      }
      `

            const utilsConstructor = `
            constructor(private _value: ${className}) {
                super();
            }
            `

            const valueGetter = `
            get value(): ${className} {
                return this._value
            }
            `

            const encodeTopMethod = `
      encodeTop(): ManagedBuffer {
        const output = ManagedBuffer.new()
        this.encodeNested(output);
        return output;
      }
      `

            const finishMethod = `
      finish(): void {
        const output = ManagedBuffer.new()
        this.encodeNested(output);
        output.utils.finish();
      }
      `

            const storeAtBufferMethod = `
      storeAtBuffer(key: ManagedBuffer): void {
        const buffer = this.encodeTop();
        buffer.utils.storeAtBuffer(key);
      }
      `

            const toString = `
      toString(): string {
        const buffer = this.encodeTop();
        return buffer.utils.toString();
      }
      `

            const signalError = `
      signalError(): void {
        const buffer = this.encodeTop();
        return buffer.utils.signalError();
      }
      `

            let decodeNestedMethodBody = ``
            let newMethodArgs = ''
            let newMethodArgsAssigns = ''
            this.fields.forEach((f, index) => {
                const fieldName = ASTBuilder.build(f.name)
                const fieldType = ASTBuilder.build(f.type!)
                const paramDeclaration = `
        const ${fieldName} = ManagedType.dummy<${fieldType}>().utils.decodeNested(input);\n
        `
                decodeNestedMethodBody += paramDeclaration + '\n'

                newMethodArgs += `${fieldName}: ${fieldType}` + (index < this.fields.length - 1 ? ',' : '')
                newMethodArgsAssigns += `this.value.${fieldName} = ${fieldName};\n`
            })

            const valueAssignment = `
      this.new(${this.fields.map(f => ASTBuilder.build(f.name)).join(', ')});\n
      `
            decodeNestedMethodBody += valueAssignment


            const decodeNestedMethod = `
      decodeNested(input: ManagedBufferNestedDecodeInput): ${className} {
        ${decodeNestedMethodBody}
        
        return this.value
      }
      `

            const newMethod = `
      new(${newMethodArgs}): void {
        ${newMethodArgsAssigns}
      }
      `

            let hasDecodeTopDefault = StructExporter.hasDefaultDecodeDecorator(node)

            let decodeTopDefaultStatements = ""

            if (hasDecodeTopDefault) {
                decodeTopDefaultStatements = `
        if (buffer.utils.getBytesLength() == 0) {
            const newValue = new ${className}();
            newValue.utils.topDecodeInstantiateDefaultsValues();
            return newValue;
        }
      `
            }

            const decodeTopMethod = `
      decodeTop(buffer: ManagedBuffer): ${className} {
        ${decodeTopDefaultStatements}
        const input = new ManagedBufferNestedDecodeInput(buffer)
        return this.decodeNested(input);
      }
      `

            const fromHandleMethod = `
      fromHandle(handle: i32): void {
        const buffer = ManagedBuffer.dummy().utils.fromHandle(handle);
        this.decodeTop(buffer);
      }
      `

            const fromStorageMethod = `
      fromStorage(key: ManagedBuffer): ${className} {
        const buffer = ManagedBuffer.dummy().utils.fromStorage(key);
        const input = new ManagedBufferNestedDecodeInput(buffer);
        return this.decodeNested(input);
      }
      `

            const fromArgumentIndexMethod = `
      fromArgumentIndex(argIndex: i32): ${className} {
        const buffer = ManagedBuffer.dummy().utils.fromArgumentIndex(argIndex);
        const input = new ManagedBufferNestedDecodeInput(buffer);
        return this.decodeNested(input);
      }
      `

            let utilsMethods = [
                staticFromValue,
                utilsConstructor,
                valueGetter,
                storeAtBufferMethod,
                toString,
                signalError,
                encodeNestedMethod,
                encodeTopMethod,
                finishMethod,
                decodeNestedMethod,
                decodeTopMethod,
                newMethod,
                fromHandleMethod,
                fromStorageMethod,
                fromArgumentIndexMethod,
                toByteWriterMethod,
                fromByteReaderMethod,
                fromBytesMethod
            ]

            utilsMethods.forEach(m => utilsClassNode.members.push(SimpleParser.parseClassMember(
                m,
                node
            )))

            let utilsNamespaceNode = SimpleParser.parseTopLevelStatement(`namespace ${className} {}`) as NamespaceDeclaration
            if (node.is(CommonFlags.EXPORT)) {
                utilsNamespaceNode.flags |= CommonFlags.EXPORT
            }
            utilsNamespaceNode.members.push(utilsClassNode)

            node.range.source.statements.push(utilsNamespaceNode)

            let allClassesNames = (node.range.source.statements
                .filter(e => e instanceof ClassDeclaration) as ClassDeclaration[])
                .map(e => ASTBuilder.build(e.name))

            if (!allClassesNames.includes(heapIndexClassName)) {
                const heapIndexClass = SimpleParser.parseTopLevelStatement(`
                @unmanaged
                class ${heapIndexClassName} {
                    constructor(public value: u32) {}
                }
                `
                )

                node.range.source.statements.push(heapIndexClass)
            }

            const utilsGetter = `
      get utils(): ${className}.Utils {
        return ${className}.Utils.fromValue(this)
      }
      `

            const skipsReserializationFields: Array<String> = []
            this.fields.forEach((f, index) => {
                const fieldType = ASTBuilder.build(f.type!)

                skipsReserializationFields.push(`BaseManagedType.dummy<${fieldType}>().skipsReserialization()`)
            })

            const getSkipsReserialization = `
        skipsReserialization(): boolean {
            return ${skipsReserializationFields.join(" && ")}
        }
            `

            const getTypeLenMethod = `
      getTypeLen(): i32 {
        return 4
      }
      `

            const bufferCacheField = `
      private __bufferCache: ManagedBuffer | null = null;
      `

            const getHandleMethod = `
      getHandle(): i32 {
        if (this.__bufferCache) {
          return this.__bufferCache!.getHandle();
        } else {
          const buffer = ManagedBuffer.new();
          this.utils.encodeNested(buffer);
          this.__bufferCache = buffer;

          return buffer.getHandle()
        }
      }
      `

            const writeMethod = `
            write(bytes: Uint8Array): void {
                defaultBaseManagedTypeWriteImplementation()
            }
            `

            const members = [
                utilsGetter,
                payloadSizeGetter,
                getTypeLenMethod,
                getSkipsReserialization,
                bufferCacheField,
                getHandleMethod,
                shouldBeInstantiatedOnHeapGetter,
                writeMethod
            ]

            const abiStructFields: AbiStructTypeField[] = [];

            this.fields.forEach(f => {
                const name = ASTBuilder.build(f.name)
                const type = ASTBuilder.build(f.type)

                f.name.text = `__${f.name.text}`

                if (!f.is(CommonFlags.DEFINITELY_ASSIGNED)) {
                    f.flags |= CommonFlags.DEFINITELY_ASSIGNED
                }

                members.push(`
        get ${name}(): ${type} {
          return this.__${name};
        }
        `)

                members.push(`
        set ${name}(value: ${type}): void {
          this.__${name} = value;
          this.__bufferCache = null;
        }
        `)

                abiStructFields.push(
                    new AbiStructTypeField(
                        name,
                        type
                    )
                )
            })

            if (!node.range.source.internalPath.includes('mx-sdk-as')) {
                const abiStruct: { [key : string]: AbiStructType } = {};
                abiStruct[className] = new AbiStructType(
                    abiStructFields
                )
                this.abiStructTypes.push(abiStruct)
            }

            for (const member of members) {
                node.members.push(SimpleParser.parseClassMember(
                    member,
                    node
                ))
            }
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

    static hasStructDecorator(node: ClassDeclaration): boolean {
        let decorators = node.decorators ?? []

        return decorators.map(d => ASTBuilder.build(d.name)).includes('struct')
    }

    static hasDefaultDecodeDecorator(node: ClassDeclaration): boolean {
        let decorators = node.decorators ?? []

        return decorators.map(d => ASTBuilder.build(d.name)).includes('defaultDecode')
    }

}
