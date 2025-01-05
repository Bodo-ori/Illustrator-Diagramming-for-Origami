// Allows the user to rotate an objects bounding box around the object, to 0, 22.5, 45, 67.5 degrees.  Requires
// a few helper actions.  Intended for use with the Free Distort tool.

function getAngle() {
    var dlg = new Window('dialog', 'Rotate Bounding Box');
    dlg.alignChildren = 'center';
    dlg.add('statictext', undefined, 'Choose an angle:');

    var buttonGroup = dlg.add('group');
    buttonGroup.orientation = 'row';
    buttonGroup.alignment = 'center';

    var selectedAngle = null;

    // Function to create a button for an angle
    function createAngleButton(label, angle) {
        var btn = buttonGroup.add('button', undefined, label);
        btn.onClick = function () {
            selectedAngle = angle;
            dlg.close(1);
        };
    }

    // this just builds the menu.  It would be easy to customize for other common angles, 
    // if you wanted to (this would require new actions, too)
    createAngleButton('22.5° //', 22.5);
    createAngleButton('45° ◇', 45);
    createAngleButton('67.5° \\\\', 67.5);
    createAngleButton('0° □', 0);

    var cancelBtn = dlg.add('button', undefined, 'Cancel', { name: 'cancel' });
    cancelBtn.onClick = function () {
        selectedAngle = null;
        dlg.close(0);
    };

    // Show the dialog and return the selected angle
    dlg.show();
    return selectedAngle;
}

function getAllAnchorPoints(item, anchorPoints) {
    // Ensure anchorPoints is an array
    anchorPoints = anchorPoints || [];

    if (item.typename === 'PathItem') {
        for (var i = 0; i < item.pathPoints.length; i++) {
            var point = item.pathPoints[i].anchor;
            anchorPoints.push([point[0], point[1]]); // Add x, y to the array
        }
    } else if (item.typename === 'CompoundPathItem') {
        for (var i = 0; i < item.pathItems.length; i++) {
            getAllAnchorPoints(item.pathItems[i], anchorPoints); // Pass anchorPoints in recursion
        }
    } else if (item.typename === 'GroupItem') {
        for (var i = 0; i < item.pageItems.length; i++) {
            getAllAnchorPoints(item.pageItems[i], anchorPoints); // Pass anchorPoints in recursion
        }
    }

    return anchorPoints; // Return the collected points
}

function rotatePoints(points, angle, cOR) {
    var center = cOR; //center of rotation
    var radians = angle * Math.PI / 180;
    var cosTheta = Math.cos(radians);
    var sinTheta = Math.sin(radians);
    var rotatedPoints = [];

    for (var i = 0; i < points.length; i++) {
        //we move the cOR to the origin, perform matrix rotation, and then put cOR back where it belongs
        var x = points[i][0];
        var y = points[i][1];

        x -= center[0];
        y -= center[1];
        var rotatedX = x * cosTheta - y * sinTheta;
        var rotatedY = x * sinTheta + y * cosTheta;
        rotatedX += center[0];
        rotatedY += center[1];

        rotatedPoints.push([rotatedX, rotatedY]);
    }

    return rotatedPoints;
}

function getCenterOfBBox(pointsArr) {
    var arrX = [], arrY = [];
    
    for (var i = 0; i < pointsArr.length; i++) {
        arrX.push(pointsArr[i][0]);
        arrY.push(pointsArr[i][1]);
    }
    
    var rotatedCenterX = (Math.max.apply(null, arrX) + Math.min.apply(null, arrX)) / 2;
    var rotatedCenterY = (Math.max.apply(null, arrY) + Math.min.apply(null, arrY)) / 2;
    var rotatedCenter = [rotatedCenterX, rotatedCenterY];

    return rotatedCenter;
}

//the item is rotated, and then the bounding box is reset.  in many cases, the center of the bounding box,
//and thus the center of rotation, will change, resulting in a changed location of the item.  this corrects for that.
function getRotationFix(item, angle) {
    var anchorPoints = getAllAnchorPoints(item, anchorPoints);
    var cOR = getCenterOfBBox(anchorPoints);
    var rotatedAnchorPoints = rotatePoints(anchorPoints, angle, cOR);
    var rotatedCenter = getCenterOfBBox(rotatedAnchorPoints);
    var unrotatedCenter = rotatePoints([rotatedCenter], -angle, cOR);
    var vectorFix = [unrotatedCenter[0][0]-rotatedCenter[0], unrotatedCenter[0][1]-rotatedCenter[1]];

    return vectorFix;
}

function hackedRotate(item, angle) {
    angle = angle % 360;
    var actionSet = "HelperActions"; 
    item.selected = true;

    switch (angle) {
        case 22.5:
            app.doScript("22.5", actionSet);
            break;
        case 45:
            app.doScript("45", actionSet);
            break;
        case 67.5:
            app.doScript("67.5", actionSet);
            break;
        case 0:
            app.doScript("FlattenTransparency1", actionSet);
            break;
    }
}

if (app.documents.length === 0) {
    alert("Please open a document and select an object.");
}

var sel = app.activeDocument.selection;

if (sel.length === 0) {
    alert("Please select a PathItem, CompoundPathItem, or GroupItem.");
}

var item = sel[0]; 
var type = item.typename;
var angle = getAngle();

//we have to correct for the rotation first FOR SOME REASON
var vector = getRotationFix(item, angle);
item.translate(vector[0], vector[1]);

//the item is rotated, and then the bounding box is reset
hackedRotate(item, angle);

// Expand styles or convert to outlines
if (type === 'PathItem' || type === 'CompoundPathItem') {
    app.executeMenuCommand('expandStyle');
}
