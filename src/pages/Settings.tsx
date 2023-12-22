import React from 'react';
import { TFunction } from 'i18next';
import { getLocalStorageDataFromKey} from '../Utils';
import { goBackToGame, setSettingsToDefault } from '../logic';
import { SETTINGS_KEY } from '../constants';
import { appSettings } from '../types/settings';
import Button from '../components/Button';
import styles from '../css/app.module.scss';

class Settings extends React.Component<{ t: TFunction }> {
    state = {
        inputMethod: '',
        hintSetting: '',
        similarityRequirement: 0,
    };

    constructor(props) {
        super(props);
        this.state = {
            inputMethod: '',
            hintSetting: '',
            similarityRequirement: 0,
        };
    }

    componentDidMount() {
        const savedSettings = getLocalStorageDataFromKey(SETTINGS_KEY, {}) as appSettings;
        this.setState({
            inputMethod: savedSettings.inputMethod,
            hintSetting: savedSettings.hintSetting,
            similarityRequirement: savedSettings.similarityRequirement,
        });
    }

    handleinputMethodChange = (event) => {
        this.setState({ inputMethod: event.target.value }, () => {
            this.saveSettingsToLocalStorage();
        });
    }

    handleHintSettingChange = (event) => {
        this.setState({ hintSetting: event.target.value }, () => {
            this.saveSettingsToLocalStorage();
        });
    };

    handlesimilarityRequirementChange = (event) => {
        this.setState({ similarityRequirement: event.target.value }, () => {
            this.saveSettingsToLocalStorage();
        });
    };

    saveSettingsToLocalStorage = () => {
        const { inputMethod, hintSetting, similarityRequirement } = this.state;
        const savedSettings = getLocalStorageDataFromKey(SETTINGS_KEY, {}) as appSettings;
        const updatedSettings = {
            inputMethod,
            hintSetting,
            similarityRequirement,
        };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
    };



    render() {
        const { t } = this.props;
        return (
            <>
                <div className={styles.container}>
                    <h1 className={styles.title}>{t('title')}</h1>
                    <h2>{t('settings.title')}</h2>
                    <Button onClick={goBackToGame} classes={[styles.goBackToGameButton]}>
                        {t('gobacktogamebutton')}
                    </Button>
                    <div>
                        <label htmlFor="inputMethod">{t('settings.inputMethod')}</label>
                        <select id="inputMethod" value={this.state.inputMethod} onChange={this.handleinputMethodChange}>
                            <option value="keyboard">{t('settings.inputKeyboard')}</option>
                            <option value="buttons">{t('settings.inputButtons')}</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="hintSetting">{t('settings.hintSetting')}</label>
                        <select id="hintSetting" value={this.state.hintSetting} onChange={this.handleHintSettingChange}>
                            <option value="oneLetter">{t('settings.hintOneLetter')}</option>
                            <option value="oneWord">{t('settings.hintOneWord')}</option>
                            <option value="oneLetterOnEachWord">{t('settings.hintOneLetterOnEachWord')}</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="similarityRequirement">{t('settings.similarityRequirement')}</label>
                        <input
                            type="range"
                            id="similarityRequirement"
                            min={0.01}
                            max={1.0}
                            step={0.01}
                            value={this.state.similarityRequirement}
                            onChange={this.handlesimilarityRequirementChange}
                        />
                        <span>{t('settings.similarityPercentage', { percentage: (this.state.similarityRequirement * 100).toFixed(2)})}</span>
                    </div>
                    <Button onClick={setSettingsToDefault} classes={[styles.resetButton]}>
                        {t('settings.resetSettingsButton')}
                    </Button>
                </div>
            </>
        );
    }
}

export default Settings;