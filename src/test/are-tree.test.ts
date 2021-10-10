import {determineWindingOrder} from "../area-tree";
import {getAlgorithmInputs, loadGraphML} from "./loader";
import {getGMLFilePath} from "./planar-face-discovery.test";

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
                const [nodes, edges] = getAlgorithmInputs(loadGraphML(getGMLFilePath('g8.graphml')))
                /**
                 * TODO.
                 * 1. flatten nested trees from planar discovery
                 * 2. pass to nesting tree algo
                 * 3. create more complicated example
                 * 4. create a nicer interface for usage that does the whole process
                 * 5. make sure that we expose each stage of the pipeline so they can be used individually
                 * 6. make anything ot used by user priovatye
                 */
            })
        })
    })

})