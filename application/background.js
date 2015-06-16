chrome.app.runtime.onLaunched.addListener(function() {
	var startingWidth  = window.screen.availWidth  - 200
	var startingHeight = window.screen.availHeight - 100
	chrome.app.window.create('index.html', {
		minWidth: 1100,
		minHeight: 670,
		maxWidth: 3840,
		maxHeight: 2160,
		width: startingWidth,
		height: startingHeight,
		resizable: true
	})
})
