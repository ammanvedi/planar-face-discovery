import {getAreaTree} from "../area-tree";
import {getAlgorithmInputs, loadGraphML} from "./loader";
import {getGMLFilePath} from "./planar-face-tree.test";

describe('Area Tree', () => {
    describe('getAreaTree', () => {
        describe('when passed a valid input', () => {
            it('should produce a valid tree', () => {
                const [nodes, edges] = getAlgorithmInputs(loadGraphML(getGMLFilePath('g10.graphml')))

                const result = getAreaTree(nodes, edges)

                expect(result).toEqual({
                    "type": "ROOT",
                    "children": [
                        {
                            "type": "CHILD",
                            "area": {
                                "total": 89406.00000000016,
                                "withoutChildren": 63253.49999999998
                            },
                            "polygonIndex": 0,
                            "polygon": [
                                1,
                                3,
                                2,
                                6,
                                5,
                                4,
                                8,
                                7,
                                0,
                                1
                            ],
                            "children": [
                                {
                                    "type": "CHILD",
                                    "area": {
                                        "total": 13313.500000000087,
                                        "withoutChildren": 13313.500000000087
                                    },
                                    "polygonIndex": 4,
                                    "polygon": [
                                        33,
                                        34,
                                        35,
                                        38,
                                        37,
                                        36,
                                        33
                                    ],
                                    "children": []
                                },
                                {
                                    "type": "CHILD",
                                    "area": {
                                        "total": 12839.000000000095,
                                        "withoutChildren": 12839.000000000095
                                    },
                                    "polygonIndex": 6,
                                    "polygon": [
                                        30,
                                        31,
                                        32,
                                        29,
                                        30
                                    ],
                                    "children": []
                                }
                            ]
                        },
                        {
                            "type": "CHILD",
                            "area": {
                                "total": 53200.57470000023,
                                "withoutChildren": 42019.07470000019
                            },
                            "polygonIndex": 1,
                            "polygon": [
                                13,
                                9,
                                10,
                                11,
                                12,
                                13
                            ],
                            "children": [
                                {
                                    "type": "CHILD",
                                    "area": {
                                        "total": 11181.50000000004,
                                        "withoutChildren": 11181.50000000004
                                    },
                                    "polygonIndex": 7,
                                    "polygon": [
                                        40,
                                        39,
                                        47,
                                        45,
                                        44,
                                        46,
                                        43,
                                        42,
                                        41,
                                        40
                                    ],
                                    "children": []
                                }
                            ]
                        },
                        {
                            "type": "CHILD",
                            "area": {
                                "total": 43836.85085000017,
                                "withoutChildren": 27199.276885503044
                            },
                            "polygonIndex": 2,
                            "polygon": [
                                14,
                                17,
                                16,
                                15,
                                14
                            ],
                            "children": [
                                {
                                    "type": "CHILD",
                                    "area": {
                                        "total": 12850.29585798823,
                                        "withoutChildren": 10877.218934911294
                                    },
                                    "polygonIndex": 5,
                                    "polygon": [
                                        24,
                                        23,
                                        22,
                                        21,
                                        24
                                    ],
                                    "children": [
                                        {
                                            "type": "CHILD",
                                            "area": {
                                                "total": 1973.076923076936,
                                                "withoutChildren": 1973.076923076936
                                            },
                                            "polygonIndex": 9,
                                            "polygon": [
                                                25,
                                                28,
                                                27,
                                                26,
                                                25
                                            ],
                                            "children": []
                                        }
                                    ]
                                },
                                {
                                    "type": "CHILD",
                                    "area": {
                                        "total": 3787.278106508895,
                                        "withoutChildren": 3787.278106508895
                                    },
                                    "polygonIndex": 8,
                                    "polygon": [
                                        18,
                                        19,
                                        20,
                                        18
                                    ],
                                    "children": []
                                }
                            ]
                        },
                        {
                            "type": "CHILD",
                            "area": {
                                "total": 20664.50000000002,
                                "withoutChildren": 20664.50000000002
                            },
                            "polygonIndex": 3,
                            "polygon": [
                                2,
                                3,
                                4,
                                5,
                                6,
                                2
                            ],
                            "children": []
                        }
                    ]
                })
            })
        })
    })

})