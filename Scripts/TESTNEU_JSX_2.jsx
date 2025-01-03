(function() {
    if (app.documents.length === 0) {
        alert("Please open a document and select a line.");
        return;
    }

    var doc = app.activeDocument;
    var selection = doc.selection;

    if (!(selection instanceof Array) || selection.length !== 1 || selection[0].typename !== "PathItem") {
        alert("Please select a single line segment.");
        return;
    }

    var originalLine = selection[0];

    if (originalLine.pathPoints.length !== 2) {
        alert("Please select a simple line segment, not a complex path.");
        return;
    }

    // Duplicate the original line and create the first arc
    var duplicatedLine = originalLine.duplicate();
    
    // Calculate the center point of the original line
    var centerX = (duplicatedLine.pathPoints[0].anchor[0] + duplicatedLine.pathPoints[1].anchor[0]) / 2;
    var centerY = (duplicatedLine.pathPoints[0].anchor[1] + duplicatedLine.pathPoints[1].anchor[1]) / 2;

    // Rotate by 90 degrees to create the first arc
    duplicatedLine.rotate(90, true, true, true, true, Transformation.CENTER);

    var p1 = duplicatedLine.pathPoints[0];
    var p2 = duplicatedLine.pathPoints[1];

    var dx = (p2.anchor[0] - p1.anchor[0]) / 2;
    var dy = (p2.anchor[1] - p1.anchor[1]) / 2;
    var lineLength = Math.sqrt(Math.pow(p2.anchor[0] - p1.anchor[0], 2) + Math.pow(p2.anchor[1] - p1.anchor[1], 2));

    var flattenFactor = 0.3;
    var arcControlX = centerX + dy * flattenFactor;
    var arcControlY = centerY - dx * flattenFactor;

    var handleSeparationFactor = lineLength * -0.3;
    var handleOffsetX = (dx / lineLength) * handleSeparationFactor;
    var handleOffsetY = (dy / lineLength) * handleSeparationFactor;

    p1.rightDirection = [arcControlX + handleOffsetX, arcControlY + handleOffsetY];
    p2.leftDirection = [arcControlX - handleOffsetX, arcControlY - handleOffsetY];
    p1.pointType = PointType.SMOOTH;
    p2.pointType = PointType.SMOOTH;

    // Duplicate the curved arc and rotate it by 15 degrees clockwise
    var rotatedArc = duplicatedLine.duplicate();
    rotatedArc.rotate(-15, true, true, true, true, Transformation.CENTER);

    // Move the rotated arc so its start point connects to the start point of the original arc
    var startPointOriginal = duplicatedLine.pathPoints[0].anchor; // Start point of the original duplicated arc
    var startPointRotated = rotatedArc.pathPoints[0].anchor; // Start point of the rotated arc

    // Calculate the translation needed to move the start point of the rotated arc to the start point of the original arc
    var translationX = startPointOriginal[0] - startPointRotated[0];
    var translationY = startPointOriginal[1] - startPointRotated[1];

    // Move the rotated arc by the translation vector
    rotatedArc.translate(translationX, translationY);

    // Rotate the Bezier handle of the outermost vertex
    var outermostPoint = p2; // Choose the outermost vertex
    var handleX = outermostPoint.leftDirection[0];
    var handleY = outermostPoint.leftDirection[1];

    // Calculate vector from anchor to handle
    var handleVectorX = handleX - outermostPoint.anchor[0];
    var handleVectorY = handleY - outermostPoint.anchor[1];

    // Convert vector to polar coordinates (angle and magnitude)
    var handleAngle = Math.atan2(handleVectorY, handleVectorX);
    var handleLength = Math.sqrt(handleVectorX * handleVectorX + handleVectorY * handleVectorY);

    // Rotate the angle by 130 degrees (in radians)
    var rotationAngle = (130 * Math.PI) / 180; // Convert degrees to radians
    var newAngle = handleAngle + rotationAngle;

    // Convert back to Cartesian coordinates
    var newHandleX = outermostPoint.anchor[0] + Math.cos(newAngle) * handleLength;
    var newHandleY = outermostPoint.anchor[1] + Math.sin(newAngle) * handleLength;

    // Scale the handle length by 80%
    var scaleFactor = 0.8;
    var scaledHandleX = outermostPoint.anchor[0] + (newHandleX - outermostPoint.anchor[0]) * scaleFactor;
    var scaledHandleY = outermostPoint.anchor[1] + (newHandleY - outermostPoint.anchor[1]) * scaleFactor;

    // Set the scaled and rotated handle position
    outermostPoint.leftDirection = [scaledHandleX, scaledHandleY];

    // Save the original end point before scaling
    var originalEndPoint = duplicatedLine.pathPoints[1].anchor; // End point of the original line

    // Now scale both arcs (duplicatedLine and rotatedArc) by 90%
    var scalingFactor = 0.95;
    
    // Scale both arcs by 95%
    duplicatedLine.resize(scalingFactor * 100, scalingFactor * 100, true, true, true, true);
    rotatedArc.resize(scalingFactor * 100, scalingFactor * 100, true, true, true, true);

    // Move the start point of the rotated arc to the start point of the duplicated line
    var startPointDuplicated = duplicatedLine.pathPoints[0].anchor; // Start point of the duplicated line
    var startPointRotatedArc = rotatedArc.pathPoints[0].anchor; // Start point of the rotated arc

    // Calculate the translation needed to move the start point of the rotated arc to the start point of the duplicated line
    var moveX = startPointDuplicated[0] - startPointRotatedArc[0];
    var moveY = startPointDuplicated[1] - startPointRotatedArc[1];

    // Apply the translation to the rotated arc
    rotatedArc.translate(moveX, moveY);

    // Move both arcs to the position of the saved end point
    var endPointDuplicated = duplicatedLine.pathPoints[1].anchor; // End point of the duplicated line
    var endPointRotatedArc = rotatedArc.pathPoints[1].anchor; // End point of the rotated arc

    // Calculate the translation needed to move both arcs' end points to the original end point
    var moveBackX = originalEndPoint[0] - endPointDuplicated[0];
    var moveBackY = originalEndPoint[1] - endPointDuplicated[1];

    // Apply the translation to both arcs
    duplicatedLine.translate(moveBackX, moveBackY);
    rotatedArc.translate(moveBackX, moveBackY);

    // Deselect the original line, leaving the last rotated arc selected
    doc.selection = null;
    rotatedArc.selected = true;
    duplicatedLine.selected = true;

})();