import styles from '../css/app.module.scss';
// import '../css/app.global.scss';
import React from 'react';
import { TFunction } from 'i18next';

import GuessItem from '../components/GuessItem';
import Button from '../components/Button';

import { initialize, toggleIsGuessing, checkGuess, saveStats, checkSimilarity, stageToTime, showHint, getRandomTrackTitles, getSettings } from '../logic';
import AudioManager from '../AudioManager';
import { appSettings } from '../types/settings';

enum GameState {
  Playing,
  Won,
  Lost,
}

class Game extends React.Component<
  {
    URIs?: string[],
    t: TFunction,
  },
  {
    stage: number;
    guess: string;
    hintCount: number;
    hint: string;
    similarity: string;
    guesses: (string | null)[];
    gameState: GameState;
    randomTitles: string[];
    randomArtists: string[];
    settings: appSettings;
    countdown: number;
  }
> {
  countdownInterval: NodeJS.Timeout | null = null;

  state = {
    // What guess you're on
    stage: 0,
    // The current guess
    guess: '',
    // Current hint counter
    hintCount: 0,
    // Current similarity
    similarity: '',
    //Current hint
    hint: '',
    // Past guesses
    guesses: [],
    gameState: GameState.Playing,
    randomTitles: getRandomTrackTitles(false).titles,
    randomArtists: getRandomTrackTitles(false).artists,
    settings: getSettings(),
    countdown: 0,
  };

  URIs?: string[];
  audioManager: AudioManager;
  constructor(props) {
    super(props);
    this.URIs = Spicetify.Platform.History.location.state.URIs;
    this.audioManager = new AudioManager();
  }

  componentDidMount() {
    console.log('App mounted, URIs: ', this.URIs);
    initialize(this.URIs);
    this.audioManager.listen();
    this.keyboardShortcuts();
  }

  componentWillUnmount() {
    this.audioManager.unlisten();
    // Clear the countdown interval if it exists
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  playClick = () => {
    this.audioManager.play();
  };

  keyboardShortcuts = () => {
    const buttons = document.querySelectorAll(`.${styles.formButtonContainer} .${styles.titleButton}`);
    buttons.forEach((button, index) => {
      if (index < 5) {
        Spicetify.Keyboard.registerShortcut((index + 1).toString(), () => {
          (button as HTMLButtonElement).click();
        });
      }
    });
    Spicetify.Keyboard.registerShortcut('q', this.skipGuess);
    Spicetify.Keyboard.registerShortcut(('w'), (e) =>{
      if (this.state.gameState === GameState.Won || this.state.gameState === GameState.Lost)
      {
        this.nextSong(e)
      } else
      {
        this.playClick(e)
      }
    });
    Spicetify.Keyboard.registerShortcut('e', this.giveUp);
  };

  guessChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({ guess: e.target.value });

  updateSimilarity = () => {
    const similarityScore = (checkSimilarity(this.state.guess, this.state.settings.guessTarget) * 100).toFixed(0);
    this.setState({ similarity: similarityScore.toString() + '%' });
  };

  skipGuess = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // Add the guess to the guess list in the state
    this.setState({
      guesses: [...this.state.guesses, null],
      // Reset the guess
      guess: '',
      // Increment the stage
      stage: this.state.stage + 1,
    }, () => {
      this.audioManager.setEnd(stageToTime(this.state.stage)*1000);
    });
  };

  submitGuess = (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // Don't allow empty guesses
    if (this.state.guess.trim().length === 0) return;
    this.updateSimilarity();
    const won = checkGuess(this.state.guess, this.state.settings.guessTarget);
    if (won) saveStats(this.state.stage);

    // Add the guess to the guess list in the state
    this.setState({
      guesses: [...this.state.guesses, this.state.guess],
      // Reset the guess
      guess: '',
      // Increment the stage
      stage: this.state.stage + 1,
      gameState: won ? GameState.Won : GameState.Playing,
    }, () => {
      if (won) {
        this.audioManager.setEnd(0);
        Spicetify.Player.seek(0);
        Spicetify.Player.play();
        toggleIsGuessing(false);
        if (this.state.settings.autoNextSongDelay > 0) {
          this.setState({ countdown: this.state.settings.autoNextSongDelay });
          this.countdownInterval = setInterval(() => {
            this.setState((prevState) => ({ countdown: prevState.countdown - 1 }), () => {
              if (this.state.countdown <= 0) {
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
                this.nextSong();
              }
            });
          }, 1000);
        }
      } else {
        this.audioManager.setEnd(stageToTime(this.state.stage)*1000);
      }
    });
  };

  giveHint = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    this.setState((prevState) => ({
      hint: showHint(prevState.hintCount + 1) || '',
      hintCount: prevState.hintCount + 1,
    }));
  };

  giveUp = () => {
    this.audioManager.setEnd(0);
    Spicetify.Player.seek(0);
    Spicetify.Player.play();
    toggleIsGuessing(false);
    saveStats(-1);

    this.setState({
      gameState: GameState.Lost,
    });
  };

  nextSong = () => {
    // Clear the countdown interval if it exists
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    toggleIsGuessing(true);
    Spicetify.Player.next();
    Spicetify.Player.seek(0);
    Spicetify.Player.pause();
    this.audioManager.setEnd(250);

    this.setState({
      guesses: [],
      // Reset the guess
      guess: '',
      // Increment the stage
      stage: 0,
      // Reset hint count
      hint: '',
      hintCount: 0,
      similarity: '',
      gameState: GameState.Playing,
      randomTitles: getRandomTrackTitles(true).titles,
      randomArtists: getRandomTrackTitles(true).artists,
    }, () => {
      this.audioManager.setEnd(stageToTime(this.state.stage)*1000);
      this.keyboardShortcuts();
    });
  };

  goToStats = () => {
    Spicetify.Platform.History.push({
      pathname: '/name-that-tune/stats',
      state: {
        data: {
          // title: this.props.item.title,
          // user: this.props.item.user,
          // repo: this.props.item.repo,
          // branch: this.props.item.branch,
          // readmeURL: this.props.item.readmeURL,
        },
      },
    });
  };

  goToSettings = () => {
    Spicetify.Platform.History.push({
      pathname: '/name-that-tune/settings',
      state: {
        data: {
        },
      },
    });
  };

  handleRandomTitleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const guess = e.currentTarget.innerText;
    this.setState({ guess }, () => {
      this.submitGuess(e);
    });
  };

  render() {
    const gameWon = this.state.gameState === GameState.Won;
    const keyboardInput = this.state.settings.inputMethod === 'keyboard';
    const isPlaying = this.state.gameState === GameState.Playing;
    const { t } = this.props;
    const guessTarget = this.state.settings.guessTarget;

    return (
      <>
        <div className={styles.container}>
          <h1 className={styles.title}>{t('title')}</h1>
          <h2 className={`${styles.subtitle} ${!gameWon ? styles.hidden : ''}`}>{t('winMsg')}</h2>
          <h3 className={`${styles.countdown} ${!gameWon || this.state.settings.autoNextSongDelay <= 0 ? styles.hidden : ''}`}>
            {t('switchingToNextSong', { seconds: this.state.countdown })}
          </h3>
          {keyboardInput ? <h2 className={styles.hint}>{(this.state.hint)}</h2> : null }
          {keyboardInput ? <h2 className={styles.similarity}>{(this.state.similarity)}</h2> : null}
          {keyboardInput &&(
            <form onSubmit={this.submitGuess}>
              <input
                type={'text'}
                className={styles.input}
                placeholder={t('guessPlaceholder') as string}
                value={this.state.guess}
                disabled={!isPlaying}
                onChange={this.guessChange}
              />
              <div className={styles.formButtonContainer}>
                <Button onClick={this.submitGuess} disabled={!isPlaying}>
                  {t('guessBtn')}
                </Button>
                <Button onClick={this.giveHint} disabled={!isPlaying}>
                  {t('hintBtn')}
                </Button>
                <Button onClick={this.skipGuess} disabled={!isPlaying}>
                  {t('skipBtn')}
                </Button>
              </div>
            </form>
          )}
          {!keyboardInput && (
            <div className={styles.formButtonContainer}>
              {guessTarget === 'song' ? this.state.randomTitles.filter(title => title).map((title, index) => (
                <Button
                  key={index}
                  classes={[styles.titleButton]}
                  onClick={this.handleRandomTitleButtonClick}
                  disabled={!isPlaying}
                >
                  {title}
                </Button>
              )) : this.state.randomArtists.filter(artist => artist).map((artist, index) => (
                <Button
                  key={index}
                  classes={[styles.titleButton]}
                  onClick={this.handleRandomTitleButtonClick}
                  disabled={!isPlaying}
                >
                  {artist}
                </Button>
              ))}
            </div>)}
          <Button onClick={this.skipGuess} disabled={!isPlaying}>
            {t('skipBtn')}
          </Button>
          {isPlaying ? (
            <Button
              onClick={this.playClick}
            >{t('playXSeconds', { count: Number(stageToTime(this.state.stage)) })}</Button>
          ) : null}

          <Button onClick={isPlaying ? this.giveUp : this.nextSong}>
            {isPlaying ? t('giveUp') : t('nextSong')}
          </Button>

          <ol className={styles.guessList}>
            {this.state.guesses.map((guess, i) => (
              <GuessItem
                key={i}
                index={i}
                guesses={this.state.guesses}
                won={gameWon}
              />
            ))}
          </ol>
          <Button onClick={this.goToStats} classes={[styles.StatsButton]}>
            {t('stats.title')}
          </Button>
          <Button onClick={this.goToSettings} classes={[styles.SettingsButton]}>
            {t('settings.title')}
          </Button>
        </div>
      </>
    );
  }
}

export default Game;
