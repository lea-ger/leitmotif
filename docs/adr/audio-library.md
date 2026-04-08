# Audio library/framework

**Context**

Part of this project will be the live-generation of audio. There are some tools/libraries that would simplify this task:

- ToneJS
- p5-sound
- VanillaJS, using the WebAudio API directly

**Decision**

I choose ToneJS due to its popularity (14,7k stars on Github) as well as its usage in similar projects like the one I am going to create (as can be sen from their [showcase](https://tonejs.github.io/demos)).

**Consequences**

**Pros**

- Simplifies tone generation/handling of sound in general

**Cons**

- Adds an external dependency to the project, which comes with its usual downsides