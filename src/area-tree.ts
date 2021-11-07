import {
    CycleTreeForest,
    DiscoveryError,
    InputEdges,
    InputNodes,
    PlanarFaceTree,
} from './planar-face-tree';
import {
    allPointsLieOnBoundary,
    getLinePath,
    getPointPath,
    getPolygonArea,
    InputPolygon,
    isInside,
} from './geometry';

export enum AreaTreeType {
    CHILD = 'CHILD',
    ROOT = 'ROOT',
}

export type AreaTreeRoot = {
    type: AreaTreeType.ROOT;
    children: Array<AreaTreeChild>;
};

export type AreaTreeChild = {
    type: AreaTreeType.CHILD;
    polygonIndex: number;
    area: {
        total: number;
        withoutChildren: number;
    };
    children: Array<AreaTreeChild>;
    polygon: Array<number>;
};

export type AreaTree = AreaTreeChild | AreaTreeRoot;

export type Polygon = {
    id: number;
    visited: boolean;
    area: number;
} & InputPolygon;

const isChildArea = (
    childPolygon: Polygon,
    parent: AreaTreeChild,
    polygons: Array<Polygon>,
    nodes: InputNodes,
): boolean => {
    const parentPointPath = getPointPath(
        nodes,
        polygons[parent.polygonIndex].edges,
    );
    const currentPolygonPointPath = getPointPath(nodes, childPolygon.edges);
    const pointOnCurrentPolygon = currentPolygonPointPath[0];

    const currentInsideParent = isInside(
        nodes,
        pointOnCurrentPolygon,
        parentPointPath,
    );
    const currentLiesCompletelyOnBoundaryOfParent = allPointsLieOnBoundary(
        currentPolygonPointPath,
        getLinePath(parentPointPath),
    );

    /**
     * If the polygon exists completely on the boundary of the parent shape then
     * it will be accounted for separately by the planar face discovery so we need
     * to exclude it from here
     */
    return currentInsideParent && !currentLiesCompletelyOnBoundaryOfParent;
};

const traverseAreas = (
    nodes: InputNodes,
    polygons: Array<Polygon>,
    parent: AreaTree = { type: AreaTreeType.ROOT, children: [] },
    pointer = 0,
): AreaTree => {
    for (let i = pointer; i < polygons.length; i++) {
        const p = polygons[i];

        if (p.visited) {
            continue;
        }

        const isRoot = parent.type === AreaTreeType.ROOT;

        if (isRoot || isChildArea(p, parent, polygons, nodes)) {
            const newTree: AreaTreeChild = {
                type: AreaTreeType.CHILD,
                area: {
                    total: p.area,
                    withoutChildren: p.area,
                },
                polygonIndex: i,
                polygon: p.edges,
                children: [],
            };
            p.visited = true;

            parent.children.push(newTree);

            if (parent.type === AreaTreeType.CHILD) {
                parent.area.withoutChildren =
                    parent.area.withoutChildren - p.area;
            }

            if (polygons[i + 1]) {
                traverseAreas(nodes, polygons, newTree, i + 1);
            }
        }
    }

    return parent;
};

const buildNestingTree = (
    nodes: InputNodes,
    polygons: Array<InputPolygon>,
): AreaTree => {
    const inputPolygons = polygons
        .map((p, ix) => ({
            ...p,
            id: ix,
            visited: false,
            area: getPolygonArea(nodes, p),
        }))
        .sort((a, b) => b.area - a.area);

    return traverseAreas(nodes, inputPolygons);
};

const getCyclesFromCycleForest = (
    forest: CycleTreeForest,
    result: Array<Array<number>> = [],
): Array<Array<number>> => {
    forest.forEach((tree) => {
        result.push(tree.cycle);
        getCyclesFromCycleForest(tree.children, result);
    });

    return result.filter((arr) => !!arr.length);
};

export const getAreaTree = (nodes: InputNodes, edges: InputEdges): AreaTree => {
    const solver = new PlanarFaceTree();
    const faces = solver.discover(nodes, edges);

    if (faces.type === 'ERROR') {
        throw new Error(faces.reason);
    }

    const flattenedFaces: Array<Array<number>> = getCyclesFromCycleForest(
        faces.forest,
        [],
    );

    return buildNestingTree(
        nodes,
        flattenedFaces.map((f) => ({ edges: f })),
    );
};
