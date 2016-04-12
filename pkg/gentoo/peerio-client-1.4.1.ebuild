# Copyright 1999-2015 Gentoo Foundation
# Distributed under the terms of the GNU General Public License v3
# $Id$

EAPI="1"

DESCRIPTION="Peerio Client"
HOMEPAGE="https://peerio.com"
SRC_URI="https://linux.peerio.com/sources/rh-${PN}-${PV}.tar.gz"

LICENSE="GPL3"
RDEPEND="media-libs/alsa-lib
    x11-libs/cairo
    media-libs/fontconfig
    media-plugins/gst-plugins-gdkpixbuf
    x11-libs/libnotify
    dev-libs/nspr
    dev-libs/nss
    x11-libs/pango
    x11-libs/libXcomposite
    x11-libs/libXcursor
    x11-libs/libXdamage
    x11-libs/libXfixes
    x11-libs/libXi
    x11-libs/libXScrnSaver
    x11-libs/libXrandr
    x11-libs/libXrender
    x11-libs/libXtst"
# libdbus
# gtk2 or 3?
DEPEND="$RDEPEND
    net-misc/curl
    sys-apps/fakeroot
    sys-devel/patch
    net-libs/nodejs
    dev-python/pip
    dev-vcs/git
    app-admin/sudo"
RESTRICT="strip"
SLOT="0"
KEYWORDS="~alpha amd64 ~arm ~hppa ~ia64 ~ppc ~ppc64 ~s390 ~sh ~sparc x86"

src_install() {
    curl http://linux.peerio.com/sources/05-build.patch >build.patch
    patch -p0 <build.patch && rm -f build.patch
    emake install PREFIX="${D}/usr/share" BINPREFIX="${D}/usr"
}
