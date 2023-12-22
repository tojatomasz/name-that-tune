// import FuzzySet from 'fuzzyset';
import { diceCoefficient } from 'dice-coefficient';
import { fetchAndPlay, shuffle, Queue } from './shuffle+';
import { getLocalStorageDataFromKey } from './Utils';
import { STATS_KEY, SETTINGS_KEY } from './constants';
import { appSettings } from './types/settings';

export const getSettings = (): appSettings => {
  console.log('Getting settings at getSettings()');
  const settings = getLocalStorageDataFromKey(SETTINGS_KEY, {}) as appSettings;
  //if settings are not set, set them to default
  if(!settings.similarityRequirement || !settings.hintSetting || !settings.inputMethod) {
    console.log('Settings not set, setting to default at getSettings()');
    return setSettingsToDefault();
  }
  console.log(settings);
  return settings;
};

export const setSettingsToDefault = () => {
  console.log('Setting settings to default at setSettingsToDefault()');
  const defaultSettings: appSettings = {
    inputMethod: 'keyboard',
    similarityRequirement: 0.8,
    hintSetting: 'oneLetter',
    //guessSetting: 'song',
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
  window.location.reload();
  return defaultSettings;
};

export const goBackToGame = () => {
  Spicetify.Platform.History.push({
      pathname: '/name-that-tune/game',
      state: {
        data: {
        },
      },
    });
};

export const resetStats = () => {
  localStorage.removeItem(STATS_KEY);
  window.location.reload();
};

export const getRandomTrackTitles = (next: boolean): string[] => {
  const tracks = Spicetify.Queue.nextTracks;
  if (tracks.length < 4) {
    console.error('Not enough tracks in the queue');
    return [];
  }

  const indices = new Set<number>();
  while (indices.size < 4) {
    indices.add(Math.floor(Math.random() * tracks.length));
  }

  const titles = Array.from(indices).map(index => {
    const title = tracks[index].contextTrack.metadata.title;
    return normalize(title, true);
  });
  
  const currentTrackTitle = Spicetify.Player.data.item?.metadata?.title;
  if(!Spicetify.Player.data.item) {return []}
  const nextTrackTitle = Spicetify.Queue.nextTracks[0].contextTrack.metadata.title;
  if(!Spicetify.Queue.nextTracks[0].contextTrack) {return []}

  console.log('Current title: '+currentTrackTitle);
  if(Spicetify.Queue.prevTracks[0]) {
    console.log('Previous title: '+Spicetify.Queue.prevTracks[0].contextTrack.metadata.title);
  }

  //when we open the game, the currentTrackTitle is current track, but when we click next, the currentTrackTitle is the previous track
  if(next){
    titles.push(normalize(nextTrackTitle, true));
  }else{
    titles.push(normalize(currentTrackTitle, true));
  }
  console.log('Tracks: '+titles);
  const shuffledTitles = titles.sort(() => 0.5 - Math.random());
  console.log('Shuffled tracks: '+shuffledTitles);
  return shuffledTitles;
};

/**
 * Set "is guessing" body class (controls element visibility/interactivity)
 * @param guessing If we are enabling or disabling the "is guessing" class
 */
export const toggleIsGuessing = (guessing: boolean) => {
  document.body.classList.toggle('name-that-tune--guessing', guessing);
};

// TODO: potentially tweak this
const normalize = (str: string | undefined, keepSpaces: boolean = false) => {
  if (!str) return '';
  let cleaned = str.trim().toLowerCase();

  // Remove anything within parentheses
  cleaned = cleaned.replace(/\(.*\)/g, '');

  // Remove anything that comes after a ' - '
  cleaned = cleaned.replace(/\s-\s.*$/, '');

  // Convert & to 'and'
  cleaned = cleaned.replace(/&/g, 'and');

  // Remove everything that is not a number, letter, Cyrylic alphabet, Polish alphabet or space
  cleaned = cleaned.replace(/[^\wа-яА-ЯіїІЇ\dąćęłńóśźż\s]/g, '');
  
  // Remove spaces
  if(!keepSpaces) cleaned = cleaned.replace(/\s/g, '');

  // TODO: add any other logic?

  return cleaned;
};

export const showHint = (hint: number) => {
  if (hint == -1) {
    return;
  }
  const title = Spicetify.Player.data.item?.metadata?.title;
  const currentHint = normalize(title, true);

  const hintSetting = getSettings().hintSetting;
  console.log('Hint setting: '+{ hintSetting });
  let updatedHint = '';

  switch (hintSetting) {
    case 'oneLetter':
      let nonSpaceChars = 0;
      updatedHint = currentHint
        .split('')
        .map((char) => {
          if (char !== ' ') {
            return nonSpaceChars++ < hint ? char : '*';
          }
          return ' ';
        })
        .join('');
      break;
    case 'oneWord':
      const words = currentHint.split(' ');
      updatedHint = words
        .map((word, index) => (index < hint ? word : '*'.repeat(word.length)))
        .join(' ');
      break;
    case 'oneLetterOnEachWord':
      updatedHint = currentHint
        .split(' ')
        .map((word) =>
          word
            .split('')
            .map((char, index) => (index < hint ? char : '*'))
            .join('')
        )
        .join(' ');
      break;
    default:
      break;
  }

  return updatedHint;
};

export const checkSimilarity = (guess: string) => {
  const normalizedTitle = normalize(
    Spicetify.Player.data.item?.metadata?.title,
  );
  const normalizedGuess = normalize(guess);
  console.log({ normalizedTitle, normalizedGuess });

  const similarity = diceCoefficient(normalizedGuess, normalizedTitle);
  console.log({ similarity });
  return similarity;
}

export const checkGuess = (guess: string) => {
  console.log({
    title: Spicetify.Player.data.item?.metadata?.title,
    guess,
  });
  const similarityRequirement = getSettings().similarityRequirement;
  console.log('Similarity requirement: ' + similarityRequirement);
  return checkSimilarity(guess) >= similarityRequirement;
};

export const initialize = (URIs?: string[]) => {
  // If passed in URIs, use them
  if (URIs) {
    if (URIs.length === 1) {
      fetchAndPlay(URIs[0]);
      return;
    }

    Queue(shuffle(URIs), null);

    // Spicetify.Player.playUri(URIs[0]);
    // Because it will start playing automatically
    try {
      Spicetify.Player.pause();
    } catch (e) {
      console.log('Error pausing player:', e);
    }
    // if (Spicetify.Player.isPlaying()) {
    // }
    Spicetify.Player.seek(0);
  }
};

/*
  * Don't just add the same amount of time for each guess
  * Heardle offsets:
  * 1s, +1s, +2s, +3s, +4s, +5s
  * Which is this equation:
  * s = 1 + 0.5x + 0.5x^2
  */
export const stageToTime = (stage: number) => {
  return (1 + 0.5 * (stage + stage ** 2));
};

/**
 * Saves an object to localStorage with key:value pairs as stage:occurrences
 * @param stage The stage they won at, or -1 if they gave up
 */
export const saveStats = (stage: number) => {
  const savedStats = getLocalStorageDataFromKey(STATS_KEY, {});
  console.debug('Existing stats:', savedStats);
  savedStats[stage] = savedStats[stage] + 1 || 1;
  console.debug('Saving stats:', savedStats);
  localStorage.setItem(STATS_KEY, JSON.stringify(savedStats));
};
