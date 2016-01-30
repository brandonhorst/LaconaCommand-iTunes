/** @jsx createElement */
import _ from 'lodash'
import { createElement, Phrase, Source } from 'lacona-phrase'
import { isDemo, fetchMusic, playSongIds, musicPlay, musicPause, musicNext, musicPrevious, musicStop } from 'lacona-api'
import { Command } from 'lacona-command'

function andify (array) {
  if (array.length === 1) {
    return array
  } else {
    return _.chain(array)
      .slice(0, -2)
      .map(item => [item, {text: ', '}])
      .flatten()
      .concat(_.slice(array, -2, -1)[0])
      .concat({text: ' and '})
      .concat(_.slice(array, -1)[0])
      .value()
  }
}

class MusicObject {
  constructor ({music}) {
    this.music = music
  }

  _demoExecute () {
    const descriptions = _.map(this.music, ({song, album, artist, genre, playlist, composer}) => {
      if (song) {
        return {text: song, argument: 'song'}
      } else if (album) {
        return [{text: 'all songs on '}, {text: album, argument: 'album'}]
      } else if (artist) {
        return [{text: 'all songs by '}, {text: artist, argument: 'artist'}]
      } else if (genre) {
        return [{text: 'all songs in the '}, {text: genre, argument: 'genre'}, {text: 'genre'}]
      } else if (playlist) {
        return [{text: 'all songs in the '}, {text: playlist, argument: 'playlist'}, {text: 'playlist'}]
      } else if (composer) {
        return [{text: 'all songs composed by '}, {text: composer, argument: 'composer'}]
      }
    })

    return _.flattenDeep([
      {text: 'play ', category: 'action'},
      andify(descriptions),
      {text: ' in ', category: 'conjunction'},
      {text: ' iTunes', argument: 'application'}
    ])
  }

  execute () {
    const ids = _.chain(this.music).map('ids').flatten().value()
    playSongIds({ids})
  }
}

class Music extends Source {
  data = []

  onCreate () {
    if (isDemo()) {
      this.fetch()
    }
  }

  fetch () {
    fetchMusic((err, music) => {
      if (err) {
        console.error(err)
      } else {
        this.setData(music)
      }
    })
  }

  onActivate () {
    this.setData([])
  }

  trigger () {
    if (_.isEmpty(this.data)) {
      this.fetch()
    }
  }
}

class PlaySpecific extends Phrase {
  static extends = [Command]

  observe () {
    return <Music />
  }

  describe () {
    const tracks = _.map(this.source.data, ({name, id}) => ({text: name, value: {song: name, ids: [id]}}))
    const albums = _.chain(this.source.data)
      .groupBy('album')
      .map((albumItems, album) => ({text: album, value: {album, ids: _.map(albumItems, 'id')}}))
      .value()
    const artists = _.chain(this.source.data)
      .groupBy('artist')
      .map((artistItems, artist) => ({text: artist, value: {artist, ids: _.map(artistItems, 'id')}}))
      .value()
    const genres = _.chain(this.source.data)
      .groupBy('genre')
      .map((genreItems, genre) => ({text: genre, value: {genre, ids: _.map(genreItems, 'id')}}))
      .value()
    const composers = _.chain(this.source.data)
      .groupBy('composer')
      .map((composerItems, composer) => ({text: composer, value: {composer, ids: _.map(composerItems, 'id')}}))
      .value()

    return (
      <map function={result => new MusicObject(result)}>
        <sequence>
          <literal text='play ' category='action' />
          <tap id='music' function={this.source.trigger.bind(this.source)}>
            <repeat unique separator={<list items={[' and ', ', ', ', and ']} limit={1} />}>
              <choice>
                <label text='song'>
                  <list items={tracks} fuzzy={true} limit={10} />
                </label>
                <label text='album'>
                  <list items={albums} fuzzy={true} limit={10} />
                </label>
                <label text='artist'>
                  <list items={artists} fuzzy={true} limit={10} />
                </label>
                <label text='genre'>
                  <list items={genres} fuzzy={true} limit={10} />
                </label>
                <label text='composer'>
                  <list items={composers} fuzzy={true} limit={10} />
                </label>
              </choice>
            </repeat>
          </tap>
        </sequence>
      </map>
    )
  }

  // filter ({ids, shuffled}) {
  //   if (shuffled && ids && ids.length === 1) {
  //     return false
  //   }
  //   return true
  // }
}

class ControlObject {
  constructor ({verb}) {
    this.verb = verb
  }

  _demoExecute () {
    if (this.verb === 'play') {
      return [
        {text: 'play ', category: 'action'},
        {text: 'the current song', category: 'argument5'},
        {text: ' in '},
        {text: 'iTunes', argument: 'application'}
      ]
    } else if (this.verb === 'next') {
      return [
        {text: 'play ', category: 'action'},
        {text: 'the next song', category: 'argument5'},
        {text: ' in '},
        {text: 'iTunes', argument: 'application'}
      ]

    } else if (this.verb === 'previous') {
      return [
        {text: 'play ', category: 'action'},
        {text: 'the previous song', category: 'argument5'},
        {text: ' in '},
        {text: 'iTunes', argument: 'application'}
      ]

    } else if (this.verb === 'stop') {
      return [
        {text: 'stop playing music ', category: 'action'},
        {text: ' in '},
        {text: 'iTunes', argument: 'application'}
      ]

    } else if (this.verb === 'pause') {
      return [
        {text: 'pause ', category: 'action'},
        {text: 'the current song', category: 'argument5'},
        {text: ' in '},
        {text: 'iTunes', argument: 'application'}
      ]
    }
  }

  execute () {
    if (this.verb === 'play') {
      musicPlay()
    } else if (this.verb === 'next') {
      musicNext()
    } else if (this.verb === 'previous') {
      musicPrevious()
    } else if (this.verb === 'pause') {
      musicPause()
    } else if (this.verb === 'stop') {
      musicStop()
    }
  }
}

class Control extends Phrase {
  static extends = [Command]

  describe () {
    return (
      <map function={result => new ControlObject(result)}>
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
      </map>
    )
  }
}

export const extensions = [PlaySpecific, Control]
