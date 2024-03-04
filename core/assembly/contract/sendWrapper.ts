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
import {BigUint, CodeMetadata, ManagedU32, MultiValue2} from "../types";
import { ManagedArray } from "../types";
import { ManagedU64 } from "../types";
import { ManagedBuffer } from "../types";
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
        payments: ManagedArray<TokenPayment>
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
        nonce: ManagedU64,
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
                ManagedU64.fromValue(0),
                ManagedBuffer.fromString(''),
                ManagedArray.new<ManagedBuffer>()
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
        nonce: ManagedU64,
        amount: BigUint
    ): void {
        const argBuffer = new ManagedArgBuffer()
        argBuffer.pushArg(token)

        let funcName: string
        if (nonce == ManagedU64.zero()) {
            funcName = BuiltIntFunctionNames.ESDT_LOCAL_BURN_FUNC_NAME
        } else {
            funcName = BuiltIntFunctionNames.ESDT_NFT_BURN_FUNC_NAME
            argBuffer.pushArg(nonce)
        }

        argBuffer.pushArg(amount)

        this.callLocalEsdtBuiltInFunction(
            (new Blockchain()).getGasLeft(),
            ManagedBuffer.fromString(funcName),
            argBuffer
        )
    }

    esdtLocalMint(
        token: TokenIdentifier,
        nonce: ManagedU64,
        amount: BigUint
    ): void {
        const argBuffer = new ManagedArgBuffer()
        argBuffer.pushArg(token)

        let funcName: string
        if (nonce == ManagedU64.zero()) {
            funcName = BuiltIntFunctionNames.ESDT_LOCAL_MINT_FUNC_NAME
        } else {
            funcName = BuiltIntFunctionNames.ESDT_NFT_MINT_FUNC_NAME
            argBuffer.pushArg(nonce)
        }

        argBuffer.pushArg(amount)

        this.callLocalEsdtBuiltInFunction(
            (new Blockchain()).getGasLeft(),
            ManagedBuffer.fromString(funcName),
            argBuffer
        )
    }

    executeOnDestContext(
        gas: ManagedU64,
        to: ManagedAddress,
        amount: BigUint,
        endpointName: ManagedBuffer,
        argBuffer: ManagedArgBuffer
    ): ManagedArray<ManagedBuffer> { //TODO : use MultiValueEncoded ?
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

        return ManagedArray.fromArrayOfBytes(resultsBytes)
    }

    asyncCallRaw(
        to: ManagedAddress,
        amount: BigUint,
        endpointName: ManagedBuffer,
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
        gas: ManagedU64,
        amount: BigUint,
        sourceContractAddress: ManagedAddress,
        codeMetadata: CodeMetadata,
        argBuffer: ManagedArgBuffer
    ): MultiValue2<ManagedAddress, ManagedArray<ManagedBuffer>> {
        const codeMetadataHandle = ManagedBuffer.fromBytes(codeMetadata.value.utils.toBytes()).getHandle()
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

        const newManagedAddress = ManagedAddress.from(ManagedBuffer.fromHandle(newAddressHandle))
        const results = ManagedArray.fromBuffer<ManagedBuffer>(ManagedBuffer.fromHandle(resultHandle))

        return MultiValue2.from(
            newManagedAddress,
            results
        )
    }

    private directEsdtWithGasLimit(
        to: ManagedAddress,
        token: TokenIdentifier,
        nonce: ManagedU64,
        amount: BigUint,
        gas: ManagedU64,
        endpointName: ManagedBuffer,
        args: ManagedArray<ManagedBuffer>
    ): void {
        if (nonce == ManagedU64.fromValue(0)) {
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
        gasLimit: ManagedU64,
        endpointName: ManagedBuffer,
        args: ManagedArray<ManagedBuffer>
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
        nonce: ManagedU64,
        amount: BigUint,
        gasLimit: ManagedU64,
        endpointName: ManagedBuffer,
        args: ManagedArray<ManagedBuffer>
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
        gas: ManagedU64,
        functionName: ManagedBuffer,
        argBuffer: ManagedArgBuffer
    ): ManagedArray<ManagedBuffer> {
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
