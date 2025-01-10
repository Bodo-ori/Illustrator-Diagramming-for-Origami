#target illustrator

function invertSelectionZOrder() {
    if (app.documents.length === 0) {
        alert("No document is open.");
        return;
    }

    var doc = app.activeDocument;
    var selectedItems = doc.selection;

    if (selectedItems.length === 0) {
        alert("No objects or groups are selected.");
        return;
    }

    // Flatten the selection to handle groups and nested groups
    var flattenedItems = flattenSelection(selectedItems);

    // Reverse the Z order of the entire selection, including groups and contents
    for (var i = flattenedItems.length - 1; i >= 0; i--) {
        var item = flattenedItems[i];

        // Send each item to the front in reverse order (last selected will be brought to the front)
        item.zOrder(ZOrderMethod.SENDTOBACK);
    }

    alert("Z order of selected objects (including groups) inverted successfully.");
}

// Function to flatten the selection (unpack groups)
function flattenSelection(items) {
    var result = [];

    for (var i = 0; i < items.length; i++) {
        var item = items[i];

        if (item.typename === "GroupItem") {
            // If the item is a group, recursively flatten its contents
            result = result.concat(flattenSelection(item.pageItems));
            result.push(item);  // Add the group itself to be reordered
        } else {
            // If it's not a group, just add it to the result
            result.push(item);
        }
    }

    return result;
}

invertSelectionZOrder();