import {DOC_CATEGORIES, type DocEntry} from './types'
import {DataType} from "../nodes";
import {getDataTypeColor} from "../utils/utils.ts";

/**
 * Getting Started documentation entries
 */
export const GETTING_STARTED_DOCS: DocEntry[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    category: DOC_CATEGORIES.GETTING_STARTED,
    tags: ['basics', 'overview'],
    content: `
      <h2>Welcome to Leitmotif!</h2>
      <p>Leitmotif is a node-based visual programming environment for creating participative audiovisual experiences. It's a bit like <a href="https://derivative.ca/">Touchdesigner</a> or <a href="https://cables.gl/">cables</a>, and it runs in your browser!</p>
      
      <!--<h3>Key Features</h3>
      <ul>
        <li>Node-based visual programming</li>
        <li>Real-time peer-to-peer collaboration</li>
        <li>Canvas manipulation and drawing</li>
        <li>Audio synthesis with Tone.js</li>
        <li>CEL (Common Expression Language) for logic</li>
        <li>Persistent variable storage</li>
      </ul>-->

      <h3>The Basics</h3>
      <p>Here are some basic concepts and terms you need to know to get started with Leitmotif:</p>
        
       <h4>Nodes</h4>
       <img src="/node.png" alt="Node Example" style="max-width: 100%; border: 1px solid #ccc; margin: 10px 0;">
       This is a node. It is the fundamental building block of your graph. Every node has a specific thing it does, like creating audio signals, drawing things on a canvas, or some kind of processing or data manipulation. 
       In this case, you're seeing an "image" node, that is able to draw an image onto a canvas.
       You can check what each node does in the <a href="/learn/node-reference" target="_blank">node reference</a>.
       <h4>Ports</h4>
       The little dots on both sides of the node are called "ports". These are data inputs and make it possible to connect nodes with each other.<br>
       These ports are colored, and the color of the port is an indicator of what type of data it expects as an input:
       <ul class="mt-4">
          <li><div class="badge badge-xs mr-1" style="background: ${getDataTypeColor(DataType.CANVAS)}"></div><strong>Blue</strong>: Canvas data (OffscreenCanvas)</li>
          <li><div class="badge badge-xs mr-1" style="background: ${getDataTypeColor(DataType.AUDIO)}"></div><strong>Green</strong>: Audio data (Tone.js objects)</li>
          <li><div class="badge badge-xs mr-1" style="background: ${getDataTypeColor(DataType.NUMERIC)}"></div><strong>Yellow</strong>: Numeric data (numbers)</li>
          <li><div class="badge badge-xs mr-1" style="background: ${getDataTypeColor(DataType.OBJECT)}"></div><strong>Purple</strong>: Structured data (objects or lists)</li>
          <li><div class="badge badge-xs mr-1" style="background: ${getDataTypeColor(DataType.EVENT)}"></div><strong>Red</strong>: Events and event data</li>
          <li><div class="badge badge-xs mr-1" style="background: ${getDataTypeColor(DataType.ANY)}"></div><strong>Gray</strong>: Any data (can be numbers, text, objects, etc.)</li>
        </ul>
        You can only connect ports with the same color. So, for example, the "canvas" output port of the image node above would only be able to connect to a canvas input port (or a "gray" input port).
        <br>
        <h4>And with that, you're basically good to go!</h4>
        You could now start with building a simple workflow by clicking on the output port of one node, and drag a connector to the input port of another. The result could look like this:
       <img src="/basic-workflow.png" alt="Workflow Example" style="max-width: 100%; border: 1px solid #ccc; margin: 10px 0;">
       What does this do? First, an empty "canvas" is created. In the next node, we draw an image of a cat on this canvas. And, last but not least, we output this canvas to the "canvas output".<br>
       And where is this canvas output? We will explore that in the next chapter, where we will take a closer look at the interface: <a href="/learn/interface" target="_blank">The Interface</a>.
    `
  },
  {
    id: 'interface',
    title: 'The Interface',
    category: DOC_CATEGORIES.GETTING_STARTED,
    tags: ['basics', 'interface'],
    content: `
      <img src="/interface.png" alt="Interface Example" style="max-width: 100%; border: 1px solid #ccc; margin: 10px 0;">
      <p>This is Leitmotif's editor. Let's go over the individual blocks here:
      <ol>
            <li><strong class="mr-2">Toolbar Menu:</strong>General settings and examples can be found here, as well as the reference (which you are currently looking at 👀).</li>
            <li><strong class="mr-2">Play/Pause Button:</strong>Stops/starts the execution of the graph in the node editor.</li>
            <li><strong class="mr-2">"Create Room" Button:</strong>Clicking this will create a room for peers to join your session.</li>
            <li><strong class="mr-2">Peer panel:</strong>Here, you can see the peers that have joined your session. See more in the following section about the <a href="#peer-panel">Peer Panel</a>.</li>            
            <li><strong class="mr-2">Node editor:</strong>Here, you can edit your graph by connecting the nodes with each other. You can open the <a href="#node-settings">node settings</a> by clicking on the nodes.</li>
            <li><strong class="mr-2">Canvas output:</strong>This is a collapsible panel that shows the output of the canvas that you can draw on with some specific nodes.</li>            
            <li><strong class="mr-2">"Add node" button:</strong>This button will open up the <a href="#node-library">node library</a>.</li>            
      </ol>
      </p>
      <h2 id="peer-panel">Peer panel</h2>
      <p>
      The peer panel lists all the peers connected to you. It's updating live, and is running separately from the state of execution of your graph, which means that peers can always connect no matter if you hit "play" or "pause" in the toolbar.
      For connected peers, you see the status of when the last time has been where they've been active. You can adjust some settings here too: You can change the layout that they see, as well as change which sensors of theirs you want to use.
      For further details, you can see the chapter <a href="/learn/peers" target="_blank" rel="noopener noreferrer">"Working with peers"</a>.
      You can also add a "Mock peer" here which lets you test your graph. 
      When you want to place one of the peers into your graph, you can simply click on it and drag it into the editor.
      </p>
      <h2 id="node-settings">Node settings</h2>
      <img src="/edit-panel.png" alt="Node Settings Example" style="max-width: 100%; border: 1px solid #ccc; margin: 10px 0;">
      <p>Above is an example of an edit panel, in this case for the image node. As mentioned previously, this node draws an image onto a canvas, and this is where you can upload the image you want to see there!
        There are some other parameters you can set here, like an "X" and a "Y" coordinate for where this image should be placed, or the scaling behavior, i.e. if the image should fill out the canvas, or fit onto it to be fully visible.
        The "X" and "Y" parameters have the "input" checkbox activated. Looking at the node, a new input port for this value is active, named "param_x". That means you can connect an output port of another node to it and set its value dynamically!
      </p>
      <h2 id="node-library">Node library</h2>
      <p>
            In the node library, you can see all the nodes available to be freely placed in the editor (except for the nodes for singular peers - you need to look at the <a href="#peer-panel">Peer Panel</a> for those!).
            They are grouped by function, and have a short description of what exactly it is they do.
            When you want to place one of these nodes into your graph, start dragging it out by holding down left click. That way, the library modal should disappear and you can place the node inside the editor.
      </p>
    `
  },
]

/**
 * Tutorial documentation entries
 */
export const TUTORIAL_DOCS: DocEntry[] = [
  {
    id: 'first-canvas',
    title: 'Creating Your First Canvas',
    category: DOC_CATEGORIES.TUTORIALS,
    tags: ['tutorial', 'canvas', 'beginner'],
    content: `
      <h2>Creating Your First Canvas</h2>
      <p>This tutorial will guide you through creating a simple canvas with an image.</p>

      <h3>Steps</h3>
      <ol>
        <li>Add a <strong>Generate Canvas</strong> node from the Input category</li>
        <li>Add an <strong>Image</strong> node</li>
        <li>Add a <strong>Canvas Output</strong> node from the Output category</li>
        <li>Connect: Generate Canvas → Image → Canvas Output</li>
        <li>Click the Image node and upload an image in the settings</li>
        <li>Press Play to see your image rendered!</li>
      </ol>

      <h3>Next Steps</h3>
      <ul>
        <li>Try adding a <strong>Canvas Transform</strong> node to rotate or scale the image</li>
        <li>Use <strong>Canvas Merge</strong> to combine multiple layers</li>
        <li>Connect an <strong>Expression</strong> node to animate properties</li>
      </ul>
    `
  },
  {
    id: 'using-variables',
    title: 'Working with Variables',
    category: DOC_CATEGORIES.TUTORIALS,
    tags: ['tutorial', 'variables', 'intermediate'],
    content: `
      <h2>Working with Variables</h2>
      <p>Variables allow you to store and share data between different parts of your graph.</p>

      <h3>Setting Variables</h3>
      <ol>
        <li>Add a <strong>Set Variable</strong> node</li>
        <li>Connect the value you want to store to its input</li>
        <li>Give it a name in the settings (e.g., "masterCanvas")</li>
        <li>Toggle "Persist" off if storing runtime objects like canvases</li>
      </ol>

      <h3>Getting Variables</h3>
      <ol>
        <li>Add a <strong>Get Variable</strong> node</li>
        <li>Enter the same variable name</li>
        <li>Optionally set a default value using CEL</li>
        <li>Connect the output to wherever you need the value</li>
      </ol>

      <h3>Tips</h3>
      <ul>
        <li>Click variable name badges in the settings to auto-fill names</li>
        <li>Use variables to create initialization patterns</li>
        <li>Canvas objects are automatically cloned when stored</li>
      </ul>
    `
  },
]

/**
 * Concept documentation entries
 */
export const CONCEPT_DOCS: DocEntry[] = [
  {
    id: 'engine',
    title: 'The Engine',
    category: DOC_CATEGORIES.CONCEPTS,
    tags: ['concepts', 'engine'],
    content: `
      <p>The engine is the core runtime that executes your node graph. It manages data flow, variable storage and node processing.</p>
      
      <h3>The execution loop</h3>
      <p>The execution of your project starts when you hit "play".</p>
      
      <h3>Variables</h3>
    `
  },
  {
    id: 'peers',
    title: 'Working with Peers',
    category: DOC_CATEGORIES.CONCEPTS,
    tags: ['concepts', 'peers'],
    content: `
      <h2>The Engine</h2>
      <p>The engine is the core runtime that executes your node graph. It manages data flow, variable storage and node processing.</p>
      
      <h3>The execution loop</h3>
      <p>The execution of your project starts when you hit "play".</p>
      
      <h3>Variables</h3>
    `
  },
  {
    id: 'cel-expressions',
    title: 'CEL Expressions',
    category: DOC_CATEGORIES.CONCEPTS,
    tags: ['concepts', 'cel', 'expressions'],
    content: `
      <h2>Common Expression Language (CEL)</h2>
      <p>CEL is a non-Turing complete expression language designed for simplicity and safety.</p>

      <h3>Basic Syntax</h3>
      <pre><code>// Math
a + b * 2
value / 100.0

// Comparisons
age >= 18
name == "Alice"

// Logical operators
active && ready
x > 10 || y < 5

// Ternary operator
condition ? trueValue : falseValue
age >= 18 ? "adult" : "minor"</code></pre>

      <h3>Type Checking</h3>
      <pre><code>type(1) == int
type("hello") == string
type(3.14) == double
type(true) == bool</code></pre>

      <h3>Where CEL is Used</h3>
      <ul>
        <li><strong>Expression Node</strong>: Calculate values from inputs</li>
        <li><strong>If Node</strong>: Conditional routing based on expressions</li>
        <li><strong>Get Variable</strong>: Default values when variable doesn't exist</li>
      </ul>

      <h3>Learn More</h3>
      <p>Full CEL specification: <a href="https://github.com/google/cel-spec" target="_blank">https://github.com/google/cel-spec</a></p>
    `
  },
]
