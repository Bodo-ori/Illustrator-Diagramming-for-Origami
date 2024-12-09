// Illustrator Script to Create Circles at Both Ends of a Line
// The original line is deselected, and the circles stay selected

// Define a function to convert millimeters to points
function mmToPoints(mm) {
    return mm * 2.83465; // Conversion factor
}

// Radius of the circles in mm
var circleRadiusMM = 0.8; // 0.8mm radius
var circleRadius = mmToPoints(circleRadiusMM);

// Get the active document
var doc = app.activeDocument;

// Check if any path item is selected
if (app.selection.length === 1 && app.selection[0].typename === "PathItem") {
    var line = app.selection[0];
    
    // Ensure the line is a straight line (only two anchor points)
    if (line.pathPoints.length === 2) {
        var startPoint = line.pathPoints[0].anchor; // Start point of the line
        var endPoint = line.pathPoints[1].anchor;   // End point of the line

        // Deselect the original line
        line.selected = false;

        // Create a group for the new circles
        var newCircles = [];

        // Create a circle at the start point
        var startCircle = doc.pathItems.ellipse(
            startPoint[1] + circleRadius, // Top
            startPoint[0] - circleRadius, // Left
            circleRadius * 2,            // Width
            circleRadius * 2,            // Height
            false,                       // Reversed
            true                         // Inscribed
        );
        newCircles.push(startCircle);

        // Create a circle at the end point
        var endCircle = doc.pathItems.ellipse(
            endPoint[1] + circleRadius, // Top
            endPoint[0] - circleRadius, // Left
            circleRadius * 2,          // Width
            circleRadius * 2,          // Height
            false,                     // Reversed
            true                       // Inscribed
        );
        newCircles.push(endCircle);

        // Select the new circles
        for (var i = 0; i < newCircles.length; i++) {
            newCircles[i].selected = true;
        }
    } else {
        alert("Please select a straight line with two anchor points.");
    }
} else {
    alert("Please select a single line.");
}
