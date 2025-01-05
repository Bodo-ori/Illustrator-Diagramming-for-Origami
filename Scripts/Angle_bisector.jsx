// The user selects either one 3-anchor-point path, or 2 2-anchor-point paths, and the script will draw the angle bisector, or
// equivalent fold-line-to-line construction.  Has a few edge cases left with weird behavior, but they are unlikely to arise.

function getLength(x1, y1, x2, y2) {
    var result = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    return result;
}

function drawLine(start, end) {
    var doc = app.activeDocument;
    var newPath = doc.pathItems.add();
    newPath.setEntirePath([start, end]);
}

function drawAngleBisector() {
    var doc = app.activeDocument;
    var selection = doc.selection;
    var path1Start, path1End, path2Start, path2End;

    if (selection.length === 1 && selection[0].pathPoints.length === 3) {
        path1Start = selection[0].pathPoints[1].anchor;
        path1End = selection[0].pathPoints[0].anchor;
        path2Start = selection[0].pathPoints[1].anchor;
        path2End = selection[0].pathPoints[2].anchor;
    } else if (selection.length === 2 && selection[0].pathPoints.length === 2 && selection[1].pathPoints.length === 2) {
        path1Start = selection[0].pathPoints[0].anchor;
        path1End   = selection[0].pathPoints[1].anchor;
        path2Start = selection[1].pathPoints[0].anchor;
        path2End   = selection[1].pathPoints[1].anchor;
    } else alert ('Select either 1 path (3 anchors), or 2 paths (2 anchors each)')

    var intersectionObj = checkLineIntersection(path1Start[0], path1Start[1], path1End[0], path1End[1], path2Start[0], path2Start[1], path2End[0], path2End[1]);
    var path1Length = getLength(path1Start[0], path1Start[1], path1End[0], path1End[1]);
    var path2Length = getLength(path2Start[0], path2Start[1], path2End[0], path2End[1]);
    var averageLength = (path1Length + path2Length) / 2;

    if (Math.abs((path1Start[1] - path1End[1]) / (path1Start[0] - path1End[0]) - (path2Start[1] - path2End[1]) / (path2Start[0] - path2End[0])) < Math.pow(10, -6)) {
        //the two paths are parallel
            
        if (!(collinear(path1Start[0], path1Start[1], path1End[0], path1End[1], path2Start[0], path2Start[1]) &&
              collinear(path1Start[0], path1Start[1], path1End[0], path1End[1], path2End[0],   path2End[1]))) {
            //the two paths are not collinear

            var unitVector = calculateUnitVector(path1Start[0], path1Start[1], path1End[0], path1End[1]);
            var center = {
                x: (path1Start[0] + path1End[0] + path2Start[0] + path2End[0]) / 4,
                y: (path1Start[1] + path1End[1] + path2Start[1] + path2End[1]) / 4
            }

            var bisectorStart = {
                x: center.x + averageLength/2 * unitVector.x,
                y: center.y + averageLength/2 * unitVector.y
            }

            var bisectorEnd = {
                x: center.x - averageLength/2 * unitVector.x,
                y: center.y - averageLength/2 * unitVector.y
            }

            drawLine([bisectorStart.x, bisectorStart.y], [bisectorEnd.x, bisectorEnd.y]);
        } else {
            //the two paths are collinear

            var path1Center = {
                x: (path1Start[0] + path1End[0])/2,
                y: (path1Start[1] + path1End[1])/2
            }

            var path2Center = {
                x: (path2Start[0] + path2End[0])/2,
                y: (path2Start[1] + path2End[1])/2
            }

            var distancePath1StartToPath2Center = getLength(path1Start[0], path1Start[1], path2Center.x, path2Center.y);
            var distancePath1EndToPath2Center   = getLength(path1End[0],   path1End[1],   path2Center.x, path2Center.y);
            var distancePath2StartToPath2Center = getLength(path2Start[0], path2Start[1], path1Center.x, path1Center.y);
            var distancePath2EndToPath2Center   = getLength(path2End[0],   path2End[1],   path1Center.x, path1Center.y);

            var path1Inner = distancePath1StartToPath2Center < distancePath1EndToPath2Center ? path1Start : path1End;
            var path2Inner = distancePath2StartToPath2Center < distancePath2EndToPath2Center ? path2Start : path2End;

            var bisCenter = {
                x: path1Inner[0] * (path2Length / (path1Length + path2Length)) + path2Inner[0] * (path1Length / (path1Length + path2Length)),
                y: path1Inner[1] * (path2Length / (path1Length + path2Length)) + path2Inner[1] * (path1Length / (path1Length + path2Length))
            }

            var unitVector = calculateUnitVector(-path1Start[1], path1Start[0], -path1End[1], path1End[0]);

            var bisectorStart = {
                x: bisCenter.x + averageLength * unitVector.x,
                y: bisCenter.y + averageLength * unitVector.y
            }

            var bisectorEnd = {
                x: bisCenter.x - averageLength * unitVector.x,
                y: bisCenter.y - averageLength * unitVector.y
            }

            drawLine([bisectorStart.x, bisectorStart.y], [bisectorEnd.x, bisectorEnd.y]);
        }
    } else {
        //the two paths are not parallel
      
        var p1Si = getLength(path1Start[0], path1Start[1], intersectionObj.x, intersectionObj.y);
        var p1Ei = getLength(path1End[0], path1End[1], intersectionObj.x, intersectionObj.y);
        var p2Si = getLength(path2Start[0], path2Start[1], intersectionObj.x, intersectionObj.y);
        var p2Ei = getLength(path2End[0], path2End[1], intersectionObj.x, intersectionObj.y);
    
        // Assign closest and farthest coordinates, meant to keep the script from behaving differently depending
        //on the direction in which the paths were drawn
        var path1Close = p1Si < p1Ei ? path1Start : path1End;
        var path1Far = p1Si < p1Ei ? path1End : path1Start;
        var path2Close = p2Si < p2Ei ? path2Start : path2End;
        var path2Far = p2Si < p2Ei ? path2End : path2Start;

        //unit vectors for each path are taken, and then the circle construction is used to find the bisector
        var path1unitVector = calculateUnitVector(path1Close[0], path1Close[1], path1Far[0], path1Far[1]);
        var path2unitVector = calculateUnitVector(path2Close[0], path2Close[1], path2Far[0], path2Far[1]);

        var circle1CenterX = intersectionObj.x + path1unitVector.x;
        var circle1CenterY = intersectionObj.y + path1unitVector.y;
        var circle2CenterX = intersectionObj.x + path2unitVector.x;
        var circle2CenterY = intersectionObj.y + path2unitVector.y;

        var circle1 = {
            x: circle1CenterX,
            y: circle1CenterY,
            r: getLength(circle1CenterX, circle1CenterY, intersectionObj.x, intersectionObj.y)
        }
        var circle2 = {
            x: circle2CenterX,
            y: circle2CenterY,
            r: getLength(circle2CenterX, circle2CenterY, intersectionObj.x, intersectionObj.y)
        }

        var circleIntersect = intersection(circle1, circle2);

        var bisectorPoint1X = circleIntersect.point_1.x;
        var bisectorPoint1Y = circleIntersect.point_1.y;
        var bisectorPoint2X = circleIntersect.point_2.x;
        var bisectorPoint2Y = circleIntersect.point_2.y;

        var bisectorUnitVector = calculateUnitVector(bisectorPoint1X, bisectorPoint1Y, bisectorPoint2X, bisectorPoint2Y);

        var bisectorStart;
        if ((Math.abs(path1Close[0] - path2Close[0]) < Math.pow(10,-6)) && (Math.abs(path1Close[1] - path2Close[1]) < Math.pow(10,-6))) {
            bisectorStart = {
                x: path1Close[0],
                y: path1Close[1]
            }
        } else {
            bisectorStart = checkLineIntersection(bisectorPoint1X, bisectorPoint1Y, bisectorPoint2X, bisectorPoint2Y, path1Close[0], path1Close[1], path2Close[0], path2Close[1]);
        }

        var bisectorEnd = checkLineIntersection(bisectorPoint1X, bisectorPoint1Y, bisectorPoint2X, bisectorPoint2Y, path1Far[0], path1Far[1], path2Far[0], path2Far[1]);

        drawLine([bisectorStart.x, bisectorStart.y], [bisectorEnd.x, bisectorEnd.y]);
    }
}

drawAngleBisector();

function calculateUnitVector(x1, y1, x2, y2) {
    var length = getLength(x1, y1, x2, y2);
    if (length === 0) throw new Error("Zero-length vector encountered.");
    return {
        x: (x2 - x1) / length,
        y: (y2 - y1) / length
    };
}

// geeksforgeeks 
function collinear(x1,  y1,  x2, y2,  x3,  y3){
    var a = x1 * (y2 - y3) +
            x2 * (y3 - y1) +
            x3 * (y1 - y2);
 
    return (Math.abs(a) < Math.pow(10, -6));
}

//credit to Justin Round - StackExchange
function checkLineIntersection(line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY) {
    // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) 
    // and booleans for whether line segment 1 or line segment 2 contain the point
    var denominator, a, b, numerator1, numerator2, result = {
        x: null,
        y: null,
        onLine1: false,
        onLine2: false
    };
    denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
    if (denominator == 0) {
        return result;
    }
    a = line1StartY - line2StartY;
    b = line1StartX - line2StartX;
    numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
    numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
    a = numerator1 / denominator;
    b = numerator2 / denominator;

    // if we cast these lines infinitely in both directions, they intersect here:
    result.x = line1StartX + (a * (line1EndX - line1StartX));
    result.y = line1StartY + (a * (line1EndY - line1StartY));

    // if line1 is a segment and line2 is infinite, they intersect if:
    if (a > 0 && a < 1) {
        result.onLine1 = true;
    }
    // if line2 is a segment and line1 is infinite, they intersect if:
    if (b > 0 && b < 1) {
        result.onLine2 = true;
    }
    // if line1 and line2 are segments, they intersect if both of the above are true
    return result;
};

//credit to Steve - StackOverflow
/**
 * @description Get information about the intersection points of a circle.
 * Adapted from: https://stackoverflow.com/a/12221389/5553768.
 * @param {Object} c1 An object describing the first circle.
 * @param {float} c1.x The x coordinate of the circle.
 * @param {float} c1.y The y coordinate of the circle.
 * @param {float} c1.r The radius of the circle.
 * @param {Object} c2 An object describing the second circle.
 * @param {float} c2.x The x coordinate of the circle.
 * @param {float} c2.y The y coordinate of the circle.
 * @param {float} c2.r The radius of the circle.
 * @returns {Object} Data about the intersections of the circles.
 */
function intersection(c1, c2) {
    // Start constructing the response object.
    const result = {
        intersect_count: 0,
        intersect_occurs: true,
        one_is_in_other: false,
        are_equal: false,
        point_1: { x: null, y: null },
        point_2: { x: null, y: null },
    };

    // Get vertical and horizontal distances between circles.
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;

    // Calculate the distance between the circle centers as a straight line.
    const dist = Math.sqrt(dy*dy + dx*dx);

    // Check if circles intersect.
    if (dist > c1.r + c2.r) {
        result.intersect_occurs = false;
    }

    // Check one circle isn't inside the other.
    if (dist < Math.abs(c1.r - c2.r)) {
        result.intersect_occurs = false;
        result.one_is_in_other = true;
    }

    // Check if circles are the same.
    if (c1.x === c2.x && c1.y === c2.y && c1.r === c2.r) {
        result.are_equal = true;
        result.are_equal = true;
    }

    // Find the intersection points
    if (result.intersect_occurs) {
        // Centroid is the pt where two lines cross. A line between the circle centers
        // and a line between the intersection points.
        const centroid = (c1.r * c1.r - c2.r * c2.r + dist * dist) / (2.0 * dist);

        // Get the coordinates of centroid.
        const x2 = c1.x + (dx * centroid) / dist;
        const y2 = c1.y + (dy * centroid) / dist;

        // Get the distance from centroid to the intersection points.
        const h = Math.sqrt(c1.r * c1.r - centroid * centroid);

        // Get the x and y dist of the intersection points from centroid.
        const rx = -dy * (h / dist);
        const ry = dx * (h / dist);

        // Get the intersection points.
        result.point_1.x = Number((x2 + rx).toFixed(15));
        result.point_1.y = Number((y2 + ry).toFixed(15));

        result.point_2.x = Number((x2 - rx).toFixed(15));
        result.point_2.y = Number((y2 - ry).toFixed(15));

        // Add intersection count to results
        if (result.are_equal) {
            result.intersect_count = null;
        } else if (result.point_1.x === result.point_2.x && result.point_1.y === result.point_2.y) {
            result.intersect_count = 1;
        } else {
            result.intersect_count = 2;
        }
    }
    return result;
}
