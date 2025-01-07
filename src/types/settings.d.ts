export type appSettings = {
    inputMethod: 'keyboard' | 'buttons';
    similarityRequirement: number; // 0 to 1, where 1 is exact match
    hintSetting: 'oneLetter' | 'oneWord' | 'oneLetterOnEachWord'; // 'oneLetter' shows one letter at a time, 'oneWord' shows one word at a time, 'oneLetterOnEachWord' shows one letter on each word at a time
    guessTarget: 'song' | 'artist'; // 'song' guesses the song title, 'artist' guesses the artist
};