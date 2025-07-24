import { NavigationProp, ParamListBase } from '@react-navigation/native';

export interface AppInformationProps {
  /**
   * navigation object required to push new views
   */
  navigation: NavigationProp<ParamListBase>;
}

export interface AppInformationState {
  appInfo: string;
  appVersion: string;
}
