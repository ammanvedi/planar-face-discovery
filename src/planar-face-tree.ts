/**
 * This code is adapted from the Geometric Tools Library
 *
 * "Constructing a Cycle Basis for a Planar Graph"
 *
 * https://www.geometrictools.com/
 *
 * You can find the original listing here
 * https://www.geometrictools.com/GTE/Mathematics/MinimalCycleBasis.h
 *
 * And the paper explaining the method can be found here
 * https://www.geometrictools.com/Documentation/MinimalCycleBasis.pdf
 *
 * Thank you to David Eberly and the Geometric Tools team for a
 * wonderful algorithm
 */

export type Position = [number, number];

/**
 * We input nodes as a pair of values indicating the x and y position
 */
export type InputNode = Position;

/**
 * The index of the node in the array gives its ID
 */
export type InputNodes = Array<InputNode>;

/**
 * we input edges as a pair of number indicating the
 * source and destination of the edge
 */
export type InputEdge = [number, number];

export type InputEdges = Array<InputEdge>;

export type TreeJSON = {
    cycle: Array<number>;
    children: Array<TreeJSON>;
};

export class CycleTree {
    constructor(
        public cycle: Array<number>,
        public children: CycleTreeForest,
    ) {}

    public isEmpty(): boolean {
        return this.cycle.length === 0 && this.children.length === 0;
    }

    public toJSON(): TreeJSON {
        return JSON.parse(
            JSON.stringify({
                cycle: [...this.cycle],
                children: this.children.map((c) => c.toJSON()),
            }),
        );
    }
}

export type CycleTreeForest = Array<CycleTree>;

/**
 * The original code leverages c++ pointers a lot, to maintain the original
 * essence of it define a wrappable reference type.
 *
 * The idea behind this implementation is to NOT diverge from the C++
 * implementation
 */
type Reference<T> = { value: T };

class Vertex {
    visited: 0 | 1 | 2 = 0;
    adjacent: Set<Vertex> = new Set<Vertex>();

    constructor(public name: number, public position: Position) {}
}

export enum DiscoveryResultType {
    ERROR = 'ERROR',
    RESULT = 'RESULT',
}

export enum DiscoveryErrorCode {
    INVALID_COORDINATE_SYSTEM = 'INVALID_COORDINATE_SYSTEM',
    EDGE_ENDPOINT_OUT_OF_BOUNDS = 'EDGE_ENDPOINT_OUT_OF_BOUNDS',
    VERTICES_HAVE_SAME_POSITION = 'VERTICES_HAVE_SAME_POSITION',
    DUPLICATE_EDGE_FOUND = 'DUPLICATE_EDGE_FOUND',
    GRAPH_EMPTY = 'GRAPH_EMPTY',
}

export type DiscoveryResult = {
    type: DiscoveryResultType.RESULT;
    forest: CycleTreeForest;
};

export type DiscoveryError = {
    type: DiscoveryResultType.ERROR;
    reason: DiscoveryErrorCode;
};

export class PlanarFaceTree {
    vertexStore: Array<Vertex> = [];

    public discover(
        positions: InputNodes,
        edges: InputEdges,
    ): DiscoveryResult | DiscoveryError {
        const forest: CycleTreeForest = [];

        const validationError = PlanarFaceTree.validateInputs(positions, edges);

        if (validationError) {
            return validationError;
        }

        /**
         * Build vertex objects only for the vertices that are
         * involved in the passed edges
         */
        const unique = new Map<number, Vertex>();
        edges.forEach((edge) => {
            for (let i = 0; i < 2; i++) {
                const name = edge[i];
                if (!unique.has(name)) {
                    const vertex = new Vertex(name, positions[name]);
                    unique.set(name, vertex);
                }
            }
        });

        const vertices: Array<Vertex> = [];
        Array.from(unique.entries()).forEach(([_, vertex]) => {
            this.vertexStore.push(vertex);
            vertices.push(vertex);
        });

        /**
         * If the edges that we are given are directed
         * this step will create an adjacency matrix which
         * is undirected. It uses a set so even if
         * we end up passing an undirected set of edges
         * it will still be fine and avoid duplicates
         */
        edges.forEach((edge) => {
            const iter0 = unique.get(edge[0]);
            const iter1 = unique.get(edge[1]);

            if (iter0 && iter1) {
                iter0.adjacent.add(iter1);
                iter1.adjacent.add(iter0);
            }
        });

        /**
         * get the connected components of the graph
         *
         * visited values are
         *
         * 0 -> unvisited (initial)
         * 1 -> discovered
         * 2 -> finished
         */

        const components: Array<Reference<Array<Vertex>>> = [];
        this.vertexStore.forEach((vInitial) => {
            if (vInitial.visited === 0) {
                components.push({ value: [] });
                PlanarFaceTree.depthFirstSearch(
                    vInitial,
                    components[components.length - 1],
                );
            }
        });

        /**
         * we must reset the visited values because we will be doing another
         * depth first search later
         */
        this.vertexStore.forEach((vertex) => {
            vertex.visited = 0;
        });

        components.forEach((component) => {
            forest.push(this.extractBasis(component));
        });

        return {
            type: DiscoveryResultType.RESULT,
            forest: forest.filter((t) => !t.isEmpty()),
        };
    }

    private static validateInputs(
        positions: InputNodes,
        edges: InputEdges,
    ): DiscoveryError | null {
        if (positions.length === 0 || edges.length === 0) {
            return {
                type: DiscoveryResultType.ERROR,
                reason: DiscoveryErrorCode.GRAPH_EMPTY,
            };
        }

        const posKeys = new Set<string>();
        for (let j = 0; j < positions.length; j++) {
            const position = positions[j];

            const key = `${position[0]}->${position[1]}`;

            if (posKeys.has(key)) {
                return {
                    type: DiscoveryResultType.ERROR,
                    reason: DiscoveryErrorCode.VERTICES_HAVE_SAME_POSITION,
                };
            }

            posKeys.add(key);

            if (position[0] < 0 || position[1] < 0) {
                return {
                    type: DiscoveryResultType.ERROR,
                    reason: DiscoveryErrorCode.INVALID_COORDINATE_SYSTEM,
                };
            }
        }

        const edgeKeys = new Set<string>();
        const maxNodeValue = positions.length - 1;
        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i];

            const key = `${edge[0]}->${edge[1]}`;
            if (edgeKeys.has(key)) {
                return {
                    type: DiscoveryResultType.ERROR,
                    reason: DiscoveryErrorCode.DUPLICATE_EDGE_FOUND,
                };
            }

            edgeKeys.add(key);

            if (
                edge[0] < 0 ||
                edge[0] > maxNodeValue ||
                edge[1] < 0 ||
                edge[1] > maxNodeValue
            ) {
                return {
                    type: DiscoveryResultType.ERROR,
                    reason: DiscoveryErrorCode.EDGE_ENDPOINT_OUT_OF_BOUNDS,
                };
            }
        }

        return null;
    }

    private static depthFirstSearch(
        vInitial: Vertex,
        component: Reference<Array<Vertex>>,
    ) {
        const vStack: Array<Vertex> = [];
        vStack.push(vInitial);
        while (vStack.length > 0) {
            const vertex: Vertex = vStack[vStack.length - 1];
            vertex.visited = 1;
            let i = 0;
            const adjacents = Array.from(vertex.adjacent.values());

            for (let j = 0; j < adjacents.length; j++) {
                const adjacent = adjacents[i];

                if (adjacent && adjacent.visited === 0) {
                    vStack.push(adjacent);
                    break;
                }

                ++i;
            }

            if (i === vertex.adjacent.size) {
                vertex.visited = 2;
                component.value.push(vertex);
                vStack.pop();
            }
        }
    }

    private static extractCycle(
        closedWalk: Reference<Array<Vertex>>,
    ): Array<number> {
        const numVertices = closedWalk.value.length;
        const cycle: Array<number> = [];
        for (let i = 0; i < numVertices; ++i) {
            cycle[i] = closedWalk.value[i].name;
        }

        let v0: Vertex = closedWalk.value[0];
        let v1: Vertex = closedWalk.value[1];
        let vBranch: Vertex | null = v0.adjacent.size > 2 ? v0 : null;

        v0.adjacent.delete(v1);
        v1.adjacent.delete(v0);

        while (v1 !== vBranch && v1.adjacent.size === 1) {
            const adj: Vertex = Array.from(v1.adjacent)[0];
            v1.adjacent.delete(adj);
            adj.adjacent.delete(v1);
            v1 = adj;
        }

        if (v1 !== v0) {
            vBranch = v1;

            while (v0 !== vBranch && v0.adjacent.size === 1) {
                v1 = Array.from(v0.adjacent)[0];
                v0.adjacent.delete(v1);
                v1.adjacent.delete(v0);
                v0 = v1;
            }
        }

        return cycle;
    }

    private extractBasis(component: Reference<Array<Vertex>>): CycleTree {
        const tree = new CycleTree([], []);

        while (component.value.length > 0) {
            this.removeFilaments(component);
            if (component.value.length > 0) {
                tree.children.push(this.extractCycleFromComponent(component));
            }
        }

        /**
         * If we have only one child and no cycle, then there is no point in
         * the intermediate tree, so just copy its properties to the parent
         *
         * Worth noting that in reality the parent "tree" will never have a
         * cycle set
         */
        if (tree.cycle.length === 0 && tree.children.length === 1) {
            const child = tree.children[tree.children.length - 1];
            tree.cycle = child.cycle;
            tree.children = child.children;
        }

        return tree;
    }

    private removeFilaments(component: Reference<Array<Vertex>>): void {
        /**
         * Finding filaments begins with finding vertices which only attach to
         * one other vertex.
         *
         * If you think about it these are like orphan vertices, we can
         * guarantee that these vertices are not part of any cycle since
         * then they would connect to >= 2 vertices
         *
         * So they must be part of a filament
         */
        const endpoints: Array<Vertex> = [];
        component.value.forEach((vertex) => {
            if (vertex.adjacent.size === 1) {
                endpoints.push(vertex);
            }
        });

        if (endpoints.length > 0) {
            endpoints.forEach((v) => {
                if (v.adjacent.size === 1) {
                    let vertex = v;
                    while (vertex.adjacent.size === 1) {
                        /**
                         * Here we traverse along the filament and delete each
                         * vertex along the way
                         *                                 v4
                         *                               /
                         *  v0 <---> v1 <---> v2 <---> v3
                         *                              \
                         *                                v5
                         *
                         * i.e we keep deleting from v0 until v3
                         */
                        const adjacent = Array.from(
                            vertex.adjacent.values(),
                        )[0];
                        /**
                         * Delete the edge in both directions since we assume
                         * an undirected graph
                         */
                        adjacent.adjacent.delete(vertex);
                        vertex.adjacent.delete(adjacent);

                        vertex = adjacent;
                    }
                }
            });

            /**
             * either the component is empty at this point (it was all filaments)
             * or it has no filaments and >= 1 cycle.
             *
             * Above all we have removed is verices
             */
            const remaining: Array<Vertex> = [];
            // TODO .filter
            component.value.forEach((vertex) => {
                if (vertex.adjacent.size > 0) {
                    remaining.push(vertex);
                }
            });
            component.value = remaining;
        }
    }

    private extractCycleFromComponent(
        component: Reference<Array<Vertex>>,
    ): CycleTree {
        /**
         * Find left most vertex of component, ie. the one
         * with the least x value
         */
        let minVertex = component.value[0];
        component.value.forEach((vertex) => {
            /**
             * if x values match then choose the vertex with
             * least y value
             */
            if (vertex.position[0] === minVertex.position[0]) {
                if (vertex.position[1] < minVertex.position[1]) {
                    minVertex = vertex;
                }
            }

            if (vertex.position[0] < minVertex.position[0]) {
                minVertex = vertex;
            }
        });

        /**
         * Traverse the closed walk, duplicating the start vertex
         * as the end vertex
         */
        const closedWalk: Reference<Array<Vertex>> = { value: [] };
        let vCurr = minVertex;
        const vStart = vCurr;
        closedWalk.value.push(vStart);
        let vAdj = this.getClockwiseMost(null, vStart);

        while (vAdj !== vStart) {
            closedWalk.value.push(vAdj);
            const vNext: Vertex = this.getCounterClockwiseMost(vCurr, vAdj);
            vCurr = vAdj;
            vAdj = vNext;
        }
        closedWalk.value.push(vStart);

        const tree: CycleTree = this.extractCycleFromClosedWalk(closedWalk);

        /**
         * Cycle removal may also leave orphan vertexes, vertexes with
         * no adjacent vertices. We need to remove these
         */
        const remaining: Array<Vertex> = [];
        component.value.forEach((vertex) => {
            if (vertex.adjacent.size > 0) {
                remaining.push(vertex);
            }
        });

        component.value = remaining;
        return tree;
    }

    private extractCycleFromClosedWalk(
        closedWalk: Reference<Array<Vertex>>,
    ): CycleTree {
        const tree = new CycleTree([], []);

        const duplicates = new Map<Vertex, number>();
        const detachments = new Set<number>();
        let numClosedWalk: number = closedWalk.value.length;

        for (let i = 1; i < numClosedWalk - 1; ++i) {
            const diter = duplicates.get(closedWalk.value[i]) || null;
            if (diter === null) {
                duplicates.set(closedWalk.value[i], i);
                continue;
            }

            const iMin: number = diter;
            const iMax: number = i;
            detachments.add(iMin);
            for (let j = iMin + 1; j < iMax; ++j) {
                const vertex: Vertex = closedWalk.value[j];
                duplicates.delete(vertex);
                detachments.delete(j);
            }
            // TODO - Could be a problem here if my iterator understandinng is wrong
            const startDeletionAt = iMin + 1;
            const endDeletionAt = iMax + 1;
            const deleteCount = endDeletionAt - startDeletionAt;
            closedWalk.value.splice(startDeletionAt, deleteCount);
            numClosedWalk = closedWalk.value.length;
            i = iMin;
        }

        if (numClosedWalk > 3) {
            detachments.add(0);
            detachments.forEach((i) => {
                const original: Vertex = closedWalk.value[i];
                const maxVertex: Vertex = closedWalk.value[i + 1];
                const minVertex =
                    i > 0
                        ? closedWalk.value[i - 1]
                        : closedWalk.value[numClosedWalk - 2];

                const dMin: [number, number] = [0, 0];
                const dMax: [number, number] = [0, 0];

                for (let j = 0; j < 2; ++j) {
                    dMin[j] = minVertex.position[j] - original.position[j];
                    dMax[j] = maxVertex.position[j] - original.position[j];
                }

                const isConvex: boolean =
                    dMax[0] * dMin[1] >= dMax[1] * dMin[0];

                const inWedge = new Set<Vertex>();
                const adjacent: Set<Vertex> = original.adjacent;

                adjacent.forEach((vertex) => {
                    if (
                        vertex.name === minVertex.name ||
                        vertex.name === maxVertex.name
                    ) {
                        return;
                    }

                    const dVer: [number, number] = [0, 0];

                    for (let j = 0; j < 2; ++j) {
                        dVer[j] = vertex.position[j] - original.position[j];
                    }

                    let containsVertex = false;

                    if (isConvex) {
                        containsVertex =
                            dVer[0] * dMin[1] > dVer[1] * dMin[0] &&
                            dVer[0] * dMax[1] < dVer[1] * dMax[0];
                    } else {
                        containsVertex =
                            dVer[0] * dMin[1] > dVer[1] * dMin[0] ||
                            dVer[0] * dMax[1] < dVer[1] * dMax[0];
                    }

                    if (containsVertex) {
                        inWedge.add(vertex);
                    }
                });

                if (inWedge.size > 0) {
                    const clone = new Vertex(original.name, [
                        ...original.position,
                    ]);
                    this.vertexStore.push(clone);

                    inWedge.forEach((vertex) => {
                        original.adjacent.delete(vertex);
                        vertex.adjacent.delete(original);
                        clone.adjacent.add(vertex);
                        vertex.adjacent.add(clone);
                    });

                    const component: Reference<Array<Vertex>> = {
                        value: [],
                    };

                    PlanarFaceTree.depthFirstSearch(clone, component);

                    tree.children.push(this.extractBasis(component));
                }
            });

            tree.cycle = PlanarFaceTree.extractCycle(closedWalk);
        } else {
            const original = closedWalk.value[0];
            const adjacent = closedWalk.value[1];

            const clone = new Vertex(original.name, [...original.position]);
            this.vertexStore.push(clone);

            original.adjacent.delete(adjacent);
            adjacent.adjacent.delete(original);
            clone.adjacent.add(adjacent);
            adjacent.adjacent.add(clone);

            const component: Reference<Array<Vertex>> = { value: [] };
            PlanarFaceTree.depthFirstSearch(clone, component);
            tree.children.push(this.extractBasis(component));

            if (tree.cycle.length === 0 && tree.children.length === 1) {
                const child = tree.children[tree.children.length - 1];
                tree.cycle = child.cycle;
                tree.children = child.children;
            }
        }

        return tree;
    }

    private getClockwiseMost(vPrev: Vertex | null, vCurr: Vertex): Vertex {
        let vNext: Vertex | null = null;
        let vCurrConvex = false;
        const dCurr: [number, number] = [0, 0];
        let dNext: [number, number] = [0, 0];

        if (vPrev) {
            dCurr[0] = vCurr.position[0] - vPrev.position[0];
            dCurr[1] = vCurr.position[1] - vPrev.position[1];
        } else {
            dCurr[0] = 0;
            dCurr[1] = -1;
        }

        vCurr.adjacent.forEach((vAdj) => {
            if (vAdj === vPrev) {
                return;
            }

            const dAdj: [number, number] = [
                vAdj.position[0] - vCurr.position[0],
                vAdj.position[1] - vCurr.position[1],
            ];

            if (!vNext) {
                vNext = vAdj;
                dNext = dAdj;
                vCurrConvex = dNext[0] * dCurr[1] <= dNext[1] * dCurr[0];
                return;
            }

            if (vCurrConvex) {
                if (
                    dCurr[0] * dAdj[1] < dCurr[1] * dAdj[0] ||
                    dNext[0] * dAdj[1] < dNext[1] * dAdj[0]
                ) {
                    vNext = vAdj;
                    dNext = dAdj;
                    vCurrConvex = dNext[0] * dCurr[1] <= dNext[1] * dCurr[0];
                }
            } else {
                if (
                    dCurr[0] * dAdj[1] < dCurr[1] * dAdj[0] &&
                    dNext[0] * dAdj[1] < dNext[1] * dAdj[0]
                ) {
                    vNext = vAdj;
                    dNext = dAdj;
                    vCurrConvex = dNext[0] * dCurr[1] < dNext[1] * dCurr[0];
                }
            }
        });

        return vNext as unknown as Vertex;
    }

    private getCounterClockwiseMost(
        vPrev: Vertex | null,
        vCurr: Vertex,
    ): Vertex {
        let vNext: Vertex | null = null;
        let vCurrConvex = false;
        const dCurr: [number, number] = [0, 0];
        let dNext: [number, number] = [0, 0];

        if (vPrev) {
            dCurr[0] = vCurr.position[0] - vPrev.position[0];
            dCurr[1] = vCurr.position[1] - vPrev.position[1];
        } else {
            dCurr[0] = 0;
            dCurr[1] = -1;
        }

        vCurr.adjacent.forEach((vAdj) => {
            if (vAdj === vPrev) {
                return;
            }

            const dAdj: [number, number] = [
                vAdj.position[0] - vCurr.position[0],
                vAdj.position[1] - vCurr.position[1],
            ];

            if (!vNext) {
                vNext = vAdj;
                dNext = dAdj;
                vCurrConvex = dNext[0] * dCurr[1] <= dNext[1] * dCurr[0];
                return;
            }

            if (vCurrConvex) {
                if (
                    dCurr[0] * dAdj[1] > dCurr[1] * dAdj[0] &&
                    dNext[0] * dAdj[1] > dNext[1] * dAdj[0]
                ) {
                    vNext = vAdj;
                    dNext = dAdj;
                    vCurrConvex = dNext[0] * dCurr[1] <= dNext[1] * dCurr[0];
                }
            } else {
                if (
                    dCurr[0] * dAdj[1] > dCurr[1] * dAdj[0] ||
                    dNext[0] * dAdj[1] > dNext[1] * dAdj[0]
                ) {
                    vNext = vAdj;
                    dNext = dAdj;
                    vCurrConvex = dNext[0] * dCurr[1] <= dNext[1] * dCurr[0];
                }
            }
        });

        return vNext as unknown as Vertex;
    }
}
