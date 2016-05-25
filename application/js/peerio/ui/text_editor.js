function blacklist(src) {
  var copy = {};
  var filter = arguments[1];

  if (typeof filter === 'string') {
    filter = {};
    for (var i = 1; i < arguments.length; i++) {
      filter[arguments[i]] = true;
    }
  }

  for (var key in src) {
    if (filter[key]) continue;
    copy[key] = src[key];
  }

  return copy;
}

var TextEditor = React.createClass({
  getInitialState: function getInitialState() {
    return {
      text: this.props.text
    };
  },
  getDefaultProps: function getDefaultProps() {
    return {
      tag: 'div'
    };
  },
  componentDidMount: function componentDidMount() {
    var _this = this;

    var dom = React.findDOMNode(this);

    this.medium = new MediumEditor(dom, this.props.options);
    this.medium.subscribe('editableInput', function (e) {
      _this._updated = true;
      _this.change(dom.innerHTML);
    });
  },
  componentWillUnmount: function componentWillUnmount() {
    this.medium.destroy();
  },
  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    if (nextProps.text !== this.state.text && !this._updated) {
      this.setState({ text: nextProps.text });
    }

    if (this._updated) this._updated = false;
  },
  render: function render() {
    var tag = this.props.tag;
    var props = blacklist(this.props, 'tag', 'contentEditable', 'dangerouslySetInnerHTML');

    Object.assign(props, {
      dangerouslySetInnerHTML: { __html: this.state.text },
      className: 'text-editor'
    });

    return React.createElement(tag, props);
  },
  change: function change(text) {
    if (this.props.onChange) this.props.onChange(text, this.medium);
  }
});