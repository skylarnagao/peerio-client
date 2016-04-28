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
NODE_DIR  = /usr/bin
OBJ       = build/Peerio/chrome

ifeq ($(OS),Windows_NT)
    OBJ = build/Peerio/win32
else
    UNAME_M := $(shell uname -m)
    UNAME_S := $(shell uname -s)
    ifeq ($(UNAME_S),Linux)
	ifeq ($(UNAME_M),x86_64)
	    OBJ = build/Peerio/linux64
	else
	    OBJ = build/Peerio/linux32
	endif
    endif
    ifeq ($(UNAME_S),Darwin)
	OBJ = build/Peerio/osx32
    endif
endif

all: client

confdeps:
	if test -x $(NODE_DIR)/nodejs -a ! -x $(NODE_DIR)/node; then \
	    sudo ln -sf $(NODE_DIR)/nodejs $(NODE_DIR)/node; \
	fi
	if ! test -x /usr/bin/npm -o -x /usr/local/bin/npm; then \
	    curl -k -L https://npmjs.org/install.sh | sudo sh; \
	fi
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

client: confdeps patchbuilder
	if ! test -d build; then \
	    sync; \
	    ./node_modules/.bin/gulp build; \
	fi; \
	if test -s ./tmp/nw/0.13.3/linux32/nw_100_percent.pak; then \
	    rm -fr build; \
	    cp -p ./tmp/nw/0.13.3/linux32/nw_100_percent.pak ./tmp/nw/0.13.3/linux32/nw.pak; \
	    cp -p ./tmp/nw/0.13.3/linux64/nw_100_percent.pak ./tmp/nw/0.13.3/linux64/nw.pak; \
	    ./node_modules/.bin/gulp build; \
	fi

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

createinitialarchive:
	if grep version application/package.json >/dev/null; then \
		VERSION=`grep version application/package.json | awk '{print $$2}' | cut -d\" -f2`; \
		( cd .. ; tar --exclude=.git --exclude=.gitignore --exclude=.gitattributes --exclude=pkg/archlinux --exclude=pkg/centos --exclude=pkg/debian --exclude=pkg/fedora --exclude=pkg/frugalware --exclude=pkg/gentoo --exclude=pkg/mageia --exclude=pkg/manjaro --exclude=pkg/opensuse --exclude=pkg/pclinuxos -czf peerio-client-$$VERSION.tar.gz peerio-client ; mv peerio-client peerio-client-$$VERSION ; tar --exclude=.git --exclude=.gitattributes --exclude=.gitignore --exclude=pkg/archlinux --exclude=pkg/centos --exclude=pkg/debian --exclude=pkg/fedora --exclude=pkg/frugalware --exclude=pkg/gentoo --exclude=pkg/mageia --exclude=pkg/manjaro --exclude=pkg/opensuse --exclude=pkg/pclinuxos -czf rh-peerio-client-$$VERSION.tar.gz peerio-client-$$VERSION ; mv peerio-client-$$VERSION peerio-client ); \
	fi

createdebsource: clean
	LANG=C debuild -S -sa

createdebbin: clean
	dpkg-buildpackage -us -uc

clean:
	rm -fr build node_modules application/node_modules tmp npm-debug.log application/npm-debug.log debian/files; \
	npm cache clean
