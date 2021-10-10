import {buildNestingTree, determineWindingOrder, getCyclesFromCycleForest} from "../area-tree";
import {getAlgorithmInputs, loadGraphML} from "./loader";
import {getGMLFilePath} from "./planar-face-discovery.test";
import {PlanarFaceDiscovery} from "../planar-face-discovery";

describe('Area Tree', () => {

    describe('determineWindingOrder', () => {

        describe('when winding order is clockwise', () => {
            it('should determine this correctly', () => {
                const res = determineWindingOrder(
                    [
                        [0,3],
                        [3,3],
                        [3,0],
                        [0,0]
                    ]
                )
                expect(res).toBe('CW')
            })
        })

        describe('when winding order is counter clockwise', () => {
            it('should determine this correctly', () => {
                const res = determineWindingOrder(
                    [
                        [0,0],
                        [3,0],
                        [3,3],
                        [0,3]
                    ]
                )
                expect(res).toBe('CCW')
            })
        })

    });

    describe('buildNestingTree', () => {
        describe('when passed a valid input', () => {
            it('should produce a valid tree', () => {
                const [nodes, edges] = getAlgorithmInputs(loadGraphML(getGMLFilePath('g10.graphml')))
                /**
                 * TODO.
                 * 1. flatten nested trees from planar discovery
                 * 2. pass to nesting tree algo
                 * 3. create more complicated example
                 * 4. create a nicer interface for usage that does the whole process
                 * 5. make sure that we expose each stage of the pipeline so they can be used individually
                 * 6. make anything ot used by user priovatye
                 */
                const solver = new PlanarFaceDiscovery();
                const cycleResults = solver.discover(nodes, edges);

                if(cycleResults.type === 'RESULT') {
                    const cyclesList: Array<Array<number>> = []
                    const cycles = getCyclesFromCycleForest(
                        cycleResults.forest,
                        cyclesList
                    );

                    console.log(cycles)

                    const nestingTree = buildNestingTree(
                        nodes,
                        cycles.map(c => ({ edges: c }))
                    )

                    // TODO - if all the points of another polygon are in

                    console.log(JSON.stringify(nestingTree, null, 2))
                }

            })
        })
    })

})