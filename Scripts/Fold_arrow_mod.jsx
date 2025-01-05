// Gives more control for fold arrows.  User selects a line to fold across, and an anchor point 
// for the arrow to begin.  The concavity of the arrow is dependent on its location along the fold
// line (it's concave in the direction that the fold line is longer).

// down the line, ideally, this kind of behavior could be integrated with Bodo's scripts, so that 
// if an anchor point is selected, the arrow begins there, but there are default behaviors in case
// one is not selected.

(function() {
    if (app.documents.length === 0) {
        alert("Please open a document and select a line and a point.");
        return;
    }
  
    var doc = app.activeDocument;
    var selection = doc.selection;
  
    // Validate selection (must be a line and a point)
    if (!(selection instanceof Array) || selection.length !== 2) {
        alert("Please select a single line segment and a point.");
        return;
    }
  
    var line, point;
    
    if (selection[0].typename === "PathItem" && selection[0].pathPoints.length === 2) {
        line = selection[0];
        point = selection[1];
    } else if (selection[1].typename === "PathItem" && selection[1].pathPoints.length === 2) {
        line = selection[1];
        point = selection[0];
    } else {
        alert("Please select a single line segment and a point.");
        return;
    }
  
    if (point.typename !== "PathItem" || point.pathPoints.length !== 1) {
        alert("The second selection must be a single anchor point.");
        return;
    }
  
    // Extract line endpoints
    var p1 = line.pathPoints[0].anchor;
    var p1obj = {x: p1[0], y: p1[1]};

    var p2 = line.pathPoints[1].anchor;
    var p2obj = {x: p2[0], y: p2[1]};

    // Extract point coordinates
    var px = point.pathPoints[0].anchor[0];
    var py = point.pathPoints[0].anchor[1];
    var pobj = {x: px, y: py};

    function sqr(x) { return x * x }
    function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
    function distToSegmentSquared(p, v, w) {
        var l2 = dist2(v, w);
        if (l2 == 0) return dist2(p, v);
        var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return dist2(p, { x: v.x + t * (w.x - v.x),
                            y: v.y + t * (w.y - v.y) });
    }
    function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w)); }

    var dist = distToSegment(pobj, p1obj, p2obj);

    // Calculate line vector and perpendicular vector
    var dx = p2obj.x - p1obj.x;
    var dy = p2obj.y - p1obj.y;
    var length = Math.sqrt(dx * dx + dy * dy);

    // Create the new perpendicular line starting at the point
    var newLineLength = dist * 2; // Twice the perpendicular length

    const dotproduct = (p2obj.x-p1obj.x)*(pobj.y-p1obj.y)-(p2obj.y-p1obj.y)*(pobj.x-p1obj.x);

    if(dotproduct>0) {
        var perpX = dy / length;
        var perpY = -dx / length;
    } else if (dotproduct<0) {
        var perpX = -dy / length;
        var perpY = dx / length;
    } else {
        alert("Select a point not on the line.");
        return;
    }

    var newStartX = px;
    var newStartY = py;
    var newEndX = px + perpX * newLineLength;
    var newEndY = py + perpY * newLineLength;

    // Create the new line
    var newLine = doc.pathItems.add();
    newLine.setEntirePath([[newStartX, newStartY], [newEndX, newEndY]]);

    var centerX = (newStartX + newEndX) / 2;
    var centerY = (newStartY + newEndY) / 2;
    var flattenFactor = 0.25; // Adjust curvature

    function distance(x1, y1, x2, y2) {return Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2))}

    var distFromCenterToAnchor = distance(newEndX,newEndY,newStartX,newStartY)*flattenFactor;

    var centertoA = distance(centerX, centerY, p1obj.x, p1obj.y);
    var centertoB = distance(centerX, centerY, p2obj.x, p2obj.y);

    var cTAx = (p1obj.x - centerX)/centertoA;
    var cTAy = (p1obj.y - centerY)/centertoA;
    var cTBx = (p2obj.x - centerX)/centertoB;
    var cTBy = (p2obj.y - centerY)/centertoB;

    if (centertoA >= centertoB) {
        var xvec = cTBx;
        var yvec = cTBy;
    } else {
        var xvec = cTAx;
        var yvec = cTAy;
    }

    var arcControlX = centerX + xvec * distFromCenterToAnchor;
    var arcControlY = centerY + yvec * distFromCenterToAnchor;

    // Convert the new line into an arc
    newLine.pathPoints[0].rightDirection = [arcControlX, arcControlY];
    newLine.pathPoints[1].leftDirection = [arcControlX, arcControlY];
    newLine.pathPoints[0].pointType = PointType.SMOOTH;
    newLine.pathPoints[1].pointType = PointType.SMOOTH;

  
    // Deselect the original line and point, leaving only the arc selected
    doc.selection = null;
    newLine.selected = true;

    var scaleFactor = 0.9;  // Shrink by 10%

    // Save the current stroke width
    var strokeWidth = newLine.strokeWidth;

    // Get the bounds of the duplicated line to use as the scaling reference point
    var bounds = newLine.geometricBounds;
    var centerX = (bounds[0] + bounds[2]) / 2;
    var centerY = (bounds[1] + bounds[3]) / 2;

    // Create a scaling matrix for the transformation
    var scaleMatrix = app.getScaleMatrix(scaleFactor * 100, scaleFactor * 100, centerX, centerY);

    // Apply the scaling transformation to the path
    newLine.transform(scaleMatrix);

    // Restore the stroke width after scaling the path
    newLine.strokeWidth = strokeWidth;

    // Deselect the object, leaving the transformed line selected
    doc.selection = null;
    newLine.selected = true;

  })();
  
