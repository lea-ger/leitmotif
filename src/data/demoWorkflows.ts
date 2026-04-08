// Demo workflows for Leitmotif
export const DEMO_WORKFLOWS = [
  {
    id: 'simple-synth',
    name: 'Simple Synthesizer',
    description: 'A basic audio setup with a synthesizer and audio output.',
    data: {
      nodes: [
        {
          id: 'synth-1',
          type: 'tone-synth',
          position: { x: 100, y: 150 },
          enabled: true,
          parameters: {
            frequency: 440,
            oscillator: 'sine',
            envelope_attack: 0.1,
            envelope_decay: 0.2,
            envelope_sustain: 0.5,
            envelope_release: 1,
            volume: -10
          },
          exposedParameters: []
        },
        {
          id: 'audio-out-1',
          type: 'audio-output',
          position: { x: 400, y: 150 },
          enabled: true,
          parameters: {},
          exposedParameters: []
        },
        {
          id: 'comment-1',
          type: 'comment',
          position: { x: 100, y: 50 },
          enabled: true,
          parameters: {
            text: 'This is a basic sine wave synthesizer connected to audio output.',
            width: 350,
            height: 100
          },
          exposedParameters: []
        }
      ],
      connections: [
        {
          id: 'conn-1',
          sourceNodeId: 'synth-1',
          sourcePortName: 'audio',
          targetNodeId: 'audio-out-1',
          targetPortName: 'audio',
          dataType: 'audio'
        }
      ],
      previewEnabled: []
    }
  },
  {
    id: 'visualizer',
    name: 'Canvas Setup',
    description: 'Generates a canvas and outputs it to the window.',
    data: {
      nodes: [
        {
          id: 'gen-canvas-1',
          type: 'generate-canvas',
          position: { x: 100, y: 150 },
          enabled: true,
          parameters: {
            width: 800,
            height: 600,
            backgroundColor: '#000000'
          },
          exposedParameters: []
        },
        {
          id: 'output-canvas-1',
          type: 'canvas-output',
          position: { x: 450, y: 150 },
          enabled: true,
          parameters: {},
          exposedParameters: []
        },
        {
          id: 'comment-1',
          type: 'comment',
          position: { x: 100, y: 50 },
          enabled: true,
          parameters: {
            text: 'Generates a blank canvas for drawing operations.',
            width: 300,
            height: 100
          },
          exposedParameters: []
        }
      ],
      connections: [
        {
          id: 'conn-1',
          sourceNodeId: 'gen-canvas-1',
          sourcePortName: 'canvas',
          targetNodeId: 'output-canvas-1',
          targetPortName: 'canvas',
          dataType: 'canvas'
        }
      ],
      previewEnabled: []
    }
  },
  {
    id: 'participative-canvas',
    name: 'Participative Canvas',
    description: 'A collaborative canvas setup that assigns connected peers a section of the canvas to draw on, and merges their contributions onto a master canvas.',
    data: {
      "nodes": [
        {
          "id": "1774368104735-wiln2dz7t",
          "type": "all-peers",
          "position": {
            "x": 185.18221833778242,
            "y": 948.167701185589
          },
          "enabled": true,
          "parameters": {},
          "exposedParameters": []
        },
        {
          "id": "1774373101910-2mu0dcsk2",
          "type": "generate-canvas",
          "position": {
            "x": 870.8402658635413,
            "y": 78.96722890772784
          },
          "enabled": true,
          "parameters": {
            "width": 800,
            "height": 600,
            "backgroundColor": "#000000"
          },
          "exposedParameters": [
            "width",
            "height"
          ]
        },
        {
          "id": "1774373328950-ci04z140f",
          "type": "canvas-merge",
          "position": {
            "x": 2276.8630688683484,
            "y": 232.3550953703809
          },
          "enabled": true,
          "parameters": {
            "width": 1920,
            "height": 1080,
            "clearBackground": true,
            "backgroundColor": "#000000"
          },
          "exposedParameters": []
        },
        {
          "id": "1774373708548-33awhv1w9",
          "type": "expression",
          "position": {
            "x": 1477.9400310163287,
            "y": 1053.666693703856
          },
          "enabled": true,
          "parameters": {
            "expression": "size(editPeerIds) + int(a)"
          },
          "exposedParameters": []
        },
        {
          "id": "1774469783995-wka2ygwhj",
          "type": "canvas-output",
          "position": {
            "x": 2737.645487210497,
            "y": 295.4743136764417
          },
          "enabled": true,
          "parameters": {},
          "exposedParameters": []
        },
        {
          "id": "1774477277320-9rb2tt4w6",
          "type": "set-variable",
          "position": {
            "x": 1214.3810362811296,
            "y": 38.35036779462058
          },
          "enabled": true,
          "parameters": {
            "name": "masterCanvas",
            "persist": false
          },
          "exposedParameters": []
        },
        {
          "id": "1774477329715-m1gt9uosj",
          "type": "get-variable",
          "position": {
            "x": 1498,
            "y": 14
          },
          "enabled": true,
          "parameters": {
            "name": "masterCanvas",
            "default": "",
            "typeHint": "none"
          },
          "exposedParameters": []
        },
        {
          "id": "1774481506484-xa4zps38g",
          "type": "set-variable",
          "position": {
            "x": 2568.4143621433127,
            "y": 587.1434548550236
          },
          "enabled": true,
          "parameters": {
            "name": "masterCanvas",
            "persist": true
          },
          "exposedParameters": []
        },
        {
          "id": "1774483130682-sx4jxyyko",
          "type": "get-variable",
          "position": {
            "x": 583.9317362460196,
            "y": 251.1172438597897
          },
          "enabled": true,
          "parameters": {
            "name": "canvasWidth",
            "default": "1900",
            "typeHint": "none"
          },
          "exposedParameters": []
        },
        {
          "id": "1774483140097-gyteux9op",
          "type": "get-variable",
          "position": {
            "x": 583.2711663881969,
            "y": 345.9189383753524
          },
          "enabled": true,
          "parameters": {
            "name": "canvasHeight",
            "default": "1080",
            "typeHint": "none"
          },
          "exposedParameters": []
        },
        {
          "id": "1774483164337-w3kxix66b",
          "type": "get-variable",
          "position": {
            "x": 953.6682855645629,
            "y": 1416.086135502967
          },
          "enabled": true,
          "parameters": {
            "name": "editPeerIds",
            "default": "[]",
            "typeHint": "none"
          },
          "exposedParameters": []
        },
        {
          "id": "1774483197978-i0rjzvncd",
          "type": "set-variable",
          "position": {
            "x": 498.93767836561926,
            "y": 898.9738586245003
          },
          "enabled": true,
          "parameters": {
            "name": "allCanvas",
            "persist": true
          },
          "exposedParameters": []
        },
        {
          "id": "1774483313833-dg0zmybi5",
          "type": "set-variable",
          "position": {
            "x": 1655.9765898413966,
            "y": 1325.463032427049
          },
          "enabled": true,
          "parameters": {
            "name": "editPeerIds",
            "persist": true
          },
          "exposedParameters": []
        },
        {
          "id": "1774483400844-6uw8vg07y",
          "type": "expression",
          "position": {
            "x": 1369.363486715297,
            "y": 1454.1435605515442
          },
          "enabled": true,
          "parameters": {
            "expression": "editPeerIds + a.map(peer, peer.peerId)"
          },
          "exposedParameters": []
        },
        {
          "id": "1774721960752-hio9gwu4a",
          "type": "canvas-transform",
          "position": {
            "x": 1882.7051442953498,
            "y": 273.43260962877787
          },
          "enabled": true,
          "parameters": {
            "x": 0,
            "y": 0,
            "width": 0,
            "height": 0,
            "scale": 1,
            "maintainAspect": false
          },
          "exposedParameters": []
        },
        {
          "id": "1774722042759-afyucp685",
          "type": "expression",
          "position": {
            "x": 1154.4862500836923,
            "y": 339.0769908877909
          },
          "enabled": true,
          "parameters": {
            "expression": "int(a) / int(b)"
          },
          "exposedParameters": []
        },
        {
          "id": "1774722075169-b0qzgatip",
          "type": "expression",
          "position": {
            "x": 1154.4862500836925,
            "y": 504.29009663742397
          },
          "enabled": true,
          "parameters": {
            "expression": "int(a) / int(b)"
          },
          "exposedParameters": []
        },
        {
          "id": "1774722241184-vk82f1ppz",
          "type": "loop",
          "position": {
            "x": 1083.3095468117667,
            "y": 907.9214724493536
          },
          "enabled": true,
          "parameters": {
            "mode": "step",
            "loop": false
          },
          "exposedParameters": []
        },
        {
          "id": "1774722373647-znsjx4d4l",
          "type": "get-variable",
          "position": {
            "x": 695.2241304310426,
            "y": 510.3529629034658
          },
          "enabled": true,
          "parameters": {
            "name": "gridSize",
            "default": "4",
            "typeHint": "none"
          },
          "exposedParameters": []
        },
        {
          "id": "1774723529767-nc0q5jom0",
          "type": "expression",
          "position": {
            "x": 1548.5521905570563,
            "y": 765.022219275769
          },
          "enabled": true,
          "parameters": {
            "expression": "a.data"
          },
          "exposedParameters": []
        },
        {
          "id": "1774723558046-p4ezhwwfg",
          "type": "comment",
          "position": {
            "x": 1743.8309109065522,
            "y": 975.2340182402261
          },
          "enabled": true,
          "parameters": {
            "text": "Calculate grid position for peer, by using the array index and dividing it by the grid size",
            "width": 185,
            "height": 174
          },
          "exposedParameters": []
        },
        {
          "id": "1774723576422-ymwm3gw7t",
          "type": "expression",
          "position": {
            "x": 1971.2731851959652,
            "y": 1084.3603619649439
          },
          "enabled": true,
          "parameters": {
            "expression": "int(int(int(canvasHeight) / gridSize) * int(int(a) / gridSize)) % int(canvasWidth))"
          },
          "exposedParameters": []
        },
        {
          "id": "1774723717582-c69ygbkv6",
          "type": "expression",
          "position": {
            "x": 1892.6517476832826,
            "y": 804.7643560482379
          },
          "enabled": true,
          "parameters": {
            "expression": "int(int(canvasWidth) / gridSize) * int(int(a) % gridSize)"
          },
          "exposedParameters": []
        },
        {
          "id": "1774726275748-1ztl8ud4a",
          "type": "expression",
          "position": {
            "x": 956.4047527053793,
            "y": 1157.4886939111045
          },
          "enabled": true,
          "parameters": {
            "expression": "allCanvas.filter(cv, !editPeerIds.exists(id, id == cv.peerId))"
          },
          "exposedParameters": []
        },
        {
          "id": "1775655596509-gfz4xtmjm",
          "type": "comment",
          "position": {
            "x": 836.0501678328272,
            "y": 304.4810242060471
          },
          "enabled": true,
          "parameters": {
            "text": "Sets some initial variables (canvasWidth, canvasHeight, gridSize) and initializes the master canvas",
            "width": 213,
            "height": 181
          },
          "exposedParameters": []
        },
        {
          "id": "1775655754901-xw47z9j9u",
          "type": "comment",
          "position": {
            "x": 724.4836979596098,
            "y": 828.1871592579735
          },
          "enabled": true,
          "parameters": {
            "text": "Start by looping through the connected peers",
            "width": 200,
            "height": 150
          },
          "exposedParameters": []
        },
        {
          "id": "1775655811434-422ipaypx",
          "type": "comment",
          "position": {
            "x": 1630.1409239892573,
            "y": 1438.5213767996922
          },
          "enabled": true,
          "parameters": {
            "text": "This keeps track of all the peers that have edited the canvas, so that freshly connected peers can be assigned a new \"parcel\" to edit on.",
            "width": 276,
            "height": 206
          },
          "exposedParameters": []
        },
        {
          "id": "1775655964518-o4i0xqzbb",
          "type": "comment",
          "position": {
            "x": 2096.8330481292705,
            "y": 82.7399362966608
          },
          "enabled": true,
          "parameters": {
            "text": "Scale the peer canvas and place it on the masterCanvas",
            "width": 200,
            "height": 150
          },
          "exposedParameters": []
        },
        {
          "id": "1775656018234-i9mazoir7",
          "type": "comment",
          "position": {
            "x": 325.7147013463776,
            "y": 1297.6082865464243
          },
          "enabled": true,
          "parameters": {
            "text": "This workflow does the following:\nWhen a new peer is connected, they are assigned a spot on the master canvas and are shown the \"canvas\" layout on their device. The thing they draw on there will be placed on the master canvas, creating a participative artwork.",
            "width": 421,
            "height": 380
          },
          "exposedParameters": []
        }
      ],
      "connections": [
        {
          "id": "1774481316943-6a8orwqug",
          "sourceNodeId": "1774477329715-m1gt9uosj",
          "sourcePortName": "value",
          "targetNodeId": "1774373328950-ci04z140f",
          "targetPortName": "layerA",
          "dataType": "any"
        },
        {
          "id": "1774481318631-aaycwtyvl",
          "sourceNodeId": "1774373328950-ci04z140f",
          "sourcePortName": "canvas",
          "targetNodeId": "1774469783995-wka2ygwhj",
          "targetPortName": "canvas",
          "dataType": "canvas"
        },
        {
          "id": "1774481508792-3rxofpdhd",
          "sourceNodeId": "1774373328950-ci04z140f",
          "sourcePortName": "canvas",
          "targetNodeId": "1774481506484-xa4zps38g",
          "targetPortName": "value",
          "dataType": "canvas"
        },
        {
          "id": "1774481571641-epeh835ez",
          "sourceNodeId": "1774373101910-2mu0dcsk2",
          "sourcePortName": "canvas",
          "targetNodeId": "1774477277320-9rb2tt4w6",
          "targetPortName": "value",
          "dataType": "canvas"
        },
        {
          "id": "1774483155659-neohqghfl",
          "sourceNodeId": "1774483140097-gyteux9op",
          "sourcePortName": "value",
          "targetNodeId": "1774373101910-2mu0dcsk2",
          "targetPortName": "param_height",
          "dataType": "any"
        },
        {
          "id": "1774483156768-kfzrmehbe",
          "sourceNodeId": "1774483130682-sx4jxyyko",
          "sourcePortName": "value",
          "targetNodeId": "1774373101910-2mu0dcsk2",
          "targetPortName": "param_width",
          "dataType": "any"
        },
        {
          "id": "1774483204772-ej7np3acl",
          "sourceNodeId": "1774368104735-wiln2dz7t",
          "sourcePortName": "allCanvas",
          "targetNodeId": "1774483197978-i0rjzvncd",
          "targetPortName": "value",
          "dataType": "object"
        },
        {
          "id": "1774483442809-9m7zcsrbf",
          "sourceNodeId": "1774483400844-6uw8vg07y",
          "sourcePortName": "result",
          "targetNodeId": "1774483313833-dg0zmybi5",
          "targetPortName": "value",
          "dataType": "any"
        },
        {
          "id": "1774722060998-up4ss89c3",
          "sourceNodeId": "1774483130682-sx4jxyyko",
          "sourcePortName": "value",
          "targetNodeId": "1774722042759-afyucp685",
          "targetPortName": "a",
          "dataType": "any"
        },
        {
          "id": "1774722070262-lfg0t6crb",
          "sourceNodeId": "1774722042759-afyucp685",
          "sourcePortName": "result",
          "targetNodeId": "1774721960752-hio9gwu4a",
          "targetPortName": "width",
          "dataType": "any"
        },
        {
          "id": "1774722078898-3r7mtusvc",
          "sourceNodeId": "1774483140097-gyteux9op",
          "sourcePortName": "value",
          "targetNodeId": "1774722075169-b0qzgatip",
          "targetPortName": "a",
          "dataType": "any"
        },
        {
          "id": "1774722098694-6y0mjo8h9",
          "sourceNodeId": "1774722075169-b0qzgatip",
          "sourcePortName": "result",
          "targetNodeId": "1774721960752-hio9gwu4a",
          "targetPortName": "height",
          "dataType": "any"
        },
        {
          "id": "1774722410942-7gp9m9zeh",
          "sourceNodeId": "1774722373647-znsjx4d4l",
          "sourcePortName": "value",
          "targetNodeId": "1774722075169-b0qzgatip",
          "targetPortName": "b",
          "dataType": "any"
        },
        {
          "id": "1774722413070-ntn315hyb",
          "sourceNodeId": "1774722373647-znsjx4d4l",
          "sourcePortName": "value",
          "targetNodeId": "1774722042759-afyucp685",
          "targetPortName": "b",
          "dataType": "any"
        },
        {
          "id": "1774723532213-hiyzwu2vy",
          "sourceNodeId": "1774722241184-vk82f1ppz",
          "sourcePortName": "item",
          "targetNodeId": "1774723529767-nc0q5jom0",
          "targetPortName": "a",
          "dataType": "any"
        },
        {
          "id": "1774723542669-0hv1a5k4i",
          "sourceNodeId": "1774723529767-nc0q5jom0",
          "sourcePortName": "result",
          "targetNodeId": "1774721960752-hio9gwu4a",
          "targetPortName": "canvas",
          "dataType": "any"
        },
        {
          "id": "1774723545853-10upy2h7x",
          "sourceNodeId": "1774721960752-hio9gwu4a",
          "sourcePortName": "canvas",
          "targetNodeId": "1774373328950-ci04z140f",
          "targetPortName": "layerB",
          "dataType": "canvas"
        },
        {
          "id": "1774723579221-53r3s4ccd",
          "sourceNodeId": "1774373708548-33awhv1w9",
          "sourcePortName": "result",
          "targetNodeId": "1774723576422-ymwm3gw7t",
          "targetPortName": "a",
          "dataType": "any"
        },
        {
          "id": "1774723720917-sokvacueb",
          "sourceNodeId": "1774373708548-33awhv1w9",
          "sourcePortName": "result",
          "targetNodeId": "1774723717582-c69ygbkv6",
          "targetPortName": "a",
          "dataType": "any"
        },
        {
          "id": "1774723745645-ylizrb93f",
          "sourceNodeId": "1774723717582-c69ygbkv6",
          "sourcePortName": "result",
          "targetNodeId": "1774373328950-ci04z140f",
          "targetPortName": "xB",
          "dataType": "any"
        },
        {
          "id": "1774723748685-lsiani6du",
          "sourceNodeId": "1774723576422-ymwm3gw7t",
          "sourcePortName": "result",
          "targetNodeId": "1774373328950-ci04z140f",
          "targetPortName": "yB",
          "dataType": "any"
        },
        {
          "id": "1774723898885-8vygy5whb",
          "sourceNodeId": "1774483164337-w3kxix66b",
          "sourcePortName": "value",
          "targetNodeId": "1774483400844-6uw8vg07y",
          "targetPortName": "b",
          "dataType": "any"
        },
        {
          "id": "1774723900892-1rxvo9vwe",
          "sourceNodeId": "1774483164337-w3kxix66b",
          "sourcePortName": "value",
          "targetNodeId": "1774373708548-33awhv1w9",
          "targetPortName": "b",
          "dataType": "any"
        },
        {
          "id": "1774726320947-h22ajdm2e",
          "sourceNodeId": "1774483197978-i0rjzvncd",
          "sourcePortName": "value",
          "targetNodeId": "1774726275748-1ztl8ud4a",
          "targetPortName": "a",
          "dataType": "any"
        },
        {
          "id": "1774726474827-61oaaoan2",
          "sourceNodeId": "1774726275748-1ztl8ud4a",
          "sourcePortName": "result",
          "targetNodeId": "1774483400844-6uw8vg07y",
          "targetPortName": "a",
          "dataType": "any"
        },
        {
          "id": "1774726497586-46pseijxn",
          "sourceNodeId": "1774483197978-i0rjzvncd",
          "sourcePortName": "value",
          "targetNodeId": "1774722241184-vk82f1ppz",
          "targetPortName": "list",
          "dataType": "any"
        },
        {
          "id": "1775655551460-hn5wdqo0d",
          "sourceNodeId": "1774722241184-vk82f1ppz",
          "sourcePortName": "index",
          "targetNodeId": "1774373708548-33awhv1w9",
          "targetPortName": "a",
          "dataType": "numeric"
        }
      ],
      "previewEnabled": [
        "1774373101910-2mu0dcsk2"
      ],
      "metadata": {
        "version": "1.0",
        "exportDate": "2026-04-08T13:52:54.178Z",
        "nodeCount": 29,
        "connectionCount": 27
      }
    }
  }
]
