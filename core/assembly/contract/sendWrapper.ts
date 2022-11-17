import {
    __frameworkGetRetainedClosureValue, __frameworkReleaseRetainedClosureValue,
    __frameworkRetainClosureValue,
    BuiltIntFunctionNames, checkIfDebugBreakpointEnabled,
    executeOnDestContext,
    getNumReturnData,
    getReturnData,
    getReturnDataSize, managedAsyncCall, managedDeployFromSourceContract, Static,
    transferESDTExecute,
    transferESDTNFTExecute,
    transferValue
} from "../utils/env";
import {BigUint, CodeMetadata, ElrondU32, MultiValue2} from "../types";
import { ElrondArray } from "../types";
import { ElrondU64 } from "../types";
import { ElrondString } from "../types";
import { ManagedAddress } from "../types";
import { TokenIdentifier } from "../types";
import { bytesToSize } from "../utils/bytes";
import { Blockchain } from "./blockchain";
import { ManagedArgBuffer } from "../types";
import {TokenPayment} from "../types";
import {EsdtSystemSmartContractProxy} from "./esdtSystemProxy";
import {BytesEncodeOutput} from "../types";

export class SendWrapper {

    private _esdtSystemScProxyCache: EsdtSystemSmartContractProxy | null = null

    get esdtSystemScProxy(): EsdtSystemSmartContractProxy {
        if (this._esdtSystemScProxyCache != null) {
            return this._esdtSystemScProxyCache!
        } else {
            const newValue = new EsdtSystemSmartContractProxy()
            this._esdtSystemScProxyCache = newValue

            return newValue
        }
    }

        directMulti(
        to: ManagedAddress,
        payments: ElrondArray<TokenPayment>
    ): void {
        __frameworkRetainClosureValue(new DirectValueRetainClosure(
            this,
            to
        ))
        payments.forEach((payment) => {
            const retainedValues = __frameworkGetRetainedClosureValue<DirectValueRetainClosure>()
            retainedValues.thisInstance.direct(retainedValues.to, payment.tokenIdentifier, payment.tokenNonce, payment.amount)
            __frameworkRetainClosureValue(retainedValues)
        })
        __frameworkReleaseRetainedClosureValue()
    }

    direct(
        to: ManagedAddress,
        token: TokenIdentifier,
        nonce: ElrondU64,
        amount: BigUint
    ): void {
        if (token.isEgld()) {
            this.directEgld(
                to,
                amount
            )
        } else {
            this.directEsdtWithGasLimit(
                to,
                token,
                nonce,
                amount,
                ElrondU64.fromValue(0),
                ElrondString.fromString(''),
                ElrondArray.new<ElrondString>()
            )
        }
    }

    directEgld(
        to: ManagedAddress,
        amount: BigUint
    ): void {
        const amountBytes = bytesToSize(amount.utils.toBytes(), 32)
        const toAddressBytes = bytesToSize(to.utils.toBytes(), 32)
        const emptyData = new Uint8Array(0)
        transferValue(
            changetype<i32>(toAddressBytes.buffer),
            changetype<i32>(amountBytes.buffer),
            changetype<i32>(emptyData.buffer),
            emptyData.byteLength
        )
    }

    esdtLocalBurn(
        token: TokenIdentifier,
        nonce: ElrondU64,
        amount: BigUint
    ): void {
        const argBuffer = new ManagedArgBuffer()
        argBuffer.pushArg(token)

        let funcName: string
        if (nonce == ElrondU64.zero()) {
            funcName = BuiltIntFunctionNames.ESDT_LOCAL_BURN_FUNC_NAME
        } else {
            funcName = BuiltIntFunctionNames.ESDT_NFT_BURN_FUNC_NAME
            argBuffer.pushArg(nonce)
        }

        argBuffer.pushArg(amount)

        this.callLocalEsdtBuiltInFunction(
            (new Blockchain()).getGasLeft(),
            ElrondString.fromString(funcName),
            argBuffer
        )
    }

    esdtLocalMint(
        token: TokenIdentifier,
        nonce: ElrondU64,
        amount: BigUint
    ): void {
        const argBuffer = new ManagedArgBuffer()
        argBuffer.pushArg(token)

        let funcName: string
        if (nonce == ElrondU64.zero()) {
            funcName = BuiltIntFunctionNames.ESDT_LOCAL_MINT_FUNC_NAME
        } else {
            funcName = BuiltIntFunctionNames.ESDT_NFT_MINT_FUNC_NAME
            argBuffer.pushArg(nonce)
        }

        argBuffer.pushArg(amount)

        this.callLocalEsdtBuiltInFunction(
            (new Blockchain()).getGasLeft(),
            ElrondString.fromString(funcName),
            argBuffer
        )
    }

    executeOnDestContext(
        gas: ElrondU64,
        to: ManagedAddress,
        amount: BigUint,
        endpointName: ElrondString,
        argBuffer: ManagedArgBuffer
    ): ElrondArray<ElrondString> { //TODO : use MultiValueEncoded ?
        const toBytes = to.utils.toBytes()
        const amountBytes = bytesToSize(amount.utils.toBytes(), 32)
        const endpointNameBytes = endpointName.utils.toBytes()
        const bytesArgsBuffer = argBuffer.toArgsBytes()

        const numReturnDataBefore = getNumReturnData()

        executeOnDestContext(
            gas.value as i32,
            changetype<i32>(toBytes.buffer),
            changetype<i32>(amountBytes.buffer),
            changetype<i32>(endpointNameBytes.buffer),
            endpointNameBytes.byteLength,
            argBuffer.getNumberOfArgs().value as i32,
            changetype<i32>(bytesArgsBuffer.argsLengths.buffer),
            changetype<i32>(bytesArgsBuffer.argsBytes.buffer)
        )

        const numReturnDataAfter = getNumReturnData()
        const resultsBytes = this.getReturnDataRange(numReturnDataBefore, numReturnDataAfter)

        return ElrondArray.fromArrayOfBytes(resultsBytes)
    }

    asyncCallRaw(
        to: ManagedAddress,
        amount: BigUint,
        endpointName: ElrondString,
        argBuffer: ManagedArgBuffer
    ): void {
        managedAsyncCall(
            to.getHandle(),
            amount.getHandle(),
            endpointName.getHandle(),
            argBuffer.getHandle()
        )
    }

    deployFromSourceContract(
        gas: ElrondU64,
        amount: BigUint,
        sourceContractAddress: ManagedAddress,
        codeMetadata: CodeMetadata,
        argBuffer: ManagedArgBuffer
    ): MultiValue2<ManagedAddress, ElrondArray<ElrondString>> {
        const codeMetadataHandle = ElrondString.fromBytes(codeMetadata.value.utils.toBytes()).getHandle()
        const newAddressHandle = Static.nextHandle()
        const resultHandle = Static.nextHandle()

        managedDeployFromSourceContract(
            gas.value as i64,
            amount.getHandle(),
            sourceContractAddress.getHandle(),
            codeMetadataHandle,
            argBuffer.getHandle(),
            newAddressHandle,
            resultHandle
        )

        const newManagedAddress = ManagedAddress.from(ElrondString.fromHandle(newAddressHandle))
        const results = ElrondArray.fromBuffer<ElrondString>(ElrondString.fromHandle(resultHandle))

        return MultiValue2.from(
            newManagedAddress,
            results
        )
    }

    private directEsdtWithGasLimit(
        to: ManagedAddress,
        token: TokenIdentifier,
        nonce: ElrondU64,
        amount: BigUint,
        gas: ElrondU64,
        endpointName: ElrondString,
        args: ElrondArray<ElrondString>
    ): void {
        if (nonce == ElrondU64.fromValue(0)) {
            this.transfertEsdtExecute(
                to,
                token,
                amount,
                gas,
                endpointName,
                args
            )
        } else {
            this.transfertEsdtNftExecute(
                to,
                token,
                nonce,
                amount,
                gas,
                endpointName,
                args
            )
        }
    }

    private transfertEsdtExecute(
        to: ManagedAddress,
        token: TokenIdentifier,
        amount: BigUint,
        gasLimit: ElrondU64,
        endpointName: ElrondString,
        args: ElrondArray<ElrondString>
    ): void {
        const amountBytes = bytesToSize(amount.utils.toBytes(), 32)
        const tokenBytes = token.utils.toBytes()
        const toAddressBytes = bytesToSize(to.utils.toBytes(), 32)
        const endpointNameBytes = endpointName.utils.toBytes()

        const argsBytes = new BytesEncodeOutput()
        args.utils.encodeWithoutLength(argsBytes)

        const argLenBytes = new BytesEncodeOutput()
        args.payloadSize.utils.encodeNested(argLenBytes)

        transferESDTExecute(
            changetype<i32>(toAddressBytes.buffer),
            changetype<i32>(tokenBytes.buffer),
            tokenBytes.byteLength,
            changetype<i32>(amountBytes.buffer),
            gasLimit.value as i64,
            changetype<i32>(endpointNameBytes.buffer),
            endpointNameBytes.byteLength,
            args.getLength().value as i32,
            changetype<i32>(argLenBytes.bytes.buffer),
            changetype<i32>(argsBytes.bytes)
        )
    }

    private transfertEsdtNftExecute(
        to: ManagedAddress,
        token: TokenIdentifier,
        nonce: ElrondU64,
        amount: BigUint,
        gasLimit: ElrondU64,
        endpointName: ElrondString,
        args: ElrondArray<ElrondString>
    ): void {
        const amountBytes = bytesToSize(amount.utils.toBytes(), 32)
        const tokenBytes = token.utils.toBytes()
        const toAddressBytes = bytesToSize(to.utils.toBytes(), 32)
        const endpointNameBytes = endpointName.utils.toBytes()

        const argsBytes = new BytesEncodeOutput()
        args.utils.encodeWithoutLength(argsBytes)

        const argLenBytes = new BytesEncodeOutput()
        args.payloadSize.utils.encodeNested(argLenBytes)

        const result = transferESDTNFTExecute(
            changetype<i32>(toAddressBytes.buffer),
            changetype<i32>(tokenBytes.buffer),
            tokenBytes.byteLength,
            changetype<i32>(amountBytes.buffer),
            nonce.value as i64,
            gasLimit.value as i64,
            changetype<i32>(endpointNameBytes.buffer),
            endpointNameBytes.byteLength,
            args.getLength().value as i32,
            changetype<i32>(argLenBytes.bytes.buffer),
            changetype<i32>(argsBytes.bytes)
        )
    }

    private callLocalEsdtBuiltInFunction(
        gas: ElrondU64,
        functionName: ElrondString,
        argBuffer: ManagedArgBuffer
    ): ElrondArray<ElrondString> {
        const scAddress = (new Blockchain()).scAddress //TODO : optimize by using a shared instance with cache of Blockchain

        const result = this.executeOnDestContext(
            gas,
            scAddress,
            BigUint.zero(),
            functionName,
            argBuffer
        )

        return result
    }

    /**
     * Retrieves already pushed results, via finish. from_index is inclusive. to_index is exclusive.
     */
    private getReturnDataRange(fromIndex: i32, toIndex: i32): Array<Uint8Array> {
        const numberOfResults = toIndex - fromIndex
        const results = new Array<Uint8Array>(numberOfResults)
        if (numberOfResults > 0) {
            for (let i = fromIndex; i < toIndex; i++) {
                results[i - fromIndex] = this.getReturnData(i)
            }
        }

        return results
    }

    /**
     * Retrieves already pushed individual result at given index, via finish.
     */
    private getReturnData(returnIndex: i32): Uint8Array {
        const length = getReturnDataSize(returnIndex)
        const result = new Uint8Array(length)
        if (length > 0) {
            getReturnData(returnIndex, changetype<i32>(result.buffer))
        }

        return result
    }

}

class DirectValueRetainClosure {
    constructor(
        public thisInstance: SendWrapper,
        public to: ManagedAddress
    ) {}
}