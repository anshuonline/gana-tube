# ytmusicapi: Unofficial API for YouTube Music
The purpose of this library is to automate interactions with YouTube Music, such as retrieving your library content, managing playlists and uploading songs. To achieve this, it emulates web requests that would occur if you performed the same actions in your web browser.

This project is not supported nor endorsed by Google

## Features
**Browsing:**
* search (including all filters) and suggestions
* get artist information and releases (songs, videos, albums, singles, related artists)
* get user information (videos, playlists)
* get albums
* get song metadata
* get watch playlists (next songs when you press play/radio/shuffle in YouTube Music)
* get song lyrics

**Exploring music:**
* get moods and genres playlists
* get latest charts (globally and per country)

**Library management:**
* get library contents: playlists, songs, artists, albums and subscriptions, podcasts, channels
* add/remove library content: rate songs, albums and playlists, subscribe/unsubscribe artists
* get and modify play history

**Playlists:**
* create and delete playlists
* modify playlists: edit metadata, add/move/remove tracks
* get playlist contents
* get playlist suggestions

**Podcasts:**
* get podcasts
* get episodes
* get channels
* get episodes playlists

**Uploads:**
* upload songs and remove them again
* list uploaded songs, artists and albums

**Localization:**
* all regions are supported (see locations FAQ)
* 16 languages are supported (see languages FAQ)

If you find something missing or broken, check the FAQ or feel free to create an issue.

## Requirements
Python 3.10 or higher - https://www.python.org

## Setup
See the Documentation for detailed instructions

## Usage
```python
from ytmusicapi import YTMusic

yt = YTMusic('oauth.json')
playlistId = yt.create_playlist('test', 'test description')
search_results = yt.search('Oasis Wonderwall')
yt.add_playlist_items(playlistId, [search_results[0]['videoId']])
```

The tests are also a great source of usage examples.
To get started, read the setup instructions.
For a complete documentation of available functions, see the Reference.

## Contents
* Setup
  * OAuth authentication
  * Browser authentication
  * Copy authentication headers
  * Using the headers in your project
  * Manual file creation
* Usage
  * Unauthenticated
  * Authenticated
  * Brand accounts
* Reference
  * YTMusic
    * YTMusic
    * YTMusic.__init__()
  * Setup
    * setup()
    * setup_oauth()
  * Search
    * YTMusic.search()
    * YTMusic.get_search_suggestions()
    * YTMusic.remove_search_suggestions()
  * Browsing
    * YTMusic.get_home()
    * YTMusic.get_artist()
    * YTMusic.get_artist_albums()
    * YTMusic.get_album()
    * YTMusic.get_album_browse_id()
    * YTMusic.get_user()
    * YTMusic.get_user_playlists()
    * YTMusic.get_user_videos()
    * YTMusic.get_song()
    * YTMusic.get_song_related()
    * YTMusic.get_lyrics()
    * YTMusic.get_tasteprofile()
    * YTMusic.set_tasteprofile()
    * YTMusic.get_song_credits()
  * Explore
    * YTMusic.get_mood_categories()
    * YTMusic.get_mood_playlists()
    * YTMusic.get_charts()
  * Watch
    * YTMusic.get_watch_playlist()
  * Library
    * YTMusic.get_library_playlists()
    * YTMusic.get_library_songs()
    * YTMusic.get_library_albums()
    * YTMusic.get_library_artists()
    * YTMusic.get_library_subscriptions()
    * YTMusic.get_library_podcasts()
    * YTMusic.get_library_channels()
    * YTMusic.get_liked_songs()
    * YTMusic.get_saved_episodes()
    * YTMusic.get_history()
    * YTMusic.add_history_item()
    * YTMusic.remove_history_items()
    * YTMusic.rate_song()
    * YTMusic.edit_song_library_status()
    * YTMusic.rate_playlist()
    * YTMusic.subscribe_artists()
    * YTMusic.unsubscribe_artists()
    * YTMusic.get_account_info()
  * Playlists
    * YTMusic.get_playlist()
    * YTMusic.create_playlist()
    * YTMusic.join_collaborative_playlist()
    * YTMusic.edit_playlist()
    * YTMusic.delete_playlist()
    * YTMusic.add_playlist_items()
    * YTMusic.remove_playlist_items()
  * Podcasts
    * YTMusic.get_channel()
    * YTMusic.get_channel_episodes()
    * YTMusic.get_podcast()
    * YTMusic.get_episode()
    * YTMusic.get_episodes_playlist()
  * Uploads
    * YTMusic.get_library_upload_songs()
    * YTMusic.get_library_upload_artists()
    * YTMusic.get_library_upload_albums()
    * YTMusic.get_library_upload_artist()
    * YTMusic.get_library_upload_album()
    * YTMusic.upload_song()
    * YTMusic.delete_upload_entity()
  * ytmusicapi
    * ytmusicapi package
    * Subpackages
      * ytmusicapi.auth package
        * Subpackages
          * ytmusicapi.auth.oauth package
            * Submodules
            * ytmusicapi.auth.oauth.credentials module
              * Credentials
                * Credentials.client_id
                * Credentials.client_secret
                * Credentials.get_code()
                * Credentials.refresh_token()
                * Credentials.token_from_code()
              * OAuthCredentials
                * OAuthCredentials.client_id
                * OAuthCredentials.client_secret
                * OAuthCredentials.get_code()
                * OAuthCredentials.refresh_token()
                * OAuthCredentials.token_from_code()
            * ytmusicapi.auth.oauth.exceptions module
              * BadOAuthClient
              * UnauthorizedOAuthClient
            * ytmusicapi.auth.oauth.models module
              * AuthCodeDict
              * BaseTokenDict
              * RefreshableTokenDict
            * ytmusicapi.auth.oauth.token module
              * OAuthToken
              * RefreshingToken
              * Token
            * Module contents
        * Submodules
          * ytmusicapi.auth.auth_parse module
          * ytmusicapi.auth.browser module
          * ytmusicapi.auth.types module
        * Module contents
      * ytmusicapi.mixins package
        * Submodules
          * ytmusicapi.mixins.browsing module
          * ytmusicapi.mixins.charts module
          * ytmusicapi.mixins.explore module
          * ytmusicapi.mixins.library module
          * ytmusicapi.mixins.playlists module
          * ytmusicapi.mixins.podcasts module
          * ytmusicapi.mixins.search module
          * ytmusicapi.mixins.uploads module
          * ytmusicapi.mixins.watch module
        * Module contents
      * ytmusicapi.models package
        * Subpackages
        * Submodules
          * ytmusicapi.models.lyrics module
        * Module contents
      * ytmusicapi.parsers package
        * Submodules
          * ytmusicapi.parsers.albums module
          * ytmusicapi.parsers.artists module
          * ytmusicapi.parsers.browsing module
          * ytmusicapi.parsers.constants module
          * ytmusicapi.parsers.explore module
          * ytmusicapi.parsers.i18n module
          * ytmusicapi.parsers.library module
          * ytmusicapi.parsers.playlists module
          * ytmusicapi.parsers.podcasts module
          * ytmusicapi.parsers.search module
          * ytmusicapi.parsers.songs module
          * ytmusicapi.parsers.uploads module
          * ytmusicapi.parsers.watch module
        * Module contents
      * ytmusicapi.constants module
      * ytmusicapi.continuations module
      * ytmusicapi.enums module
      * ytmusicapi.exceptions module
      * ytmusicapi.helpers module
      * ytmusicapi.navigation module
      * ytmusicapi.setup module
      * ytmusicapi.type_alias module
      * ytmusicapi.ytmusic module
