
var TextEditor = React.createClass({
  getInitialState: function () {
    return {
      text: this.props.text
    };
  },
  componentDidMount: function () {
    var dom = React.findDOMNode(this);
    this.medium = new MediumEditor(dom, this.props.options);
  },
  componentWillUnmount: function () {
    this.medium.destroy();
  },
  componentWillReceiveProps: function (nextProps) {
    if (nextProps.id === this.props.id && nextProps.text === this.props.text) return;
    this.setState({ text: nextProps.text });
  },
  render: function () {
    return React.createElement('div', { key: 'noteEditor', className: 'text-editor', dangerouslySetInnerHTML: { __html: this.state.text } });
  }
});