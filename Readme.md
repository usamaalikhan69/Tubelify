# Tublify - A YouTube-like Platform

## Description

This project implements the backend API for Tubelify, a YouTube-like video-sharing platform built using  (MongoDB, Express.js, and Node.js). It provides features like user authentication, video management, comments, likes, subscriptions, playlists and Dashboard.


## Features
- User Management: Registration, login, logout, password reset
- Profile management (avatar, cover image, details)
- Watch history tracking  
### Video Management:
- Video upload and publishing
- Video search, sorting, and pagination
- Video editing and deletion
- Visibility control (publish/unpublish)
- Tweet Management:
- Tweet creation and publishing
- Viewing user tweets
- Updating and deleting tweets
- Subscription Management:
- Subscribing to channels
- Viewing subscriber and subscribed channel lists  
### Playlist Management:
- Creating, updating, and deleting playlists
- Adding and removing videos from playlists
- Viewing user playlists  
### Like Management:
- Liking and unliking videos, comments, and tweets
- Viewing liked videos
- Comment Management:
- Adding, updating, and deleting comments on videos  
### Dashboard:
- Viewing channel statistics (views, subscribers, videos, likes)
- Accessing uploaded videos

## Technologies Used
- **Node.js**
- **Express.js**
- **Mongoose (MongoDB Object Modeling)**  
- **MongoDB**
- **Cloudinary (must have an account)**

## Installation and Setup


### Clone the repository:
```bash
git clone https://github.com/usamaalikhan69/Tubelify.git  
```



### Install dependencies:

cd ```Tubelify```  
```bash
npm install
``` 

Set up environment variables: Create a .env in root of project and fill in the required values in the .env file using .env.sample file  

### Start the server:

```bash
npm run dev 
```  


### Contributing
**If you wish to contribute to this project, please feel free to contribute.**  


```Note: Before deploying your API to production, it's crucial to thoroughly test it using tools like Postman to ensure it functions as expected.```

I've finished writing the API functions, but I haven't tested them yet with tools like Postman. Feel free to give them a try and let me know if you find any issues.

I've tried to optimize the code using aggregation pipelines, but I'm sure there's room for improvement. If you spot any mistakes or have suggestions for making the code better, please feel free to create a pull request

## Endpoints Table

| Method | Endpoint | Description |
|---|---|---|
| **User Endpoints** | | |
| POST | `/api/v1/users/register` | Registers a new user |
| POST | `/api/v1/users/login` | Logs in a user |
| POST | `/api/v1/users/logout` | Logs out a user |
| POST | `/api/v1/users/refresh-token` | Refreshes an access token |
| GET | `/api/v1/users/current-user` | Retrieves the current user's information |
| PATCH | `/api/v1/users/update-profile` | Updates the current user's profile |
| PATCH | `/api/v1/users/profile-avatar` | Updates the current user's avatar |
| PATCH | `/api/v1/users/profile-coverImage` | Updates the current user's cover image |
| GET | `/api/v1/users/c/:username` | Retrieves a user's channel profile |
| GET | `/api/v1/users/watch-history` | Retrieves a user's watch history |
| **Video Endpoints** | | |
| GET | `/api/v1/videos` | Retrieves a list of all videos |
| POST | `/api/v1/videos` | Uploads a new video |
| GET | `/api/v1/videos/:id` | Retrieves a specific video |
| DELETE | `/api/v1/videos/:id` | Deletes a video |
| PATCH | `/api/v1/videos/:id` | Updates a video |
| PATCH | `/api/v1/videos/toggle/publish/:id` | Toggles the publish status of a video |
| **Comment Endpoints** | | |
| GET | `/api/v1/comments/:videoId` | Retrieves comments for a video |
| POST | `/api/v1/comments/:videoId` | Adds a comment to a video |
| DELETE | `/api/v1/comments/:commentId` | Deletes a comment |
| PATCH | `/api/v1/comments/:commentId` | Updates a comment |
| **Like Endpoints** | | |
| PUT | `/api/v1/likes/like/:type/:id` | Toggles a like on a video or comment |
| **Subscription Endpoints** | | |
| GET | `/api/v1/subscriptions/c/:channelId` | Retrieves subscribed channels |
| POST | `/api/v1/subscriptions/c/:channelId` | Toggles subscription to a channel |
| GET | `/api/v1/subscriptions/u/:subscriberId` | Retrieves subscribers of a channel |
| **Playlist Endpoints** | | |
| POST | `/api/v1/playlists` | Creates a new playlist |
| GET | `/api/v1/playlists/:playlistId` | Retrieves a playlist |
| PATCH | `/api/v1/playlists/:playlistId` | Updates a playlist |
| DELETE | `/api/v1/playlists/:playlistId` | Deletes a playlist |
| PATCH | `/api/v1/playlists/add/:videoId/:playlistId` | Adds a video to a playlist |
| PATCH | `/api/v1/playlists/remove/:videoId/:playlistId` | Removes a video from a playlist |
| GET | `/api/v1/playlists/user/:userId` | Retrieves a user's playlists |
| **Dashboard Endpoints** | | |
| GET | `/api/v1/dashboard/stats` | Retrieves channel statistics |
| GET | `/api/v1/dashboard/videos` | Retrieves channel videos |






