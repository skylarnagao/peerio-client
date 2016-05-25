// THIS FILE IS COMPILED WITH BABEL FROM application/jsx SOURCE, DON'T EDIT .js FILE
Peerio.UI.controller('notesSection', function() {
    'use strict';

    var editorOptions = {
        toolbar: {
            buttons: [
                'bold',
                'italic',
                'underline',
                'h2',
                'h3',
                'quote'
            ]
        }
    };
    //--------------------------------------------------------------------------
    var NotesView = React.createClass({
        render: function() {
          if(!Peerio.user.notes) return;

            return <div style={{display: 'table-row'}}>
                <NoteList></NoteList>
                <Note></Note>
            </div>;
        }
    });
    //--------------------------------------------------------------------------
    var Note = React.createClass({
        render: function() {
            return <div className="note">
                <input type="text" className="note-name" placeholder='Note name'/>
                <TextEditor options={editorOptions}></TextEditor>
            </div>;
        }
    });
    //--------------------------------------------------------------------------
    var NoteList = React.createClass({
        render: function() {
            return <div className="note-list">
                <div className="note-toolbar">
                    <button className="fontAwesome clear" data-utip-l10n="remove" data-utip-gravity="ne" data-utip="Remove">&#xf014;</button>
                </div>
                <div className="note-list-item">
                    asdfasdfasdf
                </div>
                <div className="note-list-item selected">
                    asdfasadfsdfsdfasdf
                </div>
            </div>;
        }
    });

    //--------------------------------------------------------------------------
    React.render(React.createElement(NotesView, null), document.getElementById('notesView'));
});
