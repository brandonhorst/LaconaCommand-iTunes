/** @jsx createElement */
import _ from 'lodash'
import {createElement, Phrase} from 'lacona-phrase'
import {Applescript} from 'lacona-command-osx'

export function executeSpecific (results) {
  console.log(results)
  // if (results.ids) {
  //   const command = `tell application "iTunes"
  //   	if user playlist "Lacona Playlist" exists then
  //   		try
  //   			delete tracks of user playlist "Lacona Playlist"
  //   		end try
  //   	else
  //   		make new user playlist with properties {name:"Lacona Playlist"}
  //   	end if
  //
  //   	repeat with tid in {${results.ids.join(',')}}
  //   		set trk to (some track of first user playlist whose database ID is tid)
  //   		duplicate trk to user playlist "Lacona Playlist"
  //   	end repeat
  //
  //     play user playlist "Lacona Playlist"
  //   end tell`
  //   osa(command).catch(console.error)
  // }
}

const script = `
  set allMusic to {}
  tell application "iTunes"
    repeat with t in tracks of first library playlist
      set end of allMusic to {t's name, t's album, t's artist, t's album artist, t's composer, t's genre, t's database ID}
    end repeat
  end tell
  return allMusic
`

class PlaySpecific extends Phrase {
  source () {
    return {music: <Applescript code={script} keys={['name', 'album', 'artist', 'albumArtist', 'composer', 'genre', 'id']} fetchOn='triggerOnce' />}
  }

  describe () {
    const tracks = _.map(this.sources.music.data, ({name, id}) => ({text: name, value: [id]}))
    const albums = _.chain(this.sources.music.data)
      .groupBy('album')
      .map((albumItems, album) => ({text: album, value: _.map(albumItems, 'id')}))
      .value()
    const artists = _.chain(this.sources.music.data)
      .groupBy(({artist, albumArtist}) => albumArtist || artist)
      .map((artistItems, artist) => ({text: artist, value: _.map(artistItems, 'id')}))
      .value()
    const genres = _.chain(this.sources.music.data)
      .groupBy('genre')
      .map((genreItems, genre) => ({text: genre, value: _.map(genreItems, 'id')}))
      .value()
    const composers = _.chain(this.sources.music.data)
      .groupBy('composer')
      .map((composerItems, composer) => ({text: composer, value: _.map(composerItems, 'id')}))
      .value()

    return (
      <sequence>
        <literal text='play ' category='action' />
        <descriptor trigger={this.sources.music.trigger.bind(this.sources.music)}>
          <choice id='ids'>
            <argument text='song'>
              <list items={tracks} fuzzy={true} limit={10} />
            </argument>
            <argument text='album'>
              <list items={albums} fuzzy={true} limit={10} />
            </argument>
            <argument text='artist'>
              <list items={artists} fuzzy={true} limit={10} />
            </argument>
            <argument text='genre'>
              <list items={genres} fuzzy={true} limit={10} />
            </argument>
            <argument text='composer'>
              <list items={composers} fuzzy={true} limit={10} />
            </argument>
          </choice>
        </descriptor>
        <literal text=' shuffled' optional={true} category='action' />
      </sequence>
    )
  }
}

function executeControl (result) {
  if (result.verb === 'play') {
    execString('tell application "iTunes" play')
  } else if (result.verb === 'next') {
    execString('tell application "iTunes" to next track')
  } else if (result.verb === 'previous') {
    execString('tell application "iTunes" to previous track')
  } else if (result.verb === 'pause') {
    execString('tell application "iTunes" to pause')
  } else if (result.verb === 'stop') {
    execString('tell application "iTunes" to stop')
  }
}

class Control extends Phrase {
  describe () {
    return (
      <choice>
        <sequence>
          <literal text='play ' category='action' />
          <choice merge={true} id='verb' limit={2}>
            <list items={['current song', 'current track', 'music']} value='play' limit={1} category='action' />
            <list items={['next song', 'next track']} value='next' limit={1} category='action' />
            <list items={['previous song', 'previous track', 'last song', 'last track']} value='previous' limit={1} category='action' />
          </choice>
        </sequence>
        <sequence value={{verb: 'pause'}}>
          <literal text='pause ' category='action' />
          <list items={['current song', 'current track', 'music']} limit={1} category='action' />
        </sequence>
        <sequence value={{verb: 'next'}}>
          <literal text='skip ' category='action' />
          <list items={['current song', 'current track']} limit={1} category='action' />
        </sequence>
        <sequence value={{verb: 'stop'}}>
          <literal text='stop ' category='action' />
          <list items={['current song', 'current track']} limit={1} category='action' />
        </sequence>
      </choice>
    )
  }
}

export default {
  sentences: [
    {Sentence: PlaySpecific, execute: executeSpecific},
    {Sentence: Control, execute: executeControl}
  ]
}
