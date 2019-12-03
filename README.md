# TypeScript Guard Creator

**THIS IS CURRENTLY JUST A PROOF OF CONCEPT**

## Goal

Generate [type guards](https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-guards-and-differentiating-types) by analysing typescript interfaces.

## Usage
## Todos

### scope of possible TypeScript interfaces

* [ ] support all primitive types
* [ ] null, undefinied, unkown
* [ ] support complex types by convention
* [ ] support complex types by traversing `import`       
* [ ] add optional types
* [ ] enums
* [ ] ignore type any
* [ ] test with public keyword
* [ ] test readonly keyword 
* [ ] ignore private properties
* [ ] generics
* [ ] generics as property
* [ ] arrays primitive/ complex
* [ ] array<T> vs T[]
* [ ] union types
* [ ] files with multiple interfaces
* [ ] files with exported interface and not exported interface
* [ ] files with interfaces and other code

### Make OS independent

* [ ] OS independent SEPARATOR and so on
* [ ] OS independent build scripts

### features

* [ ] use schematics
* [ ] use glob as input
* [ ] primitive types as infile check vs import
* [ ] custom file suffix (currently it's `.guard.ts`)
* [ ] write tests with fsify


### open questions

* [ ] support of methods exists?
* [ ] in declare module? or do we ignore .d.ts for now?
* [ ] should not exported interfaces be ignored?
* [ ] can we support complex inline types `{foo: string}`
    * [ ] `[key: string]: any;`
    * [ ] `[hub: string]: Hub;` <== what's that?
* [ ] namespaced types 
    * [ ] `import * as fromAuth`
    * [ ] `import foo as fromAuth`

