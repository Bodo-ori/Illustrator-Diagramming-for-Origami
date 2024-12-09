(function() {
  if (app.documents.length === 0) {
      alert("Please open a document and select one or more lines.");
      return;
  }

  var doc = app.activeDocument;
  var selection = doc.selection;

  if (!(selection instanceof Array) || selection.length < 1) {
      alert("Please select at least one line segment.");
      return;
  }

  var duplicatedLines = []; // Array to hold duplicated lines

  // Loop through each selected item
  for (var i = 0; i < selection.length; i++) {
      var originalLine = selection[i];
      
      // Only process PathItems (line segments)
      if (originalLine.typename !== "PathItem") continue;

      if (originalLine.pathPoints.length !== 2) {
          alert("Please select simple line segments, not complex paths.");
          continue;
      }

      // Calculate the angle of the original line
      var p1 = originalLine.pathPoints[0].anchor;
      var p2 = originalLine.pathPoints[1].anchor;
      var dx = p2[0] - p1[0];
      var dy = p2[1] - p1[1];
      var angle = Math.atan2(dy, dx) * (180 / Math.PI); // Convert radians to degrees
      if (angle < 0) angle += 360; // Normalize to [0, 360)

      // Check if the angle is close to a multiple of 45 degrees (±5 degrees)
      var isNearMultipleOf45 = false;
      for (var j = 0; j < 360; j += 45) {
          if (Math.abs(angle - j) <= 5) {
              isNearMultipleOf45 = true;
              break;
          }
      }

      // Duplicate the original line
      var duplicatedLine = originalLine.duplicate();
      
      // Rotate the duplicated line by 90 degrees
      var centerX = (duplicatedLine.pathPoints[0].anchor[0] + duplicatedLine.pathPoints[1].anchor[0]) / 2;
      var centerY = (duplicatedLine.pathPoints[0].anchor[1] + duplicatedLine.pathPoints[1].anchor[1]) / 2;
      duplicatedLine.rotate(90, true, true, true, true, Transformation.CENTER);

      // Calculate control handles for a flatter arc
      var p1Dup = duplicatedLine.pathPoints[0];
      var p2Dup = duplicatedLine.pathPoints[1];

      var dxDup = (p2Dup.anchor[0] - p1Dup.anchor[0]) / 2;
      var dyDup = (p2Dup.anchor[1] - p1Dup.anchor[1]) / 2;

      // Calculate the length of the original line
      var lineLength = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

      // Flatten arc curvature by adjusting the control points closer to the center
      var flattenFactor = 0.3; // Adjust for flatter curve (0.0 - straight, 1.0 - full arc)
      var arcControlX = centerX + dyDup * flattenFactor;
      var arcControlY = centerY - dxDup * flattenFactor;

      // Define handle separation factor based on line length
      var handleSeparationFactor = lineLength * -0.3;

      // Calculate handle separation components based on the line's direction
      var handleOffsetX = (dxDup / lineLength) * handleSeparationFactor;
      var handleOffsetY = (dyDup / lineLength) * handleSeparationFactor;

      // Adjust handles symmetrically and parallel to the original line
      p1Dup.rightDirection = [arcControlX + handleOffsetX, arcControlY + handleOffsetY];
      p2Dup.leftDirection = [arcControlX - handleOffsetX, arcControlY - handleOffsetY];

      p1Dup.pointType = PointType.SMOOTH;
      p2Dup.pointType = PointType.SMOOTH;

      // Deselect the original line, leaving only the duplicated line selected
      duplicatedLines.push(duplicatedLine); // Add to the array of duplicated lines

      // Apply scaling if the angle is not close to a multiple of 45 degrees
      var scaleFactor = isNearMultipleOf45 ? 0.9 : 0.6; // Scale by 60% if not close to a multiple of 45 degrees

      // Save the current stroke width
      var strokeWidth = duplicatedLine.strokeWidth;

      // Get the bounds of the duplicated line to use as the scaling reference point
      var bounds = duplicatedLine.geometricBounds;
      centerX = (bounds[0] + bounds[2]) / 2;
      centerY = (bounds[1] + bounds[3]) / 2;

      // Create a scaling matrix for the transformation
      var scaleMatrix = app.getScaleMatrix(scaleFactor * 100, scaleFactor * 100, centerX, centerY);

      // Apply the scaling transformation to the path
      duplicatedLine.transform(scaleMatrix);

      // Restore the stroke width after scaling the path
      duplicatedLine.strokeWidth = strokeWidth;

      // Move the entire arc along the original line by 75% ONLY if the angle is NOT close to a multiple of 45 degrees
      if (!isNearMultipleOf45) {
          var moveFactor = 0.3; // Move by 75%
          var moveX = dx * moveFactor;
          var moveY = dy * moveFactor;

          // Move the entire duplicated arc along the direction of the line
          duplicatedLine.position = [duplicatedLine.position[0] + moveX, duplicatedLine.position[1] + moveY];
      }

      // Invert the direction of every other line
      if (i % 2 !== 0) {  // If the index is odd, invert the direction
          var temp = p1Dup.anchor;
          p1Dup.anchor = p2Dup.anchor;
          p2Dup.anchor = temp;

          temp = p1Dup.rightDirection;
          p1Dup.rightDirection = p2Dup.leftDirection;
          p2Dup.leftDirection = temp;
      }
  }

  // Select all duplicated arcs at the end
  doc.selection = duplicatedLines;

})();
