/**
 * calculate all the connected domains based on the given two-dimensional array
 */

/**
 * @param {Array} tdArray
 * @param {Function} indicator It receive the raw point data as the first parameter and decide what kind of domain the point belongs to, it should return a string as a domain identifier.
 * @return {Object} [{ bounding: { w: 12, h: 19, x: 0, y: 1 }, points: [ { x: 1, y: 2, point: {} } ], identifier: 'blue', domainId: 1 } ]
 */
module.exports = function( tdArray, indicator ){

    if( !tdArray ){
        throw new Error( 'tdArray must be provided' );
    }

    if( !indicator ){
        throw new Error( 'indicator must be provided' );
    }

    // clone 一份数据，因为需要对饮用进行修改，方便执行
    tdArray = JSON.parse( JSON.stringify( tdArray ) );

    // Result
    var domains = {};
    var domainUUID = 0;

    // 遍历数组，划分domain

    tdArray.forEach(function( row, y ){

        row.forEach(function( colItem, x ){

            var identifier = indicator( colItem, x, y );

            var neighbours = [];
            var neighbour = null;

            // get neighbours
            if(
                // top
                ( tdArray[ y - 1 ] && ( neighbour = tdArray[ y - 1 ][ x ] ) ) ||
                // left
                ( neighbour = row[ x - 1 ] ) ||
                // top left
                ( tdArray[ y - 1 ] && ( neighbour = tdArray[ y - 1 ][ x - 1 ] ))
            ){
                neighbours.push( neighbour );
            }

            if( neighbours.length ){
                var matched = false;

                neighbours.forEach(function( neighbour ){

                    if( neighbour.identifier == identifier ){
                        if( !matched ){
                            addPointToDomain( colItem, x, y, neighbour._domainId );
                            matched = true;
                        }
                        else if( neighbour._domainId != colItem._domainId ){
                            mergeDomains( neighbour._domainId, colItem._domainId );
                        }
                    }
                });

                if( !matched ){
                    addNewDomain( colItem, x, y, identifier );
                }
            }
            else {
                addNewDomain( colItem, x, y, identifier );
            }
        });
    });

    domains.forEach(function( domain ){
        domain.bounding = calculateBounding( domain.points );
    });

    function calculateBounding( points ){

        var minX = null;
        var minY = null;
        var maxX = null;
        var maxY = null;

        points.forEach(function( point ){

            if( minX === null || point.x < minX ){
                minX = point.x;
            }

            if( minY === null || point.y < minY ){
                minY = point.y;
            }

            if( maxX === null || point.x > maxX ){
                maxX = point.x;
            }

            if( maxY === null || point.y > maxY ){
                maxY = point.y;
            }
        });

        var w = maxX - minX;
        var h = maxY - minY;

        return {
            x: minX,
            y: minY,
            w: w,
            h: h
        };
    }

    /**
     *
     * @param point
     * @param x
     * @param y
     * @param identifier
     */
    function addNewDomain( point, x, y, identifier ){

        var newDomain = {
            identifier: identifier,
            domainId: ++domainUUID,
            bounding: {},
            points: []
        };

        var newPoint = {
            point: point,
            x: x,
            y: y,
            identifier: identifier,
            domainId: newDomain.domainId
        };

        point._identifier = identifier;
        point._domainId = newDomain.domainId;

        newDomain.points.push( newPoint );

        domains[ newDomain.domainId ] = newDomain;
    }

    /**
     * @param point
     * @param x
     * @param y
     * @param domainId
     */
    function addPointToDomain( point, x, y, domainId ){

        var domain = domains[ domainId ];
        point._domainId = domainId;
        point._identifier = domain.identifier;
        var newPoint = {
            point: point,
            x: x,
            y: y,
            identifier: domain.identifier,
            domainId: domainId
        };

        domain.points.push( newPoint );
    }

    /**
     * 将 domainB 合并到 domainA
     * @param domainAId
     * @param domainBId
     */
    function mergeDomains( domainAId, domainBId ){

        var domainA = domains[ domainAId ];
        var domainB = domains[ domainBId ];

        if( domainA.identifier == domainB.identifier ){
            // 更新 domainB 的domainId

            domainB.domainId = domainA.domainId;

            domainB.points.forEach(function( point ){
                point.domainId = point.point._domainId = domainA.domainId;
            });

            domainA.points = domainA.points.concat( domainB.points );

            // 删除domainB
            delete domains[ domainBId ];
        }
    }

    // 对于任一点
    //  - 获取当前点的 identifier
    //  - 获取当前点左，上，以及左上点的 identifier，以此判断属于已经发现的某个domain还是新的domain。
    //      - 可能出现的情况是，发现当前点的identifier和多个节点相同，但是这些节点本身的domainId 不一致，此时需要合并domainId

    // 连通域都计算完成后，计算一下bounding

    return domains;
};