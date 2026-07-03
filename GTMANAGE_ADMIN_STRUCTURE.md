# GanaTube Admin Panel Documentation

## Project Name
GTManage

## Installation Path (XAMPP)

C:\xampp\htdocs\gtmanage

Technology Stack

- PHP 8+
- MySQL
- Tailwind CSS
- Alpine.js
- JavaScript
- YouTube Music API / Search API
- FFmpeg (optional future)
- Cron Job (Scheduler)

---

# Folder Structure

gtmanage/

├── admin/
│   ├── dashboard.php
│   ├── login.php
│   ├── logout.php
│   ├── profile.php
│   ├── settings.php
│   │
│   ├── playlists/
│   │      index.php
│   │      create.php
│   │      edit.php
│   │      delete.php
│   │      publish.php
│   │      hold.php
│   │      schedule.php
│   │
│   ├── songs/
│   │      search.php
│   │      import.php
│   │      bulk-import.php
│   │      manage.php
│   │
│   ├── sections/
│   │      index.php
│   │      create.php
│   │      edit.php
│   │      delete.php
│   │
│   ├── scheduler/
│   │      jobs.php
│   │      history.php
│   │
│   ├── ajax/
│   │      playlist.php
│   │      songs.php
│   │      sections.php
│   │
│   └── assets/
│
├── uploads/
│      playlist_cover/
│      banners/
│
├── includes/
│      db.php
│      auth.php
│      functions.php
│
├── api/
│      ytmusic.php
│
└── cron/
       scheduler.php

---

# Admin Dashboard

Dashboard contains

✔ Total Songs

✔ Total Playlists

✔ Total Sections

✔ Published

✔ Scheduled

✔ Hold

✔ Recently Published

✔ Quick Actions

---

# Sidebar

Dashboard

Playlists

Songs

Sections

Scheduler

Settings

Profile

Logout

---

# Playlist Module

Admin can

Create Playlist

Edit Playlist

Delete Playlist

Upload Playlist Cover

Change Cover Anytime

SEO Title

Description

Tags

Status

Publish

Hold

Schedule

Playlist Order

Featured Playlist

Trending Playlist

---

Playlist Fields

Playlist Name

Slug

Description

Cover Image

Status

Created Date

Updated Date

Schedule Time

Featured

Priority

---

# Songs Module

Two methods

Method 1

Paste YouTube Music URL

Example

https://music.youtube.com/watch?v=xxxxxxxx

Click Import

Automatically fetch

Song Name

Artist

Thumbnail

Duration

Video ID

Save

---

Method 2

Search Song

Search Box

Search

Results

Checkbox Selection

Select All

Bulk Import

Bulk Add

---

Bulk Playlist Builder

Search Song

Select Multiple Songs

Click

Add To Playlist

Done

---

Song Fields

Song Title

Artist

Album

Thumbnail

Duration

Video ID

YouTube URL

Genre

Language

Status

---

# Playlist Builder

Workflow

Create Playlist

↓

Upload Cover

↓

Search Songs

↓

Select Songs

↓

Click Add

↓

Reorder

↓

Save

↓

Publish / Hold / Schedule

---

Drag and Drop Song Order

Admin can rearrange

1

2

3

4

etc.

---

# Publish System

Status

Draft

Hold

Scheduled

Published

Archived

---

Schedule

Date Picker

Time Picker

Timezone

Cron checks every minute

Automatically Publish

---

# Cover Management

Upload

Replace

Crop

Compress

Delete

Preview

---

# Section Manager

Example Sections

Trending

Recently Added

Hindi

English

Bengali

Love Songs

90s

Workout

Party

Sad Songs

Lo-fi

Bhajan

Instrumental

New Releases

---

Admin can

Create Section

Rename

Delete

Reorder

Show Hide

Featured

Custom Icon

Custom Banner

---

Each Section

Has Multiple Playlists

Section

↓

Playlists

↓

Songs

---

# Homepage Builder

Admin chooses

Section Order

Playlist Order

Featured Banner

Hero Playlist

Recommended

Latest

Trending

Everything drag and drop

---

# Scheduler

Upcoming Publish

History

Failed Jobs

Success Jobs

Cancel Schedule

Edit Schedule

---

# Search Engine

Global Search

Playlist

Song

Artist

Album

Section

---

# Filters

Published

Hold

Scheduled

Draft

Featured

Trending

Language

Genre

Artist

---

# Admin Settings

Website Name

Logo

Favicon

Theme Color

Default Playlist Cover

Homepage Banner

Footer

Social Links

API Keys

---

# Security

Admin Login

Password Hash

CSRF

Session

Remember Login

Role System

Activity Logs

---

# Database Tables

admins

songs

playlists

playlist_songs

sections

section_playlist

scheduled_posts

settings

activity_logs

---

Relationships

Section

↓

Multiple Playlists

Playlist

↓

Multiple Songs

Song

↓

Multiple Playlists

(Many to Many)

---

# Playlist Status Flow

Draft

↓

Hold

↓

Scheduled

↓

Published

↓

Archived

---

# Dashboard Widgets

Latest Playlist

Upcoming Schedule

Recently Imported Songs

Popular Artists

Recent Activity

Quick Publish

Quick Create Playlist

---

# Playlist Editor

Cover Preview

Title

Description

Song Count

Drag Songs

Search Songs

Bulk Add

Save

Preview

Publish

---

# Song Search Page

Search

↓

Results

↓

Checkbox

↓

Select Multiple

↓

Choose Playlist

↓

Add

---

# Activity Logs

Playlist Created

Playlist Updated

Cover Changed

Playlist Published

Section Deleted

Song Imported

Login

Logout

Everything Logged

---

# Future Features

Spotify Import

JioSaavn Import

Apple Music Import

Audio Cache

Offline Mode

Analytics

Most Played

Most Liked

Top Artists

Auto Thumbnail Generator

AI Playlist Generator

Recommendation Engine

---

# Complete Admin Workflow

Login

↓

Dashboard

↓

Create Playlist

↓

Upload Cover

↓

Search Songs

↓

Bulk Select

↓

Add Songs

↓

Arrange Songs

↓

Save Playlist

↓

Choose

Publish

Hold

or

Schedule

↓

Homepage Automatically Updates

---
