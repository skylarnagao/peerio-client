// // THIS FILE IS COMPILED WITH BABEL FROM application/jsx SOURCE, DON'T EDIT .js FILE
Peerio.UI.controller('passwordsSection', function () {});
//
//     Peerio.Passwords = {};
// (function () {
//     'use strict';
//
//     console.log("Notes initializing..");
//
//     // takes state note object and generates an object ready to be sent to server (Data Transport Object)
//     function getDTO(note) {
//         var ret = {};
//         ret.id = note.id;
//         ret.createdAt = note.createdAt;
//         ret.updatedAt = note.updatedAt;
//         ret.name = note.name;
//         ret.text = note.text;
//         ret.isNote = true;
//
//         return ret;
//     }
//
//     // we'll fire this to make react update
//     var ev = new Event('NotesUpdated');
//     Peerio.Notes.fireUpdated = function () {
//         document.dispatchEvent(ev);
//     };
//
//     // creates a new note with all the side-effects required
//     Peerio.Notes.create = function () {
//         var note = {
//             isDirty: false,
//             createdAt: Date.now(),
//             updatedAt: Date.now(),
//             name: 'new note',
//             text: ''
//         };
//         var dto = Peerio.objSignature + JSON.stringify(getDTO(note));
//         Peerio.crypto.encryptUserString(dto, encrypted => {
//             Peerio.network.createFileFolder(encrypted, res => {
//                 if(res.error){
//                     console.log(res);
//                     return;
//                 }
//                 note.id = res.id;
//                 Peerio.user.notes.push(note);
//                 Peerio.user.notesDict[note.id] = note;
//                 Peerio.Notes.fireUpdated();
//             });
//         });
//     };
//
//     // adds/updates the state with a bunch of existing notes and saves the react update
//     // this is normally called once on initial load
//     Peerio.Notes.addOrUpdateBulk = function (notes) {
//         notes.forEach(note => {
//             var existing =  Peerio.user.notesDict[note.id];
//             if(existing){
//                 if(existing.isDirty) return;
//                 exitsing.name = note.name;
//                 existing.text = note.text;
//                 existing.updatedAt = note.updatedAt;
//             } else {
//                 Peerio.user.notes.push(note);
//                 Peerio.user.notesDict[note.id] = note;
//             }
//         });
//         Peerio.Notes.fireUpdated();
//     };
//
//     // checks for unsaved notes and saves them
//     Peerio.Notes.saveAll = function () {
//         if (!Peerio.user || !Peerio.user.notes) return;
//         Peerio.user.notes.forEach(save);
//     };
//
//     // saves individual note
//     function save(note) {
//         if (!note.isDirty) return;
//         note.isDirty = false;
//         note.updatedAt = Date.now();
//         var dto = Peerio.objSignature + JSON.stringify(getDTO(note));
//         Peerio.crypto.encryptUserString(dto, encrypted => {
//            Peerio.network.renameFileFolder(note.id, encrypted, res => {
//                if(res.error){
//                    console.log(res);
//                    note.isDirty = true;
//                }
//                Peerio.Notes.fireUpdated();
//            });
//         });
//     }
//
//     //---
//     Peerio.Notes.remove = function (id) {
//         var note = Peerio.user.notesDict[id];
//         if (!note)
//             return;
//         swal({
//             title: l('removeNoteDialogTitle'),
//             text: l('removeNoteDialogText') + " " + note.name,
//             type: "warning",
//             confirmButtonColor: "#DD6B55",
//             showCancelButton: true,
//             closeOnConfirm: true,
//             animation: "slide-from-top"
//         }, function (confirmed) {
//             if (!confirmed)
//                 return;
//             Peerio.network.removeFileFolder(id);
//             var ind = Peerio.user.notes.findIndex(el => el.id === id);
//             if (ind >= 0) {
//                 Peerio.user.notes.splice(ind, 1);
//             }
//             delete Peerio.user.notesDict[id];
//             Peerio.Notes.fireUpdated();
//             //swal(l('error'), l('removingNoteError'), "error");
//
//         });
//     };
//     //--------------------------------------------------------------------------
//
//     Peerio.UI.controller('notesSection', function () {
//         'use strict';
//         console.log("NotesSection controller initializing..");
//
//         var editorOptions = {toolbar: {buttons: ['bold', 'italic', 'underline', 'strikethrough', 'h2', 'h3', 'removeFormat']}};
//         //--------------------------------------------------------------------------
//         var NotesView = React.createClass({
//             getInitialState: function () {
//                 return {selectedId: null};
//             },
//             handleSelected: function (id) {
//                 this.setState({selectedId: id});
//             },
//             handleChange: function (id, text) {
//                 var note = Peerio.user.notesDict[id];
//                 if (!note)
//                     return;
//                 if (note.text !== text) {
//                     note.text = text;
//                     if(!note.isDirty) {
//                         note.isDirty = true;
//                         Peerio.Notes.fireUpdated();
//                     }
//                 }
//             },
//             handleNameChange: function (id, name) {
//                 var note = Peerio.user.notesDict[id];
//                 if (!note)
//                     return;
//                 if (note.name !== name) {
//                     note.name = name;
//                     note.isDirty = true;
//                     Peerio.Notes.fireUpdated();
//                 }
//             },
//             handleRemove: function () {
//                 if (this.state.selectedId == null)
//                     return;
//                 Peerio.Notes.remove(this.state.selectedId);
//             },
//             componentDidMount: function () {
//                 // we only mount notes view once per app session lifetime
//                 document.addEventListener('NotesUpdated', this.forceUpdate.bind(this, null));
//             },
//             render: function () {
//                 if (!Peerio.user || !Peerio.user.notes)
//                     return;
//
//                 return <div style={{display: 'table-row'}}>
//                     <NoteList selectedId={this.state.selectedId} onSelected={this.handleSelected}
//                               onRemove={this.handleRemove}/>
//                     <Note selectedId={this.state.selectedId} onChange={this.handleChange}
//                           onNameChange={this.handleNameChange}/>
//                 </div>;
//             }
//         });
//         //--------------------------------------------------------------------------
//         var Note = React.createClass({
//             onNameChange: function (ev) {
//                 this.props.onNameChange(this.props.selectedId, ev.target.value);
//             },
//             render: function () {
//
//                 var note = Peerio.user.notesDict[this.props.selectedId];
//                 if (!note)
//                     return <div className="note-not-selected">
//                         <h1>{l('noNotesSelected')}</h1>
//                         <p>{l('noNotesText')}</p>
//                         <button onClick={()=>Peerio.Notes.create()}>{l('addMyFirstNote')}</button>
//                     </div>;
//
//                 return <div className="note">
//                     <input type="text" className="note-name" value={note.name} onChange={this.onNameChange}/>
//                     <TextEditor options={editorOptions} id={this.props.selectedId} text={note.text}
//                                 onChange={this.props.onChange}/>
//                 </div>;
//             }
//         });
//         //--------------------------------------------------------------------------
//         var NoteList = React.createClass({
//
//             render: function () {
//                 return <div className="note-list">
//                     <div className="note-list-toolbar messagesSectionListViewToolbar">
//                         <button className="fontAwesome clear" data-utip-l10n="remove" data-utip-gravity="ne"
//                                 data-utip="Remove" onClick={this.props.onRemove}>&#xf014;</button>
//                     </div>
//                     {
//                         Peerio.user.notes.map(function (note) {
//                             return <NoteListItem key={note.id} id={note.id} name={note.name}
//                                                  isDirty={note.isDirty}
//                                                  onSelected={this.props.onSelected}
//                                                  selected={this.props.selectedId == note.id}/>
//                         }, this)
//                     }
//                 </div>;
//             }
//         });
//         //--------------------------------------------------------------------------
//         var NoteListItem = React.createClass({
//             handleSelected: function () {
//                 this.props.onSelected(this.props.id);
//             },
//             render: function () {
//                 var classes = "note-list-item"
//                     + (this.props.selected ? " selected" : "")
//                     + (this.props.isDirty ? " dirty" : "");
//                 return <div className={classes} onClick={this.handleSelected}>{this.props.name}</div>;
//             }
//         });
//
//         //--------------------------------------------------------------------------
//         angular.element(document).ready(function () {
//             document.getElementsByClassName('notesSidebarAddNote')[0].addEventListener('click', ()=>Peerio.Notes.create());
//             document.l10n.ready(()=> {
//                 console.log("Starting notes render");
//                 React.render(React.createElement(NotesView, null), document.getElementById('notesView'))
//             });
//
//             window.setInterval(Peerio.Notes.saveAll, 10000);
//         });
//     });
//
// })();