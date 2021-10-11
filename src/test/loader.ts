import * as fs from 'fs';
import * as parser from 'fast-xml-parser';
import { InputEdges, InputNodes } from '../planar-face-tree';

type GraphMLResult = {
    graphml: {
        graph: {
            node: Array<{
                positionX: number;
                positionY: number;
                id: number;
            }>;
            edge: Array<{
                source: number;
                target: number;
            }>;
        };
    };
};

/**
 * graphML will define vertexes at positions with y axis growing
 * downwards. we need the y axis to grow upwards for the algorithm
 * so here we adjust this
 */
export const fixCoordinateSystem = (g: GraphMLResult): GraphMLResult => {
    if (g.graphml.graph.node && !Array.isArray(g.graphml.graph.node)) {
        g.graphml.graph.node = [g.graphml.graph.node];
    }

    if (g.graphml.graph.edge && !Array.isArray(g.graphml.graph.edge)) {
        g.graphml.graph.edge = [g.graphml.graph.edge];
    }

    const greatestYValue = g.graphml.graph.node.reduce<number>((max, node) => {
        if (node.positionY > max) {
            return node.positionY;
        }
        return max;
    }, -Infinity);

    return {
        ...g,
        graphml: {
            ...g.graphml,
            graph: {
                ...g.graphml.graph,
                node: g.graphml.graph.node.map((node) => ({
                    ...node,
                    positionY: greatestYValue - node.positionY,
                })),
            },
        },
    };
};

export const loadGraphML = (path: string): GraphMLResult => {
    const data = fs.readFileSync(path, { encoding: 'utf-8' });
    const parserResult = parser.parse(data.toString(), {
        ignoreAttributes: false,
        attributeNamePrefix: '',
        // @ts-ignore
        attrValueProcessor: (val, attrName) => {
            switch (attrName) {
                case 'positionX':
                case 'positionY':
                    return parseFloat(val);
                case 'id':
                case 'source':
                case 'target':
                    return parseInt(val);
            }

            return val;
        },
    });

    const result = fixCoordinateSystem(parserResult);

    return result as GraphMLResult;
};

export const getAlgorithmInputs = (g: GraphMLResult): [InputNodes, InputEdges] => {
    return [
        g.graphml.graph.node.map((n) => [n.positionX, n.positionY]),
        (g.graphml.graph.edge || []).map((e) => [e.source, e.target]),
    ];
};
