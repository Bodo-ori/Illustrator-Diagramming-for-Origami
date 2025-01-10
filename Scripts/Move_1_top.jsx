// Move open paths up by 1 position in the Z-order, including those inside groups
function moveOpenPathsUpInZOrder() {
    // Get the selected items in the active document
    var selectedItems = app.activeDocument.selection;

    // Create an array to store the open paths
    var openPaths = [];

    // Loop through selected items to find only the open paths
    for (var i = 0; i < selectedItems.length; i++) {
        var currentItem = selectedItems[i];

        // If the item is a group, loop through its children
        if (currentItem.typename == "GroupItem") {
            for (var j = 0; j < currentItem.pageItems.length; j++) {
                var groupItem = currentItem.pageItems[j];
                // Check if the item is an open path (closed == false)
                if (groupItem.typename == "PathItem" && !groupItem.closed) {
                    openPaths.push(groupItem);  // Add the open path inside the group
                }
            }
        } else if (currentItem.typename == "PathItem" && !currentItem.closed) {
            // If it's an open path, add it to the openPaths array
            openPaths.push(currentItem);
        }
    }

    // Loop through each open path and move it up by 1 position in the Z-order
    for (var k = 0; k < openPaths.length; k++) {
        var currentPath = openPaths[k];

        // Move each open path up one position in the Z-order (to the layer above it)
        currentPath.zOrder(ZOrderMethod.BRINGFORWARD);
    }
}

// Call the function to move the open paths
moveOpenPathsUpInZOrder();