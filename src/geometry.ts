import { InputNodes, Position } from './planar-face-tree';

export type InputPolygon = {
    edges: Array<number>;
};

export enum WindingOrder {
    CW = 'CW',
    CCW = 'CCW',
    COLINEAR = 'CL',
}

/**
 * We expect the path of polygon to be a sequence of
 * nodes that ends with the starting node
 *
 * e.g. 4 3 6 7 4
 */
export const getPointPath = (
    nodes: InputNodes,
    edges: Array<number>,
): Array<Position> => {
    const pts = edges.slice(0, edges.length - 1);
    return pts.map((p) => nodes[p]);
};

export const getLinePath = (
    points: Array<Position>,
): Array<[Position, Position]> => {
    return points.reduce<Array<[Position, Position]>>((acc, pt, ix, arr) => {
        return [...acc, [pt, arr[ix + 1] ? arr[ix + 1] : arr[0]]];
    }, []);
};

/**
 * Y up and X toward the left coordinate system
 */
export const determineWindingOrder = (
    points: Array<Position>,
): WindingOrder => {
    const res = points.reduce((acc, [x1, y1], ix) => {
        const [x2, y2] = points[ix + 1] ? points[ix + 1] : points[0];

        return acc + (x2 - x1) * (y2 + y1);
    }, 0);

    if (res === 0) {
        return WindingOrder.COLINEAR;
    }

    return res > 0 ? WindingOrder.CW : WindingOrder.CCW;
};

const getMaxX = (pos: Array<Position>): number => {
    let max = -1;

    pos.forEach((p) => {
        if (p[0] > max) {
            max = p[0];
        }
    });

    return max;
};

export const pointLiesOnPolygonBoundary = (
    point: Position,
    polygon: Array<[Position, Position]>,
): boolean => {
    for (let i = 0; i < polygon.length; i++) {
        const [from, to] = polygon[i];
        const winding = determineWindingOrder([from, to, point]);
        if (winding === 'CL' && onSegment(from, point, to)) {
            return true;
        }
    }

    return false;
};

export const allPointsLieOnBoundary = (
    a: Array<Position>,
    b: Array<[Position, Position]>,
): boolean => {
    for (let i = 0; i < a.length; i++) {
        const aPt = a[i];

        const isOnBoundary = pointLiesOnPolygonBoundary(aPt, b);
        if (!isOnBoundary) {
            return false;
        }
    }

    return true;
};

/**
 * Is A inside B
 */
export const isInside = (
    nodes: InputNodes,
    p: Position,
    polygon: Array<Position>,
): boolean => {
    const extreme: Position = [getMaxX(polygon) + 10, p[1]];

    let count = 0,
        i = 0;
    do {
        const next = (i + 1) % polygon.length;

        // Check if the line segment from 'p' to
        // 'extreme' intersects with the line
        // segment from 'polygon[i]' to 'polygon[next]'
        if (intersect(polygon[i], polygon[next], p, extreme)) {
            // If the point 'p' is colinear with line
            // segment 'i-next', then check if it lies
            // on segment. If it lies, return true, otherwise false
            if (
                determineWindingOrder([polygon[i], p, polygon[next]]) ==
                WindingOrder.COLINEAR
            ) {
                return onSegment(polygon[i], p, polygon[next]);
            }

            count++;
        }
        i = next;
    } while (i != 0);

    // Return true if count is odd, false otherwise
    return count % 2 == 1;
};

export const getPolygonArea = (
    nodes: InputNodes,
    polygon: InputPolygon,
): number => {
    const pointPath = getPointPath(nodes, polygon.edges);
    const windingOrder = determineWindingOrder(pointPath);

    const linePath = getLinePath(pointPath);

    return irregularPolygonArea(linePath, windingOrder) || 0;
};

export const areaUnderLineSegment = ([[x1, y1], [x2, y2]]: [
    Position,
    Position,
]): number => {
    const averageHeight = (y1 + y2) / 2;
    const width = x2 - x1;
    const area = averageHeight * width;
    return area;
};
export const irregularPolygonArea = (
    lineSegments: Array<[Position, Position]>,
    windingOrder: WindingOrder,
): number | null => {
    if (windingOrder === WindingOrder.COLINEAR) {
        return 0;
    }

    return lineSegments.reduce((acc, seg) => {
        switch (windingOrder) {
            case WindingOrder.CW:
                return acc + areaUnderLineSegment(seg);
            case WindingOrder.CCW:
                return acc - areaUnderLineSegment(seg);
        }
    }, 0);
};

function onSegment(p: Position, q: Position, r: Position) {
    if (
        q[0] <= Math.max(p[0], r[0]) &&
        q[0] >= Math.min(p[0], r[0]) &&
        q[1] <= Math.max(p[1], r[1]) &&
        q[1] >= Math.min(p[1], r[1])
    ) {
        return true;
    }
    return false;
}

const intersect = (
    p1: Position,
    q1: Position,
    p2: Position,
    q2: Position,
): boolean => {
    const o1 = determineWindingOrder([p1, q1, p2]);
    const o2 = determineWindingOrder([p1, q1, q2]);
    const o3 = determineWindingOrder([p2, q2, p1]);
    const o4 = determineWindingOrder([p2, q2, q1]);

    /**
     * Given the line p1 -> q1, if both points of p2 -> q2 are on the same side
     * of the line p1 -> q1 then the winding order of
     *  p1 -> q1 -> p2
     *  p1 -> q1 -> q2
     * will be the same, hence they wont intersect
     *
     * The cases o1 and o2 cover the cases where p1q1 is horizontal and p2q2 vertical
     * The cases o3 and o4 cover the cases where p1q1 is vertical and p2q2 horizontal
     */

    if (o1 !== o2 && o3 !== o4) {
        return true;
    }

    // Special Cases
    // p1, q1 and p2 are collinear and
    // p2 lies on segment p1q1
    if (o1 === WindingOrder.COLINEAR && onSegment(p1, p2, q1)) {
        return true;
    }

    // p1, q1 and p2 are collinear and
    // q2 lies on segment p1q1
    if (o2 === WindingOrder.COLINEAR && onSegment(p1, q2, q1)) {
        return true;
    }

    // p2, q2 and p1 are collinear and
    // p1 lies on segment p2q2
    if (o3 === WindingOrder.COLINEAR && onSegment(p2, p1, q2)) {
        return true;
    }

    // p2, q2 and q1 are collinear and
    // q1 lies on segment p2q2
    if (o4 === WindingOrder.COLINEAR && onSegment(p2, q1, q2)) {
        return true;
    }

    // Doesn't fall in any of the above cases
    return false;
};
