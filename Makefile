PREFIX = /usr/share

PROG_NAME = peerio-client
APP_DIR   = $(PREFIX)/$(PROG_NAME)
BIN_DIR   = /usr/bin
DOC_DIR   = $(PREFIX)/doc
DSK_DIR   = /usr/share/applications
ICON_DIR  = /usr/share/icons/hicolor
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

all: install clean

confdeps:
	if ! test -d build; then \
	    pip install transifex-client; \
	    npm install -g nw; \
	    npm install; \
	    if ! test -s ~/.transifexrc; then \
		echo missing transifex configuration >&2; \
		exit 1; \
	    fi; \
	fi

client: confdeps
	if ! test -d build; then \
	    ./node_modules/.bin/gulp build; \
	fi

installdirs:
	for d in $(APP_DIR)/locales $(DOC_DIR)/peerio-client $(BIN_DIR) $(MAN_DIR) $(ICON_DIR)/16x16/apps $(ICON_DIR)/32x32/apps $(ICON_DIR)/48x48/apps $(ICON_DIR)/64x64/apps $(ICON_DIR)/128x128/apps; do \
	    test -d "$$d" || mkdir -p "$$d"; \
	done

install: client installdirs
	for file in $(shell find $(OBJ) -type f | sed 's|build/Peerio/[^/]*/||'); do \
	    if echo "$$file" | grep Peerio; then \
		install -c -m 0755 $(OBJ)/$$file $(APP_DIR)/$$file; \
	    else \
		install -c -m 0644 $(OBJ)/$$file $(APP_DIR)/$$file; \
	    fi \
	done
	for dim in 16 32 48 64 128; do \
	    install -c -m 0644 application/img/icon$$dim.png $(ICON_DIR)/$${dim}x$$dim/apps/$(PROG_NAME).png; \
	done
	install -c -m 0644 deb/desktop  $(DSK_DIR)/$(PROG_NAME).desktop
	install -c -m 0755 deb/peerio-client $(BIN_DIR)/$(PROG_NAME)

deinstall:
	for dim in 16 32 48 64 128; do \
	    test -f $(ICON_DIR)/$${dim}x$$dim/apps/$(PROG_NAME).png || continue; \
	    rm -f $(ICON_DIR)/$${dim}x$$dim/apps/$(PROG_NAME).png; \
	done
	rm -f $(DSK_DIR)/$(PROG_NAME).desktop $(BIN_DIR)/$(PROG_NAME)
	rm -rf $(APP_DIR)

clean:
	rm -fr build
