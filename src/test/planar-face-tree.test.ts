import { getAlgorithmInputs, loadGraphML } from './loader';
import { join } from 'path';
import {
    DiscoveryError,
    InputEdges,
    InputNodes,
    PlanarFaceTree,
    TreeJSON,
} from '../planar-face-tree';

// Generate graphml at https://graphonline.ru/en/?graph=Planar

export const getGMLFilePath = (file: string): string => {
    return join(__dirname, 'fixtures', file);
}

export const getResultFromFile = (graphFileName: string): Array<TreeJSON> | DiscoveryError => {
    const file = getGMLFilePath(graphFileName)
    const [nodes, edges] = getAlgorithmInputs(loadGraphML(file));
    return getResultFromInput(nodes, edges);
};

export const getResultFromInput = (
    nodes: InputNodes,
    edges: InputEdges,
): Array<TreeJSON> | DiscoveryError => {
    const solver = new PlanarFaceTree();
    const result = solver.discover(nodes, edges);

    return result.type === 'RESULT' ? result.forest.map((t) => t.toJSON()) : result;
};

describe('Planar Face Discovery', () => {
    describe('When passed a planar graph with faces', () => {
        it('should return the correct result from graph g1', () => {
            expect(getResultFromFile('g1.graphml')).toEqual([
                {
                    cycle: [],
                    children: [
                        {
                            cycle: [1, 2, 5, 0, 1],
                            children: [],
                        },
                        {
                            cycle: [7, 8, 9, 7],
                            children: [],
                        },
                        {
                            cycle: [8, 18, 17, 16, 9, 8],
                            children: [],
                        },
                        {
                            cycle: [17, 18, 19, 17],
                            children: [],
                        },
                        {
                            cycle: [18, 20, 21, 22, 18],
                            children: [
                                {
                                    cycle: [23, 24, 25, 23],
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
                {
                    cycle: [10, 11, 12, 10],
                    children: [],
                },
            ]);
        });
    });

    describe('when passed a graph with only a single node', () => {
        it('should return a graph empty error', () => {
            const res = getResultFromFile('g2.graphml');
            expect(res).toEqual({
                type: 'ERROR',
                reason: 'GRAPH_EMPTY',
            });
        });
    });

    describe('when passed a graph with only two nodes connected by an edge', () => {
        it('should return and empty array', () => {
            const res = getResultFromFile('g3.graphml');
            expect(res).toEqual([]);
        });
    });

    describe('when passed a graph with only filaments and no faces', () => {
        it('should return an empty array', () => {
            const res = getResultFromFile('g4.graphml');
            expect(res).toEqual([]);
        });
    });

    describe('when passed a graph with 2 simple faces', () => {
        it('should return the correct result', () => {
            const res = getResultFromFile('g5.graphml');
            expect(res).toEqual([
                {
                    cycle: [],
                    children: [
                        {
                            cycle: [0, 1, 3, 0],
                            children: [],
                        },
                        {
                            cycle: [1, 2, 3, 1],
                            children: [],
                        },
                    ],
                },
            ]);
        });
    });

    describe('when passed a graph with 1 simple face and a filament', () => {
        it('should return the correct result', () => {
            const res = getResultFromFile('g6.graphml');
            expect(res).toEqual([
                {
                    cycle: [6, 7, 9, 2, 4, 5, 6],
                    children: [],
                },
            ]);
        });
    });

    describe('when passed a graph with nested and detached faces', () => {
        it('should return the correct result', () => {
            const res = getResultFromFile('g7.graphml');
            expect(res).toEqual([
                {
                    cycle: [0, 1, 2, 3, 0],
                    children: [],
                },
                {
                    cycle: [],
                    children: [
                        {
                            cycle: [10, 7, 8, 6, 5, 4, 10],
                            children: [],
                        },
                        {
                            cycle: [8, 7, 9, 6, 8],
                            children: [],
                        },
                        {
                            cycle: [7, 13, 14, 12, 9, 7],
                            children: [],
                        },
                    ],
                },
            ]);
        });
    });

    describe('when passed a graph with nested faces', () => {
        it('should return the correct result', () => {
            const res = getResultFromFile('g8.graphml');
            expect(res).toEqual([
                {
                    cycle: [2, 3, 1, 0, 2],
                    children: [],
                },
                {
                    cycle: [6, 5, 7, 4, 6],
                    children: [],
                },
            ]);
        });
    });

    describe('when passed a graph with nested faces connected by filament', () => {
        it('should return the correct result', () => {
            const res = getResultFromFile('g9.graphml');
            expect(res).toEqual([
                {
                    cycle: [2, 3, 1, 0, 2],
                    children: [
                        {
                            cycle: [6, 5, 7, 4, 6],
                            children: [],
                        },
                    ],
                },
            ]);
        });
    });

    describe('when passed a graph that has an edge with a negative position', () => {
        it('should return INVALID_COORDINATE_SYSTEM error', () => {
            expect(
                getResultFromInput(
                    [
                        [20, 400],
                        [100, -1],
                        [50, 50],
                    ],
                    [
                        [0, 1],
                        [1, 0],
                        [1, 2],
                        [2, 1],
                        [2, 0],
                        [0, 2],
                    ],
                ),
            ).toEqual({
                type: 'ERROR',
                reason: 'INVALID_COORDINATE_SYSTEM',
            });
        });
    });

    describe('when passed a graph that has an edge referencing a non existent vertex', () => {
        describe('when the vertex index is too high', () => {
            it('should return EDGE_ENDPOINT_OUT_OF_BOUNDS error', () => {
                expect(
                    getResultFromInput(
                        [
                            [20, 400],
                            [100, 100],
                            [50, 50],
                        ],
                        [
                            [0, 1],
                            [1, 0],
                            [1, 2],
                            [2, 1],
                            [2, 3],
                            [0, 2],
                        ],
                    ),
                ).toEqual({
                    type: 'ERROR',
                    reason: 'EDGE_ENDPOINT_OUT_OF_BOUNDS',
                });
            });
        });

        describe('when the vertex index is too low', () => {
            it('should return EDGE_ENDPOINT_OUT_OF_BOUNDS error', () => {
                expect(
                    getResultFromInput(
                        [
                            [20, 400],
                            [100, 100],
                            [50, 50],
                        ],
                        [
                            [0, 1],
                            [1, 0],
                            [1, 2],
                            [2, 1],
                            [2, -1],
                            [0, 2],
                        ],
                    ),
                ).toEqual({
                    type: 'ERROR',
                    reason: 'EDGE_ENDPOINT_OUT_OF_BOUNDS',
                });
            });
        });
    });

    describe('when passed a graph that has two distinct vertices with the same position', () => {
        it('should return VERTICES_HAVE_SAME_POSITION error', () => {
            expect(
                getResultFromInput(
                    [
                        [100, 100],
                        [100, 100],
                        [50, 50],
                    ],
                    [
                        [0, 1],
                        [1, 0],
                        [1, 2],
                        [2, 1],
                        [2, 0],
                        [0, 2],
                    ],
                ),
            ).toEqual({
                type: 'ERROR',
                reason: 'VERTICES_HAVE_SAME_POSITION',
            });
        });
    });

    describe('when passed a graph that has two distinct edges that reference the same endpoints', () => {
        it('should return DUPLICATE_EDGE_FOUND error', () => {
            expect(
                getResultFromInput(
                    [
                        [10, 30],
                        [100, 100],
                        [50, 50],
                    ],
                    [
                        [0, 1],
                        [1, 0],
                        [1, 0],
                        [1, 2],
                        [2, 1],
                        [2, 0],
                        [0, 2],
                    ],
                ),
            ).toEqual({
                type: 'ERROR',
                reason: 'DUPLICATE_EDGE_FOUND',
            });
        });
    });

    describe('when passed an empty graph', () => {
        it('should return GRAPH_EMPTY error', () => {
            expect(getResultFromInput([], [])).toEqual({
                type: 'ERROR',
                reason: 'GRAPH_EMPTY',
            });
        });
    });
});
