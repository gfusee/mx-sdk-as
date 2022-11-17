# Elrond WASM AssemblyScript (Proof of concept)

A proof of concept to make Elrond smart contracts in AssemblyScript.

## ⚠️ Warning ⚠️

THIS IS ONLY EXPERIMENTAL, DO NOT USE IT IN PRODUCTION !

The aim of this repo is to make a proof of concept and ONLY a proof of concept. The code is neither clean nor safe nor optimized !

## Getting started

### AssemblyScript

AssemblyScript is nearly the same as Typescript, but there is still some difference, please check https://www.assemblyscript.org/ to have more informations.

### Contract development

#### Build the empty contract

If you only want to try writing smart contracts with this framework do the following steps :

- Clone the following repo : https://github.com/gfusee/elrond-wasm-as-empty
- In order to compile the contract you should run the command `npm run build`

And you're done ! The contract is compiled into the `build` folder.

Feel free to check examples contracts inside the `contracts/examples` folder, these are reproduction of `elrond-wasm-rs` examples contracts.

#### Test the contract via mandos

If you installed erdpy via erdpy-up you only need to run `npm run mandos` in the root folder to execute mandos scenarios.

If you have a custom installation of erdpy, here are the steps to execute mandos scenarios :

- Compile the contract (steps above)
- Find your `mandos-test` executable path inside your erdpy installation
- Inside the root folder of the project, run the `<path to mandos-test> mandos` command

## Documentation

There is currently no documentation, feel free to check examples inside the `contract/examples` folder.

If after that you have any question, feel free to DM me !

## What's not (properly) working

### Structs/classes & enums

Structs and enums are workings but with some limitations.

In order to create a classes which is compatible with the framework you should annotate it with either `@struct` or `@enumType` :

```
@struct
export class Human {
    name: ElrondString
    age: ElrondU64
    wallet: ManagedAddress
}
```

or

```
@enumType
export enum Animal {
    Cat,
    Dog,
    Spider
}
```

You should be aware of the four following limitations :

- Constructor should have no parameter. It is planned in the future to allow constructors with params, for now, you can use statics methods as a workaround.
- They should have only managed properties types (those exported from this framework)
- Enums are converted into classes at compilation. So `switch` statements may not work as expected, please use `if` instead.
- They are allocated on the heap. More explanations below.

### Async calls

Elrond team will soon change the asynchronous contracts calls system, hence I will not implement the current system.
This leads to several limitations like no call to ESDT proxy (issuing tokens, managing roles)

This feature will be my ultimate priority when Elrond team will implement the new async calls system.

### Statics and generics

There is a limitation related to Typescript, we cannot define static methods on interfaces so we cannot call them on generic parameters.

A good workaround is to instantiate dummy objects to have access to those methods.
This may lead to useless VM calls, I'm hunting these useless calls to remove them.

### Closures

AssemblyScript has a SEVERE limitation about closures. Inside a closure we cannot use a variable declared outside, for example this code works :

```
myBiguints.forEach(biguint => {
    if (biguint == BigUint.zero()) {
        throw new Error("BigUint should be greater than 0 !")
    }
})
```

But the following code does not work :

```
const sum = BigUint.zero()
myBiguints.forEach(biguint => {
    sum += biguint //does NOT compile because sum is declared outside the closure
})
```

This issue is known by the AssemblyScript and should be fixed in the future : https://github.com/AssemblyScript/assemblyscript/issues/798

### Garbage collector

I did not succeed to run contracts with the AssemblyScript garbage collector, Elrond VM says "invalid contract code" and "unknown error" when trying to.

### VM calls

Currently, I'm doing too much useless VM calls, especially when using `ElrondVec` with custom structs. This has been resolved in the branch `feature/update_deps` (not compiling yet I'm doing a BIG refactor about heap allocation)

### Heap allocations

The biggest limitation of AssemblyScript I'm facing is that classes does not act as C structs, they are always allocated on the heap and this lead to big issues.
I used a heavy workaround for some classes (ElrondString, BigUint, ...) but not for all classes because this take a lot of time to refactor all.

This issue is known by the AssemblyScript team : https://github.com/AssemblyScript/assemblyscript/issues/2254

