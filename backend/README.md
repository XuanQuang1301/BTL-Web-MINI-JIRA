# MiniJira Backend

## Requirements

- JDK 17
- Maven
- MySQL

## Configuration

Update database config in `src/main/resources/application.properties`.

Example:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/ten_database
spring.datasource.username=root
spring.datasource.password=mat_khau_cua_ban
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

Create database if needed:

```sql
CREATE DATABASE ten_database;
```

## Run

```bash
mvn clean install
mvn spring-boot:run
```

Default server:

```text
http://localhost:8080
```

If port `8080` is busy, change:

```properties
server.port=8081
```

## Main Structure

```text
src
 |- main
 |  |- java
 |  `- resources
 |     `- application.properties
 `- test
```

## API

Note: except `/api/auth/**`, all endpoints require:

```http
Authorization: Bearer <JWT>
```

### Auth

- `POST /api/auth/signup` - register user
- `POST /api/auth/signin` - sign in and return JWT

### Project

- `POST /api/project/create` - create project
- `GET /api/project/my` - list projects where current user is involved
- `GET /api/project/{id}` - get project detail
- `PATCH /api/project/{id}` - update project, owner only
- `DELETE /api/project/delete/{id}` - delete project, owner only

### Project Members

- `POST /api/project/{id}/members` - add member by email, owner only
- `GET /api/project/{id}/members` - list project members

### Task

- `POST /api/project/{projectId}/tasks` - create task, owner only
- `GET /api/project/{projectId}/tasks/my` - list tasks assigned to current user in that project
- `PATCH /api/project/{projectId}/tasks/{taskId}/status` - update task status, assignee only
- `GET /api/project/{projectId}/tasks/{taskId}/history` - list task status history, project owner or task assignee only
- `DELETE /api/project/{projectId}/tasks/{taskId}` - delete task, owner only

### Comment

- `GET /api/project/{projectId}/tasks/{taskId}/comments` - list comments, project owner or task assignee only
- `POST /api/project/{projectId}/tasks/{taskId}/comments` - create comment, project owner or task assignee only
- `DELETE /api/project/{projectId}/tasks/{taskId}/comments/{commentId}` - delete comment, project owner or task assignee only

## Request And Response Samples

### Sign Up

```json
POST /api/auth/signup
Content-Type: application/json

{
  "name": "Alice Nguyen",
  "email": "alice@example.com",
  "password": "12345678",
  "avatarUrl": "https://example.com/a.png"
}
```

Response:

```json
"Dang ky thanh cong!"
```

### Sign In

```json
POST /api/auth/signin
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "12345678"
}
```

Response:

```json
{
  "token": "<JWT>",
  "type": "Bearer",
  "user": {
    "id": 1,
    "name": "Alice Nguyen",
    "email": "alice@example.com",
    "avatarUrl": "https://example.com/a.png"
  }
}
```

### Create Project

```json
POST /api/project/create
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "name": "Mini Jira Core",
  "key": "mj",
  "description": "Core services for mini jira"
}
```

Response:

```json
{
  "id": 1,
  "name": "Mini Jira Core",
  "key": "MJ",
  "description": "Core services for mini jira",
  "status": "PLANNING",
  "createdAt": "2026-03-13T10:15:30",
  "ownerId": 1,
  "ownerName": "Alice Nguyen"
}
```

### List My Projects

```json
GET /api/project/my
Authorization: Bearer <JWT>
```

Response:

```json
[
  {
    "id": 1,
    "name": "Mini Jira Core",
    "key": "MJ",
    "description": "Core services for mini jira",
    "status": "PLANNING",
    "createdAt": "2026-03-13T10:15:30",
    "ownerId": 1,
    "ownerName": "Alice Nguyen",
    "role": "MANAGER"
  }
]
```

### Get Project Detail

```json
GET /api/project/1
Authorization: Bearer <JWT>
```

Response:

```json
{
  "id": 1,
  "name": "Mini Jira Core",
  "key": "MJ",
  "description": "Core services for mini jira",
  "status": "PLANNING",
  "createdAt": "2026-03-13T10:15:30",
  "ownerId": 1,
  "ownerName": "Alice Nguyen"
}
```

### Update Project

```json
PATCH /api/project/1
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "name": "Mini Jira Core API",
  "description": "Updated backend scope",
  "status": "IN_PROGRESS"
}
```

Response:

```json
{
  "id": 1,
  "name": "Mini Jira Core API",
  "key": "MJ",
  "description": "Updated backend scope",
  "status": "IN_PROGRESS",
  "createdAt": "2026-03-13T10:15:30",
  "ownerId": 1,
  "ownerName": "Alice Nguyen"
}
```

### Add Member

```json
POST /api/project/1/members
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "email": "bob@example.com",
  "role": "MEMBER"
}
```

Response:

```json
{
  "id": 10,
  "projectId": 1,
  "userId": 2,
  "userName": "Bob Tran",
  "userEmail": "bob@example.com",
  "role": "MEMBER",
  "joinedAt": "2026-03-13T10:25:00",
  "leftAt": null
}
```

### List Members

```json
GET /api/project/1/members
Authorization: Bearer <JWT>
```

Response:

```json
[
  {
    "id": 10,
    "projectId": 1,
    "userId": 2,
    "userName": "Bob Tran",
    "userEmail": "bob@example.com",
    "role": "MEMBER",
    "joinedAt": "2026-03-13T10:25:00",
    "leftAt": null
  }
]
```

### Create Task

```json
POST /api/project/1/tasks
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "title": "Fix login bug",
  "description": "Redirect loop after signin",
  "assigneeEmail": "bob@example.com",
  "priority": "HIGH",
  "estimatedHours": 6,
  "dueDate": "2026-03-20T18:00:00"
}
```

Response:

```json
{
  "id": 5,
  "projectId": 1,
  "title": "Fix login bug",
  "description": "Redirect loop after signin",
  "status": null,
  "priority": "HIGH",
  "progress": null,
  "estimatedHours": 6.0,
  "actualHours": null,
  "startedAt": null,
  "completedAt": null,
  "dueDate": "2026-03-20T18:00:00",
  "createdAt": "2026-03-19T09:00:00",
  "updatedAt": "2026-03-19T09:00:00",
  "assigneeId": 2,
  "assigneeName": "Bob Tran",
  "assigneeEmail": "bob@example.com",
  "reporterId": 1,
  "reporterName": "Alice Nguyen"
}
```

### List My Tasks

```json
GET /api/project/1/tasks/my
Authorization: Bearer <JWT>
```

Response:

```json
[
  {
    "id": 5,
    "projectId": 1,
    "title": "Fix login bug",
    "description": "Redirect loop after signin",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "progress": null,
    "estimatedHours": 6.0,
    "actualHours": null,
    "startedAt": "2026-03-19T09:05:00",
    "completedAt": null,
    "dueDate": "2026-03-20T18:00:00",
    "createdAt": "2026-03-19T09:00:00",
    "updatedAt": "2026-03-19T09:05:00",
    "assigneeId": 2,
    "assigneeName": "Bob Tran",
    "assigneeEmail": "bob@example.com",
    "reporterId": 1,
    "reporterName": "Alice Nguyen"
  }
]
```

### Update Task Status

```json
PATCH /api/project/1/tasks/5/status
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "status": "DONE"
}
```

Response:

```json
{
  "id": 5,
  "projectId": 1,
  "title": "Fix login bug",
  "description": "Redirect loop after signin",
  "status": "DONE",
  "priority": "HIGH",
  "progress": null,
  "estimatedHours": 6.0,
  "actualHours": null,
  "startedAt": "2026-03-19T09:05:00",
  "completedAt": "2026-03-19T10:00:00",
  "dueDate": "2026-03-20T18:00:00",
  "createdAt": "2026-03-19T09:00:00",
  "updatedAt": "2026-03-19T10:00:00",
  "assigneeId": 2,
  "assigneeName": "Bob Tran",
  "assigneeEmail": "bob@example.com",
  "reporterId": 1,
  "reporterName": "Alice Nguyen"
}
```

Note:

- When task status actually changes, the backend automatically creates a `task_history` record.
- History stores `oldStatus`, `newStatus`, `progressAtThatTime`, `changedAt`, and the user who made the change.

### Get Task History

```json
GET /api/project/1/tasks/5/history
Authorization: Bearer <JWT>
```

Response:

```json
[
  {
    "id": 21,
    "taskId": 5,
    "projectId": 1,
    "oldStatus": "IN_PROGRESS",
    "newStatus": "DONE",
    "progressAtThatTime": 0,
    "changedAt": "2026-03-19T10:00:00",
    "userId": 2,
    "userName": "Bob Tran",
    "userEmail": "bob@example.com"
  },
  {
    "id": 20,
    "taskId": 5,
    "projectId": 1,
    "oldStatus": "TODO",
    "newStatus": "IN_PROGRESS",
    "progressAtThatTime": 0,
    "changedAt": "2026-03-19T09:05:00",
    "userId": 2,
    "userName": "Bob Tran",
    "userEmail": "bob@example.com"
  }
]
```

### Delete Endpoints

- `DELETE /api/project/delete/{id}` -> `204 No Content`
- `DELETE /api/project/{projectId}/tasks/{taskId}` -> `204 No Content`
- `DELETE /api/project/{projectId}/tasks/{taskId}/comments/{commentId}` -> `204 No Content`

### Comment APIs

#### 1. Get Comments

Use this endpoint to get all comments of a task.

- Method: `GET`
- URL: `/api/project/{projectId}/tasks/{taskId}/comments`
- Authorization: `Bearer <JWT>`
- Permission: project owner or task assignee
- Order: oldest comment first by `createdAt`

Example request:

```json
GET /api/project/1/tasks/5/comments
Authorization: Bearer <JWT>
```

Success response: `200 OK`

```json
[
  {
    "id": 11,
    "taskId": 5,
    "projectId": 1,
    "content": "I am checking the login flow now.",
    "createdAt": "2026-03-19T09:40:00",
    "userId": 2,
    "userName": "Bob Tran",
    "userEmail": "bob@example.com"
  },
  {
    "id": 12,
    "taskId": 5,
    "projectId": 1,
    "content": "Please update the redirect handling for expired token.",
    "createdAt": "2026-03-19T10:10:00",
    "userId": 1,
    "userName": "Alice Nguyen",
    "userEmail": "alice@example.com"
  }
]
```

Possible errors:

- `401 Unauthorized` - missing or invalid JWT
- `403 Forbidden` - current user is not project owner and not task assignee
- `404 Not Found` - task does not exist in the project

Error example:

```json
{
  "error": "Ban khong co quyen xem comment trong task nay"
}
```

#### 2. Create Comment

Use this endpoint to add a comment to a task.

- Method: `POST`
- URL: `/api/project/{projectId}/tasks/{taskId}/comments`
- Authorization: `Bearer <JWT>`
- Permission: project owner or task assignee

Request body:

```json
{
  "content": "Please update the redirect handling for expired token."
}
```

Validation:

- `content` is required
- `content` must not be blank
- `content` maximum length is `5000` characters

Example request:

```json
POST /api/project/1/tasks/5/comments
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "content": "Please update the redirect handling for expired token."
}
```

Success response: `201 Created`

```json
{
  "id": 12,
  "taskId": 5,
  "projectId": 1,
  "content": "Please update the redirect handling for expired token.",
  "createdAt": "2026-03-19T10:10:00",
  "userId": 1,
  "userName": "Alice Nguyen",
  "userEmail": "alice@example.com"
}
```

Possible errors:

- `400 Bad Request` - `content` is blank or longer than `5000` characters
- `401 Unauthorized` - missing or invalid JWT
- `403 Forbidden` - current user is not project owner and not task assignee
- `404 Not Found` - task does not exist in the project

Error example:

```json
{
  "error": "Ban khong co quyen comment trong task nay"
}
```

#### 3. Delete Comment

Use this endpoint to delete a comment from a task.

- Method: `DELETE`
- URL: `/api/project/{projectId}/tasks/{taskId}/comments/{commentId}`
- Authorization: `Bearer <JWT>`
- Permission: project owner or task assignee

Example request:

```json
DELETE /api/project/1/tasks/5/comments/12
Authorization: Bearer <JWT>
```

Success response: `204 No Content`

Possible errors:

- `401 Unauthorized` - missing or invalid JWT
- `403 Forbidden` - current user is not project owner and not task assignee
- `404 Not Found` - task or comment does not exist

Error example:

```json
{
  "error": "Khong tim thay comment id=12"
}
```

## Common Errors

- `400 Bad Request` - validation failed
- `401 Unauthorized` - signin failed, missing JWT, or invalid JWT
- `403 Forbidden` - permission denied
- `404 Not Found` - project, user, or task not found
- `409 Conflict` - duplicate key, invalid state, or referenced record

Example:

```json
{
  "error": "Nguoi duoc giao khong la thanh vien cua project"
}
```
