// ---------------------
// Peerio
// ---------------------
//
// Peerio.

// shortcut to localisation function
window.l = function (n) {
	return document.l10n.getEntitySync(n).value;
};

Peerio = window.Peerio || {}

// used as hack to separate normal string from object strings in notes/todos/passwords
Peerio.objSignature = '<#Þêèrîõôßj#>';

// if mobile app didn't set flag to true, considering it false
Peerio.isMobile = Peerio.isMobile || false;

// Initialization code for some node-webkit features.
if (typeof(require) === 'function') {
	var gui = require('nw.gui')

	// Add Mac native menubar
	if (navigator.appVersion.indexOf('Mac') >= 0) {
		Peerio.platform = 'mac';
		var win = gui.Window.get();
		var nativeMenuBar = new gui.Menu({ type: 'menubar' });
		nativeMenuBar.createMacBuiltin('Peerio');
		win.menu = nativeMenuBar;
	} else {
		Peerio.platform = process.platform;
	}

	// Check for update
	setTimeout(function() {
		if (typeof(require) === 'function') {
			$('a').unbind().on('click', function(e) {
				e.preventDefault()
				gui.Shell.openExternal($(this).attr('href'))
			})
		}
		$.get(Peerio.config.updateJSON, function(info) {
			if (
				!hasProp(info, 'latest') ||
				!hasProp(info, 'minimum')
			) {
				return false
			}
			if (Peerio.config.buildID < info.minimum) {
				swal(
					{
						title: document.l10n.getEntitySync('updateAvailableCritical').value,
						text: process.platform === 'linux' ? document.l10n.getEntitySync('updateAvailableCriticalLinuxText').value : document.l10n.getEntitySync('updateAvailableCriticalText').value,
						type: 'warning',
						confirmButtonText: process.platform === 'linux' ? document.l10n.getEntitySync('linuxPackageInfo').value : document.l10n.getEntitySync('updateDownload').value,
						showCancelButton: false,
						confirmButtonColor: '#85c573'
					},
					function() {
						if (navigator.appVersion.indexOf('Win') >= 0) {
							gui.Shell.openExternal(Peerio.config.updateWin)
						}
						else if (navigator.appVersion.indexOf('Mac') >= 0) {
							gui.Shell.openExternal(Peerio.config.updateMac)
						} else {
							gui.Shell.openExternal(Peerio.config.updateLin)
						}

						setTimeout(function() {
							gui.App.quit()
						}, 1000)
					}
				)
			}
			else if (Peerio.config.buildID < info.latest) {
				swal(
					{
						title: document.l10n.getEntitySync('updateAvailable').value,
						text: process.platform === 'linux' ? document.l10n.getEntitySync('updateAvailableLinuxText').value : document.l10n.getEntitySync('updateAvailableText').value,
						type: 'info',
						confirmButtonText: process.platform === 'linux' ? document.l10n.getEntitySync('linuxPackageInfo').value : document.l10n.getEntitySync('updateDownload').value,
						showCancelButton: true,
						confirmButtonColor: '#85c573',
						cancelButtonText: document.l10n.getEntitySync('later').value
					},
					function() {
						if (navigator.appVersion.indexOf('Win') >= 0) {
							gui.Shell.openExternal(Peerio.config.updateWin)
						}
						else if (navigator.appVersion.indexOf('Mac') >= 0) {
							gui.Shell.openExternal(Peerio.config.updateMac)
						} else {
							gui.Shell.openExternal(Peerio.config.updateLin)
						}
					}
				)
			}
		})
	}, 3000)

	// Catch process errors
	process.on('uncaughtException', function(e) { console.log(e) })
} else {
	Peerio.platform = 'chrome';
}
