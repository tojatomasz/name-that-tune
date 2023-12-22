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
                    <h1 className={styles.title}>{t('settings.title')}</h1>
                    <Button onClick={goBackToGame} classes={[styles.goBackToGameButton]}>
                        {t('gobacktogamebutton')}
                    </Button>
                    <div className={styles.settingsContainer}>
                        <div className={styles.settingsRow}>
                            <label className={styles.settingsLabel}>{t('settings.inputMethod')}</label>
                            <select className={styles.settingsSelect} value={this.state.inputMethod} onChange={this.handleinputMethodChange}>
                                <option className={styles.settingsOption} value="keyboard">{t('settings.inputKeyboard')}</option>
                                <option className={styles.settingsOption} value="buttons">{t('settings.inputButtons')}</option>
                            </select>
                        </div>
                        <div className={styles.settingsRow}>
                            <label className={styles.settingsLabel}>{t('settings.hintSetting')}</label>
                            <select className={styles.settingsSelect} value={this.state.hintSetting} onChange={this.handleHintSettingChange}>
                                <option className={styles.settingsOption} value="oneLetter">{t('settings.hintOneLetter')}</option>
                                <option className={styles.settingsOption} value="oneWord">{t('settings.hintOneWord')}</option>
                                <option className={styles.settingsOption} value="oneLetterOnEachWord">{t('settings.hintOneLetterOnEachWord')}</option>
                            </select>
                        </div>
                        <div className={styles.settingsRow}>
                            <label className={styles.settingsLabel}>{t('settings.similarityRequirement')}</label>
                            <input
                                type="range"
                                id="similarityRequirement"
                                min={0}
                                max={1.0}
                                step={0.01}
                                value={this.state.similarityRequirement}
                                onChange={this.handlesimilarityRequirementChange}
                                className={styles.settingsInput}
                            />
                            <span className={styles.similarityDisplay}>{t('settings.similarityPercentage', { percentage: (this.state.similarityRequirement * 100).toFixed(0)})}</span>
                        </div>
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