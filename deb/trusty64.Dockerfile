# Dockerfile
FROM ubuntu:trusty

# Local caches - only set those you actually have
#ENV apt_proxy http://10.42.44.100:3142/
#ENV http_proxy http://10.42.44.100:3128/
#ENV https_proxy http://10.42.44.100:3128/
# Transifex account configuration - mandatory, set yours!
ENV TRANSIFEX_PASS XXXX
ENV TRANSIFEX_USER your_transifex_username

# Arch to output
ENV ARCH 64
ENV PKG_ARCH amd64
ENV PKG_VERSION 0.1
ENV PKG_NAME peerio-client-$PKG_VERSION

ENV NODE_BIN_DIR=/usr/bin
ENV DEBIAN_FRONTEND=noninteractive 

RUN test "$apt_proxy" && echo 'Acquire::http { Proxy "$apt_proxy"; };' >/etc/apt/apt.conf.d/01proxy
RUN apt-get update && apt-get install -y \ 
    build-essential \ 
    curl \ 
    devscripts \ 
    gcc-multilib \
    git \ 
    lsb-release \ 
    make \ 
    nodejs \
    npm \
    python-pip \
    rsync \ 
    sudo

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
WORKDIR /usr/src
RUN mkdir -p $PKG_NAME/DEBIAN $PKG_NAME/usr/share/peerio-client/icons $PKG_NAME/usr/share/man/man1 $PKG_NAME/usr/share/doc/peerio-client $PKG_NAME/usr/bin
WORKDIR /usr/src/$PKG_NAME
RUN rsync -avWxzP /usr/src/peerio-client/build/Peerio/linux$ARCH/ usr/share/peerio-client/
RUN rsync -avWxzP /usr/src/peerio-client/application/img/ usr/share/peerio-client/icons/
ADD https://raw.githubusercontent.com/PeerioTechnologies/peerio-client/master/deb/control DEBIAN/control
RUN sed -i "s|/ARCH/|$PKG_ARCH|" DEBIAN/control
ADD https://raw.githubusercontent.com/PeerioTechnologies/peerio-client/master/deb/copyright usr/share/doc/peerio-client/copyright
ADD https://raw.githubusercontent.com/PeerioTechnologies/peerio-client/master/LICENSE.md usr/share/doc/peerio-client/LICENSE.md
ADD https://raw.githubusercontent.com/PeerioTechnologies/peerio-client/master/deb/man.1 usr/share/man/man1/peerio-client.1
ADD https://raw.githubusercontent.com/PeerioTechnologies/peerio-client/master/deb/peerio-client usr/bin/peerio-client
RUN cd usr/share/man/man1 && gzip -9 -f peerio-client.1
RUN find . -type f -exec chmod 644 {} \;
RUN find . -type d -exec chmod 755 {} \;
RUN chmod 755 usr/share/peerio-client/Peerio
WORKDIR /usr/src
RUN dpkg-deb --build $PKG_NAME
