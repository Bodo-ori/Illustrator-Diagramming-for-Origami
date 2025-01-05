// Allows for automatically switching the angle-snapping behavior of the pen key from
// 0+45n degrees to 22.5+45n degrees and back. It's best saved as an action with a 
// hotkey to quickly switch back and forth, as an alternative to relying on the construction
// guides.  Unfortunately, the most recent anchor point must be reselected after the
// script is called (Can this be fixed?).

try {
    var doc = app.activeDocument;
    var currentAngle = app.preferences.getRealPreference('constrain/angle');

    // Save the active selection
    var activeSelection = doc.selection;

    // Toggle Constrain Angle
    if (currentAngle === 0) {
        app.preferences.setRealPreference('constrain/angle', 22.5);
    } else {
        app.preferences.setRealPreference('constrain/angle', 0);
    }

    // Restore the active selection
    if (activeSelection.length > 0) {
        doc.selection = activeSelection;
    }
} catch (e) {
    alert("Error toggling Constrain Angle: " + e.message);
}
