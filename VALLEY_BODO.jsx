// Script for Illustrator CS6, folds a selection along the uppermost line  
if (app.documents.length > 0 && app.activeDocument.pathItems.length > 0) {
  var doc = app.activeDocument;
  var pathArray = [];
  var zMax = 0;
  var cutPath;
  var minY;
  var maxY;
  
  // Create groups for left (k=1) and right (k=0) sides
  var leftGroup = doc.groupItems.add();
  leftGroup.name = "Left Side Group";
  var rightGroup = doc.groupItems.add();
  rightGroup.name = "Right Side Group";
  
  // Analyze the paths
  for (var i = 0; i < doc.pathItems.length; i++) {
      var pathRef = doc.pathItems[i];
      if (!pathRef.selected || pathRef.pathPoints.length < 2) continue;

      zMax = Math.max(zMax, pathRef.zOrderPosition);
      
      if (pathRef.pathPoints.length == 2 && (!cutPath || cutPath.zOrderPosition < pathRef.zOrderPosition)) {
          cutPath = pathRef;
      }
      
      pathArray[pathRef.zOrderPosition] = pathRef;
      
      if (minY === undefined) {
          minY = pathRef.pathPoints[0].anchor[1];
          maxY = pathRef.pathPoints[0].anchor[1];
      }
                  
      for (var j = 0; j < pathRef.pathPoints.length; j++) {
          minY = Math.min(minY, pathRef.pathPoints[j].anchor[1]);
          maxY = Math.max(maxY, pathRef.pathPoints[j].anchor[1]);
      }
  }
  
  if (cutPath && pathArray.length > 1) {
      var backRGBColor = new RGBColor();
      backRGBColor.red = 254;
      backRGBColor.green = 251;
      backRGBColor.blue = 250;
      
      var cutPath_p0 = cutPath.pathPoints[0].anchor;
      var cutPath_p1 = cutPath.pathPoints[1].anchor;

      for (var k = 0; k < 2; k++) { // Right side (k=0), Left side (k=1)
          var startIndex = k == 0 ? 0 : zMax;
          var endIndex = k == 0 ? zMax + 1 : -1;
          var step = k == 0 ? 1 : -1;
                  
          for (var i = startIndex; i !== endIndex; i += step) {
              if (!pathArray[i] || pathArray[i] == cutPath) continue;
              
              var targetPointNum = pathArray[i].pathPoints.length;
              var newPointArray = [];
          
              for (var j = 0; j < targetPointNum; j++) {
                  if (isPointOnLine(pathArray[i].pathPoints[j].anchor, cutPath_p0, cutPath_p1)) {
                      newPointArray.push(pathArray[i].pathPoints[j].anchor);
                      continue;
                  }
              
                  if (k == 1) {
                      if (ccw(pathArray[i].pathPoints[j].anchor, cutPath_p0, cutPath_p1) == 1) {
                          newPointArray.push(getSymmetricPoint(pathArray[i].pathPoints[j].anchor, cutPath_p0, cutPath_p1));
                      }
                  } else {
                      if (ccw(pathArray[i].pathPoints[j].anchor, cutPath_p0, cutPath_p1) == -1) {
                          newPointArray.push(pathArray[i].pathPoints[j].anchor);
                      }
                  }
              
                  if (j != targetPointNum - 1) {
                      if (ccw(pathArray[i].pathPoints[j].anchor, cutPath_p0, cutPath_p1) !== 
                          ccw(pathArray[i].pathPoints[j+1].anchor, cutPath_p0, cutPath_p1)) {
                          newPointArray.push(getCrossPoint(cutPath_p0, cutPath_p1, pathArray[i].pathPoints[j].anchor, pathArray[i].pathPoints[j+1].anchor));
                      }
                  } else if (pathArray[i].closed) {                    
                      if (ccw(pathArray[i].pathPoints[j].anchor, cutPath_p0, cutPath_p1) !== 
                          ccw(pathArray[i].pathPoints[0].anchor, cutPath_p0, cutPath_p1)) {
                          newPointArray.push(getCrossPoint(cutPath_p0, cutPath_p1, pathArray[i].pathPoints[j].anchor, pathArray[i].pathPoints[0].anchor));
                      }
                  }
              }
          
              if (newPointArray.length > 1) {
                  for (var j = 0; j < newPointArray.length; j++) {
                    newPointArray[j][0] += 0; // Move the point 10 pixels to the right
                  }
              
                  var newPath = doc.pathItems.add();
                  newPath.setEntirePath(newPointArray);
                  newPath.stroked = pathArray[i].stroked;
                  newPath.strokeColor = pathArray[i].strokeColor;
                  newPath.strokeWidth = pathArray[i].strokeWidth;
                  newPath.strokeDashes = pathArray[i].strokeDashes;
                  newPath.strokeCap = pathArray[i].strokeCap;
                  newPath.strokeJoin = pathArray[i].strokeJoin;
                  newPath.filled = pathArray[i].filled;
                  newPath.closed = pathArray[i].closed;
              
                  if (k == 0) {
                      newPath.fillColor = pathArray[i].fillColor;
                      newPath.move(rightGroup, ElementPlacement.PLACEATBEGINNING);
                  } else {
                      newPath.fillColor = backRGBColor;
                      newPath.zOrder(ZOrderMethod.BRINGTOFRONT);
                      newPath.move(leftGroup, ElementPlacement.PLACEATEND);
                  }
              }
          }
      }
      
      // Bring the leftGroup to the front of rightGroup
      leftGroup.zOrder(ZOrderMethod.BRINGTOFRONT);
  }
}

// Utility functions for geometry
function isPointOnLine(p, sp, ep) {
  return getDistanceToLine(p, sp, ep) < 0.01;
}

function getDistanceToLine(p, sp, ep) {
  var q = getNearestPointToLine(p, sp, ep);
  return getDistanceBetweenTwoPoints(p, q);
}

function getDistanceBetweenTwoPoints(p, q) {
  return Math.sqrt((p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1]));
}

function getNearestPointToLine(p, sp, ep) {
  var x0 = sp[0];
  var y0 = sp[1];
  var x1 = ep[0];
  var y1 = ep[1];
  var px = p[0];
  var py = p[1];

  var sub0 = [x0 - px, y0 - py];
  var sub1 = [x1 - px, y1 - py];
  var sub0b = [-sub0[0], -sub0[1]];   
  var sub = [x1 - x0, y1 - y0];
          
  var t = ((sub[0] * sub0b[0]) + (sub[1] * sub0b[1])) /
              ((sub[0] * sub[0]) + (sub[1] * sub[1]));

  return [x0 + t * sub[0], y0 + t * sub[1]];
}

function getSymmetricPoint(p, sp, ep) {
  var cp = getNearestPointToLine(p, sp, ep);        
  return [2 * cp[0] - p[0], 2 * cp[1] - p[1]];
}

function ccw(p, sp, ep) {
  var dx1 = ep[0] - sp[0]; 
  var dy1 = ep[1] - sp[1];
  var dx2 = p[0] - sp[0];
  var dy2 = p[1] - sp[1];

  if (dx1 * dy2 > dy1 * dx2) return 1;    
  if (dx1 * dy2 < dy1 * dx2) return -1;

  return 0;
}

function getCrossPoint(p1, p2, p3, p4) {
  var a1 = (p1[1] - p2[1]);
  var a2 = (p3[1] - p4[1]);
  var b1 = (p2[0] - p1[0]);
  var b2 = (p4[0] - p3[0]);

  if (a1 * b2 - a2 * b1 === 0) { return null; }

  var c1 = p1[0] * p2[1] - p2[0] * p1[1];
  var c2 = p3[0] * p4[1] - p4[0] * p3[1];

  return [(b1 * c2 - b2 * c1) / (a1 * b2 - a2 * b1), (a1 * c2 - a2 * c1) / (a2 * b1 - a1 * b2)];
}
