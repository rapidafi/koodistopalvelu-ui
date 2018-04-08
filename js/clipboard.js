var clipboard = new Clipboard('.clip');
clipboard.on('success', function(e) {
    e.clearSelection();
});
clipboard.on('error', function(e) {
    console.log(e);
});
