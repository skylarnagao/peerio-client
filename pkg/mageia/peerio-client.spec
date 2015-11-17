Summary: Peerio Client
Name: peerio-client
Version: 1.2.0
Release: 1%{?dist}
License: GPL3
Group: Applications/Internet
Source: https://linux.peerio.com/sources/rh-%{name}-%{version}.tar.gz
Patch0: https://linux.peerio.com/sources/00-build.patch
URL: https://peerio.com

BuildRequires: fakeroot
BuildRequires: make
BuildRequires: nodejs
BuildRequires: python-pip
BuildRequires: sudo
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
