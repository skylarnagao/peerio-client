BINPREFIX = /usr
PREFIX    = /usr/share
XPREFIX   = $(PREFIX)

PROG_NAME = peerio-client
APP_DIR   = $(PREFIX)/$(PROG_NAME)
BIN_DIR   = $(BINPREFIX)/bin
DOC_DIR   = $(PREFIX)/doc
DSK_DIR   = $(XPREFIX)/applications
ICON_DIR  = $(XPREFIX)/icons/hicolor
PIX_DIR   = $(XPREFIX)/pixmaps
MAN_DIR   = $(PREFIX)/man/man1
OBJ       = build/Peerio/chrome

UGLIFY_SOURCES = application/js/lib/angular application/js/lib/hotkeys application/js/lib/papaparse application/js/lib/pouchdb application/js/lib/qrcode application/js/lib/sweet-alert application/js/lib/zepto
#FIXME: zxcvbn should be listed here as well
#	I can't figure out where our version came from
#	--doesn't match the released version while it was pushed here

ifeq ($(OS),Windows_NT)
    EMBED_NODEJS = no
    OBJ = build/Peerio/win32
else
    UNAME_M := $(shell uname -m)
    UNAME_S := $(shell uname -s)
    ifeq ($(UNAME_S),Linux)
	EMBED_NODEJS = yes
	NODE_VERSION = 4.4.1
	ifeq ($(UNAME_M),x86_64)
	    DARCH = x64
	    OBJ = build/Peerio/linux64
	else
	    DARCH = x86
	    OBJ = build/Peerio/linux32
	endif
    else
	EMBED_NODEJS = no
    endif
    ifeq ($(UNAME_S),Darwin)
	OBJ = build/Peerio/osx32
    endif
endif

all: client

ifeq ($(EMBED_NODEJS),yes)
confdeps:
	if ! test -d tmp/nodejs; then \
	    mkdir -p tmp; \
	    if wget https://nodejs.org/dist/v$(NODE_VERSION)/node-v$(NODE_VERSION)-linux-${DARCH}.tar.xz -O tmp/peerio-nodejs.tar.xz; then \
		if tar -Ctmp -xJf tmp/peerio-nodejs.tar.xz; then \
		    mv tmp/node-v$(NODE_VERSION)-linux-$(DARCH) tmp/nodejs; \
		else \
		    echo failed extracting nodejs >&2; \
		    exit 1; \
		fi; \
		rm -f tmp/peerio-nodejs.tar.xz; \
	    else \
		echo failed fetching nodejs >&2; \
		exit 1; \
	    fi; \
	fi; \
	if ! test -d build; then \
	    test -x node_modules/.bin/nw || PATH=`pwd`/tmp/nodejs/bin:$$PATH npm install; \
	    test -d application/node_modules || ( cd application && PATH=`pwd`/../tmp/nodejs/bin:$$PATH npm install ) ; \
	fi

patchbuilder:
	if ! test -s ./node_modules/nw-builder/package.json; then \
	    PATH=`pwd`/tmp/nodejs/bin:$$PATH npm install nw-builder; \
	fi; \
	if ! grep '0\.13\.0-' ./node_modules/nw-builder/lib/platforms.js >/dev/null; then \
	    patch -p0 <./pkg/nwbuilder.patch; \
	fi

uglify:
	test -x ./node_modules/.bin/uglifyjs || PATH=`pwd`/tmp/nodejs/bin:$$PATH npm install uglify-js
	for lib in $(UGLIFY_SOURCES); do \
	    if test -s $$lib.js; then \
		continue; \
	    elif echo $$lib | grep socket.io >/dev/null; then \
		cat $$lib.src*.js | PATH=`pwd`/tmp/nodejs/bin:$$PATH ./node_modules/.bin/uglifyjs -o $$lib.js; \
	    elif echo $$lib | grep -E '(angular|bluebird|papaparse|pouchdb|qrcode|sweet-alert)' >/dev/null; then \
		cat $$lib.src*.js | PATH=`pwd`/tmp/nodejs/bin:$$PATH ./node_modules/.bin/uglifyjs --mangle -o $$lib.js; \
	    else \
		cat $$lib.src*.js | PATH=`pwd`/tmp/nodejs/bin:$$PATH ./node_modules/.bin/uglifyjs --compress --mangle -o $$lib.js; \
	    fi; \
	    rm -f $$lib.src*.js; \
	done

client: confdeps patchbuilder uglify
	if ! test -d build; then \
	    sync; \
	    PATH=`pwd`/tmp/nodejs/bin:$$PATH ./node_modules/.bin/gulp build; \
	fi; \
	if test -s ./tmp/nw/0.13.3/linux32/nw_100_percent.pak; then \
	    rm -fr build; \
	    cp -p ./tmp/nw/0.13.3/linux32/nw_100_percent.pak ./tmp/nw/0.13.3/linux32/nw.pak; \
	    cp -p ./tmp/nw/0.13.3/linux64/nw_100_percent.pak ./tmp/nw/0.13.3/linux64/nw.pak; \
	    PATH=`pwd`/tmp/nodejs/bin:$$PATH ./node_modules/.bin/gulp build; \
	fi
else
confdeps:
	if test -x $(NODE_DIR)/nodejs -a ! -x $(NODE_DIR)/node; then \
	    sudo ln -sf $(NODE_DIR)/nodejs $(NODE_DIR)/node; \
	fi; \
	if ! test -x /usr/bin/npm -o -x /usr/local/bin/npm; then \
	    curl -k -L https://npmjs.org/install.sh | sudo sh; \
	fi; \
	if ! test -d build; then \
	    test -x node_modules/.bin/nw || npm install; \
	    test -d application/node_modules || cd application && npm install; \
	fi

patchbuilder:
	if ! test -s ./node_modules/nw-builder/package.json; then \
	    npm install nw-builder; \
	fi; \
	if ! grep '0\.13\.0-' ./node_modules/nw-builder/lib/platforms.js >/dev/null; then \
	    patch -p0 <./pkg/nwbuilder.patch; \
	fi

uglify:
	test -x ./node_modules/.bin/uglifyjs || npm install uglify-js
	for lib in $(UGLIFY_SOURCES); do \
	    if test -s $$lib.js; then \
		continue; \
	    elif echo $$lib | grep socket.io >/dev/null; then \
		cat $$lib.src*.js | ./node_modules/.bin/uglifyjs -o $$lib.js; \
	    elif echo $$lib | grep bluebird >/dev/null; then \
		cat $$lib.src*.js | ./node_modules/.bin/uglifyjs --mangle -o $$lib.js; \
	    else \
		cat $$lib.src*.js | ./node_modules/.bin/uglifyjs --compress --mangle -o $$lib.js; \
	    fi; \
	    rm -f $$lib.src*.js; \
	done

client: confdeps patchbuilder uglify
	if ! test -d build/Peerio; then \
	    sync; \
	    ./node_modules/.bin/gulp build; \
	fi; \
	if test -s ./tmp/nw/0.13.3/linux32/nw_100_percent.pak; then \
	    rm -fr build; \
	    cp -p ./tmp/nw/0.13.3/linux32/nw_100_percent.pak ./tmp/nw/0.13.3/linux32/nw.pak; \
	    cp -p ./tmp/nw/0.13.3/linux64/nw_100_percent.pak ./tmp/nw/0.13.3/linux64/nw.pak; \
	    ./node_modules/.bin/gulp build; \
	fi
endif

installdirs:
	for d in $(APP_DIR)/lib $(APP_DIR)/locales $(DOC_DIR)/peerio-client $(BIN_DIR) $(MAN_DIR) $(ICON_DIR)/16x16/apps $(ICON_DIR)/32x32/apps $(ICON_DIR)/48x48/apps $(ICON_DIR)/64x64/apps $(ICON_DIR)/128x128/apps $(PIX_DIR) $(DSK_DIR); do \
	    test -d "$$d" || mkdir -p "$$d"; \
	done

install: client installdirs
	for file in $(shell find $(OBJ) -type f | sed 's|build/Peerio/[^/]*/||'); do \
	    if echo "$$file" | grep Peerio >/dev/null; then \
		install -c -m 0755 $(OBJ)/$$file $(APP_DIR)/$$file; \
	    else \
		install -c -m 0644 $(OBJ)/$$file $(APP_DIR)/$$file; \
	    fi \
	done
	for dim in 16 32 48 64 128; do \
	    install -c -m 0644 application/img/icon$$dim.png $(ICON_DIR)/$${dim}x$$dim/apps/$(PROG_NAME).png; \
	done
	install -c -m 0644 application/img/icon128.png $(PIX_DIR)/peerio-client.png
	install -c -m 0644 pkg/desktop $(DSK_DIR)/$(PROG_NAME).desktop
	install -c -m 0644 pkg/man.1 $(MAN_DIR)/peerio-client.1
	install -c -m 0755 pkg/peerio-client $(BIN_DIR)/$(PROG_NAME)
	umask 133
	gzip -9 -f $(MAN_DIR)/peerio-client.1

deinstall:
	for dim in 16 32 48 64 128; do \
	    test -f $(ICON_DIR)/$${dim}x$$dim/apps/$(PROG_NAME).png || continue; \
	    rm -f $(ICON_DIR)/$${dim}x$$dim/apps/$(PROG_NAME).png; \
	done
	rm -f $(DSK_DIR)/$(PROG_NAME).desktop $(BIN_DIR)/$(PROG_NAME) $(MAN_DIR)/peerio-client.1.gz
	rm -rf $(APP_DIR)

createinitialarchive: clean
	if grep version application/package.json >/dev/null; then \
	    VERSION=`grep version application/package.json | awk '{print $$2}' | cut -d\" -f2`; \
	    if ! grep $$VERSION debian/changelog >/dev/null; then \
		echo "this client version is not documented yet in debian's changelog" >&2; \
		echo "please document it before creating your initial archive" >&2; \
		exit 1; \
	    fi; \
	    ( \
		cd .. ; \
		tar --exclude=.git --exclude=.gitignore --exclude=.gitattributes --exclude=metascan.js --exclude=virustotal.js --exclude=virustotal.py --exclude=osx --exclude=pkg/archlinux --exclude=pkg/centos --exclude=pkg/debian --exclude=pkg/fedora --exclude=pkg/frugalware --exclude=pkg/gentoo --exclude=pkg/mageia --exclude=pkg/manjaro --exclude=pkg/opensuse --exclude=pkg/pclinuxos -czf peerio-client-$$VERSION.tar.gz peerio-client ; \
		mv peerio-client peerio-client-$$VERSION ; \
		ln -sf peerio-client-$$VERSION.tar.gz peerio-client_$$VERSION.orig.tar.gz ; \
		tar --exclude=.git --exclude=.gitattributes --exclude=.gitignore --exclude=metascan.js --exclude=virustotal.js --exclude=virustotal.py --exclude=osx --exclude=pkg/archlinux --exclude=pkg/centos --exclude=pkg/debian --exclude=pkg/fedora --exclude=pkg/frugalware --exclude=pkg/gentoo --exclude=pkg/mageia --exclude=pkg/manjaro --exclude=pkg/opensuse --exclude=pkg/pclinuxos -czf rh-peerio-client-$$VERSION.tar.gz peerio-client-$$VERSION ; \
		mv peerio-client-$$VERSION peerio-client \
	    ); \
	fi

createdebsource: clean
	if grep Ubuntu /etc/issue >/dev/null 2>&1; then \
	    touch debian/files; \
	    LANG=C dpkg-genchanges -DDistribution=`awk '/CODENAME/' /etc/lsb-release | cut -d= -f2`; \
	    LANG=C debuild --changes-option=-DDistribution=`awk '/CODENAME/' /etc/lsb-release | cut -d= -f2` -S -sa; \
	else \
	    LANG=C debuild -S -sa; \
	fi

createdebbin: clean
	dpkg-buildpackage -us -uc

ifeq ($(EMBED_NODEJS),yes)
clean:
	if test -d ./tmp/nodejs/bin; then \
	    PATH=./tmp/nodejs/bin:$$PATH npm cache clean; \
	fi; \
	for lib in $(UGLIFY_SOURCES); do \
	    rm -f $$lib.js; \
	done; \
	rm -fr debian/peerio-client debian/peerio-client.* build node_modules application/node_modules tmp npm-debug.log application/npm-debug.log debian/files
else
clean:
	npm cache clean; \
	for lib in $(UGLIFY_SOURCES); do \
	    rm -f $$lib.js; \
	done; \
	rm -fr build node_modules application/node_modules tmp npm-debug.log application/npm-debug.log debian/files
endif
