/** @jsx createElement */
import _ from 'lodash'
import {createElement, Phrase, Source} from 'lacona-phrase'
import {Applescript} from 'lacona-command-osx'

export function executeSpecific (result) {
  const ids = _.chain(result.music).map('ids').flatten().value()

  if (ids) {
    const command = `
      tell application "iTunes"
      	if user playlist "Lacona Playlist" exists then
      		try
      			delete user playlist "Lacona Playlist"
      		end try
      	end if

    		make new user playlist with properties {name:"Lacona Playlist", shuffle: false}

      	repeat with tid in {${results.ids.join(',')}}
      		set trk to (some track of first user playlist whose database ID is tid)
      		duplicate trk to end of user playlist "Lacona Playlist"
      	end repeat

        play user playlist "Lacona Playlist"
      end tell
    `
    global.applescript(command)
  }
}

const script = 'tell application "iTunes" to get {name, album, artist, album artist, composer, genre, year, disc number, track number, database ID} of every track of first library playlist'

// class Sorted extends Source {
//   source () {
//     return {data: this.props.children[0]}
//   }
//
//   onCreate () {
//     this.replaceData([])
//   }
//
//   trigger () {
//     this.sources.data.trigger()
//   }
//
//   onUpdate () {
//     const sortedData = _.sortByAll(this.sources.data.data, this.props.keys)
//     this.replaceData(sortedData)
//   }
// }

function artistify({albumArtist, artist}) {
  return albumArtist || artist
}

function sortInteger(key) {
  return item => parseInt(item[key], 10)
}

function arrangeMusic(arrays) {
  return _.chain(arrays)
    .thru(_.spread(_.zip))
    .map(_.partial(_.zipObject, ['name', 'album', 'artist', 'albumArtist', 'composer', 'genre', 'year', 'discNumber', 'trackNumber', 'id']))
    .sortByAll([artistify, sortInteger('year'), 'album', sortInteger('discNumber'), sortInteger('trackNumber'), sortInteger('id')])
    .value()
}

class DemoPlay extends Source {
  onCreate () {
    this.replaceData(global.config.music)
  }

  trigger () {}
}

class PlaySpecific extends Phrase {
  source () {
    if (process.env.LACONA_ENV === 'demo') {
      return {
        music: <DemoPlay />
      }
    } else {
      return {
        music: (
          <thru function={arrangeMusic}>
            <Applescript code={script} fetchOn='triggerOnce' />
          </thru>
        )
      }
    }
  }

  describe () {
    const tracks = _.map(this.sources.music.data, ({name, id}) => ({text: name, value: {song: name, ids: [id]}}))
    const albums = _.chain(this.sources.music.data)
      .groupBy('album')
      .map((albumItems, album) => ({text: album, value: {album, ids: _.map(albumItems, 'id')}}))
      .value()
    const artists = _.chain(this.sources.music.data)
      .groupBy(artistify)
      .map((artistItems, artist) => ({text: artist, value: {artist, ids: _.map(artistItems, 'id')}}))
      .value()
    const genres = _.chain(this.sources.music.data)
      .groupBy('genre')
      .map((genreItems, genre) => ({text: genre, value: {genre, ids: _.map(genreItems, 'id')}}))
      .value()
    const composers = _.chain(this.sources.music.data)
      .groupBy('composer')
      .map((composerItems, composer) => ({text: composer, value: {composer, ids: _.map(composerItems, 'id')}}))
      .value()

    return (
      <sequence>
        <literal text='play ' category='action' />
        <descriptor id='music' trigger={this.sources.music.trigger.bind(this.sources.music)}>
          <repeat unique separator={<list items={[' and ', ', ', ', and ']} limit={1} />}>
            <choice>
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
          </repeat>
        </descriptor>
      </sequence>
    )
  }

  // filter ({ids, shuffled}) {
  //   if (shuffled && ids && ids.length === 1) {
  //     return false
  //   }
  //   return true
  // }
}

function executeControl (result) {
  if (result.verb === 'play') {
    global.applescript('tell application "iTunes" to play')
  } else if (result.verb === 'next') {
    global.applescript('tell application "iTunes" to next track')
  } else if (result.verb === 'previous') {
    global.applescript('tell application "iTunes" to previous track')
  } else if (result.verb === 'pause') {
    global.applescript('tell application "iTunes" to pause')
  } else if (result.verb === 'stop') {
    global.applescript('tell application "iTunes" to stop')
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
            <list items={['previous song', 'previous track', 'last song', 'last track']} value='previous' limit={1} category='action' />
            <list items={['next song', 'next track']} value='next' limit={1} category='action' />
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
