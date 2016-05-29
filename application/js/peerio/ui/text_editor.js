// THIS FILE IS COMPILED WITH BABEL FROM application/jsx SOURCE, DON'T EDIT .js FILE

var TextEditor = React.createClass({
    getInitialState: function () {
        return { text: this.props.text };
    },
    componentDidMount: function () {
        var dom = React.findDOMNode(this);
        this.medium = new MediumEditor(dom, this.props.options);
        this.medium.setContent(this.props.text);
        this.medium.subscribe('editableInput', () => {
            this.props.onChange(this.props.id, dom.innerHTML);
        });
    },
    componentWillUnmount: function () {
        this.medium.destroy();
    },
    componentWillReceiveProps: function (nextProps) {
        if (nextProps.id === this.props.id && nextProps.text === this.props.text) return;
        this.setState({ text: nextProps.text });
    },
    render: function () {
        if (this.medium) this.medium.setContent(this.state.text);

        return React.createElement('div', { className: 'text-editor' });
    }
});