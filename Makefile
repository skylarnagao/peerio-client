BINPREFIX = /usr
PREFIX    = /usr/share
XPREFIX   = $(PREFIX)

PROG_NAME = peerio-client
APP_DIR   = $(PREFIX)/$(PROG_NAME)
BIN_DIR   = $(BINPREFIX)/bin
DOC_DIR   = $(PREFIX)/doc
DSK_DIR   = $(XPREFIX)/applications
ICON_DIR  = $(XPREFIX)/icons/hicolor
MAN_DIR   = $(PREFIX)/man/man1
OBJ       = build/Peerio/chrome

ifeq ($(OS),Windows_NT)
    OBJ = build/Peerio/win32
else
    UNAME_P := $(shell uname -p)
    UNAME_S := $(shell uname -s)
    ifeq ($(UNAME_S),Linux)
	ifeq ($(UNAME_P),x86_64)
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
	if ! test -d build; then \
	    pip list 2>&1 | grep ^transifex-client >/dev/null || pip install transifex-client; \
	    npm -g ls 2>&1 | grep ' nw@' >/dev/null || npm install -g nw; \
	    test -d node_modules || npm install; \
	    test -d application/node_modules || cd application && npm install; \
	fi

client: confdeps
	if ! test -d build; then \
	    ./node_modules/.bin/gulp build; \
	fi

installdirs:
	for d in $(APP_DIR)/locales $(DOC_DIR)/peerio-client $(BIN_DIR) $(MAN_DIR) $(ICON_DIR)/16x16/apps $(ICON_DIR)/32x32/apps $(ICON_DIR)/48x48/apps $(ICON_DIR)/64x64/apps $(ICON_DIR)/128x128/apps $(DSK_DIR); do \
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
	install -c -m 0644 deb/desktop $(DSK_DIR)/$(PROG_NAME).desktop
	install -c -m 0644 deb/man.1 $(MAN_DIR)/peerio-client.1
	install -c -m 0755 deb/peerio-client $(BIN_DIR)/$(PROG_NAME)
	umask 133
	gzip -9 -f $(MAN_DIR)/peerio-client.1

deinstall:
	for dim in 16 32 48 64 128; do \
	    test -f $(ICON_DIR)/$${dim}x$$dim/apps/$(PROG_NAME).png || continue; \
	    rm -f $(ICON_DIR)/$${dim}x$$dim/apps/$(PROG_NAME).png; \
	done
	rm -f $(DSK_DIR)/$(PROG_NAME).desktop $(BIN_DIR)/$(PROG_NAME) $(MAN_DIR)/peerio-client.1.gz
	rm -rf $(APP_DIR)

createdebsource: clean
	debuild -S -sa

createdebbin: clean
	dpkg-buildpackage -us -uc

clean:
	rm -fr build
