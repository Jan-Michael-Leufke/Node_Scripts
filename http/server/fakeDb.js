const users = [
  {
    id: 1,
    name: "Maria",
    username: "mary123",
    password: "password123",
  },
  {
    id: 2,
    name: "Godot",
    username: "godot123",
    password: "password123",
  },
  {
    id: 3,
    name: "Alice",
    username: "alice123",
    password: "password123",
  },
];

const posts = [
  {
    id: 1,
    title: "First Post",
    content: "This is the content of the first post.",
    userId: 1,
  },
  {
    id: 2,
    title: "Second Post",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam convallis viverra nibh, ac vehicula ante molestie a. Ut ac urna diam. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam lacinia ullamcorper lectus, nec dignissim dolor luctus vitae. Duis vel felis volutpat, iaculis nisi at, finibus sapien. Fusce pharetra purus. ",
    userId: 2,
  },
  {
    id: 3,
    title: "Third Post",
    content: "This is the content of the third post.",
    userId: 1,
  },
];

module.exports = { users, posts };
