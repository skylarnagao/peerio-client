# Dockerfile
FROM debian:jessie

# Local caches - only set those you actually have such caches
#ENV apt_proxy http://10.42.44.100:3142/
#ENV http_proxy http://10.42.44.100:3128/
#ENV https_proxy http://10.42.44.100:3128/
# Transifex account configuration - mandatory, set yours!
ENV TRANSIFEX_PASS XXXX
ENV TRANSIFEX_USER your_transifex_username

# Arch to output
ENV ARCH 64
ENV PKG_ARCH amd64
ENV PKG_VERSION 1.1.5
ENV PKG_REL 1
ENV PKG_NAME peerio-client_$PKG_VERSION-${PKG_REL}_$PKG_ARCH

ENV NODE_BIN_DIR=/usr/bin
ENV DEBIAN_FRONTEND=noninteractive 

RUN test "$apt_proxy" && echo 'Acquire::http { Proxy "$apt_proxy"; };' >/etc/apt/apt.conf.d/01proxy
RUN apt-get update && apt-get install -y \
    build-essential curl devscripts gcc-multilib git lsb-release make nodejs npm python-pip rsync sudo

RUN test -x $NODE_BIN_DIR/nodejs -a ! -x $NODE_BIN_DIR/node && ln -sf $NODE_BIN_DIR/nodejs $NODE_BIN_DIR/node
RUN pip install transifex-client
RUN npm install -g nw
ADD https://raw.githubusercontent.com/PeerioTechnologies/peerio-client/master/deb/transifex.rc /root/.transifexrc
RUN sed -i -e "s|/LOGIN/|$TRANSIFEX_USER|" -e "s|/PASS/|$TRANSIFEX_PASS|" /root/.transifexrc
RUN git clone https://github.com/PeerioTechnologies/peerio-client /usr/src/peerio-client
WORKDIR /usr/src/peerio-client
RUN npm install
RUN sed -i '/^[ \t]*winIco: /d' gulpfile.js
RUN ./node_modules/.bin/gulp build
RUN mkdir ../$PKG_NAME
WORKDIR /usr/src/$PKG_NAME
RUN mkdir -p DEBIAN usr/share/man/man1 usr/share/doc/peerio-client usr/bin usr/share/applications usr/share/icons/hicolor/16x16/apps usr/share/icons/hicolor/32x32/apps usr/share/icons/hicolor/48x48/apps usr/share/icons/hicolor/64x64/apps usr/share/icons/hicolor/128x128/apps
RUN rsync -avWxzP /usr/src/peerio-client/build/Peerio/linux$ARCH/ usr/share/peerio-client/
ADD https://raw.githubusercontent.com/PeerioTechnologies/peerio-client/master/LICENSE.md usr/share/doc/peerio-client/LICENSE.md
ADD https://raw.githubusercontent.com/PeerioTechnologies/peerio-client/master/application/img/icon16.png usr/share/icons/hicolor/16x16/apps/peerio-client.png
ADD https://raw.githubusercontent.com/PeerioTechnologies/peerio-client/master/application/img/icon32.png usr/share/icons/hicolor/32x32/apps/peerio-client.png
ADD https://raw.githubusercontent.com/PeerioTechnologies/peerio-client/master/application/img/icon48.png usr/share/icons/hicolor/48x48/apps/peerio-client.png
ADD https://raw.githubusercontent.com/PeerioTechnologies/peerio-client/master/application/img/icon64.png usr/share/icons/hicolor/64x64/apps/peerio-client.png
ADD https://raw.githubusercontent.com/PeerioTechnologies/peerio-client/master/application/img/icon128.png usr/share/icons/hicolor/128x128/apps/peerio-client.png
ADD https://raw.githubusercontent.com/PeerioTechnologies/peerio-client/master/deb/control DEBIAN/control
ADD https://raw.githubusercontent.com/PeerioTechnologies/peerio-client/master/deb/copyright usr/share/doc/peerio-client/copyright
ADD https://raw.githubusercontent.com/PeerioTechnologies/peerio-client/master/deb/peerio-client usr/bin/peerio-client
ADD https://raw.githubusercontent.com/PeerioTechnologies/peerio-client/master/deb/desktop usr/share/applications/peerio-client.desktop
ADD https://raw.githubusercontent.com/PeerioTechnologies/peerio-client/master/deb/man.1 usr/share/man/man1/peerio-client.1
RUN sed -i -e "s|/ARCH/|$PKG_ARCH|" -e "s|/VERSION/|$PKG_VERSION|" -e "s|/PKGREL/|$PKG_REL|" DEBIAN/control
RUN cd usr/share/man/man1 && gzip -9 -f peerio-client.1
RUN find . -type f -exec chmod 0644 {} \;
RUN find . -type d -exec chmod 0755 {} \;
RUN chmod 0755 usr/share/peerio-client/Peerio usr/bin/peerio-client
WORKDIR /usr/src
RUN dpkg-deb --build $PKG_NAME
