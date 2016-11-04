/** @jsx createElement */
import { createElement } from 'elliptical'
import { isDemo, fetchMusic, playSongIds, musicPlay, musicPause, musicNext, musicPrevious, musicStop } from 'lacona-api'
import { Command } from 'lacona-phrases'

import _ from 'lodash'
import { playDemoExecute, controlDemoExecute } from './demo'
import { Observable } from 'rxjs/Observable'
import { of as ofObservable } from 'rxjs/observable/of'
import { switchMap } from 'rxjs/operator/switchMap'
import { mergeMap } from 'rxjs/operator/mergeMap'
import { first } from 'rxjs/operator/first'
import { startWith } from 'rxjs/operator/startWith'
import { concat } from 'rxjs/operator/concat'

const Music = {
  fetch ({activate}) {
    if (isDemo()) {
      return new Observable(observer => {
        fetchMusic((err, music) => {
          observer.next({update: () => {}, music})
          observer.complete()
        })
      })
    } else {
      let tapObserver
      const tap = new Observable(observer => { tapObserver = observer })
      const update = () => tapObserver.next()

      return ofObservable(true)
        ::concat(activate)
        ::mergeMap(() => {
          return tap::first()
        })
        ::switchMap(() => {
          return fetchMusic().then((music) => {
            return {update, music}
          })
        })
        ::startWith({update, music: []})
    }
  }
}

const PlaySpecific = {
  extends: [Command],

  demoExecute: playDemoExecute,

  execute (result) {
    const ids = _.chain(result.music).map('ids').flatten().value()
    playSongIds({ids})
  },

  describe ({observe, config}) {
    if (!config.enablePlay) {
      return null
    }

    const data = observe(<Music />)
    const tracks = _.chain(data.music)
      .filter('name')
      .map(({name, id}) => ({text: name, value: {song: name, ids: [id]}}))
      .value()
    const albums = _.chain(data.music)
      .filter('album')
      .groupBy('album')
      .map((albumItems, album) => ({text: album, value: {album, ids: _.map(albumItems, 'id')}}))
      .value()
    const artists = _.chain(data.music)
      .filter('artist')
      .groupBy('artist')
      .map((artistItems, artist) => ({text: artist, value: {artist, ids: _.map(artistItems, 'id')}}))
      .value()
    const genres = _.chain(data.music)
      .filter('genre')
      .groupBy('genre')
      .map((genreItems, genre) => ({text: genre, value: {genre, ids: _.map(genreItems, 'id')}}))
      .value()
    const composers = _.chain(data.music)
      .filter('composer')
      .groupBy('composer')
      .map((composerItems, composer) => ({text: composer, value: {composer, ids: _.map(composerItems, 'id')}}))
      .value()

    function callUpdate (option) {
      if (option.text != null) {
        data.update()
      }
    }
      // function={this.source.trigger.bind(this.source)
    return (
      <sequence>
        <literal text='play ' category='action' />
        <tap inbound={callUpdate} id='music'>
          <repeat unique separator={<list items={[' and ', ', ', ', and ']} limit={1} />}>
            <choice annotation={{type: 'icon', value: '/Applications/iTunes.app'}}>
              <placeholder argument='song'>
                <list items={tracks} strategy='fuzzy' limit={10} />
              </placeholder>
              <placeholder argument='album'>
                <list items={albums} strategy='fuzzy' limit={10} />
              </placeholder>
              <placeholder argument='artist'>
                <list items={artists} strategy='fuzzy' limit={10} />
              </placeholder>
              <placeholder argument='genre'>
                <list items={genres} strategy='fuzzy' limit={10} />
              </placeholder>
              <placeholder argument='composer'>
                <list items={composers} strategy='fuzzy' limit={10} />
              </placeholder>
            </choice>
          </repeat>
        </tap>
      </sequence>
    )
  }
}

const Control = {
  extends: [Command],

  demoExecute: controlDemoExecute,

  execute (result) {
    if (result.verb === 'play') {
      musicPlay()
    } else if (result.verb === 'next') {
      musicNext()
    } else if (result.verb === 'previous') {
      musicPrevious()
    } else if (result.verb === 'pause') {
      musicPause()
    } else if (result.verb === 'stop') {
      musicStop()
    }
  },

  describe ({config}) {
    if (!config.enableControl) {
      return null
    }

    return (
      <choice>
        <sequence>
          <literal text='play ' />
          <choice merge={true} id='verb' limit={2} annotation={{type: 'icon', value: '/Applications/iTunes.app'}}>
            <list items={['current song', 'current track', 'music']} value='play' limit={1} category='symbol' />
            <list items={['previous song', 'previous track', 'last song', 'last track']} value='previous' limit={1} category='symbol' />
            <list items={['next song', 'next track']} value='next' limit={1} category='symbol' />
          </choice>
        </sequence>
        <sequence value={{verb: 'pause'}}>
          <literal text='pause ' />
          <list items={['current song', 'current track', 'music']} limit={1} category='symbol' annotation={{type: 'icon', value: '/Applications/iTunes.app'}} />
        </sequence>
        <sequence value={{verb: 'next'}}>
          <literal text='skip ' />
          <list items={['current song', 'current track']} limit={1} category='symbol' annotation={{type: 'icon', value: '/Applications/iTunes.app'}} />
        </sequence>
        <sequence value={{verb: 'stop'}}>
          <literal text='stop ' />
          <list items={['current song', 'current track']} limit={1} category='symbol' annotation={{type: 'icon', value: '/Applications/iTunes.app'}} />
        </sequence>
      </choice>
    )
  }
}

export default [PlaySpecific, Control]
