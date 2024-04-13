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
    settings: appSettings;
  }
> {
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
    randomTitles: getRandomTrackTitles(false),
    settings: getSettings(),
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
    //add cleanup for keyboard shortcuts
  }

  playClick = () => {
    this.audioManager.play();
  };

  keyboardShortcuts = () => {
    for (let i = 0; i < this.state.randomTitles.length; i++) {
      Spicetify.Keyboard.registerShortcut((i + 1).toString(), (e) => {
        this.setState({ guess: this.state.randomTitles[i] }, () => {
          this.submitGuess(e);
        });
      });
    }
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
    const similarityScore = (checkSimilarity(this.state.guess) * 100).toFixed(0);
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

  submitGuess = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Don't allow empty guesses
    if (this.state.guess.trim().length === 0) return;
    this.updateSimilarity();
    const won = checkGuess(this.state.guess);
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
      } else {
        this.audioManager.setEnd(stageToTime(this.state.stage)*1000);
      }
    });
  };

  giveHint = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    this.setState((prevState) => ({ hint: showHint(prevState.hintCount + 1) || '' }));
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
      randomTitles: getRandomTrackTitles(true),
    }, () => {
      this.audioManager.setEnd(stageToTime(this.state.stage)*1000);
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

    return (
      <>
        <div className={styles.container}>
          <h1 className={styles.title}>{t('title')}</h1>
          {gameWon ? <h2 className={styles.subtitle}>{t('winMsg')}</h2> : null}
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
              {this.state.randomTitles.map((title, index) => (
                <Button
                  key={index}
                  classes={[styles.titleButton]}
                  onClick={this.handleRandomTitleButtonClick}
                  disabled={!isPlaying}
                >
                  {title}
                </Button>
              ))}
            </div>)}
          <Button onClick={this.skipGuess} disabled={!isPlaying}>
            {t('skipBtn')}
          </Button>
          {isPlaying ? (
            <Button
              onClick={this.playClick}
            >{t('playXSeconds', { count: stageToTime(this.state.stage) })}</Button>
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
