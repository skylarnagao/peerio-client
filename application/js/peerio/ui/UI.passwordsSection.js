// THIS FILE IS COMPILED WITH BABEL FROM application/jsx SOURCE, DON'T EDIT .js FILE

Peerio.Passwords = {};

(function () {
    'use strict';

    console.log("Passwords initializing..");

    // takes state password object and generates an object ready to be sent to server (Data Transport Object)
    function getDTO(password) {
        var ret = {};
        ret.id = password.id;
        ret.createdAt = password.createdAt;
        ret.updatedAt = password.updatedAt;
        ret.name = password.name;
        ret.username = password.username;
        ret.secret = password.secret;
        ret.note = password.note;

        ret.isPassword = true;

        return ret;
    }

    // we'll fire this to make react update
    var ev = new Event('PasswordsUpdated');
    Peerio.Passwords.fireUpdated = function () {
        document.dispatchEvent(ev);
    };

    // creates a new password with all the side-effects required
    Peerio.Passwords.create = function () {
        var password = {
            isDirty: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            name: 'password for ...',
            username: '',
            secret: '',
            note: ''
        };
        var dto = Peerio.objSignature + JSON.stringify(getDTO(password));
        Peerio.crypto.encryptUserString(dto, encrypted => {
            Peerio.network.createFileFolder(encrypted, res => {
                if (res.error) {
                    console.log(res);
                    return;
                }
                password.id = res.id;
                Peerio.user.passwords.push(password);
                Peerio.user.passwordsDict[password.id] = password;
                Peerio.Passwords.fireUpdated();
            });
        });
    };

    // adds/updates the state with a bunch of existing passwords and saves the react update
    // this is normally called once on initial load
    Peerio.Passwords.addOrUpdateBulk = function (passwords) {
        passwords.forEach(password => {
            var existing = Peerio.user.passwordsDict[password.id];
            if (existing) {
                if (existing.isDirty) return;
                exitsing.name = password.name;
                existing.username = password.username;
                existing.secret = password.secret;
                existing.note = password.note;
                existing.updatedAt = password.updatedAt;
            } else {
                Peerio.user.passwords.push(password);
                Peerio.user.passwordsDict[password.id] = password;
            }
        });
        Peerio.Passwords.fireUpdated();
    };

    // checks for unsaved passwords and saves them
    Peerio.Passwords.saveAll = function () {
        if (!Peerio.user || !Peerio.user.passwords) return;
        Peerio.user.passwords.forEach(save);
    };

    // saves individual password
    function save(password) {
        if (!password.isDirty) return;
        password.isDirty = false;
        password.updatedAt = Date.now();
        var dto = Peerio.objSignature + JSON.stringify(getDTO(password));
        Peerio.crypto.encryptUserString(dto, encrypted => {
            Peerio.network.renameFileFolder(password.id, encrypted, res => {
                if (res.error) {
                    console.log(res);
                    password.isDirty = true;
                }
                Peerio.Passwords.fireUpdated();
            });
        });
    }

    //---
    Peerio.Passwords.remove = function (id) {
        var password = Peerio.user.passwordsDict[id];
        if (!password) return;
        swal({
            title: l('removePasswordDialogTitle'),
            text: l('removePasswordDialogText') + " " + password.name,
            type: "warning",
            confirmButtonColor: "#DD6B55",
            showCancelButton: true,
            closeOnConfirm: true,
            animation: "slide-from-top"
        }, function (confirmed) {
            if (!confirmed) return;
            Peerio.network.removeFileFolder(id);
            var ind = Peerio.user.passwords.findIndex(el => el.id === id);
            if (ind >= 0) {
                Peerio.user.passwords.splice(ind, 1);
            }
            delete Peerio.user.passwordsDict[id];
            Peerio.Passwords.fireUpdated();
            //swal(l('error'), l('removingNoteError'), "error");
        });
    };
    //--------------------------------------------------------------------------

    Peerio.UI.controller('passwordsSection', function () {
        'use strict';

        console.log("PasswordsSection controller initializing..");

        //--------------------------------------------------------------------------
        var PasswordsView = React.createClass({
            getInitialState: function () {
                return { selectedId: null };
            },
            handleSelected: function (id) {
                this.setState({ selectedId: id });
            },
            handleChange: function (id, data) {
                var pass = Peerio.user.passwordsDict[id];
                if (!pass) return;
                pass.username = data.username;
                pass.secret = data.secret;
                pass.note = data.note;
                if (!pass.isDirty) {
                    pass.isDirty = true;
                }
                Peerio.Passwords.fireUpdated();
            },
            handleNameChange: function (id, name) {
                var password = Peerio.user.passwordsDict[id];
                if (!password) return;
                if (password.name !== name) {
                    password.name = name;
                    password.isDirty = true;
                    Peerio.Passwords.fireUpdated();
                }
            },
            handleRemove: function () {
                if (this.state.selectedId == null) return;
                Peerio.Passwords.remove(this.state.selectedId);
            },
            componentDidMount: function () {
                // we only mount view once per app session lifetime
                document.addEventListener('PasswordsUpdated', this.forceUpdate.bind(this, null));
            },
            render: function () {
                if (!Peerio.user || !Peerio.user.passwords) return;

                return React.createElement(
                    'div',
                    { style: { display: 'table-row' } },
                    React.createElement(PasswordList, { selectedId: this.state.selectedId, onSelected: this.handleSelected,
                        onRemove: this.handleRemove }),
                    React.createElement(Password, { selectedId: this.state.selectedId, onChange: this.handleChange,
                        onNameChange: this.handleNameChange })
                );
            }
        });
        //--------------------------------------------------------------------------
        var Password = React.createClass({
            getInitialState: function () {
                return {
                    hidden: true
                };
            },
            onNameChange: function (ev) {
                this.props.onNameChange(this.props.selectedId, ev.target.value);
            },
            onUsernameChange: function (ev) {
                var pass = Peerio.user.passwordsDict[this.props.selectedId];
                this.props.onChange(this.props.selectedId, {
                    username: ev.target.value,
                    secret: pass.secret,
                    note: pass.note
                });
            },
            onSecretChange: function (ev) {
                var pass = Peerio.user.passwordsDict[this.props.selectedId];
                this.props.onChange(this.props.selectedId, {
                    username: pass.username,
                    secret: ev.target.value,
                    note: pass.note
                });
            },
            onNoteChange: function (ev) {
                var pass = Peerio.user.passwordsDict[this.props.selectedId];
                this.props.onChange(this.props.selectedId, {
                    username: pass.username,
                    secret: pass.secret,
                    note: ev.target.value
                });
            },
            toggleHidden: function () {
                this.setState({ hidden: !this.state.hidden });
            },
            render: function () {

                var pass = Peerio.user.passwordsDict[this.props.selectedId];
                if (!pass) return React.createElement(
                    'div',
                    { className: 'note-not-selected' },
                    React.createElement(
                        'h1',
                        null,
                        l('noPasswordsSelected')
                    ),
                    React.createElement(
                        'p',
                        null,
                        l('noPasswordsText')
                    ),
                    React.createElement(
                        'button',
                        { onClick: () => Peerio.Passwords.create() },
                        l('addMyFirstPassword')
                    )
                );
                //<span class="loginShowPassphraseEnable fontAwesome">&#xf06e;</span>
                //<span class="loginShowPassphraseDisable fontAwesome">&#xf070;</span>
                return React.createElement(
                    'div',
                    { className: 'note' },
                    React.createElement('input', { type: 'text', className: 'note-name', value: pass.name, onChange: this.onNameChange }),
                    React.createElement(
                        'div',
                        { className: 'pwd-title' },
                        'Username:'
                    ),
                    React.createElement('input', { type: 'text', className: 'pwd-username', value: pass.username, onChange: this.onUsernameChange }),
                    React.createElement(
                        'div',
                        { className: 'pwd-title' },
                        'Password:'
                    ),
                    React.createElement(
                        'div',
                        { className: 'pwd-secret-container' },
                        React.createElement(
                            'span',
                            { className: 'fontAwesome pwd-toggle',
                                onClick: this.toggleHidden },
                            this.hidden ? '\uf06e' : '\uf070'
                        ),
                        React.createElement('input', { type: this.state.hidden ? 'password' : 'text', className: 'pwd-secret', value: pass.secret,
                            onChange: this.onSecretChange })
                    ),
                    React.createElement(
                        'div',
                        { className: 'pwd-title' },
                        'Notes:'
                    ),
                    React.createElement('textarea', { value: pass.note, className: 'pwd-note', onChange: this.onNoteChange })
                );
            }
        });
        //--------------------------------------------------------------------------
        var PasswordList = React.createClass({

            render: function () {
                return React.createElement(
                    'div',
                    { className: 'note-list' },
                    React.createElement(
                        'div',
                        { className: 'note-list-toolbar messagesSectionListViewToolbar' },
                        React.createElement(
                            'button',
                            { className: 'fontAwesome clear', 'data-utip-l10n': 'remove', 'data-utip-gravity': 'ne',
                                'data-utip': 'Remove', onClick: this.props.onRemove },
                            ''
                        )
                    ),
                    Peerio.user.passwords.map(function (pass) {
                        return React.createElement(PasswordListItem, { key: pass.id, id: pass.id, name: pass.name,
                            isDirty: pass.isDirty,
                            onSelected: this.props.onSelected,
                            selected: this.props.selectedId == pass.id });
                    }, this)
                );
            }
        });
        //--------------------------------------------------------------------------
        var PasswordListItem = React.createClass({
            handleSelected: function () {
                this.props.onSelected(this.props.id);
            },
            render: function () {
                var classes = "note-list-item" + (this.props.selected ? " selected" : "") + (this.props.isDirty ? " dirty" : "");
                return React.createElement(
                    'div',
                    { className: classes, onClick: this.handleSelected },
                    this.props.name
                );
            }
        });

        //--------------------------------------------------------------------------
        angular.element(document).ready(function () {
            document.getElementsByClassName('passwordsSidebarAddPassword')[0].addEventListener('click', () => Peerio.Passwords.create());
            document.l10n.ready(() => {
                console.log("Starting passwords render");
                React.render(React.createElement(PasswordsView, null), document.getElementById('passwordsView'));
            });

            window.setInterval(Peerio.Passwords.saveAll, 10000);
        });
    });
})();