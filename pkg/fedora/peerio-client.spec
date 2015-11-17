Summary: Peerio Client
Name: peerio-client
Version: 1.2.0
Release: 1%{?dist}
License: GPL3
Group: Applications/Internet
Source: https://dl.peerio.com/sources/rh-%{name}-%{version}.tar.gz
Patch0: https://dl.peerio.com/sources/00-build.patch
URL: https://peerio.com

BuildRequires: fakeroot
BuildRequires: make
BuildRequires: npm
BuildRequires: python-pip
BuildRequires: sudo
Requires: alsa-lib
Requires: glibc
Requires: cairo
Requires: dbus-libs
Requires: fontconfig
Requires: GConf2
Requires: gdk-pixbuf2
Requires: gtk3
Requires: libnotify
Requires: libXcomposite
Requires: libXcursor
Requires: libXdamage
Requires: libXfixes
Requires: libXi
Requires: libXrandr
Requires: libXrender
Requires: libXtst
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
%dir %{_datadir}/peerio-client/locales
%{_datadir}/peerio-client/icudtl.dat
%{_datadir}/peerio-client/libffmpegsumo.so
%{_datadir}/peerio-client/nw.pak
%{_datadir}/peerio-client/Peerio
%{_datadir}/peerio-client/locales/*pak
%{_bindir}/peerio-client
%{_datadir}/applications/peerio-client.desktop
%{_datadir}/icons/hicolor/*/apps/peerio-client.png
%{_datadir}/pixmaps/peerio-client.png
%{_mandir}/man1/peerio-client.1.gz

%changelog
 * Tue Nov 17 2015 Samuel MARTIN MORO <samuel@peerio.com> 1.2.0-1
 - Initial Centos/Fedora release
