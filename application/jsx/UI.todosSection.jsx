// THIS FILE IS COMPILED WITH BABEL FROM application/jsx SOURCE, DON'T EDIT .js FILE

Peerio.TODOs = {};
(function () {
    'use strict';

    console.log("TODOs initializing..");

    function newTodoItem(name) {
        return {
            name: name,
            isDone: false,
            createdAt: Date.now(),
            id: Date.now().toString() + Math.round(Math.random() * 1000).toString()
        };
    }

    // takes state todoList object and generates an object ready to be sent to server (Data Transport Object)
    function getDTO(todoList) {
        var ret = {};
        ret.id = todoList.id;
        ret.createdAt = todoList.createdAt;
        ret.updatedAt = todoList.updatedAt;
        ret.name = todoList.name;
        ret.list = todoList.list;
        ret.isTODO = true;

        return ret;
    }

    function sortList(p, n) {
        if (p.isDone && !n.isDone) return 1;
        if (!p.isDone && n.isDone) return -1;
        if (p.createdAt > n.createdAt) return 1;
        if (p.createdAt < n.createdAt) return -1;
        return 0;
    }

    // we'll fire this to make react update
    var ev = new Event('TODOsUpdated');
    Peerio.TODOs.fireUpdated = function (listId) {
        if (listId !== false) {
            if (listId) {
                var list = Peerio.user.todosDict[listId];
                if (list) list.list.sort(sortList);
            } else {
                Peerio.user.todos.forEach(t => t.list.sort(sortList));
            }
        }
        Peerio.user.todos.sort();
        document.dispatchEvent(ev);
    };

    // creates a new todoList with all the side-effects required
    Peerio.TODOs.create = function () {
        var todoList = {
            isDirty: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            name: 'new list',
            list: []
        };
        var dto = Peerio.objSignature + JSON.stringify(getDTO(todoList));
        Peerio.crypto.encryptUserString(dto, encrypted => {
            Peerio.network.createFileFolder(encrypted, res => {
                if (res.error) {
                    console.log(res);
                    return;
                }
                todoList.id = res.id;
                Peerio.user.todos.push(todoList);
                Peerio.user.todosDict[todoList.id] = todoList;
                Peerio.TODOs.fireUpdated(false);
            });
        });
    };

    // adds todolist item
    Peerio.TODOs.addItem = function (listId, name) {
        var todoList = Peerio.user.todosDict[listId];
        if (!todoList) return;
        var item = newTodoItem(name);
        todoList.list.push(item);
        todoList.isDirty = true;
        Peerio.TODOs.fireUpdated(listId);
    };
    //remove todolist item
    Peerio.TODOs.removeItem = function (listId, itemId) {
        var todoList = Peerio.user.todosDict[listId];
        if (!todoList) return;
        var index = todoList.list.findIndex(i => i.id === itemId);
        todoList.list.splice(index, 1);
        todoList.isDirty = true;
        Peerio.TODOs.fireUpdated(false);
    };

    // adds/updates the state with a bunch of existing todos and saves the react update
    // this is normally called once on initial load
    Peerio.TODOs.addOrUpdateBulk = function (todos) {
        todos.forEach(todoList => {
            var existing = Peerio.user.todosDict[todoList.id];
            if (existing) {
                if (existing.isDirty) return;
                exitsing.name = todoList.name;
                existing.list = todoList.list;
                existing.updatedAt = todoList.updatedAt;
            } else {
                Peerio.user.todos.push(todoList);
                Peerio.user.todosDict[todoList.id] = todoList;
            }
        });
        Peerio.TODOs.fireUpdated();
    };

    // checks for unsaved todos and saves them
    Peerio.TODOs.saveAll = function () {
        if (!Peerio.user || !Peerio.user.todos) return;
        Peerio.user.todos.forEach(save);
    };

    // saves individual todo
    function save(todoList) {
        if (!todoList.isDirty) return;
        todoList.isDirty = false;
        todoList.updatedAt = Date.now();
        var dto = Peerio.objSignature + JSON.stringify(getDTO(todoList));
        Peerio.crypto.encryptUserString(dto, encrypted => {
            Peerio.network.renameFileFolder(todoList.id, encrypted, res => {
                if (res.error) {
                    console.log(res);
                    todoList.isDirty = true;
                }
                Peerio.TODOs.fireUpdated(false);
            });
        });
    }

    //---
    Peerio.TODOs.remove = function (id) {
        var todoList = Peerio.user.todosDict[id];
        if (!todoList)
            return;

        swal({
            title: l('removeTodoListDialogTitle'),
            text: l('removeTodoListDialogText') + " " + todoList.name,
            type: "warning",
            confirmButtonColor: "#DD6B55",
            showCancelButton: true,
            closeOnConfirm: true,
            animation: "slide-from-top"
        }, function (confirmed) {
            if (!confirmed)
                return;
            Peerio.network.removeFileFolder(id);
            var ind = Peerio.user.todos.findIndex(el => el.id === id);
            if (ind >= 0) {
                Peerio.user.todos.splice(ind, 1);
            }
            delete Peerio.user.todosDict[id];
            Peerio.TODOs.fireUpdated(false);
        });
    };
    //--------------------------------------------------------------------------

    Peerio.UI.controller('todosSection', function () {
        'use strict';
        console.log("TodosSection controller initializing..");

        //--------------------------------------------------------------------------
        var TodosView = React.createClass({
            getInitialState: function () {
                return {selectedId: null};
            },
            handleSelected: function (id) {
                this.setState({selectedId: id});
            },
            handleChange: function (id) {
                var todoList = Peerio.user.todosDict[id];
                if (!todoList)
                    return;
                if (!todoList.isDirty) {
                    todoList.isDirty = true;
                    Peerio.TODOs.fireUpdated(this.state.selectedId);
                }
            },
            handleNameChange: function (id, name) {
                var todoList = Peerio.user.todosDict[id];
                if (!todoList)
                    return;
                if (todoList.name !== name) {
                    todoList.name = name;
                    todoList.isDirty = true;
                    Peerio.TODOs.fireUpdated(false);
                }
            },
            handleRemove: function () {
                if (this.state.selectedId == null)
                    return;
                Peerio.TODOs.remove(this.state.selectedId);
            },
            componentDidMount: function () {
                // we only mount todos view once per app session lifetime
                document.addEventListener('TODOsUpdated', this.forceUpdate.bind(this, null));
            },
            render: function () {
                if (!Peerio.user || !Peerio.user.todos)
                    return;

                return <div style={{display: 'table-row'}}>
                    <TodoListList selectedId={this.state.selectedId} onSelected={this.handleSelected}
                                  onRemove={this.handleRemove}/>
                    <TodoList selectedId={this.state.selectedId} onChange={this.handleChange}
                              onNameChange={this.handleNameChange}/>
                </div>;
            }
        });
        //--------------------------------------------------------------------------
        var TodoList = React.createClass({
            getInitialState: function () {
                return {newTodo: ''};
            },
            onNameChange: function (ev) {
                this.props.onNameChange(this.props.selectedId, ev.target.value);
            },
            onNewTodoChange: function (ev) {
                this.setState({newTodo: ev.target.value})
            },
            onNewTodoKeyDown: function (ev) {
                if (ev.keyCode !== 13) {
                    return;
                }
                ev.preventDefault();
                var val = this.state.newTodo.trim();

                if (val) {
                    Peerio.TODOs.addItem(this.props.selectedId, val);
                    this.setState({newTodo: ''});
                }
            },
            onChange: function (sort) {
                Peerio.user.todosDict[this.props.selectedId].isDirty = true;
                Peerio.TODOs.fireUpdated(sort?this.props.selectedId:false);
            },
            onRemove: function (itemId) {
              Peerio.TODOs.removeItem(this.props.selectedId, itemId);
            },
            render: function () {
                var todoList = Peerio.user.todosDict[this.props.selectedId];
                if (!todoList)
                    return <div className="note-not-selected">
                        <h1>{l('noTodoListSelected')}</h1>
                        <p>{l('noTodoListText')}</p>
                        <button onClick={()=>Peerio.TODOs.create()}>{l('addMyFirstTodoList')}</button>
                    </div>;

                return <div className="note">
                    <input type="text" className="note-name" value={todoList.name} onChange={this.onNameChange}/>
                    <div className="new-todo-input-prompt">What has to be done?</div>
                    <input type="text" className="new-todo-input" value={this.state.newTodo}
                           onChange={this.onNewTodoChange} onKeyDown={this.onNewTodoKeyDown}/>
                    <div className="todo-list-items">
                        {todoList.list.map(i=> <TodoListItem key={i.id} item={i} onChange={this.onChange} onRemove={this.onRemove}/>)}
                    </div>
                </div>;
            }
        });
        var TodoListItem = React.createClass({
            onToggle: function () {
                this.props.item.isDone = !this.props.item.isDone;
                this.props.onChange(true);
            },
            keyDown: function (ev) {
                if (ev.keyCode === 13) {
                    this.restore = false;
                    this.refs.editor.getDOMNode().blur();
                    return;
                }
                if (ev.keyCode === 27) {
                    this.restore = true;
                    this.refs.editor.getDOMNode().blur();
                    return;
                }
            },
            change: function (ev) {
                this.props.item.name = ev.target.value;
                this.forceUpdate();
            },
            focus: function () {
                this.backup = this.props.item.name;
            },
            blur: function () {
                if (this.restore) {
                    this.restore = false;
                    this.props.item.name = this.backup;
                    this.backup = null;
                    this.forceUpdate();
                    return;
                }
                this.backup = null;
                this.props.onChange(false);
            },
            remove: function () {
              this.props.onRemove(this.props.item.id);
            },
            render: function () {
                var i = this.props.item;
                return <div className={"todo-list-item"+(i.isDone?' complete':'')}>
                    <span className="fontAwesome todo-remove" onClick={this.remove}>&#xf00d;</span>
                    <span className="fontAwesome todo-check"
                          onClick={this.onToggle}>{i.isDone ? '\uf14a' : '\uf096'}</span>
                    <input type="text" ref="editor" className="todo-editable" value={i.name}
                           onKeyDown={this.keyDown} onChange={this.change} onFocus={this.focus} onBlur={this.blur}/>
                </div>
            }
        });
        //--------------------------------------------------------------------------
        var TodoListList = React.createClass({

            render: function () {
                return <div className="note-list">
                    <div className="note-list-toolbar messagesSectionListViewToolbar">
                        <button className="fontAwesome clear" data-utip-l10n="remove" data-utip-gravity="ne"
                                data-utip="Remove" onClick={this.props.onRemove}>&#xf014;</button>
                    </div>
                    {
                        Peerio.user.todos.map(function (todoList) {
                            return <TodoListListItem key={todoList.id} id={todoList.id} name={todoList.name}
                                                     isDirty={todoList.isDirty}
                                                     onSelected={this.props.onSelected}
                                                     selected={this.props.selectedId == todoList.id}/>
                        }, this)
                    }
                </div>;
            }
        });
        //--------------------------------------------------------------------------
        var TodoListListItem = React.createClass({
            handleSelected: function () {
                this.props.onSelected(this.props.id);
            },
            render: function () {
                var classes = "note-list-item"
                    + (this.props.selected ? " selected" : "")
                    + (this.props.isDirty ? " dirty" : "");
                return <div className={classes} onClick={this.handleSelected}>{this.props.name}</div>;
            }
        });

        //--------------------------------------------------------------------------
        angular.element(document).ready(function () {
            document.getElementsByClassName('todosSidebarAddTodo')[0].addEventListener('click', ()=>Peerio.TODOs.create());
            document.l10n.ready(()=> {
                console.log("Starting todos render");
                React.render(React.createElement(TodosView, null), document.getElementById('todosView'))
            });

            window.setInterval(Peerio.TODOs.saveAll, 10000);
        });
    });

})();
