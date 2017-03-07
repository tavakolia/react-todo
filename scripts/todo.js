var ReactDOM = require('react-dom');
var React = require('react');
var MediaQuery = require('react-responsive');
var DatePicker = require('react-datepicker');
var moment = require('moment');
var css = require('./../public/css/base.css');

import {FormField, Form, Button, FormInput, Card, Glyph} from 'elemental';

const ASSIGNEE_LIMIT = 3;

var TodosBox = React.createClass({
  getInitialState: function () {
    return {data: []};
  },
  loadTodosFromServer: function () {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function (data) {
        this.setState({data: data});
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  handleTodoSubmit: function (todo) {
    const todos = this.state.data;
    todo.id = '_todo_' + Date.now();
    let newTodo = todos.concat([todo]);
    this.setState({data: newTodo});
    // call server
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: todo,
      success: function (data) {
        this.setState({data: data});
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(this.props.url, status, err.toString());
        this.setState({data: todos});
      }.bind(this)
    });
  },
  handleTodoDelete: function (todoId) {
    const url = this.props.url + '/' + todoId;
    $.ajax({
      url: url,
      dataType: 'json',
      type: 'DELETE',
      success: function (data) {
        console.log('delete success');
        this.setState({ data: data });
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  componentDidMount: function () {
    this.loadTodosFromServer();
    setInterval(this.loadTodosFromServer, this.props.pollInterval);
  },
  render: function () {
    return (
      <div className="TodoBox">
        <h1>Todo List</h1>
        <TodoForm onTodoSubmit={this.handleTodoSubmit}/>
        <TodoList onTodoDelete={this.handleTodoDelete} data={this.state.data}/>
      </div>
    );
  }
});

var AssigneeList = React.createClass({
  getInitialState: function () {
    return {assignees: []};
  },
  handleAssigneeSubmit: function (assignee) {
    const assignees = this.state.assignees;
    assignee.id = '_asgne_' + Date.now();

    if (assignees.length >= ASSIGNEE_LIMIT) {
      alert('Cannot add more than ' + ASSIGNEE_LIMIT + ' assignees!');
      return;
    }

    const newAssignees = assignees.concat(assignee);
    this.props.data.assignees = newAssignees;
    this.setState({assignees: newAssignees});

    const url = '/api/todos/' + this.props.todoId + '/assignee';

    // call server to add assignee
    $.ajax({
      url: url,
      dataType: 'json',
      type: 'POST',
      data: assignee,
      success: function (data) {
        console.log('data', data);
        this.setState({data: data.assignees});
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(this.props.url, status, err.toString());
        this.setState({data: assignees});
      }.bind(this)
    });
  },
  handleAssigneeUpdate: function (assigneeData) {
    const url = '/api/todos/' + this.props.todoId;
    const data = {
      assignees: [
        {
          name: assigneeData.name,
          id: assigneeData.id
        }
    ]};

    $.ajax({
      url: url,
      dataType: 'json',
      type: 'PUT',
      data: data,
      success: function (data) {
        console.log('data', data);
        this.setState({assignees: data.assignees});
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(this.props.url, status, err.toString());
        // this.setState({data: assignees});
      }.bind(this)
    });
  },
  componentDidMount: function () {
    this.setState({assignees: this.props.data});
  },
  render: function () {
    let separator = ', ';
    const _this = this;
    const assigneesLength = this.state.assignees.length;
    const assignees = this.state.assignees.map(function (assignee, ind) {
      if (ind === assigneesLength - 1) {
        separator = '';
      }
      if (assigneesLength < ASSIGNEE_LIMIT) {
        var assigneeForm = <AssigneeForm assigneeId={assignee.id}
                                         onAssigneeSubmit={_this.handleAssigneeSubmit} onAssigneeRenameSubmit={_this.handleAssigneeUpdate}
        />;
      }
      return <div
          className="assignee"
          onSubmit={_this.handleSubmit}>
          Assigned to:
          <span key={assignee.id}>{assignee.name}{separator}</span>
          {"."}
          {assigneeForm}
          </div>
    });
    return (
      <div>
        {assignees}
      </div>
    );
  }
});

var AssigneeForm = React.createClass({
  getInitialState: function () {
    return {assignee: '', assigneeUpdate: ''};
  },
  handleSubmit: function (e) {
    e.preventDefault();
    this.props.onAssigneeSubmit({name: this.state.assignee});
    this.setState({assignee: ''})
  },
  handleAssigneeChange: function (e) {
    this.setState({assignee: e.target.value});
  },
  handleAssigneeRenameChange: function (e) {
    this.setState({assigneeUpdate: e.target.value});
  },
  handleAssigneeRename: function () {
    this.props.onAssigneeRenameSubmit({name: this.state.assigneeUpdate, id: this.props.assigneeId});
  },
  render: function () {
    return (
      <Form type="inline" className="AssigneeForm" onSubmit={this.handleSubmit}>
        <FormField>
          <FormInput
            type="text"
            placeholder="Add assignee"
            value={this.state.assignee}
            onChange={this.handleAssigneeChange}
          />
        </FormField>
        <FormField>
          <Button submit>
            Add
          </Button>
        </FormField>
        <FormField>
          <FormInput
            type="text"
            placeholder="Update assignee"
            value={this.state.assigneeUpdate}
            onChange={this.handleAssigneeRenameChange}
          />
        </FormField>
        <FormField>
          <Button class="AssigneeRename" onClick={this.handleAssigneeRename}>
            Update
          </Button>
        </FormField>
      </Form>
    );
  }
});

var TodoList = React.createClass({
  getInitialState: function () {
    return {data: []};
  },

  handleTodoDelete: function (todoId) {
    this.props.onTodoDelete(todoId);
  },
  render: function () {
    const _this = this;
    var todoNodes = this.props.data.map(function (todo) {
      return (
        <Todo
          onTodoDelete={_this.handleTodoDelete}
          done={todo.done}
          assignees={todo.assignees}
          todoId={todo.id}
          key={todo.id}
          dueDate={todo.dueDate}>
          {todo.text}
        </Todo>
      );
    });
    return (
      <div className="TodoList">
        {todoNodes}
      </div>
    );
  }
});

var TodoForm = React.createClass({
  getInitialState: function () {
    return {assignee: '', text: '', dueDate: moment()};
  },
  handleAssigneeChange: function (e) {
    this.setState({assignee: e.target.value});
  },
  handleTextChange: function (e) {
    this.setState({text: e.target.value});
  },
  handleDueDateChange: function (date) {
    this.setState({dueDate: date});
  },
  handleSubmit: function (e) {
    e.preventDefault();
    const assignee = this.state.assignee.trim();
    const text = this.state.text.trim();

    //to make sure it's alphanumeric
    if (!text || !assignee) return;
    var regexp = /^[a-zA-Z0-9-_]+$/;

    if (assignee.search(regexp) == -1) {
      console.warn('invalid entry');
      return;
    }

    this.props.onTodoSubmit({
      assignees: [{name: assignee, id: '_asgne_' + Date.now()}],
      text: text,
      dueDate: this.state.dueDate.format('DD-MM-YYYY'),
      done: false
    });
    this.setState({assignee: '', text: '', dueDate: moment()});
  },
  render: function () {
    return (
      <MediaQuery query='(min-width: 420px)'>
        <Form type="inline" className="TodoForm" onSubmit={this.handleSubmit}>
          <FormField>
            <FormInput
              type="text"
              placeholder="Assignee"
              value={this.state.assignee}
              onChange={this.handleAssigneeChange}
            />
          </FormField>
          <FormField>
            <FormInput
              type="text"
              placeholder="Task"
              value={this.state.text}
              onChange={this.handleTextChange}
            />
          </FormField>
          <FormField>
            <DatePicker
              selected={this.state.dueDate}
              onChange={this.handleDueDateChange}
            />
          </FormField>
          <FormField>
            <Button submit>
              Submit
            </Button>
          </FormField>
        </Form>
      </MediaQuery>
    );
  }
});

var Todo = React.createClass({
  getInitialState: function () {
    return {assignees: [], done: false}
  },
  componentDidMount: function () {
    this.setState({done: this.props.done})
  },
  handleDelete: function () {
    this.props.onTodoDelete(this.props.todoId);
    console.log('to be deleted');
  },
  handleCheckboxChange: function (e) {
    this.setState({done: !this.state.done});
    const url = '/api/todos/' + this.props.todoId + '/do';

    // call server to
    $.ajax({
      url: url,
      dataType: 'json',
      type: 'POST',
      data: this.state.done,
      success: function (data) {
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(this.props.url, status, err.toString());
        this.setState({done: !this.state.done});
      }.bind(this)
    });
  },
  render: function () {
    const labelStyle = {'textDecoration': this.state.done ? 'line-through' : ''};
    const deleteDivStyle = {
      float: 'right'
    };

    return (
      <div className="todo">
      <span>
        <label
          style={labelStyle}>
          <input
            hidden="true"
            type="checkbox"
            checked={this.state.done}
            ref="done"
            onChange={this.handleCheckboxChange}
          />
          <Card>{this.props.children}
            <div style={deleteDivStyle} onClick={this.handleDelete}><Glyph icon="trashcan"
                                                                           type="danger"/></div>
          </Card>
        </label>
      </span>
        <MediaQuery query='(min-width: 768px)'>
          <div
            className="todoDueDate">
            By {this.props.dueDate}
          </div>
          <AssigneeList
            data={this.props.assignees}
            todoId={this.props.todoId}
          />
        </MediaQuery>
        <hr/>
      </div>
    );
  }
});

ReactDOM.render(
  <TodosBox
    url="/api/todos"
    pollInterval={5000}
  />,
  document.getElementById('content')
);
