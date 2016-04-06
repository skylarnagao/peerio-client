Summary: Peerio Client
Name: peerio-client
Version: 1.4.1
Release: 1%{?dist}
License: GPL3
Group: Applications/Internet
Source: https://linux.peerio.com/sources/rh-%{name}-%{version}.tar.gz
Patch0: https://linux.peerio.com/sources/05-build.patch
URL: https://peerio.com

BuildRequires: make
BuildRequires: nodejs
Requires: libasound2
Requires: libglib-2_0-0
Requires: libcairo2
Requires: dbus-1-glib
Requires: fontconfig
Requires: gconf2
Requires: libgdk_pixbuf-2_0-0
Requires: libgtk-3-0
Requires: libnotify4
Requires: libXcomposite1
Requires: libXcursor1
Requires: libXdamage1
Requires: libXfixes3
Requires: libXi6
Requires: libXrandr2
Requires: libXrender1
Requires: libXtst6
Requires: mozilla-nspr
Requires: mozilla-nss
Requires: libpango-1_0-0

%description
Peerio is a messaging and file sharing solution based on miniLock,
providing with strong end-to-end encryption.

%global __os_install_post %{nil}
%define debug_package %{nil}
%prep
%autosetup
%build
sed -i 's|Icon=peerio-client.png|Icon=peerio-client|' pkg/desktop
make

%install
make install PREFIX=%{buildroot}/usr/share BINPREFIX=%{buildroot}/usr

%clean
make clean PREFIX=%{buildroot}/usr/share BINPREFIX=%{buildroot}/usr

%files
%defattr(-,root,root)
%doc README.md
%dir %{_datadir}/peerio-client
%dir %{_datadir}/peerio-client/lib
%dir %{_datadir}/peerio-client/locales
%{_datadir}/peerio-client/icudtl.dat
%{_datadir}/peerio-client/lib/*.so
%{_datadir}/peerio-client/locales/*pak
%{_datadir}/peerio-client/natives_blob.bin
%{_datadir}/peerio-client/nw.pak
%{_datadir}/peerio-client/nw_100_percent.pak
%{_datadir}/peerio-client/Peerio
%{_datadir}/peerio-client/resources.pak
%{_datadir}/peerio-client/snapshot_blob.bin
%{_bindir}/peerio-client
%{_datadir}/applications/peerio-client.desktop
%{_datadir}/icons/hicolor/*/apps/peerio-client.png
%{_datadir}/pixmaps/peerio-client.png
%{_mandir}/man1/peerio-client.1.gz

%changelog
 * Mon Apr 4 2016 Samuel MARTIN MORO <samuel@peerio.com> 1.4.1-1
 - Couple bugfixes
 * Tue Mar 15 2016 Samuel MARTIN MORO <samuel@peerio.com> 1.4.0-1
 - Removed "beta"
 * Fri Feb 26 2016 Samuel MARTIN MORO <samuel@peerio.com> 1.3.1-1
 - Disabled read receipt encryption
 - New file manager domains
 * Thu Feb 11 2016 Samuel MARTIN MORO <samuel@peerio.com> 1.3.0-1
 - Enforcei API v1.1.0 support
 - various bugfixes
 * Mon Jan 11 2016 Samuel MARTIN MORO <samuel@peerio.com> 1.2.1-1
 - Add Peerio API v2 support
 * Wed Nov 18 2015 Samuel MARTIN MORO <samuel@peerio.com> 1.2.0-1
 - Initial OpenSuSE release
