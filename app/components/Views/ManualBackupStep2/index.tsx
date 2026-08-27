/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-shadow, @typescript-eslint/prefer-optional-chain, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, @typescript-eslint/prefer-for-of, import/no-namespace, import/no-named-as-default-member, react/no-unstable-nested-components */
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

const ManualBackupStep2 = ({
  navigation,
  seedphraseBackedUp,
  route,
}: ManualBackupStep2Props) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [confirmedWords, setConfirmedWords] = useState([]);
  const [wordsDict, setWordsDict] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [seedPhraseReady, setSeedPhraseReady] = useState(false);

  const currentStep = 2;
  const words =
    process.env.JEST_WORKER_ID === undefined
      ? shuffle((route as any).params?.words)
      : (route as any).params?.words;

  const createWordsDictionary = () => {
    const dict = {};
    // @ts-expect-error -- legacy JavaScript UI type boundary
    words.forEach((word, i) => {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      dict[`${word},${i}`] = { currentPosition: undefined };
    });
    setWordsDict(dict);
  };

  const updateNavBar = useCallback(() => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    navigation.setOptions(
      getOnboardingNavbarOptions(route as any, {}, colors),
    );
  }, [colors, navigation, route]);

  useEffect(() => {
    const wordsFromRoute = (route as any).params?.words ?? [];
    setConfirmedWords(
      // @ts-expect-error -- legacy JavaScript UI type boundary
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
    // @ts-expect-error -- legacy JavaScript UI type boundary
    (word, i) => {
      let tempCurrentIndex = currentIndex;
      const tempWordsDict = wordsDict;
      const tempConfirmedWords = confirmedWords;
      // @ts-expect-error -- legacy JavaScript UI type boundary
      if (wordsDict[`${word},${i}`].currentPosition !== undefined) {
        // @ts-expect-error -- legacy JavaScript UI type boundary
        tempCurrentIndex = wordsDict[`${word},${i}`].currentPosition;
        // @ts-expect-error -- legacy JavaScript UI type boundary
        tempWordsDict[`${word},${i}`].currentPosition = undefined;
        // @ts-expect-error -- legacy JavaScript UI type boundary
        tempConfirmedWords[currentIndex] = {
          word: undefined,
          originalPosition: undefined,
        };
      } else {
        // @ts-expect-error -- legacy JavaScript UI type boundary
        tempWordsDict[`${word},${i}`].currentPosition = currentIndex;
        // @ts-expect-error -- legacy JavaScript UI type boundary
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

  // @ts-expect-error -- legacy JavaScript UI type boundary
  const clearConfirmedWordAt = (i) => {
    const { word, originalPosition } = confirmedWords[i];
    const currentIndex = i;
    if (word && (originalPosition || originalPosition === 0)) {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      wordsDict[[word, originalPosition]].currentPosition = undefined;
      // @ts-expect-error -- legacy JavaScript UI type boundary
      confirmedWords[i] = { word: undefined, originalPosition: undefined };
    }

    setCurrentIndex(currentIndex);
    setWordsDict(wordsDict);
    setConfirmedWords(confirmedWords);
    setSeedPhraseReady(findNextAvailableIndex() === -1);
  };

  const validateWords = useCallback(() => {
    const validWords = ((route as any).params?.words ?? []) as any;
    const proposedWords = confirmedWords.map(
      // @ts-expect-error -- legacy JavaScript UI type boundary
      (confirmedWord) => confirmedWord.word,
    );

    return compareMnemonics(validWords, proposedWords);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmedWords, (route as any).params?.words]);

  const goNext = () => {
    if (validateWords()) {
      (seedphraseBackedUp as any)();
      InteractionManager.runAfterInteractions(async () => {
        const words = (route as any).params?.words;
        // @ts-expect-error -- legacy JavaScript UI type boundary
        navigation.navigate('ManualBackupStep3', {
          steps: (route as any).params?.steps,
          words,
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
    const styles = createStyles(colors);

    return (
      <View style={styles.successRow}>
        <MaterialIcon
          name="check-circle"
          size={15}
          color={colors.success.default}
        />
        <Text style={styles.successText}>
          {strings('manual_backup_step_2.success')}
        </Text>
      </View>
    );
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  const renderWordBox = (word, i) => {
    const styles = createStyles(colors);

    return (
      <View key={`word_${i}`} style={styles.wordBoxWrapper}>
        <Text style={styles.wordBoxIndex}>{i + 1}.</Text>
        <TouchableOpacity
          // eslint-disable-next-line react/jsx-no-bind
          onPress={() => {
            clearConfirmedWordAt(i);
          }}
          style={[
            styles.wordWrapper,
            i === currentIndex && styles.currentWord,
            // @ts-expect-error -- legacy JavaScript UI type boundary
            confirmedWords[i].word && styles.confirmedWord,
          ]}
        >
          <Text style={styles.word}>{word}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderWordSelectableBox = useCallback(
    // @ts-expect-error -- legacy JavaScript UI type boundary
    (key, i) => {
      const [word] = key.split(',');
      // @ts-expect-error -- legacy JavaScript UI type boundary
      const selected = wordsDict[key].currentPosition !== undefined;
      const styles = createStyles(colors);

      return (
        <TouchableOpacity
          // eslint-disable-next-line react/jsx-no-bind
          onPress={() => selectWord(word, i)}
          style={[styles.selectableWord, selected && styles.selectedWord]}
          key={`selectableWord_${i}`}
        >
          <Text
            style={[
              styles.selectableWordText,
              selected && styles.selectedWordText,
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
          steps={(route as any).params?.steps}
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

// @ts-expect-error -- legacy JavaScript UI type boundary
const mapDispatchToProps = (dispatch) => ({
  seedphraseBackedUp: () => dispatch(seedphraseBackedUp()),
});

export default connect(null, mapDispatchToProps)(ManualBackupStep2);

interface ManualBackupStep2Props {
  navigation?: Record<string, any>;
  route?: Record<string, any>;
  seedphraseBackedUp?: (...args: any[]) => any;
}
type Props = ManualBackupStep2Props;
