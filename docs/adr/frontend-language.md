# Frontend Language

**Context**

A web application is to be developed. It needs to handle the WebRTC connection between the peers as well as UI logic, which includes an interface to create and edit graphs in. This raises the question of which programming language it should be written in. The alternatives under consideration are:

- Javascript
- Typescript
- Kotlin
- Gleam
- Elm
- Dart

**Decision**

I choose Typescript due to my familiarity with it, it’s almost-native compiling to browsers and its wide ecosystem. The type system and other extensions to the Javascript programming languages (e.g. Interfaces) come in handy in larger codebases which we will create here.
The other mentioned languages do compile to JavaScript, but introduce a layer of complexity due to the compilation process and are either not as widely supported as Typescript or have dissadvantages that would slow down development time.

**Consequences**

**Pros**

- Stable frontend code due to type checking, good for large codebases
- Large community and ecosystem
- Easy to integrate with existing JavaScript libraries
- Faster development time (I already know TypeScript)

**Cons**

- Slightly more complex build process
- More complexity due to type checking