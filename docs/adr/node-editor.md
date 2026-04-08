# Node Editor

**Context**

A web application is to be developed that allows performers to create and modify audiovisual processing graphs in real time. The central part of this user interface is a node-based editor, which enables users to define data flows by connecting building blocks (or nodes). This editor must support graph editing during runtime, provide visual feedback, and integrate well with the underlying audio, visual, and sensor-processing systems. As well as handling sound and WebRTC connection, using a library will fast-track development and iteration. Since I want to use Vue.js, I also need to find a solution that integrates well with that framework, which excludes the ReactFlow library, which according to my research is the most popular choice. The options considered are therefore:

- Rete.js
- VueFlow
- Joint
- Litegraph
- BaklavaJS
- Custom implementation

**Decision**

For this project, I choose VueFlow.

Many of the presented options are technically capable and similar in scope. VueFlow stands out due to its strong integration with Vue.js, its modern architecture, and active maintenance. It is extensible enough to support custom node types and visualizations, which is necessary to implement TouchDesigner-style nodes with live visual feedback. VueFlow is also used in widely adopted software such as **n8n**, which served as an important reference and source of inspiration during the research phase of this project.

Other libraries were considered, but either require additional integration layers (Rete.js), focus more on static graph visualization (Joint), or are less actively maintained or documented. A custom implementation would introduce significant development overhead and risk, especially given the complexity of live graph editing and interaction.

**Consequences**

**Pros**

- Good integration with Vue.js and its component model
- Highly customizable nodes and edges
- Supports live graph editing and visual feedback
- Good documentation and examples
- Proven in production use by widely used applications (e.g. n8n)

**Cons**

- Limited built-in visual styling, requiring custom UI work for a performance-oriented look
- Less mature ecosystem compared to React Flow
- Adds an external dependency to the project, which comes with its usual downsides