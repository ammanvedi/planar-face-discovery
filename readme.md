# Planar Graph Face Discovery

## About

Given graph with the following properties;

1. The graph is [undirected](https://en.wikipedia.org/wiki/Graph_(discrete_mathematics)#Graph)
2. The graph is [planar](https://en.wikipedia.org/wiki/Graph_(discrete_mathematics)#Planar_graph)
3. Each vertex in the graph has a defined (x,y) position

enumerate all of the faces of the graph. Can also be described as finding all of the polygons within the graph, or the minimum cycle basis.

That is from the following;

![](https://i.imgur.com/z7P8Qfj.png)

Determine the following closed regions;

![](https://i.imgur.com/raDGey9.png)

### Installation

```bash
npm install --save planar-face-discovery
```


## Usage

## 1. PlanarFaceTree
This exposes the raw algorithm to find the faces of the graph.

### Input

```typescript
import { PlanarFaceTree } from "planar-face-discovery";

const solver = new PlanarFaceTree();

/**
 * Each node is defined by its [X,Y] position.
 * The coordinate system is oriented as such
 * 
 *  +y
 *   |
 *   |
 *   |
 *   |__________ +x
 *   
 * That is you should have your nodes exist in positive
 * XY space only, negative positions are not allowed.
 * 
 * The index in the array defines the nodes "id"
 */
const nodes: Array<[number, number]> = []

/**
 * Edges are defined by [source id, target id]
 */
const edges: Array<[number, number]> = []

const result = solver.discover(nodes, edges)

```

#### Output

The output of the algorithm is a set of trees, aptly named a "forest". Each tree will contain a cycle and/or child cycles

Trees can be converted to JSON via their toJSON method, an example output will look like

```json
[
    {
        "cycle": [],
        "children": [
            {
                "cycle": [0, 1, 3, 0],
                "children": []
            },
            {
                "cycle": [1, 2, 3, 1],
                "children": []
            }
        ]
    }
]
```

With the cycle indicating the path of vertices for each enclosed shape or "face"

### 2. getAreaTree
Get the faces formed by the graph in a tree structure where each has an area 
attached which is calculated exclusive of the areas of its children.

The nodes and edges values are the same as described for `PlanarFaceTree`

```typescript
import { getAreaTree } from "planar-face-discovery";

const result = getAreaTree(nodes, edges)

```

#### Output

```JSON
{
  "type": "ROOT",
  "children": [
    {
      "type": "CHILD",
      "polygonIndex": 1,
      "area": {
        "total": 100,
        "withoutChildren": 40
      },
      "polygon": [
        1,
        4,
        5,
        7
      ],
      "children": [...]
    }
  ]
}
```

## Acknowledgement 

This module is a typescript port of the algorithm found in the [Geometric Tools C++ library](https://www.geometrictools.com/).

You can find a [fantastic paper](https://www.geometrictools.com/Documentation/MinimalCycleBasis.pdf) that explains the algorithm in detail in their [documentation](https://www.geometrictools.com/Documentation/Documentation.html)

You can also find this paper and a reference implementation from the library in the reference directory. The document may change in future so the versions stored in this repo are the ones that were used to write the code. 

The implementation has been kept as close as possible to the original.

## License

The original algorithm and by extension this code are released under the [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/)