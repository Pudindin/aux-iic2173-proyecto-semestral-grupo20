# Documentación API

# Auth

## Log in
POST https://open-chat-api.tk/api/auth/signin

header:
```
{
 "Content-Type": "application/json"
}
```

body:
```
{
 "data": {
   "type": "users",
   "attributes": {
       "email": "test@subject.cl",
       "password": "test123"
   }
 }
}
```

## New user
POST https://open-chat-api.tk/api/auth/signup

header:
```
{
 "Content-Type": "application/json"
}
```
body:
```
{
 "data": {
   "type": "users",
   "attributes": {
       "username": "<name>",
       "email": "test@subject.cl",
       "password": "test123",
       "confirmPassword": "test123"
   }
 }
}
```

## Google Log in

GET https://open-chat-api.tk/api/auth/google-signin

header:
```
{
 "Content-Type": "application/json",
 “Authorization": "Bearer <google token>"
}
```

## Google Sign up

POST https://open-chat-api.tk/api/auth/google-signup

header:
```
{
 "Content-Type": "application/json"
}
```
body:
```
{
 "data": {
   "type": "users",
   "attributes": {
       "googleToken": "<token>"
   }
 }
}
```

# Rooms
## Get Rooms
GET https://open-chat-api.tk/api/rooms

header:
```
{
 "Content-Type": "application/json",
 “authorization": "Bearer <token>"
}
```

## Create Room
POST https://open-chat-api.tk/api/rooms

header:
```
{
 "Content-Type": "application/json",
 “authorization": "Bearer <google token>"
}
```

body:
```
{
 "data": {
   "type": "rooms",
   "attributes": {
       "name": "room1"
   }
 }
}
```

## Get Room by id

GET https://open-chat-api.tk/api/rooms/:id
```
header:
{
 "Content-Type": "application/json",
 “authorization": "Bearer <google token>"
}
```

# Messages
## Get Messages
GET https://open-chat-api.tk/api/rooms/:id/messages

header:
```
{
 "Content-Type": "application/json",
 “authorization": "Bearer <google token>"
}
```

## Get Cache Messages
GET https://open-chat-api.tk/api/rooms/:id/messages/fast

header:
```
{
 "Content-Type": "application/json",
 “authorization": "Bearer <google token>"
}
```

## Post Message
POST https://open-chat-api.tk/api/rooms/:id/messages

header:
```
{
 "Content-Type": "application/json",
 “authorization": "Bearer <google token>"
}
```

body:
```
{
 "data": {
   "type": "messages",
   "attributes": {
       "message": "message text"
   }
 }
}
```

# Admin

## Users

### Get Users
GET https://open-chat-api.tk/api/admin/users

header:
```
{
 "Content-Type": "application/json",
 “authorization": "Bearer <google token>"
}
```

### Post User
POST https://open-chat-api.tk/api/admin/users

header:
```
{
 "Content-Type": "application/json",
 “authorization": "Bearer <google token>"
}
```

body:
```
{
 "data": {
   "type": "users",
   "attributes": {
       "username": "username",
    "email": "email",
    "password": "password"
   }
 }
}
```

### Get user by ID
GET https://open-chat-api.tk/api/admin/users/:id

header:
```
{
 "Content-Type": "application/json",
 “authorization": "Bearer <google token>"
}
```

### Patch user by ID
PATCH https://open-chat-api.tk/api/admin/users/:id

header:
```
{
 "Content-Type": "application/json",
 “authorization": "Bearer <google token>"
}
```
body:
```
{
 "data": {
   "type": "users",
   "attributes": {
       "username": "username",
    "email": "email",
    "password": "password"
   }
 }
}
```

### Delete user by ID
DELETE https://open-chat-api.tk/api/admin/users/:id

header:
```
{
 "Content-Type": "application/json",
 “authorization": "Bearer <google token>"
}
```

## Rooms
### Get rooms
GET https://open-chat-api.tk/api/admin/rooms

header:
```
{
 "Content-Type": "application/json",
 “authorization": "Bearer <google token>"
}
```

### Get room by ID
GET https://open-chat-api.tk/api/admin/rooms/:id

header:
```
{
 "Content-Type": "application/json",
 “authorization": "Bearer <google token>"
}
```

### Patch room by ID
PATCH https://open-chat-api.tk/api/admin/rooms/:id

header:
```
{
 "Content-Type": "application/json",
 “authorization": "Bearer <google token>"
}
```

body:
```
{
 "data": {
   "type": "rooms",
   "attributes": {
       "name": "name"
   }
 }
}
```

### Post Room
POST https://open-chat-api.tk/api/admin/rooms

header:
```
{
 "Content-Type": "application/json",
 “authorization": "Bearer <google token>"
}
```

body:
```
{
 "data": {
   "type": "users",
   "attributes": {
       "name": "name"
   }
 }
}
```

### Delete room by ID
DELETE https://open-chat-api.tk/api/admin/rooms/:id

header:
```
{
 "Content-Type": "application/json",
 “authorization": "Bearer <google token>"
}
```
## Messages

### Get messages
GET https://open-chat-api.tk/api/admin/messages

header:
```
{
 "Content-Type": "application/json",
 “authorization": "Bearer <google token>"
}
```

### Get message by ID
GET https://open-chat-api.tk/api/admin/messages/:id

header:
```
{
 "Content-Type": "application/json",
 “authorization": "Bearer <google token>"
}
```

### Patch message by ID
PATCH https://open-chat-api.tk/api/admin/messages/:id

header:
```
{
 "Content-Type": "application/json",
 “authorization": "Bearer <google token>"
}
```
body:
```
{
 "data": {
   "type": "messages",
   "attributes": {
       "message": "message"
   }
 }
}
```

### Post message
POST https://open-chat-api.tk/api/admin/messages/

header:
```
{
 "Content-Type": "application/json",
 “authorization": "Bearer <google token>"
}
```
body:
```
{
 "data": {
   "type": "messages",
   "attributes": {
       "message": "message"
   }
 }
}
```

# CSS/JS Injection
## Get Injections made
GET https://open-chat-api.tk/api/css_js_injection_new

header:
```
{
 "Content-Type": "application/json",
 “authorization": "Bearer <google token>"
}
```

## Post a new injection
POST https://open-chat-api.tk/api/css_js_injection_new

header:
```
{
 "Content-Type": "application/json",
 “authorization": "Bearer <google token>"
}
```

body:
```
{
 "data": {
   "type": "injection",
   "attributes": {
    "roomId": "<room_id>",
    "code": "<insert code here>",
    "type": "<css/js>",
   }
 }
}
```

## Approve/reject an injection
PATCH https://open-chat-api.tk/api/css_js_injection_new

header:
```
{
 "Content-Type": "application/json",
 “authorization": "Bearer <google token>"
}
```

body:
```
{
 "data": {
   "type": "injection",
   "attributes": {
    "approved": "<true/false>",
   }
 }
}
```
