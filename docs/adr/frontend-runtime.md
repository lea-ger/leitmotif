# Frontend: JS Runtime and build tool

**Context**

A JavaScript runtime is needed to transpile and bundle the frontend code, handle package installation and other fun stuff. The options I considered for this are:

- Bun
- Node.js
- Deno

**Decision**

Bun is a modern JavaScript runtime that is designed to be fast and efficient. It has a built-in bundler, transpiler, and package manager, webserver and other things which bundles a lot of tasks and requirements of modern web-development into one. It's also said to be more performant than
the alternatives, due to it being written in Zig.

**Consequences**

**Pros**

- Fast
- Built-in bundler, transpiler, package manager, webserver, etc.
- A lot of compability with the larger Node.js ecosystem

**Cons**

- Not as widely used as Node.js
- Still relatively new