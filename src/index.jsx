/** @jsx createElement */
import _ from 'lodash'
import { createElement } from 'elliptical'
import { isDemo, fetchMusic, playSongIds, musicPlay, musicPause, musicNext, musicPrevious, musicStop } from 'lacona-api'
import { Command } from 'lacona-command'
import { playDemoExecute, controlDemoExecute } from './demo'
import { Observable } from 'rxjs/Observable'
import { switchMap } from 'rxjs/operator/switchMap'
import { mergeMap } from 'rxjs/operator/mergeMap'
import { first } from 'rxjs/operator/first'
import { startWith } from 'rxjs/operator/startWith'

const Music = {
  fetch ({activate}) {
    let tapObserver
    const tap = new Observable(observer => { tapObserver = observer })
    const update = () => tapObserver.next()

    return activate
      ::mergeMap(() => {
        return tap::first()
      })
      ::switchMap(() => {
        return new Observable(observer => {
          fetchMusic((err, music) => {
            process.nextTick(() => {
              if (err) {
                observer.error({update, music: []})
              } else {
                observer.next({update, music})
                observer.complete()
              }
            })
          })
        })
      })
      ::startWith({update, music: []})

    // /*
    // The first time that tap emits after activate emits, call the callback
    // */

    // const onActivate = activate::switchMap(() => {
    //   let called = false
    //   return new Observable((observer) => {
    //     function update () {
    //       if (!called) {
    //         called = true
    //         process.nextTick(() => {
    //         })
    //       }
    //     }

    //   })
    // })

    // return onActivate::startWith({update, music: []})
  }
}
// class Music extends Source {
//   data = []

//   onCreate () {
//     if (isDemo()) {
//       this.fetch()
//     }
//   }

//   fetch () {
//     fetchMusic((err, music) => {
//       if (err) {
//         console.error(err)
//       } else {
//         this.setData(music)
//       }
//     })
//   }

//   onActivate () {
//     this.setData([])
//   }

//   trigger () {
//     if (_.isEmpty(this.data)) {
//       this.fetch()
//     }
//   }
// }

export const PlaySpecific = {
  extends: [Command],

  demoExecute: playDemoExecute,

  execute (result) {
    const ids = _.chain(result.music).map('ids').flatten().value()
    playSongIds({ids})
  },

  observe () {
    return <Music />
  },

  describe ({data}) {
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
            <choice>
              <label text='song'>
                <list items={tracks} strategy='fuzzy' limit={10} />
              </label>
              <label text='album'>
                <list items={albums} strategy='fuzzy' limit={10} />
              </label>
              <label text='artist'>
                <list items={artists} strategy='fuzzy' limit={10} />
              </label>
              <label text='genre'>
                <list items={genres} strategy='fuzzy' limit={10} />
              </label>
              <label text='composer'>
                <list items={composers} strategy='fuzzy' limit={10} />
              </label>
            </choice>
          </repeat>
        </tap>
      </sequence>
    )
  }
}

export const Control = {
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

export const extensions = [PlaySpecific, Control]
