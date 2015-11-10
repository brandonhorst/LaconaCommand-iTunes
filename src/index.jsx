/** @jsx createElement */
import _ from 'lodash'
import {createElement, Phrase} from 'lacona-phrase'
import {Applescript} from 'lacona-command-osx'

// class MusicSource extends Source {
//   fetch () {
//     if (this.fetched) {
//       return
//     } else {
//       this.fetched = true
//     }
//
//     osa(list).then(([result]) => {
//       if (Array.isArray(result)) {
//         const everything = _.chain(result)
//           .unzip()
//           .map(([name, album, artist, albumArtist, composer, genre, id]) => {
//             return {name, album, artist, albumArtist, composer, genre, id}
//           }).value()
//
//         const tracks = _.map(everything, track => _.pick(track, ['name', 'id']))
//
//         const artists = _.chain(everything)
//           .map(track => ({artist: track.albumArtist || track.artist, id: track.id}))
//           .groupBy(_.property('artist'))
//           .mapValues(valueList => _.map(valueList, _.property('id')))
//           .value()
//
//         const albums = _.chain(everything)
//           .map(track => _.pick(track, ['album', 'id']))
//           .groupBy(_.property('album'))
//           .mapValues(valueList => _.map(valueList, _.property('id')))
//           .value()
//
//         const composers = _.chain(everything)
//           .map(track => _.pick(track, ['composer', 'id']))
//           .groupBy(_.property('composer'))
//           .mapValues(valueList => _.map(valueList, _.property('id')))
//           .value()
//
//         const genres = _.chain(everything)
//           .map(track => _.pick(track, ['genre', 'id']))
//           .groupBy(_.property('genre'))
//           .mapValues(valueList => _.map(valueList, _.property('id')))
//           .value()
//
//         this.setData({tracks, artists, albums, composers, genres})
//       }
//     }).catch(console.error)
//   }

//   create () {
//     this.fetched = false
//     this.replaceData({
//       tracks: [],
//       artists: {},
//       albums: {},
//       composers: {},
//       genres: {},
//       fetch: _.debounce(this.fetch.bind(this), 2000, {leading: true})
//     })
//   }
// }

export function execute (results) {
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

export class Sentence extends Phrase {
  source () {
    return {music: <Applescript code={script} keys={['name', 'album', 'artist', 'albumArtist', 'composer', 'genre', 'id']} fetchOn='triggerOnce' />}
  }

  trigger (input) {
    this.sources.music.trigger()
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
        <descriptor trigger={this.trigger.bind(this)}>
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
      </sequence>
    )
  }
}

// class Play extends Phrase {
//   execute (results) {
//     execString('tell application "iTunes" play')
//   }
//
//   describe () {
//     return (
//       <sequence>
//         <literal text='play ' category='action' />
//         <placeholder descriptor='current song' category='symbol'>
//           <choice limit={1}>
//             <literal text='current song' />
//             <literal text='current track' />
//             <literal text='music' />
//           </choice>
//         </placeholder>
//       </sequence>
//     )
//   }
// }
//
// class Pause extends Phrase {
//   execute (results) {
//     execString('tell application "iTunes" to pause')
//   }
//
//   describe () {
//     return (
//       <sequence>
//         <literal text='pause ' category='action' />
//         <choice category='argument5 symbol' limit={1}>
//           <literal text='current song' />
//           <literal text='current track' />
//           <literal text='music' />
//           <literal text='this song' />
//         </choice>
//       </sequence>
//     )
//   }
// }
//
// class Next extends Phrase {
//   execute (results) {
//     execString('tell application "iTunes" to next track')
//   }
//
//   describe () {
//     return (
//       <choice limit={1}>
//         <sequence>
//           <literal text='play ' category='action' />
//           <placeholder descriptor='next song' category='symbol'>
//             <choice limit={1}>
//               <literal text='next song' />
//               <literal text='next track' />
//             </choice>
//           </placeholder>
//         </sequence>
//         <sequence>
//           <literal text='skip ' category='action' />
//           <literal text='current song' category='symbol' />
//         </sequence>
//       </choice>
//     )
//   }
// }
//
// class Previous extends Phrase {
//   execute (results) {
//     execString('tell application "iTunes" to previous track')
//   }
//
//   describe () {
//     return (
//       <sequence>
//         <literal text='play ' category='action' />
//         <placeholder descriptor='previous song' category='symbol'>
//           <choice limit={1}>
//             <literal text='previous song' />
//             <literal text='previous track' />
//             <literal text='last track' />
//           </choice>
//         </placeholder>
//       </sequence>
//     )
//   }
// }
//
// export default {
//   sentences: [Play, Pause, Next, Previous, PlaySongs],
//   translations: [{
//     langs: ['en', 'default'],
//     information: {
//       title: 'Play iTunes Music',
//       description: 'Play music in iTunes, and control the currently playing music',
//       examples: ['play The Reign of Kindo', 'pause current track', 'play next track', 'play previous track']
//     }
//   }]
// }
