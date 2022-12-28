import {ElrondBoolean, ElrondString} from "../types"
import {Mapping} from "../contract";

export declare function bigIntNew(value: i64): i32;
export declare function bigIntSetInt64(destination: i32, value: i64): void;
export declare function bigIntFinishUnsigned(bih: i32): void;
export declare function bigIntAdd(dest: i32, x: i32, y: i32): void;
export declare function bigIntSub(dest: i32, x: i32, y: i32): void;
export declare function bigIntMul(dest: i32, x: i32, y: i32): void;
export declare function bigIntTDiv(dest: i32, x: i32, y: i32): void;
export declare function bigIntTMod(dest: i32, x: i32, y: i32): void;
export declare function bigIntGetUnsignedArgument(arg_index: i32, dest: i32): void;
export declare function bigIntUnsignedByteLength(x: i32): i32;
export declare function bigIntGetUnsignedBytes(reference: i32, byte_ptr: i32): i32;
export declare function bigIntSetUnsignedBytes(destination: i32, byte_ptr: i32, byte_len: i32): void;
export declare function bigIntGetInt64(reference: i32): i64;
export declare function bigIntToString(bigIntHandle: i32, destHandle: i32): void;
export declare function bigIntCmp(x: i32, y: i32): i32;

export declare function smallIntFinishUnsigned(value: i64): void;
export declare function smallIntGetUnsignedArgument(id: i32): i64;

export declare function managedSignalError(messageHandle: i32): void;

export declare function mBufferNew(): i32;
export declare function mBufferNewFromBytes(byte_ptr: i32, byte_len: i32): i32;
export declare function mBufferGetLength(mBufferHandle: i32): i32;
export declare function mBufferGetBytes(mBufferHandle: i32, resultOffset: i32): i32
export declare function mBufferGetByteSlice(sourceHandle: i32, startingPosition: i32, sliceLength: i32, resultOffset: i32): i32;
export declare function mBufferEq(handle1: i32, handle2: i32): i32;
export declare function mBufferAppend(accumulatorHandle: i32, dataHandle: i32): i32;
export declare function mBufferAppendBytes(accumulatorHandle: i32, byte_ptr: i32, byte_len: i32): i32;
export declare function mBufferFromBigIntUnsigned(mBufferHandle: i32, bigIntHandle: i32): i32;
export declare function mBufferSetBytes(mBufferHandle: i32, byte_ptr: i32, byte_len: i32): i32;
export declare function mBufferSetByteSlice(mBufferHandle: i32, startingPosition: i32, dataLength: i32, dataOffset: i32): i32;
export declare function mBufferToBigIntUnsigned(mBufferHandle: i32, bigIntHandle: i32): i32;
export declare function mBufferStorageStore(keyHandle: i32, mBufferHandle: i32): i32;
export declare function mBufferStorageLoad(keyHandle: i32, mBufferHandle: i32): i32;
export declare function mBufferGetArgument(argId: i32, mBufferHandle: i32): i32;
export declare function mBufferFinish(mBufferHandle: i32): i32;
export declare function mBufferSetRandom(destinationHandle: i32, length: i32): i32;
export declare function mBufferCopyByteSlice(
    sourceHandle: i32,
    startingPosition: i32,
    sliceLength: i32,
    destinationHandle: i32
): i32

export declare function getNumArguments(): i32;

export declare function validateTokenIdentifier(token_id_handle: i32): i32;

export declare function storageLoadLength(keyOffset: i32, keyLength: i32): i32;
export declare function storageLoad(keyOffset: i32, keyLength: i32, dataOffset: i32): i32;

export declare function getBlockTimestamp(): i64;
export declare function getBlockRound(): i64;
export declare function getBlockNonce(): i64;
export declare function getBlockEpoch(): i64;
export declare function managedGetBlockRandomSeed(resultHandle: i32): void;
export declare function getOriginalTxHash(resultOffset: i32): void;
export declare function getCaller(resultOffset: i32): void;
export declare function getSCAddress(resultOffset: i32): void;
export declare function getOwnerAddress(resultOffset: i32): void;
export declare function getGasLeft(): i64;
export declare function isSmartContract(address_ptr: i32): i32;
export declare function bigIntGetExternalBalance(address_ptr: i32, dest: i32): void;
export declare function bigIntGetESDTExternalBalance(
  address_ptr: i32,
  tokenIDOffset: i32,
  tokenIDLen: i32,
  nonce: i64,
  dest: i32,
): void;
export declare function transferValue(
  dstOffset: i32,
  valueOffset: i32,
  dataOffset: i32,
  dataLength: i32,
): i32;
export declare function transferESDTExecute(
  dstOffset: i32,
  tokenIdOffset: i32,
  tokenIdLen: i32,
  valueOffset: i32,
  gasLimit: i64,
  functionOffset: i32,
  functionLength: i32,
  numArguments: i32,
  argumentsLengthOffset: i32,
  dataOffset: i32,
): i32;
export declare function transferESDTNFTExecute(
  dstOffset: i32,
  tokenIdOffset: i32,
  tokenIdLen: i32,
  valueOffset: i32,
  nonce: i64,
  gasLimit: i64,
  functionOffset: i32,
  functionLength: i32,
  numArguments: i32,
  argumentsLengthOffset: i32,
  dataOffset: i32,
): i32;
export declare function executeOnDestContext(
  gas: i64,
  addressOffset: i32,
  valueOffset: i32,
  functionOffset: i32,
  functionLength: i32,
  numArguments: i32,
  argumentsLengthOffset: i32,
  dataOffset: i32,
): i32;
export declare function managedCreateAsyncCall(
    dstHandle: i32,
    valueHandle: i32,
    functionHandle: i32,
    argumentsHandle: i32,
    successOffset: i32,
    successLength: i32,
    errorOffset: i32,
    errorLength: i32,
    gas: i64,
    extraGasForCallback: i64,
    callbackClosureHandle: i32,
): i32;
export declare function managedDeployFromSourceContract(
    gas: i64,
    valueHandle: i32,
    addressHandle: i32,
    codeMetadataHandle: i32,
    argumentsHandle: i32,
    resultAddressHandle: i32,
    resultHandle: i32,
): i32;
export declare function getNumReturnData(): i32;
export declare function getReturnDataSize(returnIndex: i32): i32;
export declare function getReturnData(resultIndex: i32, dataOffset: i32): i32;
export declare function cleanReturnData(): void;

export declare function bigIntGetCallValue(dest: i32): void;
export declare function getESDTTokenName(resultOffset: i32): i32;
export declare function getESDTTokenNonce(): i64;
export declare function bigIntGetESDTCallValue(dest: i32): void;
export declare function getNumESDTTransfers(): i32;
export declare function getESDTTokenNameByIndex(resultOffset: i32, index: i32): i32;
export declare function getESDTTokenNonceByIndex(index: i32): i64;
export declare function bigIntGetESDTCallValueByIndex(dest: i32, index: i32): void;
export declare function getESDTLocalRoles(tokenhandle: i32): i64;

export declare function verifyEd25519(
    keyOffset: i32,
    messageOffset: i32,
    messageLength: i32,
    sigOffset: i32
): i32;

export declare function managedWriteLog(topicsHandle: i32, dataHandle: i32): void;

export class Static {
  static NEXT_HANDLE: i32 = -100

  private static _EMPTY_BUFFER: ElrondString | null = null

  static get EMPTY_BUFFER(): ElrondString {
    if (Static._EMPTY_BUFFER) {
      return Static._EMPTY_BUFFER!
    } else {
      const emptyBuffer = ElrondString.new()
      Static._EMPTY_BUFFER = emptyBuffer

      return emptyBuffer
    }
  }

  static nextHandle(): i32 {
    Static.NEXT_HANDLE -= 1
    return Static.NEXT_HANDLE
  }
}

export class BuiltIntFunctionNames {

  static ESDT_LOCAL_MINT_FUNC_NAME: string = "ESDTLocalMint"
  static ESDT_NFT_MINT_FUNC_NAME: string = "ESDTNFTMint"
  static ESDT_LOCAL_BURN_FUNC_NAME: string = "ESDTLocalBurn"
  static ESDT_NFT_BURN_FUNC_NAME: string = "ESDTNFTBurn"
  static ESDT_TRANSFER_FUNC_NAME: string = "ESDTTransfer"
  static ESDT_NFT_TRANSFER_FUNC_NAME: string = "ESDTNFTTransfer"
  static ESDT_MULTI_TRANSFER_FUNC_NAME: string = "MultiESDTNFTTransfer"

}

@global
let __CLOSURE_PTR: i32 = 0

@global
let __FRAMEWORK_CLOSURE_PTR: i32 = 0

export function retainClosureValue<T>(value: T): void {
  __CLOSURE_PTR = changetype<i32>(value)
}

//retrieve retained closure value and reset ptr for more security
export function getRetainedClosureValue<T>(): T {
  if (__CLOSURE_PTR === 0) {
    ElrondString.fromString('no value retained').utils.signalError()
  }
  const result = changetype<T>(__CLOSURE_PTR)
  __CLOSURE_PTR = 0

  return result
}

export function releaseRetainedClosureValue(): void {
  __CLOSURE_PTR = 0
}

let isBreakpointEnabled = false
let isSecondBreakpointEnabled = false

export function enableDebugBreakpoint(): void { //TODO : remove before release
  isBreakpointEnabled = true
}

export function checkIfDebugBreakpointEnabled(): boolean { //TODO : remove before release
  return isBreakpointEnabled
}

export function enableSecondDebugBreakpoint(): void { //TODO : remove before release
  isSecondBreakpointEnabled = true
}

export function checkIfSecondDebugBreakpointEnabled(): boolean { //TODO : remove before release
  return isSecondBreakpointEnabled
}

//framework reserved
//TODO : check in bindgen that user does not use __frameworkXXX

export function __frameworkRetainClosureValue<T>(value: T): void {
  __FRAMEWORK_CLOSURE_PTR = changetype<i32>(value)
}

//retrieve retained closure value and reset ptr for more security
export function __frameworkGetRetainedClosureValue<T>(): T {
  if (__FRAMEWORK_CLOSURE_PTR === 0) {
    ElrondString.fromString('no value retained').utils.signalError()
  }
  const result = changetype<T>(__FRAMEWORK_CLOSURE_PTR)
  __FRAMEWORK_CLOSURE_PTR = 0

  return result
}

export function __frameworkReleaseRetainedClosureValue(): void {
  __FRAMEWORK_CLOSURE_PTR = 0
}

@global
export function wasiabort(
  message: string | null = "",
  fileName: string | null = "",
  lineNumber: u32 = 0,
  columnNumber: u32 = 0
): void {
  let newMessage = message
  if (newMessage == null) {
    newMessage = "Unknown error"
  }
  ElrondString.fromString(newMessage!).utils.signalError()
}
