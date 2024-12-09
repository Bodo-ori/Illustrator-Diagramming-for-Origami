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

  // ** Scale both lines (duplicatedLine and rotatedArc) by 10% **
  var scaleFactor = 0.9;  // Scale both lines by 90% (shrinking by 10%)

  // Save the stroke width before transforming
  var strokeWidth = duplicatedLine.strokeWidth;

  // Get the center of the duplicated line for scaling
  var boundsDuplicated = duplicatedLine.geometricBounds;
  var centerXDuplicated = (boundsDuplicated[0] + boundsDuplicated[2]) / 2;
  var centerYDuplicated = (boundsDuplicated[1] + boundsDuplicated[3]) / 2;

  // Apply the scaling transformation to the duplicated line (first arc)
  var scaleMatrixDuplicated = app.getScaleMatrix(scaleFactor * 100, scaleFactor * 100, centerXDuplicated, centerYDuplicated);
  duplicatedLine.transform(scaleMatrixDuplicated);

  // Apply the scaling transformation to the rotated arc (second arc)
  var boundsRotated = rotatedArc.geometricBounds;
  var centerXRotated = (boundsRotated[0] + boundsRotated[2]) / 2;
  var centerYRotated = (boundsRotated[1] + boundsRotated[3]) / 2;

  var scaleMatrixRotated = app.getScaleMatrix(scaleFactor * 100, scaleFactor * 100, centerXRotated, centerYRotated);
  rotatedArc.transform(scaleMatrixRotated);

  // Restore the stroke width after scaling
  duplicatedLine.strokeWidth = strokeWidth;
  rotatedArc.strokeWidth = strokeWidth;

  // Move the rotated arc so its start point connects to the start point of the original arc
  var startPointOriginal = duplicatedLine.pathPoints[0].anchor; // Start point of the original duplicated arc
  var startPointRotated = rotatedArc.pathPoints[0].anchor; // Start point of the rotated arc

  // Calculate the translation needed to move the start point of the rotated arc to the start point of the original arc
  var translationX = startPointOriginal[0] - startPointRotated[0];
  var translationY = startPointOriginal[1] - startPointRotated[1];

  // Move the rotated arc by the translation vector
  rotatedArc.translate(translationX, translationY);

  // Deselect the original line, leaving the last rotated arc selected
  doc.selection = null;
  rotatedArc.selected = true;
  duplicatedLine.selected = true;

  // Optionally: Do anything further with the joined path if needed
})();
