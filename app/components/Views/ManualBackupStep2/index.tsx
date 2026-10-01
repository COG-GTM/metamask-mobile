import React, { useEffect, useState, useCallback } from 'react';
import {
  InteractionManager,
  Alert,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
} from 'react-native';
import OnboardingProgress from '../../UI/OnboardingProgress';
import ActionView from '../../UI/ActionView';
import { ScreenshotDeterrent } from '../../UI/ScreenshotDeterrent';
import { strings } from '../../../../locales/i18n';
import { connect } from 'react-redux';
import { seedphraseBackedUp } from '../../../actions/user';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getOnboardingNavbarOptions } from '../../UI/Navbar';
import { shuffle, compareMnemonics } from '../../../util/mnemonic';
import { MetaMetricsEvents } from '../../../core/Analytics';
import { useTheme } from '../../../util/theme';
import createStyles from './styles';
import { ManualBackUpStepsSelectorsIDs } from '../../../../e2e/selectors/Onboarding/ManualBackUpSteps.selectors';
import trackOnboarding from '../../../util/metrics/TrackOnboarding/trackOnboarding';
import { MetricsEventBuilder } from '../../../core/Analytics/MetricsEventBuilder';
import type { Dispatch } from 'redux';
import type {
  NavigationProp,
  ParamListBase,
} from '@react-navigation/native';

interface OwnProps {
  navigation?: NavigationProp<ParamListBase>;
  route: {
    params?: {
      words?: string[];
      steps?: string[];
    };
    name?: string;
    key?: string;
  };
}

interface DispatchProps {
  seedphraseBackedUp: () => void;
}

type Props = OwnProps & DispatchProps;

interface ConfirmedWord {
  word: string | undefined;
  originalPosition: number | undefined;
}

type WordsDict = Record<string, { currentPosition: number | undefined }>;

const ManualBackupStep2 = ({ navigation, seedphraseBackedUp, route }: Props) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [confirmedWords, setConfirmedWords] = useState<ConfirmedWord[]>([]);
  const [wordsDict, setWordsDict] = useState<WordsDict>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [seedPhraseReady, setSeedPhraseReady] = useState(false);

  const currentStep = 2;
  const routeWords = route.params?.words ?? [];
  const words: string[] =
    process.env.JEST_WORKER_ID === undefined
      ? (shuffle(routeWords) as string[])
      : routeWords;

  const createWordsDictionary = () => {
    const dict: WordsDict = {};
    words.forEach((word: string, i: number) => {
      dict[`${word},${i}`] = { currentPosition: undefined };
    });
    setWordsDict(dict);
  };

  const updateNavBar = useCallback(() => {
    navigation?.setOptions(
      getOnboardingNavbarOptions(
        route,
        { headerLeft: undefined },
        colors,
      ),
    );
  }, [colors, navigation, route]);

  useEffect(() => {
    const wordsFromRoute = route.params?.words ?? [];
    setConfirmedWords(
      new Array(wordsFromRoute.length).fill({
        word: undefined,
        originalPosition: undefined,
      }),
    );
    createWordsDictionary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    updateNavBar();
  }, [updateNavBar]);

  const findNextAvailableIndex = useCallback(
    () => confirmedWords.findIndex(({ word }) => !word),
    [confirmedWords],
  );

  const selectWord = useCallback(
    (word: string, i: number) => {
      let tempCurrentIndex = currentIndex;
      const tempWordsDict = wordsDict;
      const tempConfirmedWords = confirmedWords;
      if (wordsDict[`${word},${i}`].currentPosition !== undefined) {
        tempCurrentIndex = wordsDict[`${word},${i}`]
          .currentPosition as number;
        tempWordsDict[`${word},${i}`].currentPosition = undefined;
        tempConfirmedWords[currentIndex] = {
          word: undefined,
          originalPosition: undefined,
        };
      } else {
        tempWordsDict[`${word},${i}`].currentPosition = currentIndex;
        tempConfirmedWords[currentIndex] = { word, originalPosition: i };
        tempCurrentIndex = findNextAvailableIndex();
      }

      setCurrentIndex(tempCurrentIndex);
      setWordsDict(tempWordsDict);
      setConfirmedWords(tempConfirmedWords);
      setSeedPhraseReady(findNextAvailableIndex() === -1);
    },
    [confirmedWords, currentIndex, findNextAvailableIndex, wordsDict],
  );

  const clearConfirmedWordAt = (i: number) => {
    const { word, originalPosition } = confirmedWords[i];
    const newCurrentIndex = i;
    if (word && (originalPosition || originalPosition === 0)) {
      wordsDict[`${word},${originalPosition}`].currentPosition = undefined;
      confirmedWords[i] = { word: undefined, originalPosition: undefined };
    }

    setCurrentIndex(newCurrentIndex);
    setWordsDict(wordsDict);
    setConfirmedWords(confirmedWords);
    setSeedPhraseReady(findNextAvailableIndex() === -1);
  };

  const validateWords = useCallback(() => {
    const validWords = route.params?.words ?? [];
    const proposedWords = confirmedWords.map(
      (confirmedWord) => confirmedWord.word ?? '',
    );

    return compareMnemonics(validWords, proposedWords);
  }, [confirmedWords, route.params?.words]);

  const goNext = () => {
    if (validateWords()) {
      seedphraseBackedUp();
      InteractionManager.runAfterInteractions(async () => {
        const navWords = route.params?.words;
        navigation?.navigate('ManualBackupStep3', {
          steps: route.params?.steps,
          words: navWords,
        });
        trackOnboarding(
          MetricsEventBuilder.createEventBuilder(
            MetaMetricsEvents.WALLET_SECURITY_PHRASE_CONFIRMED,
          ).build(),
        );
      });
    } else {
      Alert.alert(
        strings('account_backup_step_5.error_title'),
        strings('account_backup_step_5.error_message'),
      );
    }
  };

  const renderSuccess = () => {
    const localStyles = createStyles(colors);

    return (
      <View style={localStyles.successRow}>
        <MaterialIcon
          name="check-circle"
          size={15}
          color={colors.success.default}
        />
        <Text style={localStyles.successText}>
          {strings('manual_backup_step_2.success')}
        </Text>
      </View>
    );
  };

  const renderWordBox = (word: string | undefined, i: number) => {
    const localStyles = createStyles(colors);

    return (
      <View key={`word_${i}`} style={localStyles.wordBoxWrapper}>
        <Text style={localStyles.wordBoxIndex}>{i + 1}.</Text>
        <TouchableOpacity
          // eslint-disable-next-line react/jsx-no-bind
          onPress={() => {
            clearConfirmedWordAt(i);
          }}
          style={[
            localStyles.wordWrapper,
            i === currentIndex && localStyles.currentWord,
            confirmedWords[i]?.word && localStyles.confirmedWord,
          ]}
        >
          <Text style={localStyles.word}>{word}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderWordSelectableBox = useCallback(
    (key: string, i: number) => {
      const [word] = key.split(',');
      const selected = wordsDict[key].currentPosition !== undefined;
      const localStyles = createStyles(colors);

      return (
        <TouchableOpacity
          // eslint-disable-next-line react/jsx-no-bind
          onPress={() => selectWord(word, i)}
          style={[
            localStyles.selectableWord,
            selected && localStyles.selectedWord,
          ]}
          key={`selectableWord_${i}`}
        >
          <Text
            style={[
              localStyles.selectableWordText,
              selected && localStyles.selectedWordText,
            ]}
          >
            {word}
          </Text>
        </TouchableOpacity>
      );
    },
    [colors, selectWord, wordsDict],
  );

  const renderWords = useCallback(
    () => (
      <View style={styles.words}>
        {Object.keys(wordsDict).map((key, i) =>
          renderWordSelectableBox(key, i),
        )}
      </View>
    ),
    [renderWordSelectableBox, styles.words, wordsDict],
  );

  return (
    <SafeAreaView style={styles.mainWrapper}>
      <View style={styles.onBoardingWrapper}>
        <OnboardingProgress
          currentStep={currentStep}
          steps={route.params?.steps ?? []}
        />
      </View>
      <ActionView
        confirmTestID={ManualBackUpStepsSelectorsIDs.CONTINUE_BUTTON}
        confirmText={strings('manual_backup_step_2.complete')}
        onConfirmPress={goNext}
        confirmDisabled={!seedPhraseReady || !validateWords()}
        showCancelButton={false}
        confirmButtonMode={'confirm'}
      >
        <View
          style={styles.wrapper}
          testID={ManualBackUpStepsSelectorsIDs.PROTECT_CONTAINER}
        >
          <Text style={styles.action}>
            {strings('manual_backup_step_2.action')}
          </Text>
          <View style={styles.infoWrapper}>
            <Text style={styles.info}>
              {strings('manual_backup_step_2.info')}
            </Text>
          </View>
          <View
            style={[
              styles.seedPhraseWrapper,
              seedPhraseReady && styles.seedPhraseWrapperError,
              validateWords() && styles.seedPhraseWrapperComplete,
            ]}
          >
            <View style={styles.colLeft}>
              {confirmedWords
                .slice(0, confirmedWords.length / 2)
                .map(({ word }, i) => renderWordBox(word, i))}
            </View>
            <View style={styles.colRight}>
              {confirmedWords
                .slice(-confirmedWords.length / 2)
                .map(({ word }, i) =>
                  renderWordBox(word, i + confirmedWords.length / 2),
                )}
            </View>
          </View>
          {validateWords() ? renderSuccess() : renderWords()}
        </View>
      </ActionView>
      <ScreenshotDeterrent enabled isSRP />
    </SafeAreaView>
  );
};

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  seedphraseBackedUp: () => dispatch(seedphraseBackedUp()),
});

export default connect(null, mapDispatchToProps)(ManualBackupStep2);
