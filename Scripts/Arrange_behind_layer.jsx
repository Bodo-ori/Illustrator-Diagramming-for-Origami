// Adobe Illustrator CS6 Script to move the top open path right behind the other selected objects, including groups
// and deselect everything except for the original open path.

if (app.documents.length > 0) {
    var doc = app.activeDocument;
    var selectionItems = doc.selection;

    if (selectionItems.length < 2) {
        alert("Please select at least two objects.");
    } else {
        var openPathItem = null;

        // Find the topmost open path
        for (var i = 0; i < selectionItems.length; i++) {
            var item = selectionItems[i];
            if (item.typename === "PathItem" && !item.closed) {
                openPathItem = item;
                break;
            }
        }

        if (openPathItem) {
            // Deselect everything, then reselect the open path
            doc.selection = null;
            openPathItem.selected = true;

            // Collect all other selected items except the open path
            var otherItems = [];
            for (var j = 0; j < selectionItems.length; j++) {
                if (selectionItems[j] !== openPathItem) {
                    otherItems.push(selectionItems[j]);
                }
            }

            // If there are selected items other than the open path, move the open path behind them
            if (otherItems.length > 0) {
                // Identify the topmost item (last one in selection), which will be the "front" of the selection
                var topmostItem = otherItems[otherItems.length - 1];

                // Move the open path directly behind the topmost item, not affecting their relative order
                openPathItem.move(topmostItem, ElementPlacement.PLACEAFTER);
                           } else {
                alert("No other items to move the open path behind.");
            }

            // Deselect everything except for the original open path
            doc.selection = null;
            openPathItem.selected = true;

        } else {
            alert("No open paths were found in the selection.");
        }
    }
} else {
    alert("No document open.");
}