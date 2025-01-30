
//four variables which allow you to customize the appearance of the arrows.

//how far the arrow is from the corners of the square.  Max: 1
var offset = 0.1;

//bend of the arrow.  Anything above 0.5 would look pretty stupid, i think
var curvature = 0.3;

//angle offset for unfold arrow
var unfold = 12.5;

//strength of wraparound hook
var wrap = 0.5;

var doc = app.activeDocument;
var selection = doc.selection;
var style = 'FUST';
var tester = allSelectedItemsHaveTwoAnchorPoints();

function arRobust (pathPoint0, pathPoint1, arrowOrigin, style) {
    var x0 = pathPoint0[0];
    var y0 = pathPoint0[1];
    var x1 = pathPoint1[0];
    var y1 = pathPoint1[1];
    var x2 = arrowOrigin[0];
    var y2 = arrowOrigin[1];

    //alert('1');

    var abx = pathPoint1[0] - pathPoint0[0];
    var aby = pathPoint1[1] - pathPoint0[1];
    var acx = arrowOrigin[0] - pathPoint0[0];
    var acy = arrowOrigin[1] - pathPoint0[1];
    var coeff = (abx * acx + aby * acy) / (abx * abx + aby * aby);

    var arrowCenter = [pathPoint0[0] + abx * coeff, pathPoint0[1] + aby * coeff];

    //alert('2');

    var angle = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI + 90;
    var arrowLength = 2 * getLength(arrowCenter[0], arrowCenter[1], arrowOrigin[0], arrowOrigin[1]);
    
    var translationToOrigin = createTranslationMatrix(-arrowCenter[0], -arrowCenter[1]);
    var rotationToHorizontal = createRotationMatrix(-angle);
    var scaleToONe = createScalingMatrix(2/arrowLength);
    
    var transformToSanity = multiplyMatrices(scaleToONe, multiplyMatrices(rotationToHorizontal, translationToOrigin));

    //alert('3');

    var transformedPoint1 = transformPoints([pathPoint1], transformToSanity);
    var convexDir = calculateUnitVector(0, 0, transformedPoint1[0][0], transformedPoint1[0][1]);
    
    var origin = [offset-1, offset/2 * convexDir[1]];
    var anchor1 = [0, curvature * convexDir[1]];

    var anchor10 = [-curvature, curvature*convexDir[1]];
    var anchor11 = [curvature, curvature*convexDir[1]];

    var elbowUp = [1-offset, offset/2 * convexDir[1]];
    var elbowDown = [1-offset, offset/2 * -convexDir[1]];
    var wrapAnchor = [-(1+wrap) + offset/2, wrap*(curvature-offset/2)*convexDir[1]];

    //alert('4');

    var anchor2PreRotation = [-1, curvature*convexDir[1]];
    var anchor20PreRotation = [-1+curvature, curvature*convexDir[1]];
    var anchor21PreRotation = [-1-curvature, curvature*convexDir[1]];
    var endPreRotation = [-2 + offset, offset/2 * convexDir[1]];
    var rotationMatrixForArrowAnchors = createRotationMatrix(-convexDir[1]*unfold);
    var arrPostRotation = transformPoints([anchor2PreRotation, endPreRotation, anchor20PreRotation, anchor21PreRotation], rotationMatrixForArrowAnchors);
    var anchor2PostTranslation = [arrPostRotation[0][0]+1, arrPostRotation[0][1]];
    var anchor20PostTranslation = [arrPostRotation[2][0]+1, arrPostRotation[2][1]];
    var anchor21PostTranslation = [arrPostRotation[3][0]+1, arrPostRotation[3][1]];
    var endPostTranslation = [arrPostRotation[1][0]+1, arrPostRotation[1][1]];

    //alert('5');

    var trueOrigin = [-1, 0];
    var originDown = [offset-1, offset/2 * -convexDir[1]];
    var anchor1pt5 = [0, curvature * 1.5 * convexDir[1]];

    var pointsArr = [origin, anchor1, elbowUp, elbowDown, wrapAnchor, anchor2PostTranslation, endPostTranslation, trueOrigin, originDown, anchor1pt5, anchor10, anchor11, anchor20PostTranslation, anchor21PostTranslation];
    //                  0       1       2           3           4               5                       6               7       8               9         10        11              12                          13

    var inverseTransform = inverseMatrix(transformToSanity);

    var unTransformedPoints = transformPoints(pointsArr, inverseTransform);

    //alert(unTransformedPoints);

    var newLine = doc.pathItems.add();

    //alert('6');

    switch (style) { // 0 2 10 11 7 4 9 8 6 12 13 7  -- 1 3 5
        case 'FOST':
            newLine.setEntirePath([unTransformedPoints[0], unTransformedPoints[2]]);
            newLine.pathPoints[0].rightDirection = unTransformedPoints[10];
            newLine.pathPoints[1].leftDirection = unTransformedPoints[11];
            newLine.pathPoints[0].pointType = PointType.SMOOTH;
            newLine.pathPoints[1].pointType = PointType.SMOOTH;
            break;
        case 'FOWR':
            newLine.setEntirePath([unTransformedPoints[7], unTransformedPoints[2]]);
            newLine.pathPoints[0].rightDirection = unTransformedPoints[4];
            newLine.pathPoints[1].leftDirection = unTransformedPoints[9];
            newLine.pathPoints[0].pointType = PointType.SMOOTH;
            newLine.pathPoints[1].pointType = PointType.SMOOTH;
            break;
        case 'FUST':
            newLine.setEntirePath([unTransformedPoints[8], unTransformedPoints[2], unTransformedPoints[6]]);
            newLine.pathPoints[0].rightDirection = unTransformedPoints[10];
            newLine.pathPoints[1].leftDirection = unTransformedPoints[11];
            newLine.pathPoints[1].rightDirection = unTransformedPoints[12];
            newLine.pathPoints[2].leftDirection = unTransformedPoints[13];
            newLine.pathPoints[0].pointType = PointType.SMOOTH;
            newLine.pathPoints[1].pointType = PointType.CORNER;
            newLine.pathPoints[2].pointType = PointType.SMOOTH;
            break;
        case 'FUWR':
            newLine.setEntirePath([unTransformedPoints[7], unTransformedPoints[2], unTransformedPoints[6]]);
            newLine.pathPoints[0].rightDirection = unTransformedPoints[4];
            newLine.pathPoints[1].leftDirection = unTransformedPoints[9];
            newLine.pathPoints[1].rightDirection = unTransformedPoints[12];
            newLine.pathPoints[2].leftDirection = unTransformedPoints[13];
            newLine.pathPoints[0].pointType = PointType.SMOOTH;
            newLine.pathPoints[1].pointType = PointType.CORNER;
            newLine.pathPoints[2].pointType = PointType.SMOOTH;
            break;
    }

    newLine.filled = false;
    newLine.strokeDashes = [];
    newLine.strokeWidth = 0.850394;

    return newLine;
}

var arrowArray = [];

if (selection.length === 2 && (selection[0].pathPoints.length === 1 || selection[1].pathPoints.length === 1)) {
    var line, point;
    if (selection[0].typename === "PathItem" && selection[0].pathPoints.length === 2) {
        line = selection[0];
        point = selection[1];
    } else if (selection[1].typename === "PathItem" && selection[1].pathPoints.length === 2) {
        line = selection[1];
        point = selection[0];
    } else {
        alert("Please select a single line segment and a point.");
    }

    var pointFirstDrawn = line.pathPoints[0].anchor;
    var pointSecondDrawn = line.pathPoints[1].anchor;
    var arrowOrigin = point.pathPoints[0].anchor;

    var distanceFirst = getLength(pointFirstDrawn[0], pointFirstDrawn[1], arrowOrigin[0], arrowOrigin[1]);
    var distanceSecond = getLength(pointSecondDrawn[0], pointSecondDrawn[1], arrowOrigin[0], arrowOrigin[1]);

    var pointCloser, pointFurther;
    if (distanceFirst < distanceSecond) {
        pointCloser = pointFirstDrawn, pointFurther = pointSecondDrawn;
    } else {
        pointCloser = pointSecondDrawn, pointFurther = pointFirstDrawn;
    }    

    var arrow = arRobust(pointFurther, pointCloser, arrowOrigin, style);
    arrowArray.push(arrow);
    point.remove();
} else if (tester) {
    for (var i = 0; i < selection.length; i++) {
        // Validate the item and ensure it has exactly two anchor points
        if (selection[i].typename !== "PathItem" || selection[i].pathPoints.length !== 2) {
            alert("Item must be a PathItem with exactly two path points.");
            continue;
        }
    
        // Extract anchors
        var A = selection[i].pathPoints[0].anchor;
        var B = selection[i].pathPoints[1].anchor;
    
        // Calculate AB length
        var AB = getLength(A[0], A[1], B[0], B[1]);
        if (AB < Math.pow(10,-6)) {
            alert("Zero-length path detected. Skipping.");
            continue;
        }
    
        // Calculate angle and CD
        var ang = Math.atan2(B[1] - A[1], B[0] - A[0]);
        var CD = AB*Math.max(Math.abs(Math.cos(2 * ang)), Math.abs(Math.sin(2 * ang))) / 2;

        //alert(ang);
        //alert(CD);
    
        // Ensure discriminant is non-negative
        var discriminant = 4 * AB * AB - 16 * CD * CD;
        if (discriminant < 0) {
            alert("Invalid geometry: discriminant is negative. Skipping.");
            continue;
        }
    
        // Calculate AD
        var posAD = (2 * AB + Math.sqrt(discriminant)) / 4;
        var negAD = (2 * AB - Math.sqrt(discriminant)) / 4;
        var AD = posAD > 0 ? posAD : negAD;
    
        // Calculate D
        var D = [A[0] + (AD / AB) * (B[0] - A[0]), A[1] + (AD / AB) * (B[1] - A[1])];
    
        // Calculate unit vector
        var vecDC = calculateUnitVector(-A[1], A[0], -B[1], B[0]);
        if (!vecDC || vecDC.length !== 2 || isNaN(vecDC[0]) || isNaN(vecDC[1])) {
            alert("Invalid vector calculation. Skipping.");
            continue;
        }
    
        // Calculate C
        var C = [D[0] + CD * vecDC[0], D[1] + CD * vecDC[1]];

        //alert('no errors, calling arRobust');
    
        // Call arRobust with validated inputs
        var arrow = arRobust(A, B, C, style);
        arrowArray.push(arrow);
    }  
} else alert ('Select either one line segment and a point, or a collection of line segments.')

for (var j = 0; j < selection.length; j++) {
    selection[j].selected = false;
}

for (var k = 0; k < arrowArray.length; k++) {
    arrowArray[k].selected = true;
}

function allSelectedItemsHaveTwoAnchorPoints() {
    // Loop through selected items
    for (var i = 0; i < selection.length; i++) {
        var item = selection[i];

        // Check if the item is a PathItem
        if (item.typename !== "PathItem") {
            alert("Not all selected items are path items.");
            return false;
        }

        // Check if it has exactly two anchor points
        if (item.pathPoints.length !== 2) {
            //alert("An item with a different number of anchor points was found.");
            return false;
        }
    }

    //alert('tester passed');

    // If we pass all checks, return true
    return true;
}

function getLength (x0, y0, x1, y1) {
    return Math.sqrt((x0-x1)*(x0-x1) + (y0-y1)*(y0-y1));
}

function calculateUnitVector(x1, y1, x2, y2) {
    var length = getLength(x1, y1, x2, y2);
    if (length === 0) throw new Error("Zero-length vector encountered.");
    return [
        (x2 - x1) / length,
        (y2 - y1) / length
    ]
}

function multiplyMatrixAndPoint(matrix, point) {
    return [
        matrix[0][0] * point[0] + matrix[0][1] * point[1] + matrix[0][2],
        matrix[1][0] * point[0] + matrix[1][1] * point[1] + matrix[1][2],
    ];
}

function createTranslationMatrix(tx, ty) {
    return [
        [1, 0, tx],
        [0, 1, ty],
        [0, 0, 1]
    ];
}

function createRotationMatrix(angle) {
    var radians = angle * Math.PI / 180;
    var cosTheta = Math.cos(radians);
    var sinTheta = Math.sin(radians);

    return [
        [cosTheta, -sinTheta, 0],
        [sinTheta, cosTheta, 0],
        [0, 0, 1]
    ];
}

function transformPoints(points, matrix) {
    var transformedPoints = [];
    for (var i = 0; i < points.length; i++) {
        var transformedPoint = multiplyMatrixAndPoint(matrix, points[i]);
        transformedPoints.push(transformedPoint);
    }
    return transformedPoints;
}

function createScalingMatrix(factor) {
    var sx = factor, sy = factor;
    return [
        [sx, 0, 0],
        [0, sy, 0],
        [0, 0, 1]
    ];
}

function multiplyMatrices(a, b) {
    var result = [];
    for (var i = 0; i < 3; i++) {
        result[i] = [];
        for (var j = 0; j < 3; j++) {
            result[i][j] = a[i][0] * b[0][j] + a[i][1] * b[1][j] + a[i][2] * b[2][j];
        }
    }
    return result;
}

function inverseMatrix(matrix) {
    // Extract matrix elements
    var a = matrix[0][0], b = matrix[0][1], c = matrix[0][2];
    var d = matrix[1][0], e = matrix[1][1], f = matrix[1][2];

    // Determinant of the upper-left 2x2 submatrix
    var det = a * e - b * d;

    if (det === 0) {
        throw new Error("Matrix is not invertible");
    }

    // Inverse of the 2x2 submatrix
    var aPrime = e / det;
    var bPrime = -b / det;
    var dPrime = -d / det;
    var ePrime = a / det;

    // Adjust the translation components
    var cPrime = -(aPrime * c + bPrime * f);
    var fPrime = -(dPrime * c + ePrime * f);

    // Construct the inverse matrix
    return [
        [aPrime, bPrime, cPrime],
        [dPrime, ePrime, fPrime],
        [0, 0, 1] // Preserve the affine transformation structure
    ];
}