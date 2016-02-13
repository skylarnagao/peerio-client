%define name peerio-client
%define version 1.3.0
%define release %mkrel 1
Summary: Peerio Client
Name: %{name}
Version: %{version}
Release: %{release}
License: GPL3
Group: Applications/Internet
Source: https://linux.peerio.com/sources/rh-%{name}-%{version}.tar.gz
Patch0: https://linux.peerio.com/sources/03-build.patch
URL: https://peerio.com

#nodejs & npm, not packaged in provider repos, have to be installed
BuildRequires: pkgutils
BuildRequires: sudo
Requires: libalsa
Requires: libglib2
%ifarch x86_64
Requires: lib64cairo2
%else
Requires: libcairo2
%endif
Requires: libdbus-glib
Requires: libfontconfig
Requires: GConf2
Requires: libgdk_pixbuf2.0
Requires: libgtk+3
Requires: libnotify
Requires: libxcomposite
Requires: libxcursor
Requires: libxdamage
Requires: libxfixes
Requires: libxi
Requires: libxrandr
Requires: libxrender
Requires: libxtst
Requires: nspr
Requires: nss
Requires: libpango

%description
Peerio is a messaging and file sharing solution based on miniLock,
providing with strong end-to-end encryption.

%global __os_install_post %{nil}
%define debug_package %{nil}
%prep
%setup -q -n %{name}-%{version}
%patch0
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
 * Thu Feb 11 2016 Samuel MARTIN MORO <samuel@peerio.com> 1.3.0-1
 - Enforcei API v1.1.0 support
 - various bugfixes
 * Mon Jan 11 2016 Samuel MARTIN MORO <samuel@peerio.com> 1.2.1-1
 - Add Peerio API v2 support
 * Mon Nov 19 2015 Samuel MARTIN MORO <samuel@peerio.com> 1.2.0-2
 - Fix a couple warnings (license & repository undefined)
 - remove python-pip dependency & transifex
 - install nw locally instead of globally
 * Mon Nov 17 2015 Samuel MARTIN MORO <samuel@peerio.com> 1.2.0-1
 - Initial Centos/Fedora release
