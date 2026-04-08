# Backend language and toolkit

**Context**

The project primarily relies on peer-to-peer communication using WebRTC, which raises the question of whether a backend component is required at all. Many core features such as media streaming and data exchange can be handled directly between peers. However, a backend may still be necessary for tasks such as signaling (e.g. SDP and ICE candidate exchange), session coordination, and potential future extensions.

Additionally, the project may later evolve into a platform that requires persistent services, or offload parts of the media processing or orchestration logic to a server. This raises the question of which backend language and framework should be used, while keeping the initial setup as simple as possible. The options considered are:

- TypeScript with Bun (simple HTTP/WebSocket server)
- Other JavaScript / TypeScript frameworks (e.g. Express, Fastify)
- Gleam
- Rust (e.g. Axum, Actix)
- No backend / purely P2P approach

**Decision**

For this project, I choose **TypeScript running on Bun**, using Bun as a lightweight web server where needed.

This approach keeps the backend optional and minimal, while allowing easy implementation of signaling endpoints or WebSocket-based coordination if required. Using TypeScript enables code sharing and conceptual consistency between frontend and backend, and Bun provides fast startup times and a simple runtime without additional framework overhead. More complex frameworks or non-JavaScript languages are deliberately avoided at this stage to keep development effort low and iteration fast. Also, Bun is integrated as a runtime and package management tool already anyway, so this does not add another dependency

**Consequences**

**Pros**

- Minimal and optional backend setup
- Shared language and tooling between frontend and backend
- Fast startup and simple deployment using Bun
- Easy to extend later if additional server-side logic is needed

**Cons**

- Limited maturity compared to established backend frameworks
- Not optimized for heavy media processing or high concurrency
- May need to be replaced or complemented for larger-scale deployments