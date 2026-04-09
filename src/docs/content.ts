import {DOC_CATEGORIES, type DocEntry} from './types'
import {DataType} from "../nodes";
import {getDataTypeColor} from "../utils/utils.ts";

const BASE_URL = import.meta.env.BASE_URL

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
       <img src="${BASE_URL}node.png" alt="Node Example" style="max-width: 100%; border: 1px solid #ccc; margin: 10px 0;">
       This is a node. It is the fundamental building block of your graph. Every node has a specific thing it does, like creating audio signals, drawing things on a canvas, or some kind of processing or data manipulation. 
       In this case, you're seeing an "image" node, that is able to draw an image onto a canvas.
       You can check what each node does in the <a href="${BASE_URL}learn/node-reference" target="_blank">node reference</a>.
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
        You can remove a connection between ports again by clicking on the connection and then click on the "x" that should appear in the center of the dotted line.
        </p><p>
        <h4>And with that, you're basically good to go!</h4>
        You could now start with building a simple workflow by clicking on the output port of one node, and drag a connector to the input port of another. The result could look like this:
       <img src="${BASE_URL}basic-workflow.png" alt="Workflow Example" style="max-width: 100%; border: 1px solid #ccc; margin: 10px 0;">
       What does this do? First, an empty "canvas" is created. In the next node, we draw an image of a cat on this canvas. And, last but not least, we output this canvas to the "canvas output".</p><p>
       And where is this canvas output? We will explore that in the next chapter, where we will take a closer look at the interface: <a href="${BASE_URL}learn/interface" target="_blank">The Interface</a>.
    `
  },
  {
    id: 'interface',
    title: 'The Interface',
    category: DOC_CATEGORIES.GETTING_STARTED,
    tags: ['basics', 'interface'],
    content: `
      <img src="${BASE_URL}interface.png" alt="Interface Example" style="max-width: 100%; border: 1px solid #ccc; margin: 10px 0;">
      <p>This is Leitmotif's editor. Let's go over the individual blocks here:
      <ol>
            <li><strong class="mr-2">Toolbar Menu:</strong>General settings and examples can be found here, as well as the reference (which you are currently looking at 👀).</li>
            <li><strong class="mr-2">Play/Pause Button:</strong>Stops/starts the execution of the graph in the node editor.</li>
            <li><strong class="mr-2">"Create Room" Button:</strong>Clicking this will create a room for peers to join your session.</li>
            <li><strong class="mr-2">Peer panel:</strong>Here, you can see the peers that have joined your session. See more in the following section about the <a href="#peer-panel">Peer Panel</a>.</li>            
            <li><strong class="mr-2">Node editor:</strong>Here, you can edit your graph by connecting the nodes with each other. You can open the <a href="#node-settings">node settings</a> by clicking on the nodes.</li>
            <li><strong class="mr-2">Canvas output:</strong>This is a collapsible panel that shows the output of the canvas that you can draw on with some specific nodes. You can use the "maximize" button to open this output in a new tab.</li>            
            <li><strong class="mr-2">"Add node" button:</strong>This button will open up the <a href="#node-library">node library</a>.</li>            
      </ol>
      </p>
      <h2 id="peer-panel">Peer panel</h2>
      <p>
      The peer panel lists all the peers connected to you. It's updating live, and is running separately from the state of execution of your graph, which means that peers can always connect no matter if you hit "play" or "pause" in the toolbar.
      For connected peers, you see the status of when the last time has been where they've been active.</p><p> You can adjust some settings here too: You can change the layout that they see, as well as change which sensors of theirs you want to use.
      For further details, you can see the chapter <a href="${BASE_URL}learn/peers" target="_blank" rel="noopener noreferrer">"Working with peers"</a>.</p><p>
      You can also add a "Mock peer" here which lets you test your graph with some simulated values from a peer without actually connecting a device. This mock peer will generate some sensor data in a predetermined pattern. 
      For example, for the accelerometer, it will generate a sine wave pattern that oscillates between -10 and 10 on the x and y axes, and -5 to 5 in the z axis.</p><p>
      When you want to place one of the peers into your graph, you can simply click on it and drag it into the editor.
      </p>
      <h2 id="node-settings">Node settings</h2>
      <img src="${BASE_URL}edit-panel.png" alt="Node Settings Example" style="max-width: 100%; border: 1px solid #ccc; margin: 10px 0;">
      <p>Above is an example of an edit panel, in this case for the image node. As mentioned previously, this node draws an image onto a canvas, and this is where you can upload the image you want to see there!
        </p><p>There are some other parameters you can set here, like an "X" and a "Y" coordinate for where this image should be placed, or the scaling behavior, i.e. if the image should fill out the canvas, or fit onto it to be fully visible.
        </p><p>The "X" and "Y" parameters have the "input" checkbox activated. Looking at the node, a new input port for this value is active, named "param_x". That means you can connect an output port of another node to it and set its value dynamically!
      </p>
      <h2 id="node-library">Node library</h2>
      <p>
            In the node library, you can see all the nodes available to be freely placed in the editor (except for the nodes for singular peers - you need to look at the <a href="#peer-panel">Peer Panel</a> for those!).
            </p><p>They are grouped by function, and have a short description of what exactly it is they do.
            </p><p>When you want to place one of these nodes into your graph, start dragging it out by holding down left click. That way, the library modal should disappear and you can place the node inside the editor.
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
      <h2>The Engine</h2>
      <p>When you hit the "play" button in Leitmotif, the engine will start processing the graph you created in the editor.</p>
      
      <h3>How the Execution Loop Works</h3>
      <p>Unlike some visual programming tools that only run nodes when something happens (like clicking a button), Leitmotif runs <strong>every single node</strong> in your graph. Up in the top-right corner, you will see an FPS indicator, and with every frame, every node in your graph is processed.</p>
      
      <h4>The Order of Things</h4>
      <p>Before the engine can start, it needs to figure out which node should be processed first, which one second, and so on. Imagine you have a workflow where:</p>
      <ol>
        <li>Node A creates a canvas</li>
        <li>Node B draws something on that canvas</li>
        <li>Node C shows the final result</li>
      </ol>
      <p>Obviously, Node A needs to run first, then B, then C. The engine automatically figures this out by looking at how your nodes are connected. This smart ordering is called <em>topological sorting</em>. </p><p>
        What happens if there's a node D that is not connected to any other node? The engine will just run it at some point in the loop, either before node A or after node C.
      </p><p><strong>Every enabled node runs on every frame</strong>. Even if a node's inputs haven't changed, it still gets processed.
      </p><p>For example, if you have an Expression node that calculates <code>a + b</code>, that calculation happens x times per second, even if <code>a</code> and <code>b</code> stay the same.</p>
      </p>
      
      <h4>What About If and Loop Nodes?</h4>
      <p>You might wonder: "If every node runs every frame, how do conditional nodes like <strong>If</strong> work?"
      Great question! These nodes work with something called <code>null</code> values. This is how the <strong>If</strong> node behaves:
      <ul>
        <li>Every frame, it checks its condition</li>
        <li>If the condition is true, it sends the value to the <code>onTrue</code> output and <code>null</code> to <code>onFalse</code></li>
        <li>If the condition is false, it does the opposite</li>
      </ul>
      </p>
      
      <p>Think of <code>null</code> as "nothing" or "no value." Nodes downstream can check if they received <code>null</code> or an actual value. This way, you can create different paths in your graph that only activate when certain conditions are met.</p>
      
      <p>The <strong>Loop</strong> node works similarly. Every frame, it:</p>
      <ul>
        <li>Looks at the list you gave it</li>
        <li>Outputs one item from that list</li>
        <li>Outputs the current position (index) in the list</li>
      </ul>
      <p>In "step" mode, it automatically moves to the next item each frame. In "index" mode, you control which item it outputs by connecting a number to its index input.</p>
      
      <h3>Variables: Your Graph's Memory</h3>
      <p>Variables are like sticky notes for your graph. They let you remember things between different parts of your workflow, or even between different frames.</p>
      
      <h4>Creating Variables</h4>
      <p>To create a variable, use one of the variable nodes like <strong>"get-variable"</strong> or <strong>"set-variable"</strong>.
      <br>
      For the <strong>"get-variable"</strong> node for example, you have these options:
      </p>
      <ul>
        <li><strong>Name:</strong> This is the name of your variable (e.g., "outputWidth", "counter", "currentColor")</li>
        <li><strong>Default Value:</strong> What's in the box when you first create it</li>
        <li><strong>Auto Initialize:</strong> If checked, the box gets created automatically with the default value</li>
      </ul>
      
      <p>With the <strong>"set-variable"</strong> node, you can write a value to the variable by connecting something to its <code>set</code> input. You can <strong>read</strong> from it by using its <code>value</code> output.</p>
      
      <h4>Variables in Expressions</h4>
      <p>Any variable you create is automatically available in your <strong>Expression</strong> and <strong>If</strong> nodes! You don't need to connect them with wires.</p>
      
      <p>For example, if you create these variables:</p>
      <pre><code>Variable("width", 1920)
Variable("height", 1080)
Variable("scale", 0.5)</code></pre>
      
      <p>You can immediately use them in any Expression node:</p>
      <pre><code>width / 4          // Calculate a quarter of the width
height * scale     // Scale the height
width / height     // Calculate aspect ratio</code></pre>
      
      <h4>When to Use Variables</h4>
      <p>Variables are perfect for:</p>
      <ul>
        <li><strong>Shared settings:</strong> When multiple nodes need the same value (like canvas dimensions)</li>
        <li><strong>Counters:</strong> Keeping track of how many times something happened</li>
        <li><strong>States:</strong> Remembering if something is on or off</li>
        <li><strong>Configuration:</strong> Settings you want to adjust in one place and have affect the whole graph</li>
        <li><strong>Lists:</strong> Sometimes, you might want to store a list of values in a variable and access it from different nodes</li>
      </ul>
      
      <p><strong>Note:</strong> Variables live separately from your graph. When you export a graph as JSON for example, the variables aren't included. This is intentional: variables are part of your session, not part of the workflow design.</p>
      
      <h3>Performance Tips</h3>
      <p>Since every node processes every frame, here are some tips to keep things running smoothly:</p>
      
      <ul>
        <li><strong>Disable nodes you're not using:</strong> Click a node and use the settings panel to disable it. Disabled nodes are skipped during execution.</li>
        <li><strong>Be careful with loops:</strong> If you're processing a list with 1000 items, remember that's happening many times per second! Use smaller lists when possible, or consider if you really need to process everything every frame.</li>
        <li><strong>Watch your expressions:</strong> Complex mathematical expressions are fine, but if you have hundreds of them, it might slow things down. Group related calculations when possible.</li>
        <li><strong>Canvas size matters:</strong> Larger canvases (like 4K resolution) take more processing power than smaller ones. Start with smaller sizes (like 1920×1080) and only go bigger if you need to.</li>
      </ul>
      
      <h3>Understanding Null Values</h3>
      <p>Since we mentioned <code>null</code> earlier, let's clarify what it means in Leitmotif:</p>
      
      <ul>
        <li><strong>null</strong> means "no value" or "nothing"</li>
        <li>It's different from <code>0</code> (which is a number) or <code>""</code> (which is empty text)</li>
        <li>Many nodes treat <code>null</code> as "don't do anything" or "skip this"</li>
        <li>This is how conditional logic works – paths that shouldn't activate get <code>null</code> instead of real values</li>
      </ul>
      
      <p>For example, if an If node sends <code>null</code> to its <code>onFalse</code> output, any nodes connected there won't have data to work with, effectively "turning them off" for that frame.</p>
      `
  },
  {
    id: 'canvas',
    title: 'Using Canvases',
    category: DOC_CATEGORIES.CONCEPTS,
    tags: ['concepts', 'canvas'],
    content: `
      <p>The canvas is where visual things happen in Leitmotif. It's essentially a drawing board that you can paint on, draw images on, or display graphics on.</p>
      
      <h2>How Canvas Works</h2>
      <p>Canvas data flows through your graph like water through pipes:</p>
      <ol>
        <li><strong>Generate Canvas:</strong> Creates an empty canvas of a specific size</li>
        <li><strong>Image Node, Transform, Merge, etc.:</strong> Modify the canvas by drawing on it, transforming it, or combining it with other canvases</li>
        <li><strong>Canvas Output:</strong> Displays the final result in the canvas window</li>
      </ol>
      
      <p>Think of each canvas as a photograph being passed from node to node. Some nodes draw on the photo, some resize it, some combine it with other photos. The Canvas Output node is like showing the final photo in a picture frame.</p>
      
      <h2>Multiple Canvases</h2>
      <p>You can have many canvases in your graph at once! For example, you might:</p>
      <ul>
        <li>Create separate canvases for a background, middle layer, and foreground</li>
        <li>Process each canvas differently</li>
        <li>Use the <strong>Canvas Merge</strong> node to combine them all</li>
        <li>Send the combined result to the output</li>
      </ul>
      
      <p>But, the catch is: Only one canvas can be shown in the <strong>Canvas Output</strong> window at a time. Whichever canvas is connected to the Canvas Output node is what you'll see.</p>
      <p>
        When there's multiple canvases connected to the output, or there's more than one Canvas Output node in your graph, the engine will just show the first one it processes in the execution loop. So, if you want to switch between canvases, you could for example use an <strong>If</strong> node to control which canvas gets sent to the output based on some condition.</p>
      </p>
      
      <h2>Canvas and Peers</h2>
      <p>You can send canvases to connected peers (other devices)! This lets you create interactive installations where what you draw on the host computer shows up on people's phones. You can also receive canvas data from peers, which as of right now happens only if they're drawing on their phone screens when they use the "canvas" layout.</p>
      `
  },
  {
    id: 'audio',
    title: 'Making Sounds',
    category: DOC_CATEGORIES.CONCEPTS,
    tags: ['concepts', 'audio'],
    content: `
      <p>Audio in Leitmotif works through <a href="https://tonejs.github.io/" target="_blank">Tone.js</a>, a powerful audio library. When you connect audio nodes together, you're essentially building a virtual synthesizer.</p>
      
      <h2>The Audio Pipeline</h2>
      <p>Audio flows from source to destination:</p>
      <ul>
        <li><strong>Source:</strong> Nodes that create sound (like <strong>Tone Synth</strong>)</li>
        <li><strong>Effects:</strong> Nodes that modify sound (like reverb, delay, filters)</li>
        <li><strong>Destination:</strong> The <strong>Audio Output</strong> node, which sends sound to your speakers</li>
      </ul>
      
      <p>Just like with canvas, you connect these with wires. The green color on audio ports helps you see which connections carry sound.</p>
      
      <h2>Audio and the Execution Loop</h2>
      <p>Here's something to keep in mind about audio: while your node graph runs at e.g. 60 frames per second, audio itself runs at 44,100 samples per second or more! </p>
      
      <p>You don't need to worry about this difference. The audio nodes handle the fast audio processing internally. Your graph just controls <em>what</em> sounds are being made and <em>how</em> they're being processed</p>
      
      <h2>Audio to Peers</h2>
      <p>Similar to canvas, you can stream audio to connected peers. This is perfect for creating shared musical experiences or synchronized audio across multiple devices.</p>
      `
  },
  {
    id: 'peers',
    title: 'Working with Peers',
    category: DOC_CATEGORIES.CONCEPTS,
    tags: ['concepts', 'peers'],
    content: `
        <p>Peers are other devices that connect to your session. They can be phones, tablets, or other computers. When they join, they can send data (like sensor readings) to your graph, and you can send data (like canvas or audio) back to them.</p>
        
        <h2>Working with a singular peer</h2>
        
        <p>First of, for peers to be able to connect, you will need to create a session by clicking the button in the top right. A code will appear, with two buttons. If you click on the QR-Code button, a window will appear to display the QR-Code for peers to join the session:</p>
        <img src="${BASE_URL}qr-modal.png" alt="QR-Code" class="w-md" style="max-width: 100%; border: 1px solid #ccc; margin: 10px 0;" />
        <p>
         You can connect to this session now by using another device, by connecting via a private tab or a different browser, or by using a <em>Mock Peer</em>.<br>
         Mock peers generate some artificial sensor readings for you.
        </p>
        
        <p>Once a peer has connected, they will appear in the peer panel. You have a few options here: You can switch on/off capabilities, which basically means: you can set what kind of data you want to use of this peer. You are also able to change the layout the peer sees. You can check the later section about <a href="#peer-layouts">peer layouts</a> if you're curious about this topic!</p>
        
        <p>So, what's next with the peer? That's up for you to decide! But first, drag it into your editor.</p>
        
        <p>Sticking to the example from the <a href="${BASE_URL}learn/introduction">Introduction</a>, we could let the peer make our image move! Simply connect the peer's accelerometer data to the x/y position of the image, and it will start to move on the canvas.</p>
        
        <img src="${BASE_URL}peer-example.png" alt="Peer Example" style="max-width: 100%; border: 1px solid #ccc; margin: 10px 0;">
        
        <h2 id="peer-layouts">Peer Layouts</h2>
        
        <p>As the host, you're not only able to control what you see on your canvas. You can also change what the peers are seeing!</p>
        
        <p>You have access to four pre-defined layouts, which, on the peer's end, look like this:</p>
        
        ...
        
        <p>Some of these can be interacted with, and switching to this layout on the hosts end enables some new ports to be activated. For example, if you choose the <em>Keyboard</em> layout, you get an output port for the keyboard's frequency.</p>
        
        <p>That way, you could directly hook up the peer to the <em>Tone Synth</em> node. That way, when the peer plays something on the keyboard, you can actually hear what they're playing! It's like a remote MIDI-Keyboard! </p>
        
        <h2>Working with multiple peers using the "allPeers" node</h2>
        
        <p>Sometimes, you might not want to drag in each peer individually into your graph and connect them over and over. Maybe you have some automated process that should happen using peer data.</p>
        
        <img src="${BASE_URL}all-peers-node.png" alt="All Peers Node Example" style="max-width: 100%; border: 1px solid #ccc; margin: 10px 0;">
        <p>That's where the <strong>"All peers node"</strong> comes in handy: it puts out a list of all the data that all connected peers are sending over!</p>
        <p>However, working with this data can be tricky. Some familiarity with programming can assist you here.</p>
        <p>The node outputs a list of objects. The objects have a structure like this: <code>{peerId, peerName, timestamp, data}</code>.</p>
        <p>Let's say you want to work with the peer's accelerometer data. You would need the <em>allAccelerometer</em> output. But, it is still wrapped in a list. You could use an <strong>Each</strong> node to loop through this data, or you could use a CEL expression, like so: </p>
          <pre><code>allAccelerometer.map(peer => peer.data)</code></pre>
          <p>
          This would create a new list, containing just the sensor data, without the peerId and all the other stuff that's in the objects.
          Note that the <code>peer.data</code> means that for each peer object we get the <em>"data"</em> attribute, which holds the actual sensor data we're interested in.
        </p>
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
      
      <h3>Quirks in Leitmotif</h3>
      <p>Sometimes, when you want to use numbers in Leitmotif, something might not function the way it should when using expressions.</p>
      <p>When looking at a console, the ExpressionNode throws an error, which states that a specific type operation is not possible, e.g. dividing a <code>double</code> with an <code>int</code>.</p>
      <p>In this example, there's a <em>GetVariable</em> node with a default value of 1900 forwarded to the expression's "a" port. It is evaluated with this expression: <code>a / 1000</code>. This is the resulting error:</p>
      <img src="${BASE_URL}cel-type-error.png" alt="Error" class="my-4" style="max-width: 100%; border: 1px solid #ccc;">
      <p>This is because CEL is very strict with its types. If you have a number with a decimal point, it's considered a <code>double</code>, and if you have a whole number, it's an <code>int</code>. You can't mix these types in operations without explicitly converting them.</p>
      <p>To fix this, you can use doubles on both sides of the expression. For example:</p>
      <pre><code>a / 1000.0</code></pre>
      <p>If it's the other way around and you want the result to be an <code>int</code>, you can use a conversion function like this:</p>
      <pre><code>int(a) / 1000</code></pre>

      <h3>Learn More</h3>
      <p>Full CEL specification: <a href="https://github.com/google/cel-spec" target="_blank">https://github.com/google/cel-spec</a></p>
    `
  },
]
