"use strict";
const AWS = require("aws-sdk");

const db = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });
const postsTable = process.env.POSTS_TABLE;
// utils area
const sortByDate = (a, b) => (a.createdAt > b.createdAt ? -1 : 1);

const parseEventBodyToPost = (eventBody) => {
  const date = generateISODate();
  return {
    id: generateUniqueId(),
    userId: eventBody.userId,
    title: eventBody.title,
    body: eventBody.body,
    createdAt: date,
    updatedAt: date,
  };
};

const generateUniqueId = () =>
  new Date().getTime().toString(36) + Math.random().toString(36).slice(2);

const generateISODate = () => new Date().toISOString();

const validationEventBody = (eventBody) => {
  const attributes = ["userId", "title", "body"];
  const result = { valid: true, errors: [] };
  for (const prop of attributes) {
    if (!eventBody[prop]) {
      result.valid = false;
      result.errors.push(`Post must a have ${prop}`);
    }
  }
  return result;
};

const response = (fn, statusCode, message) => {
  const content = {
    statusCode,
    body: JSON.stringify(message),
  };
  return fn(null, content);
};

// FUNCTIONS

module.exports.createPost = async (event, context, callback) => {
  try {
    const reqBody = JSON.parse(event.body);
    const resValidation = validationEventBody(reqBody);
    if (!resValidation.valid) {
      return response(callback, 400, resValidation.errors);
    }
    const post = parseEventBodyToPost(reqBody);
    await db.put({ TableName: postsTable, Item: post }).promise();
    return response(callback, 201, post);
  } catch (err) {
    return response(callback, err.statusCode, err);
  }
};

module.exports.getAllPosts = async (event, context, callback) => {
  try {
    const res = await db.scan({ TableName: postsTable }).promise();
    return response(callback, 200, res.Items.sort(sortByDate));
  } catch (err) {
    return response(callback, err.statusCode, err);
  }
};

module.exports.getPosts = async (event, context, callback) => {
  try {
    const limit = event.pathParameters.limit || 100;
    const params = { TableName: postsTable, Limit: limit };
    const res = await db.scan(params).promise();
    return response(callback, 200, res.Items.sort(sortByDate));
  } catch (err) {
    return response(callback, err.statusCode, err);
  }
};

module.exports.getPostById = async (event, context, callback) => {
  try {
    const id = event.pathParameters.postId;
    const res = await db.get({ TableName: postsTable, Key: { id } }).promise();
    if (res.Item) response(callback, 200, res.Item);
    else response(callback, 404, { errorMessage: "Post not found" });
  } catch (err) {
    response(callback, err.statusCode, err);
  }
};

module.exports.updatePost = async (event, context, callback) => {
  try {
    const { paramName, paramValue } = JSON.parse(event.body);
    const params = {
      Key: { id: event.pathParameters.postId },
      TableName: postsTable,
      ConditionExpression: "attribute_exists(id)",
      UpdateExpression: `set ${paramName} = :v`,
      ExpressionAttributeValues: {
        ":v": paramValue,
      },
      ReturnValues: "ALL_NEW",
    };
    const res = await db.update(params).promise();
    return response(callback, 200, res);
  } catch (err) {
    return response(callback, err.statusCode, err);
  }
};

module.exports.deletePost = async (event, context, callback) => {
  try {
    const id = event.pathParameters.postId;
    await db.delete({ TableName: postsTable, Key: { id } }).promise();
    return response(callback, 200, { message: "Post deleted successfully" });
  } catch (err) {
    return response(callback, err.statusCode, err);
  }
};
