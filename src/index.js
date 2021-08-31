const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find((user) => user.username === username);

  if (!user) {
    return response.status(400).json({
      message: "Cannot find user by username",
    });
  }

  request.user = user;

  next();
}

function checksExistsTodo(request, response, next) {
  const { user } = request;
  const { id } = request.params;

  const todo = user.todos.find((todo) => todo.id === id);

  if (!todo) {
    return response.status(404).json({
      error: `Cannot find todo with id ${id} from username ${user.username}`,
    });
  }

  request.todo = todo;

  next();
}

app.post("/users", (request, response) => {
  const { username, name } = request.body;

  if (!username) {
    return response.status(400).json({
      error: "The attribute username is required",
    });
  }

  if (!name) {
    return response.status(400).json({
      error: "The attribute name is required",
    });
  }

  const userAlreadyExists = users.some((user) => user.username === username);

  if (userAlreadyExists) {
    return response.status(400).json({
      error: `Username ${username} already exists, choose another username`,
    });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(user);

  return response.status(201).json(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.status(200).json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;

  if (!title) {
    return response.status(400).json({
      error: "The attribute title is required",
    });
  }

  if (!deadline) {
    return response.status(400).json({
      error: "The attribute deadline is required",
    });
  }

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  user.todos.push(todo);
  return response.status(201).json(todo);
});

app.put(
  "/todos/:id",
  checksExistsUserAccount,
  checksExistsTodo,
  (request, response) => {
    const { todo } = request;
    const { title, deadline } = request.body;

    if (title) todo.title = title;
    if (deadline) todo.deadline = new Date(deadline);

    return response.status(200).json(todo);
  }
);

app.patch(
  "/todos/:id/done",
  checksExistsUserAccount,
  checksExistsTodo,
  (request, response) => {
    const { todo } = request;

    todo.done = true;

    return response.status(200).json(todo);
  }
);

app.delete(
  "/todos/:id",
  checksExistsUserAccount,
  checksExistsTodo,
  (request, response) => {
    const { todo } = request;

    const { user } = request;

    user.todos.splice(todo, 1);

    return response.status(204).json({
      message: "Todo removed successfully",
    });
  }
);

module.exports = app;
