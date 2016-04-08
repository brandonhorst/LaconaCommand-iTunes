
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

export function playDemoExecute (result) {
  const descriptions = _.map(result.music, ({song, album, artist, genre, playlist, composer}) => {
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


export function controlDemoExecute (result) {
  if (result.verb === 'play') {
    return [
      {text: 'play ', category: 'action'},
      {text: 'the current song', category: 'argument5'},
      {text: ' in '},
      {text: 'iTunes', argument: 'application'}
    ]
  } else if (result.verb === 'next') {
    return [
      {text: 'play ', category: 'action'},
      {text: 'the next song', category: 'argument5'},
      {text: ' in '},
      {text: 'iTunes', argument: 'application'}
    ]

  } else if (result.verb === 'previous') {
    return [
      {text: 'play ', category: 'action'},
      {text: 'the previous song', category: 'argument5'},
      {text: ' in '},
      {text: 'iTunes', argument: 'application'}
    ]

  } else if (result.verb === 'stop') {
    return [
      {text: 'stop playing music ', category: 'action'},
      {text: ' in '},
      {text: 'iTunes', argument: 'application'}
    ]

  } else if (result.verb === 'pause') {
    return [
      {text: 'pause ', category: 'action'},
      {text: 'the current song', category: 'argument5'},
      {text: ' in '},
      {text: 'iTunes', argument: 'application'}
    ]
  }
}