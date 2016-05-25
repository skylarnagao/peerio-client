// THIS FILE IS COMPILED WITH BABEL FROM application/jsx SOURCE, DON'T EDIT .js FILE
Peerio.UI.controller('notesSection', function () {
    'use strict';

    var editorOptions = {
        toolbar: {
            buttons: ['bold', 'italic', 'underline', 'h2', 'h3', 'quote']
        }
    };
    //--------------------------------------------------------------------------
    var NotesView = React.createClass({
        render: function () {
            if (!Peerio.user.notes) return;

            return React.createElement(
                'div',
                { style: { display: 'table-row' } },
                React.createElement(NoteList, null),
                React.createElement(Note, null)
            );
        }
    });
    //--------------------------------------------------------------------------
    var Note = React.createClass({
        render: function () {
            return React.createElement(
                'div',
                { className: 'note' },
                React.createElement('input', { type: 'text', className: 'note-name', placeholder: 'Note name' }),
                React.createElement(TextEditor, { options: editorOptions })
            );
        }
    });
    //--------------------------------------------------------------------------
    var NoteList = React.createClass({
        render: function () {
            return React.createElement(
                'div',
                { className: 'note-list' },
                React.createElement(
                    'div',
                    { className: 'note-toolbar' },
                    React.createElement(
                        'button',
                        { className: 'fontAwesome clear', 'data-utip-l10n': 'remove', 'data-utip-gravity': 'ne', 'data-utip': 'Remove' },
                        ''
                    )
                ),
                React.createElement(
                    'div',
                    { className: 'note-list-item' },
                    'asdfasdfasdf'
                ),
                React.createElement(
                    'div',
                    { className: 'note-list-item selected' },
                    'asdfasadfsdfsdfasdf'
                )
            );
        }
    });

    //--------------------------------------------------------------------------
    React.render(React.createElement(NotesView, null), document.getElementById('notesView'));
});