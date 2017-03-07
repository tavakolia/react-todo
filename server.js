/**
* Ahmad July 2016
*/
var fs = require('fs');
var path = require('path');
var express = require('express');
var _ = require('lodash');
var bodyParser = require('body-parser');

var ASSIGNEE_LIMIT = 3;

var app = express();

var TODOS_FILE = path.join(__dirname, 'todos.json');
var PORT = 3000;

app.set('port', PORT);

app.use('/', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  //Disable caching
  res.setHeader('Cache-Control', 'no-cache');
  next();
});

app.get('/api/todos', function(req, res) {
  console.log('GET TODOS');
  fs.readFile(TODOS_FILE, function(err, data) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    res.json(JSON.parse(data));
  });
});

app.post('/api/todos/:todoID/assignee', function(req, res) {
  fs.readFile(TODOS_FILE, function(err, data) {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    var todos = JSON.parse(data);
    var curTodo = todos.find(function(todo) {
      return todo.id == req.params.todoID;
    });

    if (curTodo == null) {
      res.status(404).send('Todo not found.');
      return;
    }

    if (curTodo.assignees.length >= ASSIGNEE_LIMIT) {
      res.status(400).send('Reached the assignee limit!');
      return;
    }

    var newAssignee = {
      id: _.uniqueId('_asgne_' + Date.now()),
      name: req.body.name
    };

    curTodo.assignees.push(newAssignee);

    fs.writeFile(TODOS_FILE, JSON.stringify(todos, null, 4), function(err) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      res.json(curTodo.assignees);
    });
  });
});

app.post('/api/todos/:todoID/do', function(req, res) {
  fs.readFile(TODOS_FILE, function(err, data) {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    var todos = JSON.parse(data);
    var curTodo = todos.find(function(todo) {
      return todo.id == req.params.todoID;
    });

    if (curTodo == null) {
      res.status(404).send('Todo not found.');
      return;
    }

    curTodo.done = !curTodo.done;

    fs.writeFile(TODOS_FILE, JSON.stringify(todos, null, 4), function(err) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      res.json(curTodo.done);
    });
  });
});

app.delete('/api/todos/:todoID', function(req, res) {
  fs.readFile(TODOS_FILE, function(err, data) {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    var todos = JSON.parse(data);
    const removed = _.remove(todos, todo => todo.id == req.params.todoID);
    if (_.isEmpty(removed)) {
      res.status(404).send('Todo not found.');
      return;
    }

    fs.writeFile(TODOS_FILE, JSON.stringify(todos, null, 4), function(err) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      res.status(200).json(todos).send();
    });
  });
});

// TODO: to delete the assignees potentially!
app.put('/api/todos/:todoID', function(req, res) {
  console.log('put todoID', req.params.todoID);
  fs.readFile(TODOS_FILE, function(err, data) {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    console.log(req.body.assignees);

    var todos = JSON.parse(data);
    var curTodo = todos.find(function(todo) {
      return todo.id == req.params.todoID;
    });

    if (curTodo == null) {
      res.status(404).send('Not found');
    }

    if (req.body.assignees.length >= ASSIGNEE_LIMIT) {
      res.status(400).send('Assignee limit does not allow!');
      return;
    }

    _.each(req.body.assignees, asgne => {
      const curAssignee = _.find(curTodo.assignees, (curTodoAsgnes) => curTodoAsgnes.id == asgne.id )
      if (curAssignee) {
        curAssignee.name = asgne.name;
      }
    });

    if (req.body.text) {curTodo.text = req.body.text;}

    fs.writeFile(TODOS_FILE, JSON.stringify(todos, null, 4), function(err) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      res.json(curTodo);
    });

  });
});

app.post('/api/todos', function(req, res) {
  console.log('POST API/TODO');
  fs.readFile(TODOS_FILE, function(err, data) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    var todos = JSON.parse(data);

    let assignees = _.each(req.body.assignees, asgne => asgne.id = _.uniqueId('_asgnee_' + Date.now()));
    assignees = _.slice(assignees,0,3);

    var newTodo = {
      id: _.uniqueId('_todo_' + Date.now()),
      assignees: assignees,
      text: req.body.text,
      dueDate: req.body.dueDate,
      done: false
    };
    todos.unshift(newTodo);
    fs.writeFile(TODOS_FILE, JSON.stringify(todos, null, 4), function(err) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      res.json(todos);
    });
  });
});

app.listen(app.get('port'), function() {
  console.log('Server started: http://localhost:' + app.get('port') + '/');
});
