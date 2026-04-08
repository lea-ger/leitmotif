# WebRTC data channels and messaging library

**Context**

It might be a good decision to use a library to offload the logic of building a WebRTC connection between peers and handle media and data channels. The alternatives I considered are:

- PeerJS
- simple-peer
- Just use VanillaJS

**Decision**

I choose PeerJS because it has a wide adoption and popular, the repository counting over 10k stars on Github, as well as being seemingly more actively maintained than simple-peer, whose last commit was done more than 2 years ago. Simply using VanillaJS is also an option, but, for my project, I want to rather focus on the UI development as it is the topic I am researching.

**Consequences**

**Pros**

- Simplifies the development by bringing in handy methods for peer connection and data transmittance

**Cons**

- Adds an external dependency to the project, which comes with its usual downsides
- The last update on the repository was 7 months ago, which, in web development terms, is quite a while