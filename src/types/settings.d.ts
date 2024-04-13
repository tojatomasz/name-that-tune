export type appSettings = {
    inputMethod: 'keyboard' | 'buttons';
    similarityRequirement: number; // 0 to 1, where 1 is exact match
    hintSetting: 'oneLetter' | 'oneWord' | 'oneLetterOnEachWord' ; // 'oneLetter' shows one letter at a time, 'oneWord' shows one word at a time, 'oneLetterOnEachWord' shows one letter on each word at a time
    stageScaling: number; // 1 to 5, where 1 is no scaling (standard offsets), at 5 the first stage is 0.2seconds, at 1 it is 1 second
    //guessTarget: 'song' | 'artist'; // 'song' guesses the song title, 'artist' guesses the artist
  };