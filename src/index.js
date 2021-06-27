const { v4: uuid } = require('uuid');
const express = require('express');
const cors = require('cors');

// const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  let userIndex;
  const user = users.find((user, index) => {
    if (user.username === username) {
      userIndex = index;
      return true;
    }
    return false;
  });

  if (!user) {
    return response.status(404).json({
      error: 'User not found'
    })
  }
  request.user = user;
  request.userIndex = userIndex;
  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExists = users.some(user => user.username === username);
  if (userAlreadyExists) {
    return response.status(400).json({ error: 'User already exists.' });
  }

  const id = uuid();
  const user = {
    id,
    name,
    username,
    todos: []
  }
  users.push(user)
  return response.status(201).json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { todos } = request.user;
  return response.status(200).json(todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { userIndex } = request;

  const todo = {
    id: uuid(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  users[userIndex].todos.push(todo);
  return response.status(201).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { id } = request.params;
  const { userIndex } = request;

  const todoIndex = users[userIndex]?.todos?.findIndex(todo => todo.id === id);

  if (todoIndex === -1) {
    return response.status(404).json({ error: 'Todo doesn\'t exist.' });
  }

  const update = { title, deadline: new Date(deadline) };

  Object.assign(users[userIndex].todos[todoIndex], update);

  return response.status(200).json(users[userIndex].todos[todoIndex]);
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { userIndex } = request;

  const todoIndex = users[userIndex]?.todos?.findIndex(todo => todo.id === id);

  if (todoIndex === -1) {
    return response.status(404).json({ error: 'Todo doesn\'t exist.' });
  }

  Object.assign(users[userIndex].todos[todoIndex], { done: true });

  return response.status(200).json(users[userIndex].todos[todoIndex]);
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { userIndex } = request;

  const todoIndex = users[userIndex]?.todos?.findIndex(todo => todo.id === id);

  if (todoIndex === -1) {
    return response.status(404).json({ error: 'Todo doesn\'t exist.' });
  }

  users[userIndex].todos.splice(todoIndex, 1);

  return response.status(204).send();
});

module.exports = app;