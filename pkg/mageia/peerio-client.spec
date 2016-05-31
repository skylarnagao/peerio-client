Summary: Peerio Client
Name: peerio-client
Version: 1.4.2
Release: 1%{?dist}
License: GPL3
Group: Applications/Internet
Source: https://linux.peerio.com/sources/rh-%{name}-%{version}.tar.gz
Patch0: https://linux.peerio.com/sources/06-build.patch
URL: https://peerio.com

BuildRequires: git
BuildRequires: make
Requires: alsa-lib
Requires: glibc
Requires: cairo
Requires: libdbus1_3
Requires: fontconfig
Requires: GConf2
Requires: libgdk_pixbuf2.0_0
Requires: libgtk+3_0
Requires: libnotify
Requires: libxcomposite1
Requires: libxcursor1
Requires: libxdamage1
Requires: libxfixes3
Requires: libxi6
Requires: libxrandr2
Requires: libxrender1
Requires: libxscrnsaver1
Requires: libxtst6
Requires: nspr
Requires: nss
Requires: pango

%description
Peerio is a messaging and file sharing solution based on miniLock,
providing with strong end-to-end encryption.

%global __os_install_post %{nil}
%define debug_package %{nil}
%prep
%autosetup
%build
make

%install
make install PREFIX=%{buildroot}/usr/share BINPREFIX=%{buildroot}/usr

%clean
make clean

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
 * Tue May 31 2016 Samuel MARTIN MORO <samuel@peerio.com> 1.4.2-1
 - Add paid plan support
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
 * Mon Nov 19 2015 Samuel MARTIN MORO <samuel@peerio.com> 1.2.0-2
 - Fix a couple warnings (license & repository undefined)
 - remove python-pip dependency & transifex
 - install nw locally instead of globally
 * Tue Nov 17 2015 Samuel MARTIN MORO <samuel@peerio.com> 1.2.0-1
 - Initial Mageia release
