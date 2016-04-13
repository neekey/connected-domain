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
    var pointsHash = {};

    // 遍历数组，划分domain

    tdArray.forEach(function( row, y ){

        row.forEach(function( colItem, x ){

            // get the current point identifier.
            var identifier = indicator( colItem, x, y );

            // get neighbours
            // Except for Undefined every data type is valid.
            var neighbours = [];

            // top neighbour
            if( tdArray[ y - 1 ] && tdArray[ y - 1 ][ x ] !== undefined ){
                neighbours.push( pointsHash[ x + '_' + ( y - 1 ) ] );
            }

            // left neighbour
            if( row[ x - 1 ] !== undefined ){
                neighbours.push( pointsHash[ ( x - 1 ) + '_' + y ] );
            }

            // top left neighbour
            if( tdArray[ y - 1 ] && tdArray[ y - 1 ][ x - 1 ] !== undefined ){
                neighbours.push( pointsHash[ ( x - 1 ) + '_' + ( y - 1 ) ] );
            }

            if( neighbours.length ){
                var matched = false;

                neighbours.forEach(function( neighbour ){

                    if( neighbour.identifier == identifier ){

                        // If the neighbour is the first neighbour has the same identifier
                        if( !matched ){
                            addPointToDomain( colItem, x, y, neighbour.domainId );
                            matched = true;
                        }

                        // If more than one neighbour matched, check if these neighbours belong to the same domain
                        // If not, merge these domains since they connects to each other.
                        else {
                            var colItemPoint = pointsHash[ x + '_' + y ];
                            if( neighbour.domainId != colItemPoint.domainId ){
                                mergeDomains( neighbour.domainId, colItemPoint.domainId );
                            }
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

    for( var domainId in domains ){
        domains[ domainId ].bounding = calculateBounding( domains[ domainId ].points );
    }

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

        pointsHash[ x + '_' + y ] = {
            value: point,
            identifier: identifier,
            domainId: newDomain.domainId
        };

        newDomain.points.push( newPoint );

        domains[ newDomain.domainId ] = newDomain;
    }

    /**
     * add a point to a existing domain, and attach properties domainId and identifier to point.
     * @param point
     * @param x
     * @param y
     * @param domainId
     */
    function addPointToDomain( point, x, y, domainId ){

        var domain = domains[ domainId ];
        var newPoint = {
            point: point,
            x: x,
            y: y,
            identifier: domain.identifier,
            domainId: domainId
        };

        pointsHash[ x + '_' + y ] = {
            value: point,
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
                point.domainId = domainA.domainId;
                pointsHash[ point.x + '_' + point.y ].domainId = domainA.domainId;
            });

            domainA.points = domainA.points.concat( domainB.points );

            // 删除domainB
            delete domains[ domainBId ];
        }
    }

    return domains;
};