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
      var lineLength = Math.sqrt(dx * dx + dy * dy);

      // Normalize the direction vector of the line
      var lineUnitX = dx / lineLength;
      var lineUnitY = dy / lineLength;

      // Duplicate the original line
      var duplicatedLine = originalLine.duplicate();
      
      // Rotate the duplicated line by 90 degrees
      var centerX = (duplicatedLine.pathPoints[0].anchor[0] + duplicatedLine.pathPoints[1].anchor[0]) / 2;
      var centerY = (duplicatedLine.pathPoints[0].anchor[1] + duplicatedLine.pathPoints[1].anchor[1]) / 2;
      duplicatedLine.rotate(90, true, true, true, true, Transformation.CENTER);

      // Get control points of the duplicated line
      var p1Dup = duplicatedLine.pathPoints[0];
      var p2Dup = duplicatedLine.pathPoints[1];

      // Adjust control handles to form an arc
      var dxDup = (p2Dup.anchor[0] - p1Dup.anchor[0]) / 2;
      var dyDup = (p2Dup.anchor[1] - p1Dup.anchor[1]) / 2;

      var flattenFactor = 0.3;
      var arcControlX = centerX + dyDup * flattenFactor;
      var arcControlY = centerY - dxDup * flattenFactor;

      p1Dup.rightDirection = [arcControlX, arcControlY];
      p2Dup.leftDirection = [arcControlX, arcControlY];

      // Mirror one handle along the original line direction
      var handleX = p1Dup.rightDirection[0];
      var handleY = p1Dup.rightDirection[1];
      var handleVectorX = handleX - p1Dup.anchor[0];
      var handleVectorY = handleY - p1Dup.anchor[1];

      // Dot product to find projection of the handle vector onto the line
      var dot = handleVectorX * lineUnitX + handleVectorY * lineUnitY;

      // Project the handle vector onto the line
      var projX = dot * lineUnitX;
      var projY = dot * lineUnitY;

      // Reflect the handle vector across the line
      var mirroredHandleX = 2 * projX - handleVectorX;
      var mirroredHandleY = 2 * projY - handleVectorY;

      // Shorten the mirrored handle by 50%
      var handleLength = Math.sqrt(mirroredHandleX * mirroredHandleX + mirroredHandleY * mirroredHandleY);
      var shortenedFactor = 0.5; // 50%
      mirroredHandleX = (mirroredHandleX / handleLength) * (handleLength * shortenedFactor);
      mirroredHandleY = (mirroredHandleY / handleLength) * (handleLength * shortenedFactor);

      // Set the shortened mirrored handle
      p1Dup.rightDirection = [p1Dup.anchor[0] + mirroredHandleX, p1Dup.anchor[1] + mirroredHandleY];

      // Smooth point type
      p1Dup.pointType = PointType.SMOOTH;
      p2Dup.pointType = PointType.SMOOTH;

      // Deselect the original line, leaving only the duplicated line selected
      duplicatedLines.push(duplicatedLine);

      // Scale the duplicated line by 90% using p1Dup.anchor as the fixed point
      var scaleFactor = 0.95; // 95%
      var scaleCenterX = p1Dup.anchor[0];
      var scaleCenterY = p1Dup.anchor[1];

      // Perform scaling manually to avoid movement of the fixed vertex
      for (var j = 0; j < duplicatedLine.pathPoints.length; j++) {
          var point = duplicatedLine.pathPoints[j];
          
          // Compute scaled position relative to the fixed point
          var scaledX = scaleCenterX + (point.anchor[0] - scaleCenterX) * scaleFactor;
          var scaledY = scaleCenterY + (point.anchor[1] - scaleCenterY) * scaleFactor;

          // Update anchor point
          point.anchor = [scaledX, scaledY];

          // Scale control handles as well
          var rightHandleX = scaleCenterX + (point.rightDirection[0] - scaleCenterX) * scaleFactor;
          var rightHandleY = scaleCenterY + (point.rightDirection[1] - scaleCenterY) * scaleFactor;
          point.rightDirection = [rightHandleX, rightHandleY];

          var leftHandleX = scaleCenterX + (point.leftDirection[0] - scaleCenterX) * scaleFactor;
          var leftHandleY = scaleCenterY + (point.leftDirection[1] - scaleCenterY) * scaleFactor;
          point.leftDirection = [leftHandleX, leftHandleY];
      }
  }

  // Select all duplicated arcs at the end
  doc.selection = duplicatedLines;

})();
